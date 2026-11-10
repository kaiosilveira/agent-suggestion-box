/**
 * The MCP server: three tools over stdio (list_suggestions, suggest, upvote). Agents never resolve (docs/adr/0003).
 * Each tool's description carries the rules an agent needs, so no instruction file is required.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { findDuplicate } from "../domain/duplicate.js";
import { LIMITS, SuggestionError } from "../domain/suggestion.js";
import { formatSuggestion } from "../format.js";
import type { SuggestionStore } from "../store/store.js";

/** The `source` used when the agent leaves it out. */
export const SOURCE_ENV = "SUGGESTION_BOX_SOURCE";

export interface ServerOptions {
  store: SuggestionStore;
  now: () => Date;
  version: string;
  /** From SUGGESTION_BOX_SOURCE: the source when the agent gives none. */
  defaultSource?: string;
}

const WHAT_TO_POST =
  "Post friction with the process you work in: a tool, script, skill, prompt, check or doc that cost you a retry, a guess " +
  "or minutes. Never product bugs (those belong in the project's issues), never third-party tools you cannot change.";

export function createServer({ store, now, version, defaultSource }: ServerOptions): McpServer {
  const server = new McpServer({ name: "agent-suggestion-box", version });

  server.registerTool(
    "list_suggestions",
    {
      title: "List suggestions",
      description:
        "The open suggestions in this project's suggestion box, the most voted first. Read it before you post: if one " +
        "matches what you hit, upvote it instead of posting.",
      annotations: { readOnlyHint: true },
    },
    () =>
      run(async () => {
        const open = await store.listOpen();
        if (open.length === 0) return "The suggestion box is empty.";
        return open.map(formatSuggestion).join("\n\n");
      }),
  );

  server.registerTool(
    "suggest",
    {
      title: "Post a suggestion",
      description:
        `Post a new suggestion to this project's suggestion box. ${WHAT_TO_POST} Call list_suggestions first and upvote a ` +
        "match instead; a post that repeats an open suggestion is refused with its id. One suggestion per post; keep " +
        "each field to a line or two. A human decides what gets fixed.",
      inputSchema: {
        source: z
          .string()
          .optional()
          .describe(`Who hit it: the agent, skill or stage, and the task (e.g. "implement on #42"). At most ${LIMITS.source} characters.`),
        hit: z.string().describe(`What happened and what it cost: a retry, a guess, minutes. At most ${LIMITS.hit} characters.`),
        suggest: z.string().describe(`The change: which file, what it would say or do. At most ${LIMITS.suggest} characters.`),
      },
    },
    ({ source, hit, suggest }) =>
      run(async () => {
        const from = source?.trim() || defaultSource?.trim();
        if (!from) throw new SuggestionError("invalid", "source is required: who hit it, and on what task");

        const match = findDuplicate(suggest, await store.listOpen());
        if (match) {
          throw new SuggestionError(
            "invalid",
            `An open suggestion already says this: ${match}. Call upvote with id "${match}" instead of posting.`,
          );
        }

        const posted = await store.post({ source: from, hit, suggest }, now());
        return `Posted ${posted.id}.`;
      }),
  );

  server.registerTool(
    "upvote",
    {
      title: "Upvote a suggestion",
      description:
        "Add a vote to an open suggestion when you hit the same thing, so the most common friction gets fixed first. " +
        "Take the id from list_suggestions.",
      inputSchema: {
        id: z.string().describe("The suggestion's id, from list_suggestions."),
        note: z.string().optional().describe("Optional: one line of what this run saw."),
      },
    },
    ({ id, note }) =>
      run(async () => {
        const upvoted = await store.upvote(id, note, now());
        return `Upvoted ${upvoted.id}: ${upvoted.votes} ${upvoted.votes === 1 ? "vote" : "votes"}.`;
      }),
  );

  return server;
}

/** Serves the tools over stdio until the agent closes the connection. */
export async function startServer(options: ServerOptions): Promise<void> {
  await createServer(options).connect(new StdioServerTransport());
}

/** Turns a rule the agent broke into an error result it can read and act on; anything else is a real failure. */
async function run(body: () => Promise<string>): Promise<CallToolResult> {
  try {
    return { content: [{ type: "text", text: await body() }] };
  } catch (error) {
    if (error instanceof SuggestionError) return { isError: true, content: [{ type: "text", text: error.message }] };
    throw error;
  }
}
