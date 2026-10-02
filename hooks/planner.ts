/**
 * Holdtime's decisions, with no access to Claude Code: which topic a tool call
 * points at, which card comes next, and how an answer moves a card between
 * spaced-repetition boxes. Everything here is a plain function of its inputs,
 * so it is tested directly.
 */
import type { Card, Topic } from '../types'

export const TOPICS: readonly Topic[] = ['javascript', 'python', 'git']

/** A card's place in the Leitner system, kept per card id in the store. */
export type CardProgress = {
  /** 1 to 5; a wrong answer sends a card back to box 1. */
  box: number
  /** The day (YYYY-MM-DD) the card is next due for review. */
  due: string
  seen: number
  right: number
}

export type Progress = Readonly<Record<string, CardProgress>>

export type Weights = Readonly<Record<Topic, number>>

/** Days until a card in each box comes back: box 1 tomorrow, box 5 in 16 days. */
export const INTERVAL_DAYS = [1, 2, 4, 8, 16] as const

/** Every topic stays possible, so a session about one language still mixes. */
export const BASE_WEIGHT = 0.5

/** How much of a topic's weight carries into the next turn. */
export const DECAY = 0.8

export function freshWeights(): Weights {
  return { javascript: BASE_WEIGHT, python: BASE_WEIGHT, git: BASE_WEIGHT }
}

/** Fades older signals at the start of a turn, never below the base weight. */
export function decay(weights: Weights): Weights {
  const out = { ...weights }
  for (const topic of TOPICS) {
    out[topic] = Math.max(BASE_WEIGHT, weights[topic] * DECAY)
  }
  return out
}

const EXTENSIONS: ReadonlyArray<[RegExp, Topic]> = [
  [/\.(m|c)?(j|t)sx?$/i, 'javascript'],
  [/(^|\/)(package\.json|tsconfig[^/]*\.json)$/i, 'javascript'],
  [/\.pyi?$/i, 'python'],
  [/(^|\/)(pyproject\.toml|requirements[^/]*\.txt|setup\.py)$/i, 'python'],
  [/(^|\/)\.git(ignore|attributes|modules)$/i, 'git'],
]

const PROGRAMS: Readonly<Record<string, Topic>> = {
  git: 'git',
  gh: 'git',
  node: 'javascript',
  npm: 'javascript',
  npx: 'javascript',
  pnpm: 'javascript',
  yarn: 'javascript',
  bun: 'javascript',
  tsc: 'javascript',
  deno: 'javascript',
  python: 'python',
  python3: 'python',
  pip: 'python',
  pip3: 'python',
  pytest: 'python',
  uv: 'python',
  poetry: 'python',
  ruff: 'python',
  mypy: 'python',
}

/**
 * The topic one tool call points at: a file's extension for the file tools,
 * the program a shell command starts with for Bash. `null` when neither says.
 */
