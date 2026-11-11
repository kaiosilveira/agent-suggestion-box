# 9. The box is private by default, outside the repository

Date: 2026-11-11

## Status

Accepted

## Context

The file store's default was `.suggestion-box/suggestions.jsonl` in the repository, committed, with a `union` merge rule. A
person who wanted the box out of the repository set `SUGGESTION_BOX_FILE`, usually in a settings file of one checkout. That
file is not in the worktrees, so their agents wrote to the repository's box while the main checkout read the other one: two
boxes, and nothing saying so. The tool is local-first and meant first for one person checking their own agents' suggestions;
a box shared through git is a team's need, for later.

## Decision

With no `file.path` in `.suggestion-box.json` and no `SUGGESTION_BOX_FILE`, the box is
`<data folder>/suggestion-box/<project>-<hash>/suggestions.jsonl`. The data folder is `XDG_DATA_HOME` when set, else
`~/Library/Application Support` on macOS, `%LOCALAPPDATA%` on Windows and `~/.local/share` elsewhere. The key is the project
root's folder name and the first eight hex digits of the SHA-256 of its absolute path. The root is found as before, a linked
worktree resolving to its main worktree ([ADR 8](0008-worktrees-share-the-main-box.md)), so every checkout and session of one
repository on one machine shares one box, with no setting.

A box in the repository is a choice: `file.path` names it, and `init` then adds its `union` merge rule as before.

## Consequences

- Nothing to configure and nothing to commit or ignore; a worktree cannot drift to another box.
- The box is per person and per machine. Two machines (a laptop and a loop runner) have two boxes until a shared store exists.
- Moving or renaming the repository's folder starts a new, empty box; the old one stays in the data folder. `list_suggestions`
  names the file it read, which is where to look.
- A box at the old default, `.suggestion-box/suggestions.jsonl`, is no longer read unless `file.path` names it. No release had
  shipped, so no migration is made.
