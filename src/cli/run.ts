/**
 * The CLI's commands. I/O comes in through `Io`, so tests run them without a process; main.ts wires the real one.
 */

import { spawn } from "node:child_process";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { basename, isAbsolute, join, relative } from "node:path";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import { CONFIG_FILE, ConfigError, ROOT_ENV, findRoot, loadConfig, type Config } from "../config.js";
import { SuggestionError, type SuggestionSnapshot } from "../domain/suggestion.js";
import { formatSuggestion } from "../format.js";
import { SOURCE_ENV, startServer } from "../mcp/server.js";
import { openStore } from "../store/open.js";
import type { SuggestionStore } from "../store/store.js";
import { createUiServer } from "../ui/server.js";
import { VERSION } from "../version.js";

export interface Io {
  cwd: string;
  env: Record<string, string | undefined>;
  now: () => Date;
  stdin: NodeJS.ReadableStream;
  stdout: { write(text: string): void };
  stderr: { write(text: string): void };
  /** Opens a URL in the browser; the system's opener when left out. */
  openUrl?: (url: string) => void;
  /** Stops long-running commands (ui) when aborted; tests use it. */
  signal?: AbortSignal;
}

/** The ui command's default port; --port 0 picks a free one. */
export const DEFAULT_UI_PORT = 4848;

export const USAGE = `Usage: suggestion-box <command> [--root <dir>]

  init                 write .suggestion-box.json and print the MCP config for your agent
  serve                run the MCP server over stdio (what your agent starts)
  list [--json]        the open suggestions, the most voted first
  ui [--port <n>]      a page of the box in your browser, live (--no-open to only print its address)
  triage               walk them one by one: [f]ile, [d]rop, [s]kip, [q]uit
  file <id> <ref>      resolve as filed, recording where it went (an issue URL, a ticket, a commit)
  drop <id> [why]      resolve without filing

The project is --root, else $${ROOT_ENV}, else the nearest directory above holding ${CONFIG_FILE} or .git.
`;

class UsageError extends Error {}

export async function run(argv: string[], io: Io): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      allowNegative: true,
      options: {
        port: { type: "string" },
        open: { type: "boolean", default: true },
        root: { type: "string" },
        json: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "v", default: false },
      },
    });
  } catch (error) {
    io.stderr.write(`${(error as Error).message}\n\n${USAGE}`);
    return 2;
  }
  const { values, positionals } = parsed;
  const [command, ...rest] = positionals;

  if (values.version) {
    io.stdout.write(`${VERSION}\n`);
    return 0;
  }
  if (command === undefined || values.help) {
    io.stdout.write(USAGE);
    return 0;
  }

  const project = async (): Promise<{ config: Config; store: SuggestionStore }> => {
    const root = await findRoot({ flag: values.root, env: io.env[ROOT_ENV], cwd: io.cwd });
    const config = await loadConfig(root, io.env);
    return { config, store: openStore(config) };
  };

  try {
    switch (command) {
      case "init":
        return await init(values.root, io);
      case "serve": {
        const { config, store } = await project();
        const defaultSource = io.env[SOURCE_ENV];
        await startServer({ store, now: io.now, version: VERSION, box: config.file.path, ...(defaultSource ? { defaultSource } : {}) });
        return 0;
      }
      case "list": {
        const open = await (await project()).store.listOpen();
        if (values.json) io.stdout.write(`${JSON.stringify(open, null, 2)}\n`);
        else io.stdout.write(open.length === 0 ? "The suggestion box is empty.\n" : `${open.map(formatSuggestion).join("\n\n")}\n`);
        return 0;
      }
      case "file": {
        const [id, ref] = rest;
        if (!id || !ref) throw new UsageError("file needs an id and a ref: suggestion-box file <id> <ref>");
        await (await project()).store.resolve(id, { status: "filed", ref }, io.now());
        io.stdout.write(`Filed ${id} as ${ref}.\n`);
        return 0;
      }
      case "drop": {
        const [id, ...why] = rest;
        if (!id) throw new UsageError("drop needs an id: suggestion-box drop <id> [why]");
        const reason = why.join(" ").trim();
        await (await project()).store.resolve(id, { status: "dropped", ...(reason ? { reason } : {}) }, io.now());
        io.stdout.write(`Dropped ${id}.\n`);
        return 0;
      }
      case "triage":
        return await triage((await project()).store, io);
      case "ui": {
        const port = values.port === undefined ? DEFAULT_UI_PORT : Number(values.port);
        if (!Number.isInteger(port) || port < 0 || port > 65535) throw new UsageError(`--port must be a port number, not ${values.port}`);
        const { config, store } = await project();
        return await ui({ store, project: basename(config.root), port, open: values.open }, io);
      }
      default:
        throw new UsageError(`Unknown command: ${command}`);
    }
  } catch (error) {
    if (error instanceof UsageError) {
      io.stderr.write(`${error.message}\n\n${USAGE}`);
      return 2;
    }
    if (error instanceof ConfigError || error instanceof SuggestionError) {
      io.stderr.write(`${error.message}\n`);
      return 1;
    }
    throw error;
  }
}

