/**
 * The UI's one page: markup, styles and script inline, so it works offline and needs no build step. The CSP nonce
 * covers the <style> and <script>. Agent-written text only ever reaches the DOM through textContent.
 *
 * The page is a plain string with placeholders, so its script avoids template literals. Its look follows the design
 * system the project borrows from: a quiet ground, condensed uppercase headlines, borders rather than shadows.
 */

/** The mark: an ink square with a note going into a slot, as the favicon and in the header. */
const MARK =
  '<rect width="32" height="32" rx="7" fill="#16191b"/>' +
  '<path d="M11 16V8.5A1.5 1.5 0 0 1 12.5 7h7A1.5 1.5 0 0 1 21 8.5V16" fill="none" stroke="#4cc9a0" stroke-width="2.2" stroke-linecap="round"/>' +
  '<path d="M14.5 11.5h3" stroke="#4cc9a0" stroke-width="2.2" stroke-linecap="round"/>' +
  '<rect x="6.5" y="18.5" width="19" height="3.4" rx="1.7" fill="#4cc9a0"/>';

const ICON = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${MARK}</svg>`);

export function renderPage({ nonce, title }: { nonce: string; title: string }): string {
  return PAGE.replaceAll("__NONCE__", nonce)
    .replaceAll("__TITLE__", escapeHtml(title))
    .replace("__ICON__", ICON)
    .replace("__MARK__", MARK);
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>__TITLE__</title>
<link rel="icon" href="__ICON__">
<style nonce="__NONCE__">
/* A quiet ground, loud condensed headlines, borders instead of shadows. Fonts are the system's: the page loads nothing. */
:root {
  --bg: #eceeed;
  --surface: #f8f9f8;
  --ink: #16191b;
  --muted: #5b6569;
  --line: #d2d8d6;
  --track: #dde2e0;
  --accent: #17795e;
  --warn: #b4540a;
  --float: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --display: "Barlow Condensed", "DIN Condensed", "Bahnschrift", "Roboto Condensed", "Avenir Next Condensed", "Arial Narrow", sans-serif;
  --body: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111415;
    --surface: #1a1e20;
    --ink: #e8ecea;
    --muted: #97a1a5;
    --line: #2b3235;
    --track: #2a3134;
    --accent: #4cc9a0;
    --warn: #f0975a;
    --float: 0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4);
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 400 14px/1.45 var(--body); -webkit-font-smoothing: antialiased; }
button, input, select { font: inherit; color: inherit; }
a { color: inherit; text-underline-offset: 2px; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.disp { font-family: var(--display); font-weight: 700; font-stretch: condensed; text-transform: uppercase; line-height: 1; }
.label { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.mono { font-family: var(--mono); font-weight: 500; font-variant-numeric: tabular-nums; }
.wrap { max-width: 960px; margin: 0 auto; padding: 0 16px; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* header */
.bar { border-bottom: 1px solid var(--line); }
.bar .wrap { display: flex; align-items: center; justify-content: space-between; gap: 16px; height: 60px; }
.brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
.brand svg { flex: none; border-radius: 7px; box-shadow: 0 0 0 1px var(--line); }
.brand .wm { font-size: 24px; letter-spacing: 0.01em; white-space: nowrap; }
.pill { display: inline-flex; align-items: center; gap: 8px; min-width: 0; border: 1px solid var(--line); border-radius: 999px; padding: 5px 12px; font-size: 12px; white-space: nowrap; }
.pill.project { overflow: hidden; }
.pill.project span { overflow: hidden; text-overflow: ellipsis; }
.dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
.live.offline .dot { background: var(--warn); }
.live .txt { color: var(--muted); }

/* page header */
.hero { padding: 32px 0 24px; }
.hero h1 { margin: 8px 0 0; font-size: clamp(34px, 6.4vw, 52px); line-height: 0.95; text-wrap: balance; }
.hero p { margin: 12px 0 0; max-width: 62ch; font-size: 15px; color: var(--muted); }
.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-top: 24px; }
.stat { display: flex; flex-direction: column; gap: 6px; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 14px 20px 16px; }
.stat .n { font-size: 48px; line-height: 0.9; font-variant-numeric: tabular-nums; }
.progress { display: flex; flex-direction: column; gap: 6px; margin-top: 20px; }
.progress .lab { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; color: var(--muted); }
.meter { position: relative; height: 12px; border-radius: 999px; background: var(--track); overflow: hidden; }
.meter i { position: absolute; top: 0; bottom: 0; left: 0; border-radius: 999px; background: var(--accent); transition: width 0.7s ease; }
.progress.met .meter { overflow: visible; }
.progress.met .meter i { box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 70%, transparent); }

/* toolbar */
.toolbar { position: sticky; top: 0; z-index: 2; display: flex; flex-wrap: wrap; align-items: flex-end; gap: 8px 16px; padding-top: 8px; background: var(--bg); border-bottom: 1px solid var(--line); }
.tabs { display: flex; gap: 4px; margin-right: auto; }
.tab { display: inline-flex; align-items: baseline; gap: 6px; border: 0; background: none; padding: 10px 12px; margin-bottom: -1px; border-bottom: 3px solid transparent; cursor: pointer; color: var(--muted); font-family: var(--display); font-stretch: condensed; font-weight: 600; font-size: 22px; line-height: 1; letter-spacing: 0.02em; text-transform: uppercase; white-space: nowrap; }
.tab:hover { color: var(--ink); }
.tab[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--accent); }
.tab .c { font: 500 12px var(--mono); letter-spacing: 0; color: var(--muted); font-variant-numeric: tabular-nums; }
.controls { display: flex; flex: 1 1 280px; gap: 8px; padding-bottom: 8px; max-width: 420px; }
.search { flex: 1 1 auto; position: relative; }
.field { width: 100%; height: 36px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); font-size: 13px; }
.field:hover { border-color: var(--ink); }
.search .field { padding: 0 34px 0 34px; }
.search svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
.search kbd { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font: 500 11px var(--mono); color: var(--muted); border: 1px solid var(--line); border-radius: 4px; padding: 1px 6px; pointer-events: none; }
select.field { width: auto; padding: 0 10px; cursor: pointer; }

/* cards */
.cards { list-style: none; margin: 16px 0 0; padding: 0; display: grid; gap: 16px; }
.card { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 20px; padding: 20px; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; }
.card.dropped { border: 1px dashed var(--muted); }
.card.is-new { animation: arrive 1.4s ease-out 1; }
@keyframes arrive { 0% { box-shadow: 0 0 0 3px var(--accent); } 100% { box-shadow: 0 0 0 3px transparent; } }
.votes { display: flex; flex-direction: column; gap: 6px; }
.votes .n { font-size: 48px; line-height: 0.9; font-variant-numeric: tabular-nums; }
.pieces { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 2px; margin-top: 4px; }
.pieces i { height: 10px; border-radius: 3px; background: var(--track); }
.pieces i.on { background: var(--accent); }
.card.filed .votes .n, .card.dropped .votes .n { color: var(--muted); }
.card.filed .pieces i.on, .card.dropped .pieces i.on { background: var(--muted); }
.body { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.suggest { margin: 0; font-size: 17px; line-height: 1.4; font-weight: 600; overflow-wrap: anywhere; }
.card.dropped .suggest { color: var(--muted); }
.hit { margin: 0; color: var(--muted); overflow-wrap: anywhere; }
.hit .label { margin-right: 8px; }
.meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; font-size: 12px; color: var(--muted); }
.chip { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; background: var(--surface); border: 1px solid var(--line); border-radius: 999px; padding: 3px 10px; font-size: 12px; color: var(--ink); white-space: nowrap; }
.chip i { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--t, var(--muted)); }
.chip.t-empty i { width: 7px; height: 7px; background: none; border: 1.5px solid var(--muted); }
.chip.t-good { --t: var(--accent); }
.chip span { overflow: hidden; text-overflow: ellipsis; }
.id { border: 0; background: none; padding: 0; cursor: pointer; font: 500 12px var(--mono); color: var(--muted); max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.id:hover { color: var(--ink); }
.outcome { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; padding-top: 12px; border-top: 1px solid var(--line); font-size: 13px; overflow-wrap: anywhere; }
.outcome .when { color: var(--muted); font-size: 12px; }
.outcome a, .outcome code { font: 500 13px var(--mono); }
.actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; padding-top: 4px; }
.btn { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); font-size: 12px; font-weight: 600; white-space: nowrap; cursor: pointer; }
.btn:hover { border-color: var(--ink); }
.btn.primary { border-color: var(--ink); background: var(--ink); color: var(--bg); }
.btn.primary:hover { opacity: 0.9; }
.quiet { border: 0; background: none; padding: 0; font-size: 12px; color: var(--muted); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; white-space: nowrap; }
.quiet:hover { color: var(--ink); }
.suggest code, .hit code, .empty code, .foot code { font-family: var(--mono); font-size: 0.88em; font-weight: 500; padding: 1px 5px; border-radius: 4px; background: var(--track); }
mark { background: color-mix(in srgb, var(--accent) 24%, transparent); color: inherit; border-radius: 2px; }

/* empty and footer */
.empty { margin-top: 16px; padding: 40px 20px; border: 1px dashed var(--muted); border-radius: 14px; text-align: center; color: var(--muted); }
.empty h2 { margin: 0 0 8px; font-size: 24px; color: var(--ink); }
.empty p { margin: 0 auto; max-width: 48ch; }
.foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; padding: 32px 0 40px; color: var(--muted); font-size: 12px; }
.toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); visibility: hidden; background: var(--ink); color: var(--bg); padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; box-shadow: var(--float); pointer-events: none; max-width: calc(100vw - 32px); }
.toast.show { visibility: visible; }

@media (max-width: 640px) {
  .brand .wm { font-size: 20px; }
  .pill.project { display: none; }
  .live .txt { display: none; }
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .stat .n { font-size: 40px; }
  .tabs { width: 100%; gap: 0; justify-content: space-between; }
  .tab { font-size: 18px; padding: 10px 8px; }
  .controls { max-width: none; }
  .card { grid-template-columns: 1fr; gap: 14px; }
  .votes { flex-direction: row; align-items: baseline; gap: 8px; }
  .votes .n { font-size: 32px; }
  .pieces { flex: 1; margin: 0 0 0 4px; align-self: center; max-width: 160px; }
  .search kbd { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::after { animation: none !important; transition: none !important; }
}
</style>
</head>
<body>
<header class="bar">
  <div class="wrap">
    <div class="brand">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">__MARK__</svg>
      <span class="disp wm">Suggestion box</span>
      <span class="pill project" title="The project this box belongs to"><span id="project"></span></span>
    </div>
    <div class="pill live" id="live" role="status" aria-live="polite"><span class="dot"></span><span id="live-state">Connecting</span><span class="txt mono" id="live-text"></span></div>
  </div>
</header>
<div class="wrap">
  <section class="hero">
    <span class="label">What your agents keep running into</span>
    <h1 class="disp" id="headline">Suggestion box</h1>
    <p id="subline">Friction your agents hit while they work: the scripts, skills and checks that cost them a retry, a guess or minutes.</p>
    <div class="stats">
      <div class="stat"><span class="label">Open</span><span class="disp n" id="s-open">–</span></div>
      <div class="stat"><span class="label">Votes on open</span><span class="disp n" id="s-votes">–</span></div>
      <div class="stat"><span class="label">Filed</span><span class="disp n" id="s-filed">–</span></div>
      <div class="stat"><span class="label">Dropped</span><span class="disp n" id="s-dropped">–</span></div>
    </div>
    <div class="progress" id="progress" hidden>
      <div class="lab"><span>Triaged: filed or dropped</span><span class="mono" id="p-text"></span></div>
      <div class="meter" id="p-meter" role="progressbar" aria-label="Suggestions triaged" aria-valuemin="0"><i id="p-bar"></i></div>
    </div>
  </section>

  <div class="toolbar">
    <div class="tabs" role="tablist" aria-label="Status">
      <button class="tab" role="tab" data-tab="open" aria-selected="true">Open <span class="c" id="c-open"></span></button>
      <button class="tab" role="tab" data-tab="filed" aria-selected="false">Filed <span class="c" id="c-filed"></span></button>
      <button class="tab" role="tab" data-tab="dropped" aria-selected="false">Dropped <span class="c" id="c-dropped"></span></button>
      <button class="tab" role="tab" data-tab="all" aria-selected="false">All <span class="c" id="c-all"></span></button>
    </div>
    <div class="controls">
      <label class="search">
        <span class="sr">Search suggestions</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input class="field" id="q" type="search" placeholder="Search suggestions" autocomplete="off">
        <kbd>/</kbd>
      </label>
      <label><span class="sr">Sort</span>
        <select class="field" id="sort">
          <option value="votes">Most voted</option>
          <option value="newest">Newest</option>
        </select>
      </label>
    </div>
  </div>

  <main>
    <ol class="cards" id="cards" aria-live="polite"></ol>
    <div class="empty" id="empty" hidden></div>
  </main>

  <footer class="foot">
    <span>Read-only. Triage from the terminal: <code>suggestion-box triage</code></span>
    <span class="mono" id="version"></span>
  </footer>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script nonce="__NONCE__">
(function () {
  "use strict";
  var POLL_MS = 3000;
  var state = { data: null, raw: "", tab: "open", q: "", sort: "votes", seen: null, lastOk: 0, failed: false };
  var $ = function (id) { return document.getElementById(id); };

  try {
    var saved = JSON.parse(localStorage.getItem("suggestion-box:view") || "{}");
    if (["open", "filed", "dropped", "all"].indexOf(saved.tab) >= 0) state.tab = saved.tab;
    if (saved.sort === "votes" || saved.sort === "newest") state.sort = saved.sort;
  } catch (e) { /* storage is a convenience only */ }

  function remember() {
    try { localStorage.setItem("suggestion-box:view", JSON.stringify({ tab: state.tab, sort: state.sort })); } catch (e) { /* ignore */ }
  }

  /** Builds an element. Children that are strings become text nodes: nothing is ever parsed as HTML. */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") el.className = attrs[k];
      else if (k === "text") el.textContent = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return el;
  }

  /** The text, with each match of the search wrapped in <mark>, built from text nodes. */
  function highlighted(text) {
    var frag = document.createDocumentFragment();
    var q = state.q.trim().toLowerCase();
    if (!q) { frag.appendChild(document.createTextNode(text)); return frag; }
    var lower = text.toLowerCase(), at = 0, i;
    while ((i = lower.indexOf(q, at)) >= 0) {
      if (i > at) frag.appendChild(document.createTextNode(text.slice(at, i)));
      frag.appendChild(h("mark", { text: text.slice(i, i + q.length) }));
      at = i + q.length;
    }
    if (at < text.length) frag.appendChild(document.createTextNode(text.slice(at)));
    return frag;
  }

  /** Agents write \u0060code\u0060 in backticks: those spans become <code>, the rest stays text. Both get search marks. */
  function rich(text) {
    var frag = document.createDocumentFragment();
    var parts = text.split(/\u0060([^\u0060]+)\u0060/);
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] === "") continue;
      if (i % 2 === 1) { var code = h("code"); code.appendChild(highlighted(parts[i])); frag.appendChild(code); }
      else frag.appendChild(highlighted(parts[i]));
    }
    return frag;
  }

  var rtf = typeof Intl !== "undefined" && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }) : null;
  function ago(iso) {
    var then = new Date(iso).getTime();
    if (isNaN(then)) return "";
    var s = Math.round((then - Date.now()) / 1000);
    var units = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
    for (var i = 0; i < units.length; i++) {
      if (Math.abs(s) >= units[i][1]) {
        var n = Math.round(s / units[i][1]);
        return rtf ? rtf.format(n, units[i][0]) : Math.abs(n) + " " + units[i][0] + "s ago";
      }
    }
    return "just now";
  }
  function fullDate(iso) {
    var d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

  var toastTimer;
  function toast(message) {
    var t = $("toast");
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }
  function copy(text, what) {
    var done = function () { toast("Copied " + what); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { toast("Copy this: " + text); });
    } else {
      toast("Copy this: " + text);
    }
  }

  var SVG = "http://www.w3.org/2000/svg";
  function copyIcon() {
    var svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("width", "13"); svg.setAttribute("height", "13"); svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "2");
    svg.setAttribute("aria-hidden", "true");
    var a = document.createElementNS(SVG, "rect");
    a.setAttribute("x", "9"); a.setAttribute("y", "9"); a.setAttribute("width", "12"); a.setAttribute("height", "12"); a.setAttribute("rx", "2");
    var b = document.createElementNS(SVG, "path");
    b.setAttribute("d", "M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1");
    svg.appendChild(a); svg.appendChild(b);
    return svg;
  }

  /** One piece per vote while the most voted has few enough to count; a single bar beyond that. */
  function pieces(votes, max) {
    var box = h("div", { class: "pieces", "aria-hidden": "true" });
    if (max <= 12) {
      for (var i = 0; i < max; i++) box.appendChild(h("i", i < votes ? { class: "on" } : null));
    } else {
      var bar = h("i", { class: "on" });
      box.style.gridAutoColumns = "auto";
      box.style.gridTemplateColumns = Math.max(4, Math.round((votes / max) * 100)) + "fr " + Math.round((1 - votes / max) * 100) + "fr";
      box.appendChild(votes > 0 ? bar : h("i"));
      box.appendChild(h("i"));
    }
    return box;
  }

  var STATUS = { open: ["", "Open"], filed: [" t-good", "Filed"], dropped: [" t-empty", "Dropped"] };

  function card(s, max, isNew) {
    var votes = h("div", { class: "votes", title: plural(s.votes, "run hit this after it was posted", "runs hit this after it was posted") },
      h("span", { class: "label", text: s.votes === 1 ? "Vote" : "Votes" }),
      h("span", { class: "disp n", text: String(s.votes) }),
      max > 0 ? pieces(s.votes, max) : null);

    var suggest = h("p", { class: "suggest" });
    suggest.appendChild(rich(s.suggest));
    var hit = h("p", { class: "hit" }, h("span", { class: "label", text: "Hit" }));
    hit.appendChild(rich(s.hit));

    var tone = STATUS[s.status] || STATUS.open;
    var status = h("span", { class: "chip" + tone[0] }, h("i", { "aria-hidden": "true" }), tone[1]);
    var sourceText = h("span");
    sourceText.appendChild(highlighted(s.source));
    var source = h("span", { class: "chip", title: "Who hit it" }, sourceText);
    var posted = h("time", { datetime: s.postedAt, title: fullDate(s.postedAt), text: "Posted " + ago(s.postedAt) });
    var id = h("button", { class: "id", type: "button", title: "Copy the id", text: s.id });
    id.addEventListener("click", function () { copy(s.id, "the id"); });
    var meta = h("div", { class: "meta" }, status, source, posted, id);

    var body = h("div", { class: "body" }, suggest, hit, meta);

    if (s.status === "open") {
      var file = h("button", { class: "btn primary", type: "button", title: "Copies the command. Add where it went: an issue, a ticket, a commit" }, copyIcon(), "Copy file command");
      file.addEventListener("click", function () { copy("suggestion-box file " + s.id + " ", "the file command. Add where it went"); });
      var drop = h("button", { class: "quiet", type: "button", title: "Copies the command. Add why, if you like" }, "Copy drop command");
      drop.addEventListener("click", function () { copy("suggestion-box drop " + s.id + " ", "the drop command"); });
      body.appendChild(h("div", { class: "actions" }, file, drop));
    } else if (s.resolution) {
      var r = s.resolution;
      var outcome = h("div", { class: "outcome" });
      if (s.status === "filed") {
        outcome.appendChild(h("span", { class: "label", text: "Filed as" }));
        if (r.ref) {
          outcome.appendChild(/^https?:\\/\\//i.test(r.ref)
            ? h("a", { href: r.ref, target: "_blank", rel: "noopener noreferrer", text: r.ref })
            : h("code", { text: r.ref }));
        }
      } else {
        outcome.appendChild(h("span", { class: "label", text: "Dropped" }));
        outcome.appendChild(h("span", { text: r.reason || "No reason given" }));
      }
      outcome.appendChild(h("time", { class: "when", datetime: r.at, title: fullDate(r.at), text: ago(r.at) }));
      body.appendChild(outcome);
    }

    return h("li", { class: "card " + s.status + (isNew ? " is-new" : "") }, votes, body);
  }

  function matches(s) {
    var q = state.q.trim().toLowerCase();
    if (!q) return true;
    return (s.suggest + "\\n" + s.hit + "\\n" + s.source + "\\n" + s.id).toLowerCase().indexOf(q) >= 0;
  }

  function sorted(list) {
    var copy = list.slice();
    if (state.sort === "newest") {
      copy.sort(function (a, b) {
        var ka = a.resolution && state.tab !== "open" && state.tab !== "all" ? a.resolution.at : a.postedAt;
        var kb = b.resolution && state.tab !== "open" && state.tab !== "all" ? b.resolution.at : b.postedAt;
        return kb < ka ? -1 : kb > ka ? 1 : 0;
      });
    } else {
      copy.sort(function (a, b) { return b.votes - a.votes || (a.postedAt < b.postedAt ? -1 : a.postedAt > b.postedAt ? 1 : 0); });
    }
    return copy;
  }

  function emptyState(total) {
    var box = $("empty");
    box.textContent = "";
    var title, text;
    if (state.q.trim()) {
      title = "Nothing matches \\u201c" + state.q.trim() + "\\u201d";
      text = "Try fewer words, or another tab.";
    } else if (state.tab === "open" && total === 0) {
      title = "The box is empty";
      text = null;
    } else if (state.tab === "open") {
      title = "Nothing open";
      text = "Every suggestion has been filed or dropped. New ones appear here as agents post them.";
    } else if (state.tab === "filed") {
      title = "Nothing filed yet";
      text = "Suggestions you file with suggestion-box file or triage show up here, with where they went.";
    } else if (state.tab === "dropped") {
      title = "Nothing dropped";
      text = "Suggestions you drop show up here, with the reason you gave.";
    } else {
      title = "The box is empty";
    }
    box.appendChild(h("h2", { class: "disp", text: title }));
    if (text) box.appendChild(h("p", { text: text }));
    else box.appendChild(h("p", null, "When an agent hits friction it will post here. Point your agent at ", h("code", { text: "suggestion-box serve" }), " to start."));
    box.hidden = false;
  }

  function render() {
    var data = state.data;
    if (!data) return;
    var all = data.suggestions;
    var by = { open: [], filed: [], dropped: [] };
    all.forEach(function (s) { (by[s.status] || []).push(s); });
    var openVotes = by.open.reduce(function (n, s) { return n + s.votes; }, 0);

    document.title = "Suggestion box \\u00b7 " + data.project;
    $("project").textContent = data.project;
    $("version").textContent = "agent-suggestion-box " + data.version;
    $("s-open").textContent = String(by.open.length);
    $("s-votes").textContent = String(openVotes);
    $("s-filed").textContent = String(by.filed.length);
    $("s-dropped").textContent = String(by.dropped.length);
    $("c-open").textContent = String(by.open.length);
    $("c-filed").textContent = String(by.filed.length);
    $("c-dropped").textContent = String(by.dropped.length);
    $("c-all").textContent = String(all.length);
    var resolved = by.filed.length + by.dropped.length;
    $("progress").hidden = all.length === 0;
    $("progress").classList.toggle("met", all.length > 0 && resolved === all.length);
    $("p-text").textContent = resolved + " / " + all.length;
    $("p-bar").style.width = (all.length ? Math.round((resolved / all.length) * 100) : 0) + "%";
    $("p-meter").setAttribute("aria-valuemax", String(all.length));
    $("p-meter").setAttribute("aria-valuenow", String(resolved));
    $("headline").textContent = by.open.length === 0 ? "Nothing open" : plural(by.open.length, "open suggestion", "open suggestions");
    $("subline").textContent = by.open.length === 0
      ? "Nothing is waiting for you. Agents post here when a script, skill or check costs them a retry, a guess or minutes."
      : "The most voted is the friction your agents hit most often. File it where the fix will happen, or drop it.";

    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.setAttribute("aria-selected", String(tab.getAttribute("data-tab") === state.tab));
    });
    $("sort").value = state.sort;

    var list = state.tab === "all" ? all : by[state.tab];
    var shown = sorted(list.filter(matches));
    var max = shown.reduce(function (m, s) { return Math.max(m, s.votes); }, 0);

    var cards = $("cards");
    cards.textContent = "";
    var seen = state.seen;
    shown.forEach(function (s) { cards.appendChild(card(s, max, seen !== null && !seen.has(s.id))); });
    state.seen = new Set(all.map(function (s) { return s.id; }));

    if (shown.length === 0) emptyState(all.length);
    else $("empty").hidden = true;
  }

  function setLive() {
    var live = $("live");
    if (state.failed) {
      live.classList.add("offline");
      $("live-state").textContent = "Offline";
      $("live-text").textContent = "retrying";
      live.title = "Can\\u2019t reach suggestion-box ui. Is it still running?";
    } else if (state.lastOk) {
      live.classList.remove("offline");
      $("live-state").textContent = "Live";
      $("live-text").textContent = ago(new Date(state.lastOk).toISOString());
      live.title = "Updates as agents post";
    }
  }

  function load() {
    return fetch("/api/suggestions", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.text(); })
      .then(function (text) {
        state.failed = false;
        state.lastOk = Date.now();
        if (text !== state.raw) {
          state.raw = text;
          state.data = JSON.parse(text);
          render();
        }
      })
      .catch(function () { state.failed = true; })
      .then(setLive);
  }

  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () { state.tab = tab.getAttribute("data-tab"); remember(); render(); });
  });
  $("q").addEventListener("input", function (e) { state.q = e.target.value; render(); });
  $("sort").addEventListener("change", function (e) { state.sort = e.target.value; remember(); render(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== $("q")) { e.preventDefault(); $("q").focus(); }
    if (e.key === "Escape" && document.activeElement === $("q")) { $("q").value = ""; state.q = ""; render(); $("q").blur(); }
  });

  load();
  setInterval(function () { if (!document.hidden) load(); else setLive(); }, POLL_MS);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) load(); });
})();
</script>
</body>
</html>
`;
