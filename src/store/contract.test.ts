import { describe, it } from "vitest";

// One suite every store passes. Once the file store exists, this becomes
// `export function storeContract(name, makeStore)` and each store's test file calls it.
describe("SuggestionStore contract", () => {
  it.todo("posts a suggestion and lists it as open");
  it.todo("lists open suggestions in vote order, most voted first");
  it.todo("upvotes an open suggestion");
  it.todo("refuses an upvote on a resolved suggestion");
  it.todo("resolves a suggestion once, and it leaves the open list");
  it.todo("refuses a second resolution");
  it.todo("refuses an unknown id");
});
