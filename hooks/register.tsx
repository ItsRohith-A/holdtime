/**
 * Holdtime: short learning cards in the band above the prompt while Claude
 * works. A card appears when a turn starts, steps aside whenever Claude needs
 * the person, and the turn ends with a one-line summary under Claude's answer.
 *
 * The decisions (which card, how an answer is graded) live in planner.ts;
 * this module connects them to Claude Code's events and draws the band.
 */
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Card, Feedback, Topic, TurnTally } from '../types'
import { CARDS } from '../content'
import {
  accuracyByTopic, bump, dayOf, decay, freshWeights, grade, isAnswered, keyOf, pickCard,
  PROJECT_FILES, seed, topicOf, TOPICS,
} from './planner'
import type { Ask, Progress, Weights } from './planner'

const cardAtom = atom({ plugin: 'holdtime', key: 'card' } as const, null)
const feedbackAtom = atom({ plugin: 'holdtime', key: 'feedback' } as const, null)
const needsYouAtom = atom({ plugin: 'holdtime', key: 'needsYou' } as const, false)
const tallyAtom = atom({ plugin: 'holdtime', key: 'tally' } as const, { seen: 0, asked: 0, right: 0 })

const TOPIC_NAMES: Record<Topic, string> = { javascript: 'JavaScript', python: 'Python', git: 'Git' }

/** Notifications that mean Claude is waiting on the person. */
const NEEDS_YOU = new Set(['permission_prompt', 'agent_needs_input', 'elicitation_dialog', 'elicitation_url_dialog'])

type DayCount = { date: string; count: number }

/**
 * The session's bookkeeping, set up again on every load. Progress lives in
 * $.store, which every Claude Code session on the machine shares, so it is
 * read again right before each write; what the band draws lives in $.state.
 */
const session = {
  dailyGoal: 20,
  maxPerTurn: 5,
  weights: freshWeights() as Weights,
  progress: {} as Progress,
  isPaused: false,
  isHiddenThisTurn: false,
  /** Cards shown this session, never offered again until the next one. */
  shown: new Set<string>(),
  /** The card on screen that has not been answered yet. */
  unanswered: null as string | null,
  /** What Claude is waiting on the person for, while it waits. */
  ask: null as Ask | null,
  /**
   * Set while a press is being handled. Checked and set before anything
   * awaits, so a second press of the same key cannot count twice.
   */
  isBusy: false,
}

/** Takes the press lock; false when another press is still being handled. */
function lock(): boolean {
  if (session.isBusy) return false
  session.isBusy = true
  return true
}

function unlock(): void {
  session.isBusy = false
}

async function today($: EngineInterface): Promise<string> {
  return dayOf(await $.clock.now())
}

async function readDay($: EngineInterface): Promise<DayCount> {
  const stored = (await $.store.get('day')) as DayCount | undefined
  const date = await today($)
  return stored && stored.date === date ? stored : { date, count: 0 }
}

/** Shows the next card, or nothing when a cap is reached or learning is off. */
async function showNext($: EngineInterface): Promise<void> {
  const tally = await read($, tallyAtom)
  const day = await readDay($)
  const isCapped = tally.seen >= session.maxPerTurn || day.count >= session.dailyGoal
  const isOff = session.isPaused || session.isHiddenThisTurn || isCapped
  const card = isOff ? null : pickCard(CARDS, session.weights, session.progress, day.date, session.shown)
  if (card) session.shown.add(card.id)
  session.unanswered = card?.id ?? null
  await update($, feedbackAtom, () => null)
  await update($, cardAtom, () => card)
}

/**
 * Records a seen card: grades it on top of what the store holds now (another
 * session may have written since), counts it for today, and saves both.
 */
async function record($: EngineInterface, card: Card, isRight: boolean | null): Promise<void> {
  const day = await readDay($)
  const stored = ((await $.store.get('progress')) as Progress | undefined) ?? {}
  session.progress = grade(stored, card, isRight, day.date)
  const counted: DayCount = { date: day.date, count: day.count + 1 }
  await $.store.set('progress', session.progress)
  await $.store.set('day', counted)
  session.unanswered = null
  await update($, tallyAtom, t => ({
    seen: t.seen + 1,
    asked: t.asked + (isRight === null ? 0 : 1),
    right: t.right + (isRight === true ? 1 : 0),
  }))
  if (counted.count === session.dailyGoal) {
    $.ui.toast(`Holdtime: daily goal of ${session.dailyGoal} cards reached. Nice work.`)
  }
}

