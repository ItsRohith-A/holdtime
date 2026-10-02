/** A topic a card belongs to; the session's tool calls weight these. */
export type Topic = 'javascript' | 'python' | 'git'

/**
 * One learning card. A `fact` is read and dismissed; a `yesno` is answered
 * with 1 (yes) or 2 (no) and then explained.
 */
export type Card = {
  id: string
  topic: Topic
  kind: 'fact' | 'yesno'
  text: string
  /** The right answer of a `yesno` card. */
  answer?: boolean
  /** One or two short sentences, shown after a `yesno` is answered. */
  explain?: string
}

/** What the band shows after a `yesno` card is answered. */
export type Feedback = { isRight: boolean; text: string }

/** Cards seen and answered right during the current Claude turn. */
export type TurnTally = { seen: number; asked: number; right: number }

declare module 'claude-code' {
  interface PluginState {
    holdtime: {
      card: Card | null
      feedback: Feedback | null
      needsYou: boolean
      tally: TurnTally
    }
  }
}
