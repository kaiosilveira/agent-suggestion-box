import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileStore } from "../store/file-store.js";
import { run, type Io } from "./run.js";

const NOW = new Date("2026-11-10T12:00:00.000Z");
const DRAFT = { source: "implement on #42", hit: "lost five minutes", suggest: "add a retry to check.sh" };

let root: string;

beforeEach(async () => {
  root = await realpath(await mkdtemp(join(tmpdir(), "suggestion-box-cli-")));
  await mkdir(join(root, ".git"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const box = () => new FileStore(join(root, ".suggestion-box", "suggestions.jsonl"));

async function cli(
  args: string[],
  { input = "", cwd = root, extra = {} }: { input?: string; cwd?: string; extra?: Partial<Io> } = {},
) {
  let stdout = "";
  let stderr = "";
  const io: Io = {
    cwd,
    env: {},
    now: () => NOW,
    stdin: Readable.from([input]),
    stdout: { write: (s) => void (stdout += s) },
    stderr: { write: (s) => void (stderr += s) },
    ...extra,
  };
  const code = await run(args, io);
  return { code, stdout, stderr };
}

describe("the CLI", () => {
  it("prints usage with no command, and refuses an unknown one", async () => {
    expect(await cli([])).toMatchObject({ code: 0, stdout: expect.stringContaining("Usage") });
    expect(await cli(["nope"])).toMatchObject({ code: 2, stderr: expect.stringContaining("Unknown command") });
  });

  describe("init", () => {
    it("writes the config, the union merge rule and prints the MCP config", async () => {
      const result = await cli(["init"]);

      expect(result.code).toBe(0);
      expect(JSON.parse(await readFile(join(root, ".suggestion-box.json"), "utf8"))).toEqual({ store: "file" });
      expect(await readFile(join(root, ".gitattributes"), "utf8")).toBe(".suggestion-box/suggestions.jsonl merge=union\n");
      expect(result.stdout).toContain("claude mcp add --scope user suggestion-box -- suggestion-box serve");
      expect(result.stdout).toContain('"command": "suggestion-box"');
    });

    it("keeps an existing config and .gitattributes, and does not repeat the rule", async () => {
      await writeFile(join(root, ".suggestion-box.json"), '{ "store": "file", "file": { "path": "box.jsonl" } }\n');
      await writeFile(join(root, ".gitattributes"), "*.png binary");

      await cli(["init"]);
      await cli(["init"]);

      expect(await readFile(join(root, ".suggestion-box.json"), "utf8")).toContain("box.jsonl");
      expect(await readFile(join(root, ".gitattributes"), "utf8")).toBe("*.png binary\nbox.jsonl merge=union\n");
    });

    it("initialises the current directory when there is no project above it", async () => {
      const lonely = await realpath(await mkdtemp(join(tmpdir(), "suggestion-box-lonely-")));
      try {
        expect((await cli(["init"], { cwd: lonely })).code).toBe(0);
        expect(await readFile(join(lonely, ".suggestion-box.json"), "utf8")).toContain("file");
      } finally {
        await rm(lonely, { recursive: true, force: true });
      }
    });
  });

  describe("list", () => {
    it("says the box is empty", async () => {
      expect(await cli(["list"])).toMatchObject({ code: 0, stdout: expect.stringMatching(/empty/) });
    });

    it("lists the open suggestions from a subdirectory of the project", async () => {
      const s = await box().post(DRAFT, NOW);
      await mkdir(join(root, "src"));
      const result = await cli(["list"], { cwd: join(root, "src") });
      expect(result.stdout).toContain(s.id);
      expect(result.stdout).toContain(DRAFT.suggest);
    });

    it("prints JSON with --json", async () => {
      const s = await box().post(DRAFT, NOW);
      expect(JSON.parse((await cli(["list", "--json"])).stdout)).toEqual([s]);
    });
  });

  describe("file and drop", () => {
    it("files a suggestion with a ref", async () => {
      const s = await box().post(DRAFT, NOW);
      expect(await cli(["file", s.id, "https://example.com/issues/7"])).toMatchObject({ code: 0 });
      expect(await box().listOpen()).toEqual([]);
    });

    it("refuses file without a ref", async () => {
      const s = await box().post(DRAFT, NOW);
      expect((await cli(["file", s.id])).code).toBe(2);
    });

    it("drops a suggestion, joining the words of the reason", async () => {
      const s = await box().post(DRAFT, NOW);
      expect(await cli(["drop", s.id, "already", "fixed"])).toMatchObject({ code: 0 });
      expect(await box().listOpen()).toEqual([]);
      expect(await readFile(join(root, ".suggestion-box", "suggestions.jsonl"), "utf8")).toContain('"reason":"already fixed"');
    });

    it("explains an unknown id", async () => {
      expect(await cli(["drop", "nope"])).toMatchObject({ code: 1, stderr: expect.stringContaining("no suggestion with id nope") });
    });
  });

  describe("triage", () => {
    it("walks the box: file with a ref, drop with a reason, skip, in vote order", async () => {
      const a = await box().post({ ...DRAFT, suggest: "first" }, NOW);
      const b = await box().post({ ...DRAFT, suggest: "second" }, NOW);
      const c = await box().post({ ...DRAFT, suggest: "third" }, NOW);

      const result = await cli(["triage"], { input: "f\n#7\nd\nnot worth it\ns\n" });

      expect(result.code).toBe(0);
      expect((await box().listOpen()).map((s) => s.id)).toEqual([c.id]);
      expect(result.stdout).toContain(`Filed ${a.id}`);
      expect(result.stdout).toContain(`Dropped ${b.id}`);
    });

    it("stops on q and when the input ends", async () => {
      await box().post({ ...DRAFT, suggest: "first" }, NOW);
      await box().post({ ...DRAFT, suggest: "second" }, NOW);
      expect((await cli(["triage"], { input: "q\n" })).code).toBe(0);
      expect((await cli(["triage"], { input: "" })).code).toBe(0);
      expect(await box().listOpen()).toHaveLength(2);
    });
  });

  describe("ui", () => {
    it("serves the box on the loopback interface and opens the browser", async () => {
      await box().post(DRAFT, NOW);
      const stop = new AbortController();
      const opened: string[] = [];
      const result = await cli(["ui", "--port", "0"], { extra: { signal: stop.signal, openUrl: (url) => opened.push(url) } });
      try {
        expect(result.code).toBe(0);
        const url = /http:\/\/127\.0\.0\.1:\d+/.exec(result.stdout)?.[0];
        expect(url).toBeDefined();
        expect(opened).toEqual([url]);

        const data = (await (await fetch(`${url}/api/suggestions`)).json()) as { project: string; suggestions: unknown[] };
        expect(data.suggestions).toHaveLength(1);
        expect(data.project).toBe(root.split(/[\\/]/).pop());
      } finally {
        stop.abort();
      }
    });

    it("does not open the browser with --no-open", async () => {
      const stop = new AbortController();
      const opened: string[] = [];
      await cli(["ui", "--port", "0", "--no-open"], { extra: { signal: stop.signal, openUrl: (url) => opened.push(url) } });
      stop.abort();
      expect(opened).toEqual([]);
    });

    it("refuses a port that is not a number", async () => {
      expect((await cli(["ui", "--port", "web"])).code).toBe(2);
    });
  });
});
