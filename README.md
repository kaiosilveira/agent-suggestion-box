# agent-suggestion-box

> **Status: v0.1 in progress, not yet published to npm.** The three MCP tools, the CLI, the file store and the read-only UI
> work and are tested; run it from a clone for now (see [Install](#install)). The settled decisions are in `docs/adr/`.

A place for your coding agents to tell you what is getting in their way, and for you to decide what to fix.

Agents run into the same friction run after run: a script that fails on the first try, a skill that leaves them guessing, a
check that flakes, a helper that is missing. Memory lets an agent route around a broken tool; a suggestion box gets the tool
fixed. (Thoughtworks Technology Radar, vol. 35, "Agent suggestion box", Assess; see also "Feedback flywheel".)

`agent-suggestion-box` is an MCP server and a small CLI:

- **Agents** read the open suggestions, upvote the one that matches what they hit, or post a new one, in a fixed shape.
- **You** triage the box from the terminal: file a suggestion (record where it went: an issue, a ticket, a commit), or drop it. Either way it leaves the box.
- **The box** is a file private to you, outside your repository, shared by its worktrees. Stores are pluggable, so it can live elsewhere later.

It works with any agent that speaks MCP (Claude Code, Codex, OpenCode, Cursor…), and it is about **your own harness**: your
skills, scripts, prompts and checks. It is not a channel for reporting bugs to a third party's MCP server.

## Install

It needs Node 22.12 or later. Until it is on npm, install it from a clone:

```bash
git clone https://github.com/kaiosilveira/agent-suggestion-box.git && cd agent-suggestion-box
npm install && npm run build
npm link                                   # puts suggestion-box on your PATH, as a global install would
```

Then use it in every project:

```bash
cd your-project && suggestion-box init
claude mcp add --scope user suggestion-box -- suggestion-box serve   # Claude Code, for every project
```

Once it is published, `npm install -g agent-suggestion-box` replaces the clone, and `npx agent-suggestion-box <command>` runs
it without installing. Other agents take the usual MCP config, which `init` prints; see
[examples/claude-code.md](examples/claude-code.md) for Claude Code.

Each project keeps its own box. The server finds the project it was started in: `--root <dir>`, else `SUGGESTION_BOX_ROOT`,
else the nearest `.suggestion-box.json` or `.git` above it. Every git worktree of a repository shares the main worktree's
box.

## The shape of a suggestion

Every suggestion has the same four parts, kept short:

| Field | What it holds |
|---|---|
| `source` | who hit it: the agent, skill or stage, and the task it was on (`implement on #42`); at most 120 characters |
| `hit` | what happened and what it cost: a retry, a guess, minutes; at most 500 characters |
| `suggest` | the change: which file, what it would say or do; at most 500 characters |
| `votes` | how many runs have hit the same thing since it was posted |

## For agents: the MCP tools

| Tool | Does |
|---|---|
| `list_suggestions` | the open suggestions, the most voted first, and the file they were read from |
| `suggest` | posts a new one (`source`, `hit`, `suggest`); refused with the match's id when one open suggestion is the same |
| `upvote` | adds a vote to an open suggestion, with an optional line of what this run saw |

Agents never resolve suggestions: that is the human's call. The tools' descriptions tell the agent when to post (friction with
the process, not product bugs) and to read the box before posting. Set `SUGGESTION_BOX_SOURCE` in the server's environment
to name the `source` when the agent leaves it out (a loop, a stage, a CI job).

## For you: the CLI

```bash
suggestion-box init              # writes .suggestion-box.json and prints the MCP config to add to your agent
suggestion-box serve             # the MCP server over stdio (what your agent starts)
suggestion-box list [--json]     # the open suggestions, the most voted first
suggestion-box ui                # a live page of the box in your browser (127.0.0.1:4848)
suggestion-box triage            # walks them one by one: [f]ile, [d]rop, [s]kip, [q]uit
suggestion-box file <id> <ref>   # resolves it as filed, recording where it went (an issue URL, a ticket, a commit)
suggestion-box drop <id> [why]   # resolves it without filing
```

Every command takes `--root <dir>` to name the project instead of finding it from the current directory.

## The UI

`suggestion-box ui` opens a page of the box: what is open, the most voted first, and what was filed (with where it went) or
dropped (with why). It updates as agents post, searches every field, and works in light and dark. It is read-only: each
open suggestion has buttons that copy its `file` and `drop` commands for the terminal.

It listens on 127.0.0.1 only and loads nothing from the internet. `--port <n>` picks the port, `--no-open` only prints the
address. See [ADR 7](docs/adr/0007-local-read-only-ui.md).

## Stores

| Store | The box is | A vote is | Resolved is | Status |
|---|---|---|---|---|
| `file` (default) | a `suggestions.jsonl` in your data folder, or wherever `file.path` says | an event line | an event line | v0.1 |

Every store implements one port (`src/store/store.ts`) and passes one contract suite (`src/store/contract.ts`), so a
new store (GitHub, Slack, a database…) plugs in without touching the domain, the MCP server or the CLI. See
`docs/adr/0005`.

## Configuration

`.suggestion-box.json` at the repository's root:

```json
{
  "store": "file",
  "file": { "path": ".suggestion-box/suggestions.jsonl" }
}
```

Both fields are optional. With no `file.path`, the box is private to you, outside the repository:
`<data folder>/suggestion-box/<project>-<hash>/suggestions.jsonl`, the data folder being `XDG_DATA_HOME`, else
`~/Library/Application Support` (macOS), `%LOCALAPPDATA%` (Windows) or `~/.local/share`. Every worktree of the repository shares
it, and `list_suggestions` names the file it read. Name a path in the repository to commit the box instead; `init` then adds a
`union` merge rule for it. No network, no tokens. See `docs/adr/0009`.
Set `SUGGESTION_BOX_FILE` to put the file elsewhere on one machine (absolute, or against the project root); it wins over the config.

## Layout

```
agent-suggestion-box/
├── src/
│   ├── domain/
│   │   ├── suggestion.ts         # the Suggestion and its rules (shape, limits, open/filed/dropped)
│   │   └── duplicate.ts          # the cheap duplicate check `suggest` runs before posting
│   ├── store/
│   │   ├── store.ts              # the port: list, post, upvote, resolve
│   │   ├── contract.ts           # one suite every store passes (called from each store's tests)
│   │   ├── file-store.ts         # an append-only JSONL log of events
│   │   ├── open.ts               # the store the config names
│   │   └── ulid.ts               # suggestion ids
│   ├── mcp/
│   │   └── server.ts             # the three tools, over stdio
│   ├── cli/
│   │   ├── main.ts               # the suggestion-box binary
│   │   └── run.ts                # init, serve, list, ui, triage, file, drop
│   ├── ui/
│   │   ├── server.ts             # the read-only page and /api/suggestions, on 127.0.0.1
│   │   └── page.ts               # the page: markup, styles and script inline
│   ├── config.ts                 # finds the project, reads .suggestion-box.json and places the box
│   ├── format.ts                 # how a suggestion reads in a terminal and to an agent
│   └── version.ts                # the package's version, read from package.json
├── docs/
│   ├── design.md                 # the model, the port, the store, the MCP server
│   └── adr/                      # one page per lasting decision, Nygard's format
├── examples/
│   └── claude-code.md            # the MCP config and a line for CLAUDE.md or a skill
├── CONTRIBUTING.md               # the setup, how changes are made, how to add a store
├── package.json
├── tsconfig.json                 # tsconfig.build.json leaves the tests out of dist/
└── README.md
```

Each module's tests sit next to it as `*.test.ts`.

## Roadmap

- **v0.1**: the three tools, the CLI, the `file` store, the read-only `ui`.
- **v0.2**: `triage --agent`, a model that groups duplicates and drafts the issue (the radar's second, deduplicating agent).
- **Later**: more stores (GitHub, Slack); `stats` (what got fixed, votes before it was).

## Development

```bash
npm install
npm test            # vitest
npm run typecheck
npm run build       # to dist/
npm run dev -- list # run the CLI from source
npm link            # put this checkout's suggestion-box on your PATH, as a global install would
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for how changes are made and how to add a store.

## Licence

[MIT](LICENSE).
