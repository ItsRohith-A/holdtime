/**
 * The library of generated cards: what is kept, when more are needed, and
 * which topic to ask about next. Pure functions, so the refill policy is
 * tested without a model or a store.
 */
import type { Card, Topic } from '../types'
import { isValidCard, leadingTopic, PACK_TOPICS, type Weights } from './planner'

/** Generated cards kept at once. Old ones fall off the end as new arrive. */
export const LIBRARY_MAX = 240

/**
 * Cards of the current topic that have to be ready and unshown before a
 * refill is worth a request. Below this, one batch is fetched in the
 * background; the shipped packs cover the gap meanwhile.
 */
export const LOW_WATER = 6

/** Reads a stored library back, dropping anything that is not a card now. */
export function readLibrary(stored: unknown): Card[] {
  if (!Array.isArray(stored)) return []
  return stored.filter(isValidCard)
}

/**
 * Adds new cards to the library, newest first, skipping any whose id or text
 * is already held, and trimming the oldest away past `LIBRARY_MAX`.
 */
export function merge(library: readonly Card[], incoming: readonly Card[], cap = LIBRARY_MAX): Card[] {
  const ids = new Set(library.map(card => card.id))
  const texts = new Set(library.map(card => card.text.toLowerCase()))
  const fresh: Card[] = []
  for (const card of incoming) {
    if (ids.has(card.id) || texts.has(card.text.toLowerCase())) continue
    ids.add(card.id)
    texts.add(card.text.toLowerCase())
    fresh.push(card)
  }
  return [...fresh, ...library].slice(0, cap)
}

/** Cards of one topic that this session has not shown yet. */
export function readyFor(library: readonly Card[], topic: Topic, shown: ReadonlySet<string>): number {
  return library.filter(card => card.topic === topic && !shown.has(card.id)).length
}

/**
 * Whether to spend a request on `topic` now: only when the library is short
 * of unshown cards for it. A topic the packs already cover is still worth
 * generating for, because the pack runs out within a session or two.
 */
export function needsRefill(library: readonly Card[], topic: Topic, shown: ReadonlySet<string>): boolean {
  return readyFor(library, topic, shown) < LOW_WATER
}

/**
 * The topic to generate for: whatever the session leans towards, or a pack
 * topic when nothing has pointed anywhere yet, so an idle session still fills
 * its library instead of waiting for a signal that may never come.
 */
export function topicToFill(weights: Weights, rand: () => number = Math.random): Topic {
  const leading = leadingTopic(weights)
  if (leading !== null) return leading
  return PACK_TOPICS[Math.floor(rand() * PACK_TOPICS.length)] ?? 'git'
}

/** The texts of the cards already held for a topic, to send as "do not repeat". */
export function avoidFor(library: readonly Card[], packs: readonly Card[], topic: Topic): string[] {
  return [...library, ...packs].filter(card => card.topic === topic).map(card => card.text)
}
