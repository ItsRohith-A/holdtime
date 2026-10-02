import { describe, expect, test } from 'claude-code/testing'

import type { Card } from '../types'
import { bump, freshWeights } from './planner'
import { avoidFor, LOW_WATER, merge, needsRefill, readLibrary, readyFor, topicToFill } from './pool'

const card = (id: string, topic = 'rust', text = id): Card => ({ id, topic, kind: 'fact', text, source: 'ai' })

/** `n` cards of one topic, ids `t0`, `t1`, and so on. */
const many = (n: number, topic = 'rust'): Card[] => Array.from({ length: n }, (_, i) => card(`${topic}${i}`, topic))

describe('readLibrary', () => {
  test('reads back what was stored', () => {
    expect(readLibrary([card('a')]).length).toBe(1)
  })

  test('drops anything that is not a card, so bad stored data cannot reach the band', () => {
    expect(readLibrary(undefined)).toEqual([])
    expect(readLibrary('nonsense')).toEqual([])
    expect(readLibrary([card('a'), { id: 'b' }, null, { ...card('c'), text: '' }]).length).toBe(1)
  })
})

describe('merge', () => {
  test('puts new cards in front of the old ones', () => {
    const merged = merge([card('old')], [card('new')])
    expect(merged[0]?.id).toBe('new')
    expect(merged.length).toBe(2)
  })

  test('skips a card already held by id', () => {
    expect(merge([card('a')], [card('a')]).length).toBe(1)
  })

  test('skips a card whose text is already held under another id', () => {
    const held = card('a', 'rust', 'Ownership moves by default.')
    const same = card('b', 'rust', 'ownership MOVES by default.')
    expect(merge([held], [same]).length).toBe(1)
  })

  test('trims the oldest away once the cap is reached', () => {
    const merged = merge(many(5), [card('fresh')], 3)
    expect(merged.length).toBe(3)
    expect(merged[0]?.id).toBe('fresh')
    // The oldest of the five is gone, the newest of them kept.
    expect(merged.map(c => c.id).includes('rust4')).toBe(false)
  })
})

describe('needsRefill', () => {
  const shown = new Set<string>()

  test('an empty library needs filling', () => {
    expect(needsRefill([], 'rust', shown)).toBe(true)
  })

  test('a library stocked for the topic does not', () => {
    expect(needsRefill(many(LOW_WATER), 'rust', shown)).toBe(false)
  })

  test('cards of another topic do not count', () => {
    expect(needsRefill(many(LOW_WATER, 'go'), 'rust', shown)).toBe(true)
  })

  test('cards already shown this session do not count', () => {
    const library = many(LOW_WATER)
    const seen = new Set(library.map(c => c.id))
    expect(readyFor(library, 'rust', seen)).toBe(0)
    expect(needsRefill(library, 'rust', seen)).toBe(true)
  })
})

describe('topicToFill', () => {
  test('fills for whatever the session leans towards', () => {
    expect(topicToFill(bump(freshWeights(), 'kubernetes'))).toBe('kubernetes')
  })

  test('falls back to a pack topic when nothing has pointed anywhere', () => {
    expect(topicToFill(freshWeights(), () => 0)).toBe('javascript')
  })
})

describe('avoidFor', () => {
  test('gathers the texts of both the library and the packs, for that topic only', () => {
    const library = [card('a', 'rust', 'From the library.')]
    const packs = [card('b', 'rust', 'From the pack.'), card('c', 'go', 'Another topic.')]
    expect(avoidFor(library, packs, 'rust')).toEqual(['From the library.', 'From the pack.'])
  })
})
