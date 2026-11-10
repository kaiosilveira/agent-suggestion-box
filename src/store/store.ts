import type { SuggestionDraft, SuggestionSnapshot } from "../domain/suggestion.js";

/**
 * The port every store implements. A store is done when it passes contract.ts.
 * See docs/design.md, "The port", and docs/adr/0005.
 */
export interface SuggestionStore {
  /** The open suggestions, the most voted first. */
  listOpen(): Promise<SuggestionSnapshot[]>;
  post(draft: SuggestionDraft, now: Date): Promise<SuggestionSnapshot>;
  upvote(id: string, note: string | undefined, now: Date): Promise<SuggestionSnapshot>;
  resolve(id: string, resolution: ResolveRequest, now: Date): Promise<void>;
}

export type ResolveRequest =
  | { status: "filed"; ref: string }
  | { status: "dropped"; reason?: string };
