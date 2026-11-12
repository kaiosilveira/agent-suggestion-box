# Contributing

Thanks for helping. This guide covers the setup, how changes are made, and the most likely contribution: a new store.

## Setup

You need Node 22.12 or later.

```bash
git clone https://github.com/kaiosilveira/agent-suggestion-box.git && cd agent-suggestion-box
npm install
npm test            # Vitest
npm run typecheck
npm run build       # to dist/
npm link            # put this checkout's suggestion-box on your PATH
```

`npm run dev -- <command>` runs the CLI from source without building.

## How changes are made

- **Tests first.** Each module's tests sit next to it as `*.test.ts`. A bug fix starts with a test that fails.
- **Time is a parameter.** Code that depends on the current time takes it as its last argument (`now: Date`), so tests fix it.
  Code never calls `new Date()` itself except in `src/cli/main.ts`.
- **Small commits, [Conventional Commits](https://www.conventionalcommits.org/)**: `feat(store): …`, `fix(mcp): …`,
  `docs: …`. One logical change per commit.
- **Lasting decisions get an ADR** in `docs/adr/`, in Nygard's format. An accepted ADR is not rewritten. A later one amends
  or supersedes it, and the index in `docs/adr/README.md` says so.
- CI runs typecheck, tests and build on Node 22, 24 and 26, on Linux, macOS and Windows. A pull request should pass all three locally first.

## Two rules that keep the tool what it is

1. **Agents never resolve suggestions** ([ADR 3](docs/adr/0003-agents-cannot-resolve.md)). The MCP server has only
   `list_suggestions`, `suggest` and `upvote`. Filing and dropping are for the human, from the CLI.
2. **The box is about your own harness**: your skills, scripts, prompts and checks. It is not for product bugs or reports to
   third parties, and the tool descriptions say so.

## Adding a store

A store is where the box lives. v0.1 ships one, a JSONL file that is private to you by default
([ADR 5](docs/adr/0005-file-store-only-in-v0.1.md), [ADR 9](docs/adr/0009-the-box-is-private-by-default.md)). Every store sits behind one port, so the domain, the MCP server and
the CLI do not change when you add one.

1. **Implement the port** in `src/store/<name>-store.ts`:

   ```ts
   interface SuggestionStore {
     listOpen(): Promise<SuggestionSnapshot[]>;
     listAll(): Promise<SuggestionSnapshot[]>;
     post(draft: SuggestionDraft, now: Date): Promise<SuggestionSnapshot>;
     upvote(id: string, note: string | undefined, now: Date): Promise<SuggestionSnapshot>;
     resolve(id: string, resolution: ResolveRequest, now: Date): Promise<void>;
   }
   ```

   Use the `Suggestion` aggregate (`src/domain/suggestion.ts`) to apply the rules rather than repeating them. Throw
   `SuggestionError` with the code `not-found` for an unknown id. Let the aggregate throw `invalid` and `closed`.

2. **Pass the contract.** In `src/store/<name>-store.test.ts`:

   ```ts
   import { storeContract } from "./contract.js";
   storeContract("MyStore", async () => new MyStore(/* a fresh, empty box */));
   ```

   The store is done when the suite passes. Add tests for anything specific to it below that. A store that talks to a
   network service is tested against recorded responses, never the live service.

3. **Make it selectable.** In `src/config.ts`, add its name to the `store` enum and its settings (as their own object, like
   `file`) to the schema and to `Config`. Add a case to `openStore` in `src/store/open.ts`.

4. **Document it.** Add a row to the Stores table in the README with what the box, a vote and a resolution are in this store.
   If it needs a decision (where tokens come from, what an upvote note becomes), write an ADR.

Keep resolved suggestions readable ([ADR 4](docs/adr/0004-resolved-suggestions-stay-in-the-log.md)): a store hides them from
`listOpen`, never deletes them.
