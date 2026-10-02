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
import { accuracyByTopic, bump, dayOf, decay, freshWeights, grade, pickCard, topicOf, TOPICS } from './planner'
import type { Progress, Weights } from './planner'

const cardAtom = atom({ plugin: 'holdtime', key: 'card' } as const, null)
const feedbackAtom = atom({ plugin: 'holdtime', key: 'feedback' } as const, null)
const needsYouAtom = atom({ plugin: 'holdtime', key: 'needsYou' } as const, false)
const tallyAtom = atom({ plugin: 'holdtime', key: 'tally' } as const, { seen: 0, asked: 0, right: 0 })

const TOPIC_NAMES: Record<Topic, string> = { javascript: 'JavaScript', python: 'Python', git: 'Git' }

/** Notifications that mean Claude is waiting on the person. */
const NEEDS_YOU = new Set(['permission_prompt', 'idle_prompt', 'agent_needs_input', 'elicitation_dialog', 'elicitation_url_dialog'])

type DayCount = { date: string; count: number }

/**
 * The session's bookkeeping, set up again on every load. What must outlive
 * the session (progress, the day's count, the pause switch) is mirrored to
 * $.store; what the band draws from lives in $.state.
 */
const session = {
  dailyGoal: 20,
  maxPerTurn: 5,
  weights: freshWeights() as Weights,
  progress: {} as Progress,
  dayCount: { date: '', count: 0 } as DayCount,
  isPaused: false,
  isHiddenThisTurn: false,
  shown: new Set<string>(),
}

async function today($: EngineInterface): Promise<string> {
  return dayOf(await $.clock.now())
}

async function countToday($: EngineInterface): Promise<number> {
  return session.dayCount.date === (await today($)) ? session.dayCount.count : 0
}

/** Shows the next card, or nothing when a cap is reached or learning is off. */
async function showNext($: EngineInterface): Promise<void> {
  const tally = await read($, tallyAtom)
  const isCapped = tally.seen >= session.maxPerTurn || (await countToday($)) >= session.dailyGoal
  const isOff = session.isPaused || session.isHiddenThisTurn || isCapped
  const card = isOff ? null : pickCard(CARDS, session.weights, session.progress, await today($), session.shown)
  if (card) session.shown.add(card.id)
  await update($, feedbackAtom, () => null)
  await update($, cardAtom, () => card)
}

/** Records a seen card: grades it, counts it, and saves progress. */
async function record($: EngineInterface, card: Card, isRight: boolean | null): Promise<void> {
  const day = await today($)
  session.progress = grade(session.progress, card, isRight, day)
  const before = session.dayCount.date === day ? session.dayCount.count : 0
  session.dayCount = { date: day, count: before + 1 }
  await update($, tallyAtom, t => ({
    seen: t.seen + 1,
    asked: t.asked + (isRight === null ? 0 : 1),
    right: t.right + (isRight === true ? 1 : 0),
  }))
  await $.store.set('progress', session.progress)
  await $.store.set('day', session.dayCount)
  if (session.dayCount.count === session.dailyGoal) {
    $.ui.toast(`Holdtime: daily goal of ${session.dailyGoal} cards reached. Nice work.`)
  }
}

async function answer($: EngineInterface, card: Card, said: boolean): Promise<void> {
  const isRight = said === card.answer
  await record($, card, isRight)
  const feedback: Feedback = { isRight, text: card.explain ?? '' }
  await update($, feedbackAtom, () => feedback)
}

async function hide($: EngineInterface): Promise<void> {
  session.isHiddenThisTurn = true
  await update($, cardAtom, () => null)
}

async function gotIt($: EngineInterface, card: Card, isAnswered: boolean): Promise<void> {
  if (!isAnswered) await record($, card, null)
  await showNext($)
}

async function statsText($: EngineInterface): Promise<string> {
  const count = await countToday($)
  const byTopic = accuracyByTopic(CARDS, session.progress)
  const asked = TOPICS.reduce((n, t) => n + byTopic[t].asked, 0)
  const right = TOPICS.reduce((n, t) => n + byTopic[t].right, 0)
  const pct = (r: number, a: number): string => (a === 0 ? '-' : `${Math.round((100 * r) / a)}%`)
  const topics = TOPICS.map(t => `${TOPIC_NAMES[t]} ${pct(byTopic[t].right, byTopic[t].asked)} (${byTopic[t].asked})`).join(' · ')
  return [
    `Holdtime${session.isPaused ? ' (paused)' : ''}: ${count}/${session.dailyGoal} cards today.`,
    `Questions answered: ${asked}, right: ${right} (${pct(right, asked)}).`,
    `By topic: ${topics}.`,
    session.isPaused ? '`/holdtime resume` turns the cards back on.' : '`/holdtime pause` turns the cards off.',
  ].join('\n')
}

