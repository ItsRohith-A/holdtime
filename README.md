# Holdtime

Learn something while Claude works.

When you send Claude Code a prompt, you often wait 30 seconds to a few minutes.
Holdtime fills that wait with one short card at a time — a quick fact or a
yes/no question — in the band just above your prompt. It picks cards from what
Claude is doing right now, steps aside the moment Claude needs you, and
remembers what you got wrong so it can ask again later.

```
Holdtime · Git · yes or no?
Does `git rebase` give the rebased commits new hashes?
1: Yes   2: No   9: Hide
```

When Claude finishes, one line under its answer tells you how it went:

```
Holdtime: 3 cards this turn, 2/2 right · 7/20 today
```

## Why

Waiting on an AI agent creates many short breaks, and most of them end up on a
phone. Holdtime keeps the break short and useful:

- **Only while Claude works.** Cards appear when a turn starts and disappear
  when it ends. There is no feed to scroll.
- **Claude always comes first.** A permission prompt or a question from Claude
  hides the card at once; it comes back when Claude carries on.
- **About your work.** Editing `.py` files or running `pytest` brings Python
  cards; `git` commands bring Git cards.
- **It sticks.** Spaced repetition brings a missed question back the next day,
  and correct ones further and further apart.
- **It stops.** At most 5 cards per turn and 20 per day by default.

## Requirements

- **Claude Code v2.1.287 or later.** Holdtime is a *mod*: it runs inside
  Claude Code and draws in Claude's own window. Check with `claude --version`.
- A terminal (or the desktop app's Code tab). Nothing else to install.

## Install

```bash
claude plugin marketplace add ItsRohith-A/holdtime
claude plugin install holdtime@holdtime
```

Restart Claude Code. The next time you give Claude a task, a card appears above
the prompt.

To try a local copy instead:

```bash
git clone https://github.com/ItsRohith-A/holdtime.git
claude --plugin-dir ./holdtime
```

## How to use it

| Key | What it does |
| --- | --- |
| `1` | Yes, or "Got it" on a fact, or "Next" after an answer |
| `2` | No |
| `9` | Hide cards for the rest of this turn |

Type the digit on its own in the **empty** prompt; it answers the card instead
of starting a prompt. You can also click the buttons, or focus the band with
`Ctrl+X` then `Tab`.

### Commands

| Command | What it does |
| --- | --- |
| `/holdtime` | Today's count, your accuracy, and accuracy by topic |
| `/holdtime pause` | Turn cards off (stays off across sessions) |
| `/holdtime resume` | Turn them back on |

### Settings

Change these in `/config`, or when you install:

| Setting | Default | What it does |
| --- | --- | --- |
| Daily goal | 20 | Cards per day before Holdtime goes quiet |
| Cards per turn | 5 | Most cards in one Claude turn |

## What's inside

108 cards in three topics, half quick facts and half yes/no questions:

| Topic | Cards | Picked when Claude… |
| --- | --- | --- |
| JavaScript and TypeScript | 36 | edits `.js`/`.ts` files, runs `npm`, `node`, `tsc`… |
| Python | 36 | edits `.py` files, runs `python`, `pytest`, `pip`… |
| Git | 36 | runs `git` or `gh` commands |

With no signal yet, all three topics are mixed. Every card was written for
this project; none are copied from other sites.

## Privacy

Everything stays on your computer. Holdtime makes no network requests and
collects no personal data. It reads only the name of each tool Claude uses,
the file extension, and the first word of a shell command, to pick a topic.
Your progress is kept in Claude Code's local plugin store. See
[PRIVACY.md](PRIVACY.md).

## Troubleshooting

**No cards appear.** Check `claude --version` is 2.1.287 or newer, that the
plugin is enabled in `/plugin`, and that `/holdtime` does not say "paused". Cards
only show while Claude is working, and not once today's goal is reached.

**Typing `1` started a prompt instead of answering.** The digit must be the
only thing in an empty prompt. Otherwise, click the button or focus the band
with `Ctrl+X` then `Tab`.

**A card disappeared mid-question.** Claude asked for permission or a decision.
Answer Claude; the card returns when it continues.

## Development

```bash
claude plugin validate .claude-plugin/plugin.json   # manifest and hooks module
claude plugin test .                                 # 17 tests
claude --plugin-dir .                                # run your working copy
```

```
hooks/register.tsx    events and the band: what Holdtime does in Claude Code
hooks/planner.ts      pure logic: topics, card choice, spaced repetition
content/*.ts          the card packs
types/index.d.ts      the shapes of cards and of the band's state
```

A new card is one object in `content/<topic>.ts`. The tests check that every id
is unique, every question ends with `?`, has an answer and an explanation, and
fits on one line. Raise `version` in `.claude-plugin/plugin.json` for every
release so installed copies update.

## License

MIT — see [LICENSE](LICENSE).
