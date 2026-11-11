# 8. Worktrees share the main worktree's box

Date: 2026-11-11

## Status

Accepted

## Context

The server finds its project by walking up to the nearest `.suggestion-box.json` or `.git`. A linked git worktree has both
(the config is committed, and its `.git` is a file), so each worktree got a box of its own. Agents do most of their work in
worktrees: they could not see or upvote what agents in the other worktrees posted, and a box that was not committed was
deleted with its worktree, with nothing telling the human it had been there.

## Decision

A linked worktree resolves to its main worktree. `findRoot` reads the worktree's `.git` file and the `commondir` it leads
to, without running git; when that common directory is a `.git` folder, its parent is the root. Anything else (a submodule,
a bare repository's worktree) keeps the directory found. `--root` and `SUGGESTION_BOX_ROOT` still choose any directory,
a worktree included.

## Consequences

- Every agent on one repository and machine reads, posts to and votes on one box, live.
- An agent in a worktree writes to the main worktree's files. A committed box shows up as a change there, not in the
  worktree's branch; the `union` merge rule still settles boxes from other clones.
- A worktree that wants its own box passes `--root` or sets `SUGGESTION_BOX_ROOT`.
