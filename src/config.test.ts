import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ConfigError, findRoot, loadConfig } from "./config.js";

let base: string;

beforeEach(async () => {
  base = await realpath(await mkdtemp(join(tmpdir(), "suggestion-box-config-")));
});

afterEach(async () => {
  await rm(base, { recursive: true, force: true });
});

const dir = async (...parts: string[]) => {
  const path = join(base, ...parts);
  await mkdir(path, { recursive: true });
  return path;
};

describe("findRoot", () => {
  it("prefers --root, then SUGGESTION_BOX_ROOT", async () => {
    const flag = await dir("flag");
    const env = await dir("env");
    expect(await findRoot({ flag, env, cwd: base })).toBe(flag);
    expect(await findRoot({ env, cwd: base })).toBe(env);
  });

  it("resolves a relative --root against the current directory", async () => {
    await dir("project");
    expect(await findRoot({ flag: "project", cwd: base })).toBe(join(base, "project"));
  });

  it("refuses a --root that is not a directory", async () => {
    await expect(findRoot({ flag: join(base, "missing"), cwd: base })).rejects.toThrow(ConfigError);
  });

  it("walks up to the nearest .suggestion-box.json", async () => {
    const project = await dir("project");
    await writeFile(join(project, ".suggestion-box.json"), "{}");
    expect(await findRoot({ cwd: await dir("project", "src", "deep") })).toBe(project);
  });

  it("walks up to the nearest .git when there is no config", async () => {
    const repo = await dir("repo");
    await mkdir(join(repo, ".git"));
    expect(await findRoot({ cwd: await dir("repo", "src") })).toBe(repo);
  });

  it("resolves a linked worktree to its main worktree, so they share one box", async () => {
    const repo = await dir("repo");
    const gitDir = await dir("repo", ".git", "worktrees", "w");
    await writeFile(join(gitDir, "commondir"), "../..\n");
    const worktree = await dir("worktree");
    await writeFile(join(worktree, ".suggestion-box.json"), "{}");
    await writeFile(join(worktree, ".git"), "gitdir: ../repo/.git/worktrees/w\n");
    expect(await findRoot({ cwd: await dir("worktree", "src") })).toBe(repo);
  });

  it("keeps a .git file's directory when it is not a linked worktree (a submodule)", async () => {
    await dir("repo", ".git", "modules", "sub");
    const sub = await dir("repo", "sub");
    await writeFile(join(sub, ".git"), "gitdir: ../.git/modules/sub\n");
    expect(await findRoot({ cwd: sub })).toBe(sub);
  });

  it("lets --root pick a worktree itself", async () => {
    const worktree = await dir("worktree");
    await writeFile(join(worktree, ".git"), "gitdir: ../repo/.git/worktrees/w\n");
    expect(await findRoot({ flag: worktree, cwd: base })).toBe(worktree);
  });

  it("refuses when neither is found, naming init and --root", async () => {
    const lonely = await dir("lonely");
    await expect(findRoot({ cwd: lonely, stopAt: base })).rejects.toThrow(/init.*--root/s);
  });
});

describe("loadConfig", () => {
  it("uses the default file store when there is no config file", async () => {
    expect(await loadConfig(base)).toEqual({
      root: base,
      store: "file",
      file: { path: join(base, ".suggestion-box", "suggestions.jsonl") },
    });
  });

  it("resolves the file store's path against the root", async () => {
    await writeFile(join(base, ".suggestion-box.json"), JSON.stringify({ store: "file", file: { path: "box.jsonl" } }));
    expect((await loadConfig(base)).file.path).toBe(join(base, "box.jsonl"));
  });

  it("lets SUGGESTION_BOX_FILE override the configured path, resolved against the root", async () => {
    await writeFile(join(base, ".suggestion-box.json"), JSON.stringify({ store: "file", file: { path: "box.jsonl" } }));
    expect((await loadConfig(base, { SUGGESTION_BOX_FILE: "/elsewhere/box.jsonl" })).file.path).toBe("/elsewhere/box.jsonl");
    expect((await loadConfig(base, { SUGGESTION_BOX_FILE: "other.jsonl" })).file.path).toBe(join(base, "other.jsonl"));
    expect((await loadConfig(base, { SUGGESTION_BOX_FILE: "" })).file.path).toBe(join(base, "box.jsonl"));
  });

  it("refuses an unknown store name", async () => {
    await writeFile(join(base, ".suggestion-box.json"), JSON.stringify({ store: "github" }));
    await expect(loadConfig(base)).rejects.toThrow(ConfigError);
  });

  it("refuses a file that is not JSON", async () => {
    await writeFile(join(base, ".suggestion-box.json"), "{ store: file");
    await expect(loadConfig(base)).rejects.toThrow(/not valid JSON/);
  });
});
