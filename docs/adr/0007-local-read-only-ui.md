# 7. A local, read-only UI

Date: 2026-11-10

## Status

Accepted

## Context

`list` and `triage` work in a terminal, but a box that agents fill during a long loop is easier to follow on a page: what
is open, what is most voted, what was filed and where it went. The tool runs locally and the content is written by agents,
so the page must not become a way to reach the box from elsewhere, or to run what an agent wrote.

## Decision

`suggestion-box ui` serves one page and one JSON endpoint (`/api/suggestions`, every suggestion) from the CLI, on
127.0.0.1 only, port 4848 by default, and opens the browser.

- **Read-only.** The page shows the box and copies the `file` and `drop` commands. Resolving stays in the CLI, so there is no
  write endpoint to protect.
- **Self-contained.** Markup, styles and script are inline in `src/ui/page.ts`, with no external assets or build step. It
  works offline and sends nothing anywhere.
- **Safe with agent-written text.** The script builds the DOM from text nodes only (no `innerHTML`). The page runs under a
  CSP with a per-request nonce (`default-src 'none'`). Requests whose `Host` is not 127.0.0.1, localhost or [::1] on the
  served port are refused, against DNS rebinding.
- **Live by polling.** The page fetches the box every 3 seconds while visible.

## Consequences

- No new dependency: `node:http` serves it.
- The page polls rather than streams. That is enough at the box's size and works with any store.
- Triage from the page would need a write endpoint with its own protection (a token, CSRF checks). That is a new decision.
