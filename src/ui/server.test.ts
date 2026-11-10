import { mkdtemp, rm } from "node:fs/promises";
import { request } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileStore } from "../store/file-store.js";
import { createUiServer } from "./server.js";

const NOW = new Date("2026-11-10T12:00:00.000Z");
const DRAFT = { source: "implement on #42", hit: "lost five minutes", suggest: "add a retry to check.sh" };

let dir: string;
let store: FileStore;
let server: ReturnType<typeof createUiServer>;
let port: number;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "suggestion-box-ui-"));
  store = new FileStore(join(dir, "suggestions.jsonl"));
  server = createUiServer({ store, project: "my-project", version: "1.2.3", now: () => NOW });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.address() as AddressInfo).port;
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(dir, { recursive: true, force: true });
});

/** A raw request, so the Host header can be set to anything. */
function get(path: string, { host = `127.0.0.1:${port}`, method = "GET" } = {}) {
  return new Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: string }>(
    (resolve, reject) => {
      const req = request({ host: "127.0.0.1", port, path, method, headers: { host } }, (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
      });
      req.on("error", reject);
      req.end();
    },
  );
}

describe("the UI server", () => {
  it("serves the page with a strict content security policy", async () => {
    const page = await get("/");
    expect(page.status).toBe(200);
    expect(page.headers["content-type"]).toMatch(/text\/html/);
    expect(page.body).toContain("<title>Suggestion box · my-project</title>");

    const csp = String(page.headers["content-security-policy"]);
    expect(csp).toContain("default-src 'none'");
    const nonce = /script-src 'nonce-([^']+)'/.exec(csp)?.[1];
    expect(nonce).toBeTruthy();
    expect(page.body).toContain(`<script nonce="${nonce}">`);
    expect(page.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("uses a fresh nonce for each page", async () => {
    const a = String((await get("/")).headers["content-security-policy"]);
    const b = String((await get("/")).headers["content-security-policy"]);
    expect(a).not.toBe(b);
  });

  it("serves every suggestion as JSON, with the project", async () => {
    const open = await store.post(DRAFT, NOW);
    const dropped = await store.post({ ...DRAFT, suggest: "something else" }, NOW);
    await store.resolve(dropped.id, { status: "dropped", reason: "no" }, NOW);

    const response = await get("/api/suggestions");
    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(JSON.parse(response.body)).toEqual({
      project: "my-project",
      version: "1.2.3",
      generatedAt: NOW.toISOString(),
      suggestions: [open, { ...dropped, status: "dropped", resolution: { reason: "no", at: NOW.toISOString() } }],
    });
  });

  it("refuses a request whose Host is not this machine, against DNS rebinding", async () => {
    expect((await get("/api/suggestions", { host: "evil.example:80" })).status).toBe(403);
    expect((await get("/", { host: `attacker.test:${port}` })).status).toBe(403);
    expect((await get("/api/suggestions", { host: `localhost:${port}` })).status).toBe(200);
  });

  it("only answers GET and HEAD", async () => {
    expect((await get("/api/suggestions", { method: "POST" })).status).toBe(405);
    expect((await get("/", { method: "HEAD" })).status).toBe(200);
  });

  it("answers 404 for anything else", async () => {
    expect((await get("/nope")).status).toBe(404);
  });

  it("never puts agent-written text into the page as HTML", async () => {
    const page = (await get("/")).body;
    expect(page).not.toMatch(/\.innerHTML\s*=/);
    expect(page).not.toMatch(/insertAdjacentHTML|document\.write/);
  });
});