async function setPaused($: EngineInterface, isPaused: boolean): Promise<void> {
  session.isPaused = isPaused
  await $.store.set('paused', isPaused)
  if (isPaused) await update($, cardAtom, () => null)
}

async function startTurn($: EngineInterface): Promise<void> {
  session.isHiddenThisTurn = false
  session.weights = decay(session.weights)
  const fresh: TurnTally = { seen: 0, asked: 0, right: 0 }
  await update($, tallyAtom, () => fresh)
  await update($, needsYouAtom, () => false)
  await showNext($)
}

async function setNeedsYou($: EngineInterface, needsYou: boolean): Promise<void> {
  if ((await read($, needsYouAtom)) !== needsYou) await update($, needsYouAtom, () => needsYou)
}

/** Clears the band and says how the turn went, or nothing if no card was seen. */
async function endTurn($: EngineInterface): Promise<string | null> {
  const tally = await read($, tallyAtom)
  await update($, cardAtom, () => null)
  await update($, feedbackAtom, () => null)
  await setNeedsYou($, false)
  if (tally.seen === 0) return null
  const cards = `${tally.seen} card${tally.seen === 1 ? '' : 's'}`
  const right = tally.asked > 0 ? `, ${tally.right}/${tally.asked} right` : ''
  return `Holdtime: ${cards} this turn${right} · ${await countToday($)}/${session.dailyGoal} today`
}

async function load($: EngineInterface): Promise<void> {
  await $.command.register({
    name: 'holdtime',
    description: 'Holdtime: your learning stats, or pause and resume the cards',
    argumentHint: '[stats | pause | resume]',
    immediate: true,
  })
  session.progress = ((await $.store.get('progress')) as Progress | undefined) ?? {}
  session.dayCount = ((await $.store.get('day')) as DayCount | undefined) ?? { date: '', count: 0 }
  session.isPaused = (await $.store.get('paused')) === true
}

export const register: Register = (on, options) => {
  session.dailyGoal = Number(options['daily_goal'] ?? 20)
  session.maxPerTurn = Number(options['max_per_turn'] ?? 5)
  session.weights = freshWeights()
  session.shown = new Set<string>()

  on('session.start', async ($, e, next) => {
    await load($)
    return next(e)
  })

  on('command.run', { command: 'holdtime' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'pause') {
      await setPaused($, true)
      return { text: 'Holdtime paused. `/holdtime resume` brings the cards back.' }
    }
    if (arg === 'resume') {
      await setPaused($, false)
      return { text: 'Holdtime is on. Cards appear while Claude works.' }
    }
    return { text: await statsText($) }
  })

  on('turn.start', async ($, e, next) => {
    const started = await next(e)
    await startTurn($)
    return started
  })

  // Every tool call says something about the session's topic. When one
  // finishes, Claude is working again, so a band that stepped aside returns.
  on('tool.call', async ($, e, next) => {
    const topic = topicOf(e.tool, e as unknown as Readonly<Record<string, unknown>>)
    if (topic) session.weights = bump(session.weights, topic)
    const ran = await next(e)
    await setNeedsYou($, false)
    return ran
  })

  on('classic.PermissionRequest', async ($, e, next) => {
    await setNeedsYou($, true)
    return next(e)
  })

  on('classic.Notification', async ($, e, next) => {
    if (NEEDS_YOU.has(e.notification_type)) await setNeedsYou($, true)
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
    const question = card.kind === 'yesno' && !feedback ? ' · yes or no?' : ''
    const header = `Holdtime · ${TOPIC_NAMES[card.topic]}${question}`
    const body = feedback ? `${feedback.isRight ? '**Right.**' : '**Not quite.**'} ${feedback.text}` : card.text
    const isAsking = card.kind === 'yesno' && !feedback

    return (
      <Box flexDirection="column">
        <Text dimColor>{header}</Text>
        <Markdown text={body} />
        <Box flexDirection="row" columnGap={3}>
          {isAsking && <Button key="yes" label="Yes" hotkey="1" plain onPress={() => answer($, card, true)} />}
          {isAsking && <Button key="no" label="No" hotkey="2" plain onPress={() => answer($, card, false)} />}
          {!isAsking && (
            <Button key="next" label={feedback ? 'Next' : 'Got it'} hotkey="1" plain onPress={() => gotIt($, card, feedback !== null)} />
          )}
          <Button key="hide" label="Hide" hotkey="9" plain dimColor onPress={() => hide($)} />
        </Box>
      </Box>
    )
  })
}