/** True while `card` is still the one on screen and not yet answered. */
async function isCurrent($: EngineInterface, card: Card): Promise<boolean> {
  const shownCard = await read($, cardAtom)
  return shownCard?.id === card.id && (await read($, feedbackAtom)) === null
}

// A second press can arrive before the band redraws: each handler takes the
// lock before it awaits anything, and checks the card it was drawn for is
// still the one on screen.

async function answer($: EngineInterface, card: Card, said: boolean): Promise<void> {
  if (!lock()) return
  try {
    if (!(await isCurrent($, card))) return
    const isRight = said === card.answer
    const feedback: Feedback = { isRight, text: card.explain ?? '' }
    await update($, feedbackAtom, () => feedback)
    await record($, card, isRight)
  } finally {
    unlock()
  }
}

async function moveOn($: EngineInterface, card: Card): Promise<void> {
  if (!lock()) return
  try {
    if ((await read($, cardAtom))?.id !== card.id) return
    if (session.unanswered === card.id) await record($, card, null)
    await showNext($)
  } finally {
    unlock()
  }
}

async function hide($: EngineInterface): Promise<void> {
  if (!lock()) return
  try {
    session.isHiddenThisTurn = true
    forgetUnanswered()
    await update($, cardAtom, () => null)
  } finally {
    unlock()
  }
}

/** A card the person never answered may come back later in the session. */
function forgetUnanswered(): void {
  if (session.unanswered) session.shown.delete(session.unanswered)
  session.unanswered = null
}

async function statsText($: EngineInterface): Promise<string> {
  const day = await readDay($)
  const byTopic = accuracyByTopic(CARDS, session.progress)
  const asked = TOPICS.reduce((n, t) => n + byTopic[t].asked, 0)
  const right = TOPICS.reduce((n, t) => n + byTopic[t].right, 0)
  const pct = (r: number, a: number): string => (a === 0 ? '-' : `${Math.round((100 * r) / a)}%`)
  const topics = TOPICS.map(t => `${TOPIC_NAMES[t]} ${pct(byTopic[t].right, byTopic[t].asked)} (${byTopic[t].asked})`).join(' · ')
  return [
    `${session.isPaused ? 'Paused. ' : ''}${day.count}/${session.dailyGoal} cards today.`,
    `Questions answered: ${asked}, right: ${right} (${pct(right, asked)}).`,
    `By topic: ${topics}.`,
    session.isPaused ? '`/holdtime resume` turns the cards back on.' : '`/holdtime pause` turns the cards off.',
  ].join('\n')
}

async function setPaused($: EngineInterface, isPaused: boolean): Promise<void> {
  session.isPaused = isPaused
  await $.store.set('paused', isPaused)
  if (isPaused) {
    forgetUnanswered()
    await update($, cardAtom, () => null)
  }
}

async function reset($: EngineInterface): Promise<void> {
  await $.store.delete('progress')
  await $.store.delete('day')
  session.progress = {}
  session.shown.clear()
}

async function startTurn($: EngineInterface): Promise<void> {
  session.isHiddenThisTurn = false
  session.ask = null
  session.weights = decay(session.weights)
  const fresh: TurnTally = { seen: 0, asked: 0, right: 0 }
  await update($, tallyAtom, () => fresh)
  await update($, needsYouAtom, () => false)
  await showNext($)
}

async function setNeedsYou($: EngineInterface, needsYou: boolean): Promise<void> {
  if ((await read($, needsYouAtom)) !== needsYou) await update($, needsYouAtom, () => needsYou)
}

async function waitForYou($: EngineInterface, tool: string, key: string): Promise<void> {
  session.ask = { tool, key, at: await $.clock.now() }
  await setNeedsYou($, true)
}

async function noteCall($: EngineInterface, call: { tool: string; key: string; startedAt: number }, isFinished: boolean): Promise<void> {
  if (session.ask && isAnswered(session.ask, call, isFinished)) {
    session.ask = null
    await setNeedsYou($, false)
  }
}

async function now($: EngineInterface): Promise<number> {
  return $.clock.now()
}