/** Writes the config if there is none, adds the union merge rule for the box, and prints how to add the server. */
async function init(flag: string | undefined, io: Io): Promise<number> {
  const root = await findRoot({ flag, env: io.env[ROOT_ENV], cwd: io.cwd }).catch((error: unknown) => {
    if (error instanceof ConfigError && flag === undefined) return io.cwd;
    throw error;
  });

  const configPath = join(root, CONFIG_FILE);
  const wrote = await writeFile(configPath, `${JSON.stringify({ store: "file" }, null, 2)}\n`, { flag: "wx" }).then(
    () => true,
    (error: NodeJS.ErrnoException) => {
      if (error.code === "EEXIST") return false;
      throw error;
    },
  );
  io.stdout.write(wrote ? `Wrote ${configPath}.\n` : `Kept the existing ${configPath}.\n`);

  const config = await loadConfig(root, io.env);
  const boxPath = relative(root, config.file.path);
  if (!boxPath.startsWith("..") && !isAbsolute(boxPath)) {
    const rule = `${boxPath.split("\\").join("/")} merge=union`;
    const attributesPath = join(root, ".gitattributes");
    const attributes = await readFile(attributesPath, "utf8").catch(() => "");
    if (!attributes.split("\n").some((line) => line.trim() === rule)) {
      const separator = attributes === "" || attributes.endsWith("\n") ? "" : "\n";
      await appendFile(attributesPath, `${separator}${rule}\n`);
      io.stdout.write(`Added "${rule}" to .gitattributes, so two branches' suggestions merge without conflict.\n`);
    }
  }

  io.stdout.write(`
Add the MCP server to your agent. For Claude Code, once for every project:

  claude mcp add --scope user suggestion-box -- suggestion-box serve

For other agents, the usual MCP config (or "command": "npx", "args": ["-y", "agent-suggestion-box", "serve"]):

${JSON.stringify({ mcpServers: { "suggestion-box": { command: "suggestion-box", args: ["serve"] } } }, null, 2)}
`);
  return 0;
}

/** Walks the open suggestions, the most voted first, asking what to do with each. Ends on q or when input ends. */
async function triage(store: SuggestionStore, io: Io): Promise<number> {
  const open = await store.listOpen();
  if (open.length === 0) {
    io.stdout.write("The suggestion box is empty.\n");
    return 0;
  }

  const rl = createInterface({ input: io.stdin, terminal: false });
  const lines = rl[Symbol.asyncIterator]();
  const ask = async (prompt: string): Promise<string | undefined> => {
    io.stdout.write(prompt);
    const next = await lines.next();
    return next.done ? undefined : String(next.value).trim();
  };

  try {
    for (const [index, suggestion] of open.entries()) {
      io.stdout.write(`\n(${index + 1}/${open.length}) ${formatSuggestion(suggestion)}\n`);
      const done = await triageOne(suggestion, store, io, ask);
      if (done) break;
    }
  } finally {
    rl.close();
  }
  return 0;
}

/** Returns true when triage should stop. */
async function triageOne(
  suggestion: SuggestionSnapshot,
  store: SuggestionStore,
  io: Io,
  ask: (prompt: string) => Promise<string | undefined>,
): Promise<boolean> {
  for (;;) {
    const answer = (await ask("[f]ile, [d]rop, [s]kip, [q]uit? "))?.toLowerCase();
    if (answer === undefined || answer === "q") return true;
    if (answer === "s") return false;
    if (answer === "f") {
      const ref = await ask("Where did it go (an issue URL, a ticket, a commit)? ");
      if (ref === undefined) return true;
      if (ref === "") continue;
      await store.resolve(suggestion.id, { status: "filed", ref }, io.now());
      io.stdout.write(`Filed ${suggestion.id} as ${ref}.\n`);
      return false;
    }
    if (answer === "d") {
      const reason = await ask("Why (optional)? ");
      if (reason === undefined) return true;
      await store.resolve(suggestion.id, { status: "dropped", ...(reason ? { reason } : {}) }, io.now());
      io.stdout.write(`Dropped ${suggestion.id}.\n`);
      return false;
    }
  }
}

/** Serves the page until interrupted (or until io.signal aborts). */
async function ui(
  { store, project, port, open }: { store: SuggestionStore; project: string; port: number; open: boolean },
  io: Io,
): Promise<number> {
  const server = createUiServer({ store, project, version: VERSION, now: io.now });
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, "127.0.0.1", () => {
        server.off("error", reject);
        resolve();
      });
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
      throw new ConfigError(`port ${port} is in use. Is suggestion-box ui already running? Pick another with --port <n>.`);
    }
    throw error;
  }
  io.signal?.addEventListener("abort", () => server.close(), { once: true });

  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  io.stdout.write(`The suggestion box for ${project} is at ${url}\nIt updates as agents post. Ctrl-C to stop.\n`);
  if (open) (io.openUrl ?? openInBrowser)(url);
  return 0;
}

function openInBrowser(url: string): void {
  const [command, args] =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", url]]
        : ["xdg-open", [url]];
  try {
    const child = spawn(command, args as string[], { stdio: "ignore", detached: true });
    child.on("error", () => undefined);
    child.unref();
  } catch {
    // no browser to open: the address is printed
  }
}
