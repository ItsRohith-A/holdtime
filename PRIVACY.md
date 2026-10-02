# Holdtime privacy policy

_Last updated: 2 October 2026_

Holdtime runs inside Claude Code on your own computer. This page explains what
it reads, what it keeps, and what it sends.

## The short version

- **One thing leaves your computer: a topic name.** When Holdtime writes new
  cards, it asks Claude for cards about a topic such as `Rust` or `Kubernetes`.
  Nothing else about your work is sent. Turn this off and Holdtime makes no
  network requests at all.
- **Never your code, prompts or replies.** Holdtime does not read file
  contents, your prompts, or Claude's answers, and cannot send them.
- **No accounts, tracking, analytics or ads.** The author receives no data of
  any kind.

## Writing cards with a model

Holdtime ships 108 cards covering JavaScript, Python and Git. For any other
topic it asks Claude to write more. This is **on by default** and you can turn
it off in `/config`, under **Write new cards with a model**.

While it is on:

- **What is sent**: the topic name, the instructions for writing a card, and
  the text of the cards you already hold for that topic, so the model does not
  repeat them. Nothing else — not your code, not your file names, not your
  prompts.
- **Where it goes**: to Claude, through Claude Code, using your own plan or API
  key. The request is not part of your conversation and Claude cannot see it.
- **What it costs**: the requests count against your Claude plan like any other
  use. One request writes eight cards, and Holdtime only asks when it is
  running short for the current topic.
- **When it happens**: in the background, on a timer, never while you are
  waiting for a card.

Turn it off and Holdtime uses the shipped packs only and makes no network
requests.

## What it reads

- **Which tool Claude uses**, and from that tool's input only: the file's
  extension (such as `.py`) or the first word of a shell command (such as
  `pytest`). This picks the topic of the next card. It is not stored.
- **Whether a few project files exist** in the folder Claude works in
  (`package.json`, `tsconfig.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`,
  `Gemfile`, `pom.xml`, `composer.json`, `Dockerfile` and a few more), once per
  session, to choose the first topic. Their contents are never read.
- **Which call Claude is waiting to have approved**, held in memory only, so
  the card comes back once that call goes ahead.
- **When a turn starts and ends**, and when Claude asks for permission or a
  decision, so cards appear and step aside at the right moments.
- **Your answers** to cards: the key you press.

## What it stores

In Holdtime's own file in Claude Code's local plugin store, under
`~/.claude/plugins/store/` on your computer:

| Item | Contents |
| --- | --- |
| Progress | For each card id: its review box, when it is next due, how many times you saw it and got it right |
| Today | The date and how many cards you saw that day |
| Paused | Whether you turned cards off with `/holdtime pause` |
| Library | The cards a model wrote: their topic, text, answer and explanation |

The library holds cards about public programming topics. It never holds
anything taken from your own code or conversation.

## What it sends

The topic name and the cards you already hold for it, to Claude, and only
while card writing is on. The author receives no data of any kind.

## Removing your data

Run `/holdtime reset` to delete your progress, today's count and every card a
model wrote. To remove Holdtime completely, uninstall it with
`claude plugin uninstall holdtime@holdtime` and delete its file under
`~/.claude/plugins/store/`.

## Children

Holdtime is a tool for Claude Code users and is not directed at children under 18.

## Changes

Changes to this policy are made in this file, in the project's public
repository, with the date above updated.

## Contact

Open an issue at <https://github.com/ItsRohith-A/holdtime/issues>.
