#!/usr/bin/env node
/**
 * suggestion-box: init, list, triage, file, drop, and `serve` (the MCP server over stdio).
 */

const USAGE = `Usage: suggestion-box <command>

  init                 write .suggestion-box.json and print the MCP config for your agent
  serve                run the MCP server over stdio (what your agent starts)
  list                 the open suggestions, the most voted first
  triage               walk them one by one: [f]ile, [d]rop, [s]kip
  file <id> <ref>      resolve as filed, recording where it went (an issue URL, a ticket, a commit)
  drop <id> [why]      resolve without filing
`;

const COMMANDS = ["init", "serve", "list", "triage", "file", "drop"] as const;

function main(argv: string[]): number {
  const [command] = argv;
  if (command === undefined || command === "--help" || command === "-h") {
    process.stdout.write(USAGE);
    return 0;
  }
  if (!(COMMANDS as readonly string[]).includes(command)) {
    process.stderr.write(`Unknown command: ${command}\n\n${USAGE}`);
    return 2;
  }
  process.stderr.write(`${command}: not implemented yet\n`);
  return 1;
}

process.exitCode = main(process.argv.slice(2));
