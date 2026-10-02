import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const NOW = Date.parse('2026-10-02T10:00:00Z')

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: true, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const

/** The engine's own answers beneath the plugin, for the events a turn raises. */
function engine(on: On): void {
  mock.store(on)
  mock.clock(on, { now: NOW })
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  on('tool.call', () => ({ result: 'ok' }) as never)
  on('classic.Notification', () => ({}))
  on('classic.PermissionRequest', () => ({}))
  on('ui.toast', () => undefined as never)
  // The engine draws nothing of its own in the band.
  on('ui.render', () => ({ type: 'engine', ref: 0 }) as never)
}

const complete = { answer: 'Done.', reason: 'answer', durationMs: 1000, isAborted: false, turnId: 't1' } as const

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

test('the band steps aside while Claude needs you, and returns after', async ($, on) => {
  engine(on)
  await $.turn.start({ text: 'deploy it', turnId: 't1' })
  const ui = await $.ui.mount({ plugin: 'holdtime', surface: 'terminal', ...BAND })
  expect(await ui.find({ key: 'hide' })).toBeDefined()

  await $.classic.Notification({ notification_type: 'permission_prompt', message: 'Claude needs your permission to use Bash' })
  await ui.redraw()
  expect(await ui.find({ key: 'hide' })).toBeUndefined()

  await $.tool.call({ tool: 'Read', file_path: 'app.py', tool_use_id: 'toolu_1' } as never)
  await ui.redraw()
  expect(await ui.find({ key: 'hide' })).toBeDefined()
  await ui.unmount()
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