/** Clears the band and says how the turn went, or nothing if no card was seen. */
async function endTurn($: EngineInterface): Promise<string | null> {
  const tally = await read($, tallyAtom)
  forgetUnanswered()
  session.ask = null
  await update($, cardAtom, () => null)
  await update($, feedbackAtom, () => null)
  await setNeedsYou($, false)
  if (tally.seen === 0) return null
  const cards = `${tally.seen} card${tally.seen === 1 ? '' : 's'}`
  const right = tally.asked > 0 ? `, ${tally.right}/${tally.asked} right` : ''
  const day = await readDay($)
  return `Holdtime: ${cards} this turn${right} · ${day.count}/${session.dailyGoal} today`
}

async function load($: EngineInterface): Promise<void> {
  await $.command.register({
    name: 'holdtime',
    description: 'Holdtime: your learning stats, or pause, resume or reset the cards',
    argumentHint: '[stats | pause | resume | reset]',
    immediate: true,
  })
  session.progress = ((await $.store.get('progress')) as Progress | undefined) ?? {}
  session.isPaused = (await $.store.get('paused')) === true
  const found: Topic[] = []
  for (const [file, topic] of PROJECT_FILES) {
    if (await $.fs.exists(file)) found.push(topic)
  }
  session.weights = seed(freshWeights(), found)
}

export const register: Register = (on, options) => {
  session.dailyGoal = Number(options['daily_goal'] ?? 20)
  session.maxPerTurn = Number(options['max_per_turn'] ?? 5)
  session.weights = freshWeights()
  session.shown = new Set<string>()
  session.unanswered = null
  session.ask = null
  session.isBusy = false

  on('session.start', async ($, e, next) => {
    await load($)
    return next(e)
  })

  on('command.run', { command: 'holdtime' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'pause') {
      await setPaused($, true)
      return { text: 'Paused. `/holdtime resume` brings the cards back.' }
    }
    if (arg === 'resume') {
      await setPaused($, false)
      return { text: 'On. Cards appear while Claude works.' }
    }
    if (arg === 'reset') {
      await reset($)
      return { text: 'Progress deleted: every card is new again, and today starts at 0.' }
    }
    return { text: await statsText($) }
  })

  on('turn.start', async ($, e, next) => {
    const started = await next(e)
    await startTurn($)
    return started
  })

  // Every tool call says something about the session's topic, and tells
  // whether Claude has moved on from a question it put to the person.
  on('tool.call', async ($, e, next) => {
    const input = e as unknown as Readonly<Record<string, unknown>>
    const topic = topicOf(e.tool, input)
    if (topic) session.weights = bump(session.weights, topic)
    const call = { tool: e.tool, key: keyOf(input), startedAt: await now($) }
    await noteCall($, call, false)
    const ran = await next(e)
    await noteCall($, call, true)
    return ran
  })

  on('classic.PermissionRequest', async ($, e, next) => {
    await waitForYou($, e.tool_name, keyOf((e.tool_input ?? {}) as Readonly<Record<string, unknown>>))
    return next(e)
  })

  on('classic.Notification', async ($, e, next) => {
    if (NEEDS_YOU.has(e.notification_type)) await waitForYou($, '', '')
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId) return done
    const summary = await endTurn($)
    return summary ? { ...done, text: summary } : done
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !e.props.isWorking || e.props.view.agentId) return next(e)
    const card = await read($, cardAtom)
    const feedback = await read($, feedbackAtom)
    const needsYou = await read($, needsYouAtom)
    if (needsYou || !card) return next(e)

    const { Box, Button, Markdown, Text } = $.ui.resolve(e)
    const isAsking = card.kind === 'yesno' && !feedback
    const title = `Holdtime · ${TOPIC_NAMES[card.topic]}${isAsking ? ' · yes or no?' : ''}`
    const body = feedback ? `${feedback.isRight ? '**Right.**' : '**Not quite.**'} ${feedback.text}` : card.text

    // The buttons share the first row with the title: a band shorter than the
    // card scrolls, and a bare digit only presses a button in view.
    return (
      <Box flexDirection="column">
        <Box flexDirection="row" columnGap={3}>
          <Text dimColor>{title}</Text>
          {isAsking && <Button key="yes" label="Yes" hotkey="1" plain onPress={() => answer($, card, true)} />}
          {isAsking && <Button key="no" label="No" hotkey="2" plain onPress={() => answer($, card, false)} />}
          {!isAsking && <Button key="next" label={feedback ? 'Next' : 'Got it'} hotkey="1" plain onPress={() => moveOn($, card)} />}
          <Button key="hide" label="Hide" hotkey="9" plain dimColor onPress={() => hide($)} />
        </Box>
        <Markdown text={body} />
      </Box>
    )
  })
}
