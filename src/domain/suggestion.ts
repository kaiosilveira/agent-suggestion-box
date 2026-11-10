/**
 * The Suggestion aggregate: its shape, limits and lifecycle (open → filed | dropped).
 * See docs/design.md, "The model".
 */

export const LIMITS = {
  source: 120,
  hit: 500,
  suggest: 500,
} as const;

export type SuggestionStatus = "open" | "filed" | "dropped";

export interface SuggestionDraft {
  source: string;
  hit: string;
  suggest: string;
}

export interface Resolution {
  /** Where it went when filed: an issue URL, a ticket, a commit. */
  ref?: string;
  /** Why it was dropped. */
  reason?: string;
  /** ISO timestamp of the resolution. */
  at: string;
}

export interface SuggestionSnapshot extends SuggestionDraft {
  id: string;
  votes: number;
  status: SuggestionStatus;
  resolution?: Resolution;
  /** ISO timestamp, from the clock passed in at posting. */
  postedAt: string;
}

/** `invalid`: the input breaks a rule. `closed`: the suggestion is already filed or dropped. */
export type SuggestionErrorCode = "invalid" | "closed";

export class SuggestionError extends Error {
  override readonly name = "SuggestionError";

  constructor(
    readonly code: SuggestionErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export class Suggestion {
  readonly #id: string;
  readonly #draft: SuggestionDraft;
  readonly #postedAt: string;
  #votes: number;
  #status: SuggestionStatus;
  #resolution: Resolution | undefined;

  private constructor(snapshot: SuggestionSnapshot) {
    this.#id = snapshot.id;
    this.#draft = { source: snapshot.source, hit: snapshot.hit, suggest: snapshot.suggest };
    this.#postedAt = snapshot.postedAt;
    this.#votes = snapshot.votes;
    this.#status = snapshot.status;
    this.#resolution = snapshot.resolution && { ...snapshot.resolution };
  }

  /** A new, open suggestion. The id comes from the store. */
  static post(id: string, draft: SuggestionDraft, now: Date): Suggestion {
    return new Suggestion({
      id,
      source: field("source", draft.source),
      hit: field("hit", draft.hit),
      suggest: field("suggest", draft.suggest),
      votes: 0,
      status: "open",
      postedAt: now.toISOString(),
    });
  }

  /** Rebuilds a suggestion a store has already checked and kept. */
  static fromSnapshot(snapshot: SuggestionSnapshot): Suggestion {
    return new Suggestion(snapshot);
  }

  get id(): string {
    return this.#id;
  }

  get votes(): number {
    return this.#votes;
  }

  get status(): SuggestionStatus {
    return this.#status;
  }

  upvote(): void {
    this.#ensureOpen("upvote");
    this.#votes += 1;
  }

  file(ref: string, now: Date): void {
    this.#ensureOpen("file");
    const trimmed = ref.trim();
    if (trimmed === "") throw new SuggestionError("invalid", "file needs a ref: where the suggestion went");
    this.#status = "filed";
    this.#resolution = { ref: trimmed, at: now.toISOString() };
  }

  drop(reason: string | undefined, now: Date): void {
    this.#ensureOpen("drop");
    const trimmed = reason?.trim();
    this.#status = "dropped";
    this.#resolution = trimmed ? { reason: trimmed, at: now.toISOString() } : { at: now.toISOString() };
  }

  toSnapshot(): SuggestionSnapshot {
    const snapshot: SuggestionSnapshot = {
      id: this.#id,
      ...this.#draft,
      votes: this.#votes,
      status: this.#status,
      postedAt: this.#postedAt,
    };
    if (this.#resolution) snapshot.resolution = { ...this.#resolution };
    return snapshot;
  }

  #ensureOpen(action: string): void {
    if (this.#status !== "open") {
      throw new SuggestionError("closed", `cannot ${action} suggestion ${this.#id}: it is already ${this.#status}`);
    }
  }
}

function field(name: keyof typeof LIMITS, value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") throw new SuggestionError("invalid", `${name} is required`);
  if (trimmed.length > LIMITS[name]) {
    throw new SuggestionError("invalid", `${name} is ${trimmed.length} characters; at most ${LIMITS[name]}`);
  }
  return trimmed;
}
