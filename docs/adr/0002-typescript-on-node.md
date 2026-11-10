# 2. TypeScript on Node

Date: 2026-11-10

## Status

Accepted. The Node floor is amended by [ADR 6](0006-node-22-or-later.md) (Node 22 or later).

## Context

The tool is an MCP server plus a small CLI, downloaded and run on the user's machine. The candidates were TypeScript on Node
and a single compiled binary (Rust or Go).

## Decision

TypeScript on Node (20 or later), built with `tsc` to ES modules. The MCP server uses the official TypeScript SDK
(`@modelcontextprotocol/sdk`).

It is distributed through npm only. Users either install it once globally (`npm install -g agent-suggestion-box`) and use the
same `suggestion-box` command in every project, or run it without installing (`npx agent-suggestion-box`). A release is
`npm publish`. There are no prebuilt binaries, install scripts or Homebrew formula.

One install serves many projects: the code is shared, the data is not. Each project keeps its own `.suggestion-box.json` and
box, and the server finds the project it was started in (docs/design.md, "Finding the project").

## Consequences

- The MCP SDK is first-class in TypeScript.
- `npx agent-suggestion-box` installs and runs it with nothing else; most agent harnesses already have Node.
- Start-up is slower than a native binary. That matters little for a stdio server that starts once per agent session.
- No cross-compilation or binary release pipeline to maintain.
- Users need Node 20 or later. A tool like agentsview (one Go binary from an install script, Releases or Homebrew) needs
  nothing; that was weighed and npm kept for the simpler release.
- `npm update -g` upgrades every project at once; a project that needs a fixed version can use `npx agent-suggestion-box@x.y.z`.
