import type { SuggestionSnapshot } from "./domain/suggestion.js";

/** How a suggestion reads in a terminal and to an agent: one header line, then its three fields. */
export function formatSuggestion(s: SuggestionSnapshot): string {
  return [
    `${s.id} · ${s.votes} ${s.votes === 1 ? "vote" : "votes"} · posted ${s.postedAt.slice(0, 10)}`,
    `  from: ${s.source}`,
    `  hit: ${s.hit}`,
    `  suggest: ${s.suggest}`,
  ].join("\n");
}
