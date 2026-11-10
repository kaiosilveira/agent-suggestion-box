#!/usr/bin/env node
/** The `suggestion-box` binary. The commands are in run.ts. */

import { run } from "./run.js";

process.exitCode = await run(process.argv.slice(2), {
  cwd: process.cwd(),
  env: process.env,
  now: () => new Date(),
  stdin: process.stdin,
  stdout: process.stdout,
  stderr: process.stderr,
});
