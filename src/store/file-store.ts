/**
 * The file store: `.suggestion-box/suggestions.jsonl`, one JSON event per line (`posted`, `upvoted`, `resolved`),
 * appended and never rewritten. State is folded from the events. See docs/design.md and docs/adr/0004.
 */

import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { Suggestion, SuggestionError, type SuggestionDraft, type SuggestionSnapshot } from "../domain/suggestion.js";
import type { ResolveRequest, SuggestionStore } from "./store.js";
import { ulid } from "./ulid.js";

export const DEFAULT_PATH = ".suggestion-box/suggestions.jsonl";

type Event =
  | ({ type: "posted"; id: string; at: string } & SuggestionDraft)
  | { type: "upvoted"; id: string; at: string; note?: string }
  | ({ type: "resolved"; id: string; at: string } & ResolveRequest);

export class FileStore implements SuggestionStore {
  constructor(
    private readonly path: string,
    private readonly newId: (now: Date) => string = ulid,
  ) {}

  async listOpen(): Promise<SuggestionSnapshot[]> {
    const open = (await this.listAll()).filter((s) => s.status === "open");
    return open.sort((a, b) => b.votes - a.votes || a.postedAt.localeCompare(b.postedAt));
  }

  /** In the order the log holds them: a Map keeps the order its keys were first set, which is posting order. */
  async listAll(): Promise<SuggestionSnapshot[]> {
    return [...(await this.#fold()).values()].map((s) => s.toSnapshot());
  }

  async post(draft: SuggestionDraft, now: Date): Promise<SuggestionSnapshot> {
    const suggestion = Suggestion.post(this.newId(now), draft, now);
    const { id, source, hit, suggest } = suggestion.toSnapshot();
    await this.#append({ type: "posted", id, at: now.toISOString(), source, hit, suggest });
    return suggestion.toSnapshot();
  }

  async upvote(id: string, note: string | undefined, now: Date): Promise<SuggestionSnapshot> {
    const suggestion = await this.#find(id);
    suggestion.upvote();
    const trimmed = note?.trim();
    await this.#append({ type: "upvoted", id, at: now.toISOString(), ...(trimmed ? { note: trimmed } : {}) });
    return suggestion.toSnapshot();
  }

  async resolve(id: string, resolution: ResolveRequest, now: Date): Promise<void> {
    const suggestion = await this.#find(id);
    if (resolution.status === "filed") suggestion.file(resolution.ref, now);
    else suggestion.drop(resolution.reason, now);
    const { resolution: kept } = suggestion.toSnapshot();
    const event: Event =
      resolution.status === "filed"
        ? { type: "resolved", id, at: now.toISOString(), status: "filed", ref: kept!.ref! }
        : { type: "resolved", id, at: now.toISOString(), status: "dropped", ...(kept?.reason ? { reason: kept.reason } : {}) };
    await this.#append(event);
  }

  async #find(id: string): Promise<Suggestion> {
    const suggestion = (await this.#fold()).get(id);
    if (!suggestion) throw new SuggestionError("not-found", `no suggestion with id ${id}`);
    return suggestion;
  }

  async #append(event: Event): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    await appendFile(this.path, `${JSON.stringify(event)}\n`, "utf8");
  }

  /**
   * Replays the log. Lines it cannot read and events that break the rules (an upvote after a resolution, a second
   * resolution, as two worktrees can leave after a union merge) are skipped: the first event to arrive wins.
   */
  async #fold(): Promise<Map<string, Suggestion>> {
    const suggestions = new Map<string, Suggestion>();
    for (const event of await this.#events()) {
      const at = new Date(event.at);
      if (Number.isNaN(at.getTime())) continue;
      const existing = suggestions.get(event.id);
      try {
        if (event.type === "posted") {
          if (!existing) suggestions.set(event.id, Suggestion.post(event.id, event, at));
          continue;
        }
        if (!existing) continue;
        if (event.type === "upvoted") existing.upvote();
        else if (event.status === "filed") existing.file(event.ref, at);
        else existing.drop(event.reason, at);
      } catch (error) {
        if (!(error instanceof SuggestionError)) throw error;
      }
    }
    return suggestions;
  }

  async #events(): Promise<Event[]> {
    let text: string;
    try {
      text = await readFile(this.path, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
    const events: Event[] = [];
    for (const line of text.split("\n")) {
      if (line.trim() === "") continue;
      try {
        const parsed: unknown = JSON.parse(line);
        if (isEvent(parsed)) events.push(parsed);
      } catch {
        // an unreadable line: skip it
      }
    }
    return events;
  }
}

function isEvent(value: unknown): value is Event {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  if (typeof e.id !== "string" || typeof e.at !== "string") return false;
  const optionalString = (v: unknown) => v === undefined || typeof v === "string";
  switch (e.type) {
    case "posted":
      return typeof e.source === "string" && typeof e.hit === "string" && typeof e.suggest === "string";
    case "upvoted":
      return optionalString(e.note);
    case "resolved":
      return (e.status === "filed" && typeof e.ref === "string") || (e.status === "dropped" && optionalString(e.reason));
    default:
      return false;
  }
}
