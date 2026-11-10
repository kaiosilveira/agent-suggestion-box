# 5. The file store only in v0.1; stores stay pluggable

Date: 2026-11-10

## Status

Accepted

## Context

The first sketch shipped two stores in v0.1: a JSONL file in the repository and a pinned GitHub issue. The project is meant to
be an open-source tool that anyone downloads and runs locally. Tying v0.1 to GitHub would add a token, an API client and
recorded-response tests before the core is proven, and would make GitHub look like the expected home for the box.

## Decision

v0.1 has one store, `file`. Every store goes behind the `SuggestionStore` port (`src/store/store.ts`) and must pass the shared
contract suite (`src/store/contract.test.ts`). `.suggestion-box.json` selects the store by name. Other stores (GitHub, Slack,
others) can be added later without changing the domain, the MCP server or the CLI.

`file <id> <ref>` no longer creates an issue. It records `ref` (an issue URL, a ticket, a commit) and resolves the suggestion as
filed. The human creates the issue wherever they keep issues.

## Consequences

- v0.1 has no network access, no tokens and no third-party API.
- The open question about upvote notes on GitHub (a reaction carries no text) is deferred with the GitHub store.
- Users who want the box in GitHub, Slack or elsewhere wait for, or contribute, a store. The port and the contract suite are the
  extension point.
