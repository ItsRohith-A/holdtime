# Holdtime privacy policy

_Last updated: 2 October 2026_

Holdtime runs inside Claude Code on your own computer. This page explains what
it reads, what it keeps, and what it sends.

## The short version

- **Nothing leaves your computer.** Holdtime makes no network requests.
- **No personal data.** It does not collect names, emails, file contents,
  prompts or Claude's replies.
- **No accounts, tracking, analytics or ads.**

## What it reads

- **Which tool Claude uses**, and from that tool's input only: the file's
  extension (such as `.py`) or the first word of a shell command (such as
  `pytest`). This picks the topic of the next card. It is not stored.
- **Whether a few project files exist** in the folder Claude works in
  (`package.json`, `tsconfig.json`, `pyproject.toml`, `requirements.txt`,
  `setup.py`), once per session, to choose the first topic. Their contents
  are never read.
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

## What it sends

**Nothing.** The author receives no data of any kind.

## Removing your data

Run `/holdtime reset` to delete your progress and today's count at once. To
remove Holdtime completely, uninstall it with
`claude plugin uninstall holdtime@holdtime` and delete its file under
`~/.claude/plugins/store/`.

## Children

Holdtime is a tool for Claude Code users and is not directed at children under 18.

## Changes

Changes to this policy are made in this file, in the project's public
repository, with the date above updated.

## Contact

Open an issue at <https://github.com/ItsRohith-A/holdtime/issues>.
