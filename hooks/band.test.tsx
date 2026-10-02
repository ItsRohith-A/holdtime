import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'
import type { MockClock } from 'claude-code/testing'

const NOW = Date.parse('2026-10-02T10:00:00Z')

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: true, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const

/** The engine's own answers beneath the plugin, for the events a turn raises. */
function engine(on: On, store: Record<string, unknown> = {}): MockClock {
  mock.store(on, store)
  const clock = mock.clock(on, { now: NOW })
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  on('tool.call', () => ({ result: 'ok' }) as never)
  on('classic.Notification', () => ({}))
  on('classic.PermissionRequest', () => ({}))
  on('ui.toast', () => undefined as never)
  // The engine draws nothing of its own in the band.
  on('ui.render', () => ({ type: 'engine', ref: 0 }) as never)
  return clock
}

const complete = { answer: 'Done.', reason: 'answer', durationMs: 1000, isAborted: false, turnId: 't1' } as const
const command = (args: string) => ({ command: 'holdtime', args, origin: { kind: 'composer' }, presentation: {} }) as never

test('a turn shows a card, takes an answer, and ends with a summary', async ($, on) => {
  engine(on)
  await $.turn.start({ text: 'fix the login bug', turnId: 't1' })

  const ui = await $.ui.mount({ plugin: 'holdtime', surface: 'terminal', ...BAND })
  expect(await ui.find({ key: 'hide' })).toBeDefined()

  // A question takes 1 for yes and then shows Next; a fact takes 1 for Got it.
  if (await ui.find({ key: 'yes' })) {
    await ui.press({ key: 'yes' })
    expect(await ui.find({ key: 'next' })).toBeDefined()
    expect(await ui.find({ type: 'Markdown', text: /Right\.|Not quite\./ })).toBeDefined()
  } else {
    await ui.press({ key: 'next' })
  }
  await ui.unmount()

  const done = await $.turn.complete(complete as never)
  expect(done.text).toMatch(/^Holdtime: 1 card this turn/)
  expect(done.text).toMatch(/1\/20 today$/)
})

test('a question from Claude hides the card until Claude starts new work', async ($, on) => {
  const clock = engine(on)
  await $.turn.start({ text: 'deploy it', turnId: 't1' })
  const ui = await $.ui.mount({ plugin: 'holdtime', surface: 'terminal', ...BAND })
  expect(await ui.find({ key: 'hide' })).toBeDefined()

  await $.classic.Notification({ notification_type: 'elicitation_dialog', message: 'Claude has a question' })
  await ui.redraw()
  expect(await ui.find({ key: 'hide' })).toBeUndefined()

  await clock.advance(5000)
  await $.tool.call({ tool: 'Read', file_path: 'app.py', tool_use_id: 'toolu_1' } as never)
  await ui.redraw()
  expect(await ui.find({ key: 'hide' })).toBeDefined()
  await ui.unmount()
})

test('a parallel tool finishing does not bring the card back during a permission prompt', async ($, on) => {
  const clock = engine(on)
  await $.turn.start({ text: 'publish', turnId: 't1' })
  const ui = await $.ui.mount({ plugin: 'holdtime', surface: 'terminal', ...BAND })

  await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: { command: 'npm publish' } } as never)
  await ui.redraw()
  expect(await ui.find({ key: 'hide' })).toBeUndefined()

  // Another call already in flight finishes: still waiting on the person.
  await $.tool.call({ tool: 'Read', file_path: 'package.json', tool_use_id: 'toolu_2' } as never)
  await ui.redraw()
  expect(await ui.find({ key: 'hide' })).toBeUndefined()

  // The approved call itself finishes: Claude carries on.
  await clock.settle()
  await $.tool.call({ tool: 'Bash', command: 'npm publish', tool_use_id: 'toolu_1' } as never)
  await ui.redraw()
  expect(await ui.find({ key: 'hide' })).toBeDefined()
  await ui.unmount()
})

test('a double press counts once', async ($, on) => {
  engine(on)
  await $.turn.start({ text: 'one', turnId: 't1' })
  const ui = await $.ui.mount({ plugin: 'holdtime', surface: 'terminal', ...BAND })
  const key = (await ui.find({ key: 'yes' })) ? 'yes' : 'next'
  await Promise.allSettled([ui.press({ key }), ui.press({ key })])
  await ui.unmount()

  const done = await $.turn.complete(complete as never)
  expect(done.text).toMatch(/^Holdtime: 1 card this turn/)
})

test('nothing shows when Claude is idle, and a turn with no card says nothing', async ($, on) => {
  engine(on)
  const idle = await $.ui.mount({ plugin: 'holdtime', surface: 'terminal', ...BAND, props: { ...BAND.props, isWorking: false } })
  expect(await idle.find({ key: 'hide' })).toBeUndefined()
  await idle.unmount()

  await $.turn.start({ text: 'quick one', turnId: 't1' })
  const ui = await $.ui.mount({ plugin: 'holdtime', surface: 'terminal', ...BAND })
  await ui.press({ key: 'hide' })
  expect(await ui.find({ key: 'yes' })).toBeUndefined()
  await ui.unmount()

  const done = await $.turn.complete(complete as never)
  expect(done.text).toBe('Done.')
})

test('the daily goal stops new cards', { options: { daily_goal: 1 } }, async ($, on) => {
  engine(on)
  await $.turn.start({ text: 'one', turnId: 't1' })
  const ui = await $.ui.mount({ plugin: 'holdtime', surface: 'terminal', ...BAND })
  if (await ui.find({ key: 'yes' })) {
    await ui.press({ key: 'no' })
  }
  await ui.press({ key: 'next' })
  expect(await ui.find({ key: 'hide' })).toBeUndefined()
  await ui.unmount()
})

test('progress another session saved is kept when this one saves', async ($, on) => {
  // Another session answered this question three times, all right.
  const other = { 'git-rebase-hashes': { box: 3, due: '2026-10-06', seen: 3, right: 3 } }
  engine(on, { progress: other })
  await $.turn.start({ text: 'one', turnId: 't1' })
  const ui = await $.ui.mount({ plugin: 'holdtime', surface: 'terminal', ...BAND })
  await ui.press({ key: (await ui.find({ key: 'yes' })) ? 'yes' : 'next' })
  await ui.unmount()

  // Stats read what this session saved: the other session's 3 answers survive.
  const stats = await $.command.run(command('stats'))
  const answered = Number(/Questions answered: (\d+)/.exec(stats.text ?? '')?.[1])
  expect(answered).toBeGreaterThan(2)
})

test('/holdtime reset deletes saved progress', async ($, on) => {
  engine(on, { progress: { 'git-bisect': { box: 1, due: '2026-10-03', seen: 1, right: 0 } }, day: { date: '2026-10-02', count: 4 } })
  const before = await $.command.run(command(''))
  expect(before.text).toMatch(/^4\/20 cards today\./)

  const reply = await $.command.run(command('reset'))
  expect(reply.text).toMatch(/Progress deleted/)

  const after = await $.command.run(command(''))
  expect(after.text).toMatch(/^0\/20 cards today\./)
  expect(after.text).toMatch(/Questions answered: 0,/)
})
