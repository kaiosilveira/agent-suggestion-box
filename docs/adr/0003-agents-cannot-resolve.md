# 3. Agents cannot resolve suggestions

Date: 2026-11-10

## Status

Accepted

## Context

A suggestion leaves the box when it is filed (it became an issue, a ticket, a change) or dropped. If agents could do this, the
box would decide which changes get made to the harness. The radar's "feedback flywheel" puts that choice with the human.

## Decision

In v0.1 the MCP server exposes only `list_suggestions`, `suggest` and `upvote`. Resolving (`file`, `drop`, `triage`) is
available only from the CLI.

## Consequences

- An agent cannot close a suggestion it dislikes, or one it thinks it fixed.
- The human has to triage. `list` and `triage` keep that quick.
- If users ask for it, a later `--allow-agent-resolve` flag on the server can add a `resolve` tool. That would need a new ADR.
