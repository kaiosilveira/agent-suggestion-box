# Architecture decision records

One page per lasting decision, in Michael Nygard's format (Context, Decision, Status, Consequences). A record is never edited
once accepted; a later record supersedes it.

| # | Decision | Status |
|---|---|---|
| [0001](0001-name.md) | The name: `agent-suggestion-box`, binary `suggestion-box` | Accepted |
| [0002](0002-typescript-on-node.md) | TypeScript on Node, distributed through npm | Accepted, amended by 0006 |
| [0003](0003-agents-cannot-resolve.md) | Agents cannot resolve suggestions | Accepted |
| [0004](0004-resolved-suggestions-stay-in-the-log.md) | Resolved suggestions stay in the log | Accepted |
| [0005](0005-file-store-only-in-v0.1.md) | The file store only in v0.1; stores stay pluggable | Accepted |
| [0006](0006-node-22-or-later.md) | Node 22 or later | Accepted, amends 0002 |
| [0007](0007-local-read-only-ui.md) | A local, read-only UI | Accepted |
