import { appendFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { storeContract } from "./contract.js";
import { FileStore } from "./file-store.js";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "suggestion-box-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

storeContract("FileStore", async () => new FileStore(join(dir, ".suggestion-box", "suggestions.jsonl")));

describe("FileStore", () => {
  const now = new Date("2026-11-10T12:00:00.000Z");
  const draft = { source: "implement on #42", hit: "lost five minutes", suggest: "add a retry" };
  const path = () => join(dir, ".suggestion-box", "suggestions.jsonl");
  const lines = async () => (await readFile(path(), "utf8")).split("\n").filter(Boolean);

  it("starts empty when the file does not exist, without creating it", async () => {
    const store = new FileStore(path());
    expect(await store.listOpen()).toEqual([]);
    await expect(readFile(path())).rejects.toThrow();
  });

  it("creates the directory on the first post", async () => {
    await new FileStore(path()).post(draft, now);
    expect(await lines()).toHaveLength(1);
  });

  it("writes one event per line: posted, upvoted, resolved", async () => {
    const store = new FileStore(path());
    const s = await store.post(draft, now);
    await store.upvote(s.id, "again on #43", now);
    await store.resolve(s.id, { status: "filed", ref: "#7" }, now);

    expect((await lines()).map((line) => JSON.parse(line))).toEqual([
      { type: "posted", id: s.id, at: now.toISOString(), ...draft },
      { type: "upvoted", id: s.id, at: now.toISOString(), note: "again on #43" },
      { type: "resolved", id: s.id, at: now.toISOString(), status: "filed", ref: "#7" },
    ]);
  });

  it("only ever appends to the file", async () => {
    const store = new FileStore(path());
    const s = await store.post(draft, now);
    const before = await readFile(path(), "utf8");
    await store.upvote(s.id, undefined, now);
    await store.resolve(s.id, { status: "dropped" }, now);
    expect((await readFile(path(), "utf8")).startsWith(before)).toBe(true);
  });

  it("folds the same state from two branches' lines joined by a union merge", async () => {
    const shared = new FileStore(path());
    const s = await shared.post(draft, now);
    const base = await readFile(path(), "utf8");

    const left = join(dir, "left.jsonl");
    const right = join(dir, "right.jsonl");
    await writeFile(left, base);
    await writeFile(right, base);
    await new FileStore(left).upvote(s.id, undefined, now);
    const other = await new FileStore(right).post({ ...draft, suggest: "document the release" }, now);
    await new FileStore(right).upvote(s.id, undefined, now);

    const tail = async (file: string) => (await readFile(file, "utf8")).slice(base.length);
    await writeFile(path(), base + (await tail(left)) + (await tail(right)));

    const open = await new FileStore(path()).listOpen();
    expect(open.map((x) => [x.id, x.votes])).toEqual([
      [s.id, 2],
      [other.id, 0],
    ]);
  });

  it("ignores events that break the rules, as two writers can leave", async () => {
    const store = new FileStore(path());
    const s = await store.post(draft, now);
    await store.resolve(s.id, { status: "dropped" }, now);
    // another worktree upvoted and filed it before it saw the drop
    await appendFile(
      path(),
      `${JSON.stringify({ type: "upvoted", id: s.id, at: now.toISOString() })}\n` +
        `${JSON.stringify({ type: "resolved", id: s.id, at: now.toISOString(), status: "filed", ref: "#9" })}\n`,
    );
    expect(await store.listOpen()).toEqual([]);
  });

  it("skips lines it cannot read, and events for unknown ids", async () => {
    const store = new FileStore(path());
    const s = await store.post(draft, now);
    await appendFile(path(), `not json\n{"type":"mystery"}\n${JSON.stringify({ type: "upvoted", id: "ghost", at: "x" })}\n`);
    await store.upvote(s.id, undefined, now);
    expect((await store.listOpen()).map((x) => x.votes)).toEqual([1]);
  });
});
