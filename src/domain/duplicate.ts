/**
 * The cheap duplicate check `suggest` runs before posting: normalise the `suggest` text (lower case, punctuation and
 * stop words removed) and compare token sets. The agent is the real deduplicator; this is a backstop.
 * See docs/design.md, "Duplicates".
 */

import type { SuggestionSnapshot } from "./suggestion.js";

/** A match must be more similar than this. */
export const SIMILARITY_THRESHOLD = 0.8;

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "of", "to", "in", "on", "at", "for", "with", "by", "from", "as", "into", "via",
  "is", "are", "was", "were", "be", "been", "it", "its", "this", "that", "these", "those", "when", "then", "than", "so", "if",
]);

/** The words of a text: lower case, split on anything but letters and digits, stop words removed. */
export function normalise(text: string): Set<string> {
  const words = text.toLowerCase().split(/[^\p{L}\p{N}]+/u);
  return new Set(words.filter((word) => word !== "" && !STOP_WORDS.has(word)));
}

/** The Jaccard index of two word sets: shared words over all distinct words. 0 when either is empty. */
export function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared / (a.size + b.size - shared);
}

/** The id of the open suggestion whose `suggest` text matches, the closest if several do; undefined if none. */
export function findDuplicate(suggest: string, suggestions: readonly SuggestionSnapshot[]): string | undefined {
  const words = normalise(suggest);
  let best: { id: string; score: number } | undefined;
  for (const candidate of suggestions) {
    if (candidate.status !== "open") continue;
    const score = similarity(words, normalise(candidate.suggest));
    if (score > SIMILARITY_THRESHOLD && (!best || score > best.score)) best = { id: candidate.id, score };
  }
  return best?.id;
}
