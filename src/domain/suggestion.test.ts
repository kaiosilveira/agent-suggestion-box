import { describe, expect, it } from "vitest";
import { LIMITS, Suggestion, SuggestionError } from "./suggestion.js";

const NOW = new Date("2026-11-10T12:00:00.000Z");
const LATER = new Date("2026-11-11T09:30:00.000Z");
const DRAFT = {
  source: "implement on #42",
  hit: "scripts/check.sh failed twice before I found it needs `make deps` first",
  suggest: "scripts/check.sh: run `make deps` when node_modules is missing",
};

const post = (draft = DRAFT) => Suggestion.post("s1", draft, NOW);
const errorCode = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    if (error instanceof SuggestionError) return error.code;
    throw error;
  }
  throw new Error("expected a SuggestionError");
};

describe("Suggestion", () => {
  it("is posted open, with 0 votes and postedAt from the clock passed in", () => {
    expect(post().toSnapshot()).toEqual({
      id: "s1",
      ...DRAFT,
      votes: 0,
      status: "open",
      postedAt: "2026-11-10T12:00:00.000Z",
    });
  });

  it("trims each field", () => {
    const s = post({ source: "  a ", hit: "\tb\n", suggest: " c " }).toSnapshot();
    expect([s.source, s.hit, s.suggest]).toEqual(["a", "b", "c"]);
  });

  it.each(["source", "hit", "suggest"] as const)("refuses an empty %s", (field) => {
    expect(errorCode(() => post({ ...DRAFT, [field]: "   " }))).toBe("invalid");
  });

  it.each(["source", "hit", "suggest"] as const)("refuses a %s over its limit", (field) => {
    expect(() => post({ ...DRAFT, [field]: "x".repeat(LIMITS[field]) })).not.toThrow();
    expect(errorCode(() => post({ ...DRAFT, [field]: "x".repeat(LIMITS[field] + 1) }))).toBe("invalid");
  });

  it("adds a vote on upvote while open", () => {
    const s = post();
    s.upvote();
    s.upvote();
    expect(s.votes).toBe(2);
  });

  it("refuses an upvote once filed or dropped", () => {
    const filed = post();
    filed.file("https://example.com/issues/7", LATER);
    expect(errorCode(() => filed.upvote())).toBe("closed");

    const dropped = post();
    dropped.drop(undefined, LATER);
    expect(errorCode(() => dropped.upvote())).toBe("closed");
  });

  it("files once, keeping the ref and the time", () => {
    const s = post();
    s.file(" https://example.com/issues/7 ", LATER);
    expect(s.status).toBe("filed");
    expect(s.toSnapshot().resolution).toEqual({ ref: "https://example.com/issues/7", at: "2026-11-11T09:30:00.000Z" });
  });

  it("refuses to file without a ref", () => {
    expect(errorCode(() => post().file("  ", LATER))).toBe("invalid");
  });

  it("drops once, keeping the reason and the time", () => {
    const s = post();
    s.drop("already fixed in main", LATER);
    expect(s.status).toBe("dropped");
    expect(s.toSnapshot().resolution).toEqual({ reason: "already fixed in main", at: "2026-11-11T09:30:00.000Z" });
  });

  it("drops without a reason", () => {
    const s = post();
    s.drop(undefined, LATER);
    expect(s.toSnapshot().resolution).toEqual({ at: "2026-11-11T09:30:00.000Z" });
  });

  it("refuses a second resolution", () => {
    const s = post();
    s.drop(undefined, LATER);
    expect(errorCode(() => s.file("ref", LATER))).toBe("closed");
    expect(errorCode(() => s.drop("again", LATER))).toBe("closed");
  });

  it("comes back unchanged from a snapshot", () => {
    const s = post();
    s.upvote();
    s.file("ref", LATER);
    expect(Suggestion.fromSnapshot(s.toSnapshot()).toSnapshot()).toEqual(s.toSnapshot());
  });

  it("does not let a snapshot change it", () => {
    const s = post();
    s.toSnapshot().votes = 99;
    expect(s.votes).toBe(0);
  });
});
