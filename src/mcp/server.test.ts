import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileStore } from "../store/file-store.js";
import type { SuggestionStore } from "../store/store.js";
import { createServer } from "./server.js";

const NOW = new Date("2026-11-10T12:00:00.000Z");
const ENTRY = {
  source: "implement on #42",
  hit: "scripts/check.sh failed twice: it needs `make deps` first",
  suggest: "scripts/check.sh: run `make deps` when node_modules is missing",
};

let dir: string;
let store: SuggestionStore;
let client: Client;

async function connect(defaultSource?: string) {
  const server = createServer({ store, now: () => NOW, version: "0.0.0-test", ...(defaultSource ? { defaultSource } : {}) });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientSide);
}

async function call(name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  const content = result.content as { type: string; text: string }[];
  return { isError: result.isError === true, text: content.map((c) => c.text).join("\n") };
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "suggestion-box-mcp-"));
  store = new FileStore(join(dir, "suggestions.jsonl"));
  await connect();
});

afterEach(async () => {
  await client.close();
  await rm(dir, { recursive: true, force: true });
});

describe("MCP server", () => {
  it("exposes list_suggestions, suggest and upvote, and nothing that resolves", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["list_suggestions", "suggest", "upvote"]);
  });

  it("tells the agent the rules in the tool descriptions", async () => {
    const { tools } = await client.listTools();
    const suggest = tools.find((t) => t.name === "suggest")?.description ?? "";
    expect(suggest).toMatch(/list_suggestions/);
    expect(suggest).toMatch(/product bugs/);
  });

  it("lists an empty box", async () => {
    expect(await call("list_suggestions")).toEqual({ isError: false, text: expect.stringMatching(/empty/) });
  });

  it("posts a suggestion and lists it", async () => {
    const posted = await call("suggest", ENTRY);
    expect(posted.isError).toBe(false);
    const [id] = (await store.listOpen()).map((s) => s.id);
    expect(posted.text).toContain(id);

    const listed = await call("list_suggestions");
    expect(listed.text).toContain(id);
    expect(listed.text).toContain(ENTRY.suggest);
  });

  it("refuses a duplicate with the match's id", async () => {
    await call("suggest", ENTRY);
    const [first] = await store.listOpen();
    const again = await call("suggest", { ...ENTRY, suggest: "Scripts/check.sh — run make deps when node_modules is missing." });

    expect(again.isError).toBe(true);
    expect(again.text).toContain(first!.id);
    expect(again.text).toMatch(/upvote/);
    expect(await store.listOpen()).toHaveLength(1);
  });

  it("upvotes a suggestion", async () => {
    await call("suggest", ENTRY);
    const [s] = await store.listOpen();
    const upvoted = await call("upvote", { id: s!.id, note: "hit it again on #43" });
    expect(upvoted).toEqual({ isError: false, text: `Upvoted ${s!.id}: 1 vote.` });
    expect((await store.listOpen())[0]?.votes).toBe(1);
  });

  it("answers an error the agent can act on for an unknown id", async () => {
    const result = await call("upvote", { id: "nope" });
    expect(result.isError).toBe(true);
    expect(result.text).toMatch(/no suggestion with id nope/);
  });

  it("answers an error for a field over its limit", async () => {
    const result = await call("suggest", { ...ENTRY, hit: "x".repeat(501) });
    expect(result.isError).toBe(true);
    expect(result.text).toMatch(/hit/);
  });

  it("falls back to SUGGESTION_BOX_SOURCE for source", async () => {
    await client.close();
    await connect("ralph loop: implement");
    const { source: _, ...withoutSource } = ENTRY;
    expect((await call("suggest", withoutSource)).isError).toBe(false);
    expect((await store.listOpen())[0]?.source).toBe("ralph loop: implement");
  });

  it("asks for a source when there is neither an argument nor a default", async () => {
    const { source: _, ...withoutSource } = ENTRY;
    const result = await call("suggest", withoutSource);
    expect(result.isError).toBe(true);
    expect(result.text).toMatch(/source/);
  });
});
