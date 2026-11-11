# Design

The model, the port every store implements, the first store, and the MCP server. It comes from a working version: the
suggestion box of the Tibo repository (a pinned GitHub issue that the Ralph loop's skills post to and `prepare-loop` triages),
generalised into a local, downloadable tool. The settled decisions are in [`adr/`](adr/README.md).

## The model

One aggregate, `Suggestion`. Its fields stay private and change only through methods that check its rules.

| Field | Type | Rule |
|---|---|---|
| `id` | string | given by the store (a ULID in the file store) |
| `source` | string | required, at most 120 characters |
| `hit` | string | required, at most 500 characters |
| `suggest` | string | required, at most 500 characters |
| `votes` | number | starts at 0; `upvote()` adds one, only while open |
| `status` | `open` \| `filed` \| `dropped` | starts open; `file(ref)` and `drop(reason)` close it, once |
| `resolution` | `{ref?, reason?, at}` | set when it closes: where it went (an issue URL, a ticket, a commit), or why it was dropped |
| `postedAt` | `YYYY-MM-DD…` ISO string | given at posting, from the clock passed in |

Functions that depend on now take it as their last parameter, so tests fix it.

**Duplicates.** The agent is the real deduplicator: the tools tell it to `list_suggestions` first and `upvote` a match. As a
backstop, `suggest` refuses a post whose `suggest` field, normalised (lower case, punctuation and stop words removed), equals or
nearly equals (a token-set similarity over 0.8) an open suggestion's, and answers with that suggestion's id so the agent can upvote it.
Deduplication by a model is v0.2, in `triage`, never in the hot path.

## The port

`src/store/store.ts`:

```ts
interface SuggestionStore {
  listOpen(): Promise<SuggestionSnapshot[]>;
  listAll(): Promise<SuggestionSnapshot[]>;
  post(draft: SuggestionDraft, now: Date): Promise<SuggestionSnapshot>;
  upvote(id: string, note: string | undefined, now: Date): Promise<SuggestionSnapshot>;
  resolve(id: string, resolution: ResolveRequest, now: Date): Promise<void>;
}

type ResolveRequest = { status: "filed"; ref: string } | { status: "dropped"; reason?: string };
```

`contract.ts` runs one suite against every store (posting, listing in vote order, upvoting, refusing an upvote on a closed
one, resolving once), so a store is done when it passes. The port is the extension point: v0.1 ships one store, and others
(GitHub, Slack, a database) plug in behind it ([ADR 5](adr/0005-file-store-only-in-v0.1.md)).

## The file store

`.suggestion-box/suggestions.jsonl`: one JSON event per line, appended, never rewritten: `posted`, `upvoted`, `resolved`. The
state is folded from the events, so two agents in two worktrees append without a merge conflict on the same line (git's
`union` merge driver, set by `init` in `.gitattributes`, keeps both sides). Resolved suggestions stay in the log, which is the
history ([ADR 4](adr/0004-resolved-suggestions-stay-in-the-log.md)).

## Finding the project

One global install serves every project, so each command and each server finds its project at start:

1. `--root <dir>` if given, else `SUGGESTION_BOX_ROOT` if set.
2. Otherwise walk up from the current directory to the first directory holding `.suggestion-box.json` or `.git`. A linked
   git worktree resolves to its main worktree (read from its `.git` file and the `commondir` it leads to), so agents in
   several worktrees of one repository read and vote on one box, and a box is not lost when its worktree is removed.
3. If neither is found, refuse with a message that names `init` and `--root`, rather than create a box in a stray directory.

Paths in `.suggestion-box.json` resolve against that root. `SUGGESTION_BOX_FILE`, when set, replaces the file store's path (absolute,
or against the root), so the repository keeps one config and each machine says where its box lives. An agent that starts the server from a subdirectory still gets the
project's box.

## The MCP server

Stdio, three tools, the official TypeScript SDK, started with `suggestion-box serve`. Each tool's description carries the rules
an agent needs, so no instruction file is required: post only friction with the process (tools, scripts, skills, checks, docs),
never product bugs; read the box first; one suggestion per post; keep each field to a line or two. `source` defaults to
`SUGGESTION_BOX_SOURCE` from the environment when the agent omits it. No tool resolves a suggestion
([ADR 3](adr/0003-agents-cannot-resolve.md)).

## The CLI

`init`, `serve`, `list`, `ui`, `triage`, `file <id> <ref>`, `drop <id> [why]`. `file` does not create an issue: the human files it
wherever they keep issues and passes the reference, which the box records.

## The UI

`ui` serves a read-only page on 127.0.0.1 ([ADR 7](adr/0007-local-read-only-ui.md)): `GET /` is the page, under a CSP with a
per-request nonce, and `GET /api/suggestions` returns `{ project, version, generatedAt, suggestions }` from `listAll`. The page
polls every 3 seconds, renders agent-written text through text nodes only, and turns backtick spans into code.
