import { describe, expect, test } from 'claude-code/testing'

import { BATCH, buildPrompt, parseCards } from './generate'

const reply = (...cards: unknown[]): string => JSON.stringify(cards)

const question = {
  kind: 'yesno',
  text: 'Does `cargo build` write to `target/`?',
  answer: true,
  explain: 'Yes. Cargo puts compiled artifacts under `target/` by default.',
}

describe('buildPrompt', () => {
  test('names the topic and how many cards are wanted', () => {
    const prompt = buildPrompt('rust', [])
    expect((prompt).includes('Topic: Rust.')).toBe(true)
    expect((prompt).includes(`Write ${BATCH} cards.`)).toBe(true)
  })

  test('lists what the reader already has, so the model does not repeat it', () => {
    const prompt = buildPrompt('rust', ['Ownership moves by default.'])
    expect((prompt).includes('Do not repeat')).toBe(true)
    expect((prompt).includes('Ownership moves by default.')).toBe(true)
  })

  test('sends at most 40 of them, however many are held', () => {
    const many = Array.from({ length: 100 }, (_, i) => `card number ${i}`)
    const prompt = buildPrompt('rust', many)
    expect((prompt).includes('card number 39')).toBe(true)
    expect((prompt).includes('card number 40')).toBe(false)
  })
})

describe('parseCards', () => {
  test('reads a plain JSON array', () => {
    const [card] = parseCards('rust', reply(question))
    expect(card?.topic).toBe('rust')
    expect(card?.kind).toBe('yesno')
    expect(card?.answer).toBe(true)
    expect(card?.source).toBe('ai')
    expect(card?.id.startsWith('ai-rust-')).toBe(true)
  })

  test('reads an array the model wrapped in a code fence', () => {
    const fenced = '```json\n' + reply(question) + '\n```'
    expect((parseCards('rust', fenced)).length).toBe(1)
  })

  test('reads an array with prose around it', () => {
    expect((parseCards('rust', `Here you go:\n${reply(question)}\nHope that helps.`)).length).toBe(1)
  })

  // A reply costs a request, so it is worth a few attempts before it is
  // thrown away. These are shapes a model sends back in practice.
  test('reads an array past prose that has brackets of its own', () => {
    expect((parseCards('rust', `Here [are] your cards:\n${reply(question)}`)).length).toBe(1)
  })

  test('reads the fenced block holding the array, not merely the first fence', () => {
    const fence = '```'
    const two = `${fence}\nan example\n${fence}\n${fence}json\n${reply(question)}\n${fence}`
    expect((parseCards('rust', two)).length).toBe(1)
  })

  test('reads a fenced array even when prose after it has brackets', () => {
    const fence = '```'
    const trailing = `${fence}json\n${reply(question)}\n${fence}\nLet me know [ok]?`
    expect((parseCards('rust', trailing)).length).toBe(1)
  })

  test('reads an array the model wrapped in an object', () => {
    expect((parseCards('rust', `{"cards": ${reply(question)}}`)).length).toBe(1)
  })

  test('gives up quickly rather than trying every opening', () => {
    const started = Date.now()
    expect(parseCards('rust', '['.repeat(5000) + reply(question))).toEqual([])
    expect(Date.now() - started).toBeLessThan(1000)
  })

  test('the same text always gets the same id, so a repeat is caught later', () => {
    const [first] = parseCards('rust', reply(question))
    const [again] = parseCards('rust', reply(question))
    expect(first?.id).toBe(again?.id)
  })

  test('drops a card the band could not show, keeping the rest', () => {
    const cards = parseCards('rust', reply(
      question,
      { kind: 'yesno', text: 'No question mark', answer: true, explain: 'This one has no question mark at all.' },
      { kind: 'yesno', text: 'Missing its explanation?', answer: false },
      { kind: 'yesno', text: `${'a'.repeat(200)}?`, answer: true, explain: 'Far too long for one line of the band.' },
      { kind: 'fact', text: '' },
      { kind: 'essay', text: 'Discuss ownership.' },
      'not an object',
    ))
    expect((cards).length).toBe(1)
    expect(cards[0]?.text).toBe(question.text)
  })

  test('a fact keeps no answer, even when the model sends one', () => {
    const [card] = parseCards('go', reply({ kind: 'fact', text: '`go vet` reports suspicious constructs.', answer: true }))
    expect(card?.kind).toBe('fact')
    expect(card?.answer).toBe(undefined)
  })

  test('the same text twice in one reply is kept once', () => {
    expect((parseCards('rust', reply(question, question))).length).toBe(1)
  })

  test('a reply that is not JSON yields nothing rather than throwing', () => {
    expect(parseCards('rust', 'I cannot help with that.')).toEqual([])
    expect(parseCards('rust', '[{"kind": "fact", unterminated')).toEqual([])
    expect(parseCards('rust', '')).toEqual([])
    expect(parseCards('rust', '{"kind":"fact","text":"An object, not an array."}')).toEqual([])
  })
})
