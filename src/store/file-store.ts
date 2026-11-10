/**
 * The file store: `.suggestion-box/suggestions.jsonl`, one JSON event per line (`posted`, `upvoted`, `resolved`),
 * appended and never rewritten. State is folded from the events. See docs/design.md and docs/adr/0004.
 */

export const DEFAULT_PATH = ".suggestion-box/suggestions.jsonl";

// TODO(v0.1): FileStore implements SuggestionStore.
