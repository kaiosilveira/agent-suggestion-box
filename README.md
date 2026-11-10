# agent-suggestion-box

> **Status: scaffolded.** The project builds and its tests are listed, but nothing works yet. This README and
> `docs/design.md` describe v0.1; the settled decisions are in `docs/adr/`.

A place for your coding agents to tell you what is getting in their way, and for you to decide what to fix.

Agents run into the same friction run after run: a script that fails on the first try, a skill that leaves them guessing, a
check that flakes, a helper that is missing. Memory lets an agent route around a broken tool; a suggestion box gets the tool
fixed. (Thoughtworks Technology Radar, vol. 35, "Agent suggestion box", Assess; see also "Feedback flywheel".)

`agent-suggestion-box` is an MCP server and a small CLI:

- **Agents** read the open suggestions, upvote the one that matches what they hit, or post a new one, in a fixed shape.
- **You** triage the box from the terminal: file a suggestion (record where it went: an issue, a ticket, a commit), or drop it. Either way it leaves the box.
- **The box** is a file in your repository by default. Stores are pluggable, so it can live elsewhere later.

It works with any agent that speaks MCP (Claude Code, Codex, OpenCode, Cursor…), and it is about **your own harness**: your
skills, scripts, prompts and checks. It is not a channel for reporting bugs to a third party's MCP server.

## Install

It needs Node 20 or later. Install it once and use it in every project:

```bash
npm install -g agent-suggestion-box
cd your-project && suggestion-box init
claude mcp add --scope user suggestion-box -- suggestion-box serve   # Claude Code, for every project
```

Or run it without installing: `npx agent-suggestion-box <command>`. Each project keeps its own box; the server finds the
project it was started in (the nearest `.suggestion-box.json` or `.git` above it, or `--root`).

## The shape of a suggestion

Every suggestion has the same four parts, kept short:

| Field | What it holds |
|---|---|
| `source` | who hit it: the agent, skill or stage, and the task it was on (`implement on #42`) |
| `hit` | what happened and what it cost: a retry, a guess, minutes |
| `suggest` | the change: which file, what it would say or do |
| `votes` | how many runs have hit the same thing since it was posted |

## For agents: the MCP tools

| Tool | Does |
|---|---|
| `list_suggestions` | the open suggestions, the most voted first |
| `suggest` | posts a new one (`source`, `hit`, `suggest`); refused with the match's id when one open suggestion is the same |
| `upvote` | adds a vote to an open suggestion, with an optional line of what this run saw |

Agents never resolve suggestions: that is the human's call. The tools' descriptions tell the agent when to post (friction with
the process, not product bugs) and to read the box before posting.

## For you: the CLI

```bash
npx agent-suggestion-box init              # writes .suggestion-box.json and prints the MCP config to add to your agent
npx agent-suggestion-box serve             # the MCP server over stdio (what your agent starts)
npx agent-suggestion-box list              # the open suggestions, the most voted first
npx agent-suggestion-box triage            # walks them one by one: [f]ile, [d]rop, [s]kip
npx agent-suggestion-box file <id> <ref>   # resolves it as filed, recording where it went (an issue URL, a ticket…)
npx agent-suggestion-box drop <id> [why]   # resolves it without filing
```

## Stores

| Store | The box is | A vote is | Resolved is | Status |
|---|---|---|---|---|
| `file` (default) | `.suggestion-box/suggestions.jsonl` in the repo | an event line | an event line | v0.1 |

Every store implements one port (`src/store/store.ts`) and passes one contract suite (`src/store/contract.test.ts`), so a
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

Both fields are optional: with no file at all, the box is the file store at its default path. No network, no tokens.

## Layout

```
agent-suggestion-box/
├── src/
│   ├── domain/
│   │   ├── suggestion.ts         # the Suggestion and its rules (shape, limits, open/filed/dropped)
│   │   ├── suggestion.test.ts
│   │   ├── duplicate.ts          # the cheap duplicate check `suggest` runs before posting
│   │   └── duplicate.test.ts
│   ├── store/
│   │   ├── store.ts              # the port: list, post, upvote, resolve
│   │   ├── contract.test.ts      # one suite every store passes
│   │   ├── file-store.ts         # JSONL in the repository
│   │   └── file-store.test.ts
│   ├── mcp/
│   │   ├── server.ts             # the three tools, over stdio
│   │   └── server.test.ts
│   ├── cli/
│   │   ├── main.ts               # init, serve, list, triage, file, drop
│   │   └── triage.ts
│   └── config.ts                 # reads and checks .suggestion-box.json
├── docs/
│   ├── design.md                 # the model, the port, the store, the MCP server
│   └── adr/                      # one page per lasting decision, Nygard's format
├── examples/
│   └── claude-code.md            # the MCP config and a line for CLAUDE.md or a skill
├── package.json
├── tsconfig.json
└── README.md
```

## Roadmap

- **v0.1**: the three tools, the CLI, the `file` store.
- **v0.2**: `triage --agent`, a model that groups duplicates and drafts the issue (the radar's second, deduplicating agent).
- **Later**: more stores (GitHub, Slack); `stats` (what got fixed, votes before it was).

## Development

```bash
npm install
npm test            # vitest
npm run typecheck
npm run build       # to dist/
npm run dev -- list # run the CLI from source
```

## Licence

MIT.
