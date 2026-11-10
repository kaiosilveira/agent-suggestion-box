import { beforeEach, describe, expect, it } from "vitest";
import { SuggestionError, type SuggestionErrorCode } from "../domain/suggestion.js";
import type { SuggestionStore } from "./store.js";

/**
 * The suite every store passes: a store is done when it does. Call it from the store's own test file.
 * Not a *.test.ts file itself, so Vitest does not run it on its own.
 */
export function storeContract(name: string, makeStore: () => Promise<SuggestionStore>): void {
  const day = (n: number) => new Date(Date.UTC(2026, 10, n, 12));
  const draft = (suggest: string) => ({ source: "implement on #42", hit: "lost five minutes", suggest });

  const errorCode = async (promise: Promise<unknown>): Promise<SuggestionErrorCode> => {
    try {
      await promise;
    } catch (error) {
      if (error instanceof SuggestionError) return error.code;
      throw error;
    }
    throw new Error("expected a SuggestionError");
  };

  describe(`${name}: the SuggestionStore contract`, () => {
    let store: SuggestionStore;

    beforeEach(async () => {
      store = await makeStore();
    });

    it("starts empty", async () => {
      expect(await store.listOpen()).toEqual([]);
    });

    it("posts a suggestion and lists it as open", async () => {
      const posted = await store.post(draft("add a retry"), day(10));

      expect(posted).toMatchObject({ ...draft("add a retry"), votes: 0, status: "open", postedAt: day(10).toISOString() });
      expect(posted.id).not.toBe("");
      expect(await store.listOpen()).toEqual([posted]);
    });

    it("gives each suggestion its own id", async () => {
      const a = await store.post(draft("one"), day(10));
      const b = await store.post(draft("two"), day(10));
      expect(a.id).not.toBe(b.id);
    });

    it("refuses an invalid draft", async () => {
      expect(await errorCode(store.post(draft(" "), day(10)))).toBe("invalid");
      expect(await store.listOpen()).toEqual([]);
    });

    it("lists open suggestions in vote order, most voted first, then oldest first", async () => {
      const older = await store.post(draft("older"), day(10));
      const newer = await store.post(draft("newer"), day(11));
      const top = await store.post(draft("top"), day(12));
      await store.upvote(top.id, undefined, day(12));

      expect((await store.listOpen()).map((s) => s.id)).toEqual([top.id, older.id, newer.id]);
    });

    it("upvotes an open suggestion, with or without a note", async () => {
      const posted = await store.post(draft("add a retry"), day(10));
      await store.upvote(posted.id, undefined, day(11));
      const upvoted = await store.upvote(posted.id, "hit it again on #43", day(12));

      expect(upvoted.votes).toBe(2);
      expect((await store.listOpen())[0]?.votes).toBe(2);
    });

    it("files a suggestion, and it leaves the open list", async () => {
      const posted = await store.post(draft("add a retry"), day(10));
      await store.resolve(posted.id, { status: "filed", ref: "https://example.com/issues/7" }, day(11));
      expect(await store.listOpen()).toEqual([]);
    });

    it("drops a suggestion, and it leaves the open list", async () => {
      const posted = await store.post(draft("add a retry"), day(10));
      await store.resolve(posted.id, { status: "dropped", reason: "not worth it" }, day(11));
      expect(await store.listOpen()).toEqual([]);
    });

    it("refuses an upvote on a resolved suggestion", async () => {
      const posted = await store.post(draft("add a retry"), day(10));
      await store.resolve(posted.id, { status: "dropped" }, day(11));
      expect(await errorCode(store.upvote(posted.id, undefined, day(12)))).toBe("closed");
    });

    it("refuses a second resolution", async () => {
      const posted = await store.post(draft("add a retry"), day(10));
      await store.resolve(posted.id, { status: "filed", ref: "#7" }, day(11));
      expect(await errorCode(store.resolve(posted.id, { status: "dropped" }, day(12)))).toBe("closed");
    });

    it("lists every suggestion, resolved ones with their resolution, in the order they were posted", async () => {
      const first = await store.post(draft("first"), day(10));
      const second = await store.post(draft("second"), day(11));
      await store.upvote(second.id, undefined, day(11));
      await store.resolve(first.id, { status: "filed", ref: "#7" }, day(12));

      const all = await store.listAll();
      expect(all.map((s) => [s.id, s.status, s.votes])).toEqual([
        [first.id, "filed", 0],
        [second.id, "open", 1],
      ]);
      expect(all[0]?.resolution).toEqual({ ref: "#7", at: day(12).toISOString() });
    });

    it("refuses an unknown id", async () => {
      expect(await errorCode(store.upvote("nope", undefined, day(10)))).toBe("not-found");
      expect(await errorCode(store.resolve("nope", { status: "dropped" }, day(10)))).toBe("not-found");
    });
  });
}
