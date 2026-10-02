# Holdtime

Learn something while Claude works.

When you send Claude Code a prompt, you often wait 30 seconds to a few minutes.
Holdtime fills that wait with one short card at a time — a quick fact or a
yes/no question — in the band just above your prompt. It picks cards from what
Claude is doing right now, steps aside the moment Claude needs you, and
remembers what you got wrong so it can ask again later.

It ships with cards for JavaScript, Python and Git, and writes its own for
whatever else you are working on, so a Rust or Kubernetes session gets Rust or
Kubernetes cards.

```
Holdtime · Git · yes or no?   1: Yes   2: No   9: Hide
Does `git rebase` give the rebased commits new hashes?
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
  cards; `git` commands bring Git cards; `cargo` brings Rust and `kubectl`
  brings Kubernetes. Even the first card fits: a `pyproject.toml`,
  `package.json` or `Cargo.toml` in the folder sets the starting topic.
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
| `/holdtime reset` | Delete your saved progress and start fresh |

### Settings

Change these in `/config`, or when you install:

| Setting | Default | What it does |
| --- | --- | --- |
| Write new cards with a model | On | Cards for topics beyond the three packs. Uses your Claude plan; see [Privacy](#privacy) |
| Daily goal | 20 | Cards per day before Holdtime goes quiet |
| Cards per turn | 5 | Most cards in one Claude turn |

## What's inside

108 cards ship with Holdtime, in three topics, half quick facts and half
yes/no questions:

| Topic | Cards | Picked when Claude… |
| --- | --- | --- |
| JavaScript and TypeScript | 36 | edits `.js`/`.ts` files, runs `npm`, `node`, `tsc`… |
| Python | 36 | edits `.py` files, runs `python`, `pytest`, `pip`… |
| Git | 36 | runs `git` or `gh` commands |

With no signal yet, all three topics are mixed. Every shipped card was written
for this project; none are copied from other sites.

### Cards for anything else

Holdtime recognises Rust, Go, Ruby, Java, Kotlin, Swift, PHP, C#, SQL, Docker,
Kubernetes, Terraform, shell and CSS from the files Claude edits and the
commands it runs. No pack covers those, so Holdtime asks Claude to write
cards for them in the background and keeps the good ones.

A generated card has to clear the same bar as a shipped one — one line, a
question that ends in `?`, a real explanation — or it is thrown away unread.
The shipped packs fill in whenever the library is empty, the request fails, or
you are offline, so the band is never blank waiting on a model.

This is on by default. It uses your Claude plan and sends the topic name to
Claude; nothing from your code or conversation goes with it. Turn it off in
`/config` and Holdtime makes no network requests at all. See
[PRIVACY.md](PRIVACY.md).

## Privacy

Holdtime collects no personal data and sends the author nothing. It reads only
the name of each tool Claude uses, the file extension, and the first word of a
shell command, to pick a topic. Your progress is kept in Claude Code's local
plugin store, and `/holdtime reset` deletes it.

One thing leaves your computer, and only while card writing is on: the topic
name, sent to Claude on your own plan so it can write cards about it. Never
your code, your prompts or Claude's replies. Turn **Write new cards with a
model** off in `/config` and Holdtime makes no network requests at all. See
[PRIVACY.md](PRIVACY.md).

## Troubleshooting

**No cards appear.** Check `claude --version` is 2.1.287 or newer, that the
plugin is enabled in `/plugin`, and that `/holdtime` does not say "paused". Cards
only show while Claude is working, and not once today's goal is reached.

**Only JavaScript, Python and Git cards.** Those are the shipped packs. Cards
for other topics are written in the background and take a few seconds to
arrive; `/holdtime` shows how many are ready. If it always says `0 generated`,
check **Write new cards with a model** is on in `/config`.

**Typing `1` started a prompt instead of answering.** The digit must be the
only thing in an empty prompt. Otherwise, click the button or focus the band
with `Ctrl+X` then `Tab`.

**A card disappeared mid-question.** Claude asked for permission or a decision.
Answer Claude; the card returns when it continues.

## Development

```bash
claude plugin validate .claude-plugin/plugin.json   # manifest and hooks module
claude plugin test .                                 # the test suite
claude --plugin-dir .                                # run your working copy
```

For editor type checking, run `/plugin-types` once inside Claude Code from
this folder. It writes Claude Code's API types to `.claude/types/`, which
`tsconfig.json` reads and git ignores. Then `npx tsc -p tsconfig.json` checks
the code and the tests.

```
hooks/register.tsx    events and the band: what Holdtime does in Claude Code
hooks/planner.ts      pure logic: topics, card choice, spaced repetition
hooks/pool.ts         pure logic: the generated library and when to refill it
content/*.ts          the card packs
content/generate.ts   the prompt, and turning a model's reply into cards
types/index.d.ts      the shapes of cards and of the band's state
```

A new shipped card is one object in `content/<topic>.ts`. Both shipped and
generated cards go through `isValidCard` in `planner.ts`, so the tests and the
runtime filter agree on what a card has to be: a unique id, one line, a
question that ends with `?`, an answer and an explanation.

Nothing calls a model in the tests. `$.model.complete` is an event like any
other, so `band.test.tsx` answers it with a canned reply.

Raise `version` in `.claude-plugin/plugin.json` for every release so installed
copies update.

## License

MIT — see [LICENSE](LICENSE).
