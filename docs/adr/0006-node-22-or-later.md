# 6. Node 22 or later

Date: 2026-11-10

## Status

Accepted. Amends [ADR 2](0002-typescript-on-node.md), which said Node 20 or later.

## Context

Node 20 reached its end of life in April 2026. The test runner, Vitest 5, needs Node 22.12 or later, so CI cannot run the
suite on Node 20 at all. The runtime dependencies (the MCP SDK, zod) still support older versions.

## Decision

`engines` is `>=22.12`. CI runs on Node 22, 24 and 26 on Linux, and on Node 24 on macOS and Windows.

## Consequences

- Every supported Node version is tested.
- Users on Node 20 get an engines warning from npm. It may still run, but that is not supported.
- When Node 22 reaches its end of life (April 2027), this moves again.
