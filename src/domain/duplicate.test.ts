import { describe, expect, it } from "vitest";
import { findDuplicate, normalise, similarity } from "./duplicate.js";
import type { SuggestionSnapshot } from "./suggestion.js";

const open = (id: string, suggest: string, status: SuggestionSnapshot["status"] = "open"): SuggestionSnapshot => ({
  id,
  source: "src",
  hit: "hit",
  suggest,
  votes: 0,
  status,
  postedAt: "2026-11-10T12:00:00.000Z",
});

describe("normalise", () => {
  it("lower-cases and removes punctuation and stop words", () => {
    expect(normalise("Make the `check.sh` script run deps, first!")).toEqual(
      new Set(["make", "check", "sh", "script", "run", "deps", "first"]),
    );
  });

  it("keeps letters and digits outside ASCII", () => {
    expect(normalise("Ação 42")).toEqual(new Set(["ação", "42"]));
  });
});

describe("similarity", () => {
  it("is 1 for the same words in another order", () => {
    expect(similarity(normalise("run deps first"), normalise("first, run deps"))).toBe(1);
  });

  it("is the share of words in common (Jaccard)", () => {
    expect(similarity(new Set(["a", "b", "c"]), new Set(["b", "c", "d"]))).toBe(0.5);
  });

  it("is 0 when either side has no words", () => {
    expect(similarity(new Set(), new Set(["a"]))).toBe(0);
  });
});

describe("findDuplicate", () => {
  const box = [
    open("s1", "scripts/check.sh: run `make deps` when node_modules is missing"),
    open("s2", "Document the release checklist in RELEASING.md"),
  ];

  it("matches an identical suggest text, ignoring case and punctuation", () => {
    expect(findDuplicate("SCRIPTS/CHECK.SH — run make deps when node_modules is missing.", box)).toBe("s1");
  });

  it("matches a near-identical one, over the threshold", () => {
    // 9 of the 10 distinct words are shared: 0.9
    expect(findDuplicate("scripts/check.sh should run make deps when node_modules is missing", box)).toBe("s1");
  });

  it("does not match a different suggestion", () => {
    expect(findDuplicate("Add a retry to the flaky e2e login test", box)).toBeUndefined();
  });

  it("does not match at exactly the threshold", () => {
    // 4 shared of 5 distinct words: 0.8
    const b = [open("s1", "alpha beta gamma delta")];
    expect(findDuplicate("alpha beta gamma delta epsilon", b)).toBeUndefined();
  });

  it("only compares against open suggestions", () => {
    const closed = [open("s9", "Document the release checklist in RELEASING.md", "filed")];
    expect(findDuplicate("Document the release checklist in RELEASING.md", closed)).toBeUndefined();
  });

  it("answers with the closest match when several pass", () => {
    const b = [open("a", "one two three four five six seven eight nine ten x"), open("b", "one two three four five six seven eight nine ten")];
    expect(findDuplicate("one two three four five six seven eight nine ten", b)).toBe("b");
  });
});
