# Claude Code

## Add the server once, for every project

```bash
npm install -g agent-suggestion-box
claude mcp add --scope user suggestion-box -- suggestion-box serve
```

Then, in each project that should have a box:

```bash
cd your-project
suggestion-box init
```

Claude Code starts the server in the project's directory, and the server finds the project's box from there (the nearest
`.suggestion-box.json` or `.git` above it). Without a global install, use
`claude mcp add --scope user suggestion-box -- npx -y agent-suggestion-box serve`.

To tag what posted a suggestion when the agent leaves `source` out (a loop, a stage, a CI job), set it in the environment:

```bash
claude mcp add --scope user -e SUGGESTION_BOX_SOURCE="ralph loop" suggestion-box -- suggestion-box serve
```

## Tell the agent when to use it

The tools' descriptions already say when to post and to read the box first, so nothing else is required. To make it a habit
at the end of a task, add a line to `CLAUDE.md` or to a skill:

```markdown
Before you finish, if a tool, script, skill or check in this repository cost you a retry, a guess or minutes, check
`list_suggestions` and upvote a match, or `suggest` the fix. Not for product bugs.
```

## Triage

```bash
suggestion-box list      # what agents hit, the most voted first
suggestion-box triage    # file each (record the issue it became), drop it, or skip it
```