export function topicOf(tool: string, input: Readonly<Record<string, unknown>>): Topic | null {
  const path = input['file_path'] ?? input['notebook_path'] ?? input['path']
  if (typeof path === 'string') {
    const normal = path.replace(/\\/g, '/')
    for (const [pattern, topic] of EXTENSIONS) {
      if (pattern.test(normal)) return topic
    }
  }
  const command = input['command']
  if ((tool === 'Bash' || tool === 'PowerShell') && typeof command === 'string') {
    for (const step of command.split(/&&|\|\||;|\|/)) {
      const words = step.trim().split(/\s+/)
      // Skip leading `FOO=bar` assignments.
      const program = words.find(word => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(word))
      const topic = program ? PROGRAMS[program.replace(/^.*\//, '').toLowerCase()] : undefined
      if (topic) return topic
    }
  }
  return null
}

/** Adds one to a topic's weight. */
export function bump(weights: Weights, topic: Topic): Weights {
  return { ...weights, [topic]: weights[topic] + 1 }
}

/**
 * Project files that say what a repository is written in, checked once at
 * session start so the very first card already fits the project.
 */
export const PROJECT_FILES: ReadonlyArray<[string, Topic]> = [
  ['package.json', 'javascript'],
  ['tsconfig.json', 'javascript'],
  ['pyproject.toml', 'python'],
  ['requirements.txt', 'python'],
  ['setup.py', 'python'],
]

/** Raises the weight of each topic a project file pointed at, once per topic. */
export function seed(weights: Weights, found: readonly Topic[]): Weights {
  return [...new Set(found)].reduce(bump, weights)
}

/**
 * A tool call Claude asked the person to approve, or a question it put to
 * them. `tool` and `key` identify the call; both are empty for a question.
 */
export type Ask = { tool: string; key: string; at: number }

/** The input field that tells one call of a tool from another. */
export function keyOf(input: Readonly<Record<string, unknown>>): string {
  for (const field of ['command', 'file_path', 'notebook_path', 'url', 'pattern', 'query']) {
    const value = input[field]
    if (typeof value === 'string') return value
  }
  return ''
}

/**
 * Whether Claude has moved on from an ask: the call that asked has finished,
 * or a new tool call started after it, which Claude only does once answered.
 */
export function isAnswered(ask: Ask, call: { tool: string; key: string; startedAt: number }, isFinished: boolean): boolean {
  if (!isFinished) return call.startedAt > ask.at
  return ask.tool !== '' && call.tool === ask.tool && call.key === ask.key
}

/** The day of a timestamp, as YYYY-MM-DD in UTC. */
export function dayOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

export function addDays(day: string, days: number): string {
  return dayOf(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000)
}

/**
 * Records one answer. `isRight` is `null` for a fact, which was only read:
 * it moves up a box like a right answer, so facts come back less and less.
 */
export function grade(progress: Progress, card: Card, isRight: boolean | null, today: string): Progress {
  const before = progress[card.id] ?? { box: 0, due: today, seen: 0, right: 0 }
  const box = isRight === false ? 1 : Math.min(INTERVAL_DAYS.length, before.box + 1)
  const wait = INTERVAL_DAYS[box - 1] ?? 1
  return {
    ...progress,
    [card.id]: {
      box,
      due: addDays(today, wait),
      seen: before.seen + 1,
      right: before.right + (isRight === true ? 1 : 0),
    },
  }
}

/** Picks from `items` with chances in proportion to `weightOf`. */
function weighted<T>(items: readonly T[], weightOf: (item: T) => number, rand: () => number): T | undefined {
  const total = items.reduce((sum, item) => sum + Math.max(0, weightOf(item)), 0)
  if (total <= 0) return items.at(Math.floor(rand() * items.length))
  let left = rand() * total
  for (const item of items) {
    left -= Math.max(0, weightOf(item))
    if (left < 0) return item
  }
  return items.at(-1)
}

/**
 * The next card. A topic is drawn by weight; within it, a card due for review
 * comes first one time in three, else a card never seen, else any card not
 * shown this session. Returns `null` when nothing is left to show.
 */
export function pickCard(
  cards: readonly Card[],
  weights: Weights,
  progress: Progress,
  today: string,
  shown: ReadonlySet<string>,
  rand: () => number = Math.random,
): Card | null {
  const fresh = cards.filter(card => !shown.has(card.id))
  if (fresh.length === 0) return null

  const topics = TOPICS.filter(topic => fresh.some(card => card.topic === topic))
  const topic = weighted(topics, t => weights[t], rand) ?? topics.at(0)
  const pool = fresh.filter(card => card.topic === topic)

  const due = pool.filter(card => {
    const p = progress[card.id]
    return p !== undefined && p.due <= today
  })
  const unseen = pool.filter(card => progress[card.id] === undefined)

  const roll = rand()
  const from = due.length > 0 && (roll < 1 / 3 || unseen.length === 0) ? due : unseen.length > 0 ? unseen : pool
  return from.at(Math.floor(rand() * from.length)) ?? null
}

/** Right answers out of answered cards, per topic, from the stored progress. */
export function accuracyByTopic(cards: readonly Card[], progress: Progress): Record<Topic, { asked: number; right: number }> {
  const out = { javascript: { asked: 0, right: 0 }, python: { asked: 0, right: 0 }, git: { asked: 0, right: 0 } }
  for (const card of cards) {
    const p = progress[card.id]
    if (!p || card.kind !== 'yesno') continue
    out[card.topic].asked += p.seen
    out[card.topic].right += p.right
  }
  return out
}
