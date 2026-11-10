# 4. Resolved suggestions stay in the log

Date: 2026-11-10

## Status

Accepted

## Context

Once filed or dropped, a suggestion leaves the open list. The question is whether its record is kept anywhere.

## Decision

The file store never deletes or rewrites. Resolving appends a `resolved` event; `listOpen` skips resolved suggestions when
folding the events. Every store must keep resolved suggestions readable in the same way.

## Consequences

- The log is the history: what was suggested, how many runs hit it, and what became of it.
- A later `stats` command can read it without a second source.
- The file grows without bound. That is acceptable at the expected volume. Compacting it, if ever needed, is a new decision.
