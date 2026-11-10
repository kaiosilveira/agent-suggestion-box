/**
 * The local, read-only UI (docs/adr/0007): one page and one JSON endpoint, on the loopback interface only.
 * Agents write the content it shows, so the page runs under a strict CSP and requests must name this machine as Host.
 */

import { randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import type { SuggestionStore } from "../store/store.js";
import { renderPage } from "./page.js";

export interface UiServerOptions {
  store: SuggestionStore;
  /** The project's name, shown in the page. */
  project: string;
  version: string;
  now: () => Date;
}

const LOOPBACK_HOSTS = ["127.0.0.1", "localhost", "[::1]"];

export function createUiServer({ store, project, version, now }: UiServerOptions): Server {
  const server = createServer((req, res) => {
    handle(req, res).catch(() => {
      if (!res.headersSent) send(res, 500, "text/plain; charset=utf-8", "Internal error\n");
      else res.destroy();
    });
  });

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const { port } = server.address() as AddressInfo;
    // Against DNS rebinding: a page on another site that resolves its name to 127.0.0.1 still sends its own Host.
    if (!LOOPBACK_HOSTS.some((host) => req.headers.host === `${host}:${port}`)) {
      return send(res, 403, "text/plain; charset=utf-8", "Forbidden: open this page through 127.0.0.1 or localhost\n");
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD");
      return send(res, 405, "text/plain; charset=utf-8", "Method not allowed\n");
    }

    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    if (path === "/") {
      const nonce = randomBytes(16).toString("base64");
      res.setHeader(
        "Content-Security-Policy",
        [
          "default-src 'none'",
          `script-src 'nonce-${nonce}'`,
          `style-src 'nonce-${nonce}'`,
          "connect-src 'self'",
          "img-src data:",
          "base-uri 'none'",
          "form-action 'none'",
          "frame-ancestors 'none'",
        ].join("; "),
      );
      return send(res, 200, "text/html; charset=utf-8", renderPage({ nonce, title: `Suggestion box · ${project}` }));
    }
    if (path === "/api/suggestions") {
      const suggestions = await store.listAll();
      const body = JSON.stringify({ project, version, generatedAt: now().toISOString(), suggestions });
      return send(res, 200, "application/json; charset=utf-8", body);
    }
    return send(res, 404, "text/plain; charset=utf-8", "Not found\n");
  }

  function send(res: ServerResponse, status: number, type: string, body: string): void {
    res.statusCode = status;
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.end(res.req.method === "HEAD" ? undefined : body);
  }

  return server;
}
