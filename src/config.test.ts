import { describe, it } from "vitest";

describe("findRoot", () => {
  it.todo("prefers --root, then SUGGESTION_BOX_ROOT");
  it.todo("walks up to the nearest .suggestion-box.json");
  it.todo("walks up to the nearest .git when there is no config");
  it.todo("refuses when neither is found");
});

describe("loadConfig", () => {
  it.todo("uses the default file store when there is no config file");
  it.todo("resolves the file store's path against the root");
  it.todo("refuses an unknown store name");
});
