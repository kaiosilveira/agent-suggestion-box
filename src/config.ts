/**
 * Finds the project and reads `.suggestion-box.json` at its root. One global install serves many projects, so every
 * command and server finds its own (docs/design.md, "Finding the project"). The store is chosen by name, so new stores
 * plug in without changing callers (docs/adr/0005).
 */

import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { z } from "zod";
import { BOX_FILE } from "./store/file-store.js";

export const CONFIG_FILE = ".suggestion-box.json";

/** Overrides the project root, after `--root`. */
export const ROOT_ENV = "SUGGESTION_BOX_ROOT";

/** Overrides the file store's path, over `.suggestion-box.json`: one config in the repo, a box wherever each machine keeps it. */
export const FILE_ENV = "SUGGESTION_BOX_FILE";

export class ConfigError extends Error {
  override readonly name = "ConfigError";
}

const ConfigFile = z.strictObject({
  store: z.enum(["file"]).default("file"),
  file: z.strictObject({ path: z.string().min(1).optional() }).optional(),
});

/** The configuration with its defaults applied and its paths made absolute. */
export interface Config {
  root: string;
  store: "file";
  file: { path: string };
}

export interface FindRootOptions {
  /** `--root`, if given. */
  flag?: string | undefined;
  /** `SUGGESTION_BOX_ROOT`, if set. */
  env?: string | undefined;
  cwd: string;
  /** The last directory to look in when walking up; the filesystem root by default. */
  stopAt?: string;
}

/**
 * --root, then SUGGESTION_BOX_ROOT, then the nearest ancestor holding .suggestion-box.json or .git. A linked git worktree
 * resolves to its main worktree, so every worktree of a repository shares one box.
 */
export async function findRoot({ flag, env, cwd, stopAt }: FindRootOptions): Promise<string> {
  const explicit = flag ?? (env === "" ? undefined : env);
  if (explicit !== undefined) {
    const root = resolve(cwd, explicit);
    if (!(await isDirectory(root))) throw new ConfigError(`the project root ${root} is not a directory`);
    return root;
  }

  for (let dir = resolve(cwd); ; dir = dirname(dir)) {
    if ((await exists(join(dir, CONFIG_FILE))) || (await exists(join(dir, ".git")))) return (await mainWorktree(dir)) ?? dir;
    if (dir === dirname(dir) || (stopAt !== undefined && dir === resolve(stopAt))) break;
  }
  throw new ConfigError(
    `no project found from ${cwd}: no ${CONFIG_FILE} or .git above it.\n` +
      "Run `suggestion-box init` in the project, or pass --root <dir>.",
  );
}

type Env = Record<string, string | undefined>;

/**
 * The box when the config names no path: private to the person, in their data folder, keyed by the project's root so
 * every worktree and session on the machine shares it and no commit sweeps it up (docs/adr/0009).
 */
export function privateBoxPath(root: string, env: Env = {}, platform: NodeJS.Platform = process.platform): string {
  const data =
    env.XDG_DATA_HOME ||
    (platform === "darwin"
      ? join(homedir(), "Library", "Application Support")
      : platform === "win32"
        ? (env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"))
        : join(homedir(), ".local", "share"));
  const key = `${basename(root)}-${createHash("sha256").update(root).digest("hex").slice(0, 8)}`;
  return join(data, "suggestion-box", key, BOX_FILE);
}

export async function loadConfig(root: string, env: Env = {}): Promise<Config> {
  const path = join(root, CONFIG_FILE);
  let raw: unknown = {};
  try {
    raw = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) throw new ConfigError(`${path} is not valid JSON: ${error.message}`);
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const parsed = ConfigFile.safeParse(raw);
  if (!parsed.success) throw new ConfigError(`${path} is not a valid configuration:\n${z.prettifyError(parsed.error)}`);

  return {
    root,
    store: parsed.data.store,
    file: { path: resolve(root, (env[FILE_ENV] || undefined) ?? parsed.data.file?.path ?? privateBoxPath(root, env)) },
  };
}

/**
 * The main worktree of a linked worktree at `dir`, read from git's files rather than by running git: `.git` is a file
 * naming the worktree's git dir, whose `commondir` leads to the repository's `.git`. Undefined for anything else (a main
 * worktree, a submodule, a bare repository's worktree).
 */
async function mainWorktree(dir: string): Promise<string | undefined> {
  const dotGit = join(dir, ".git");
  if (!(await stat(dotGit).then((s) => s.isFile(), () => false))) return undefined;
  const gitDir = /^gitdir:\s*(.+)$/m.exec(await readFile(dotGit, "utf8"))?.[1]?.trim();
  if (gitDir === undefined) return undefined;
  const absoluteGitDir = resolve(dir, gitDir);
  const commonDir = await readFile(join(absoluteGitDir, "commondir"), "utf8").then(
    (text) => resolve(absoluteGitDir, text.trim()),
    () => undefined,
  );
  if (commonDir === undefined || basename(commonDir) !== ".git") return undefined;
  const main = dirname(commonDir);
  return (await isDirectory(main)) ? main : undefined;
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}
