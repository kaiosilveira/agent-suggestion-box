/**
 * Reads and checks `.suggestion-box.json` at the repository's root. The store is chosen by name, so new stores plug
 * in without changing callers (docs/adr/0005).
 */

export const CONFIG_FILE = ".suggestion-box.json";

export type Config = {
  store: "file";
  file?: { path?: string };
};

export const DEFAULT_CONFIG: Config = { store: "file" };

/** Overrides the project root, after `--root`. See docs/design.md, "Finding the project". */
export const ROOT_ENV = "SUGGESTION_BOX_ROOT";

// TODO(v0.1): findRoot({ flag, env, cwd }) → the project root: --root, then SUGGESTION_BOX_ROOT, then the nearest ancestor
// holding .suggestion-box.json or .git; refuse when none is found.
// TODO(v0.1): loadConfig(root) → Config, validated with zod; a missing file means DEFAULT_CONFIG.
