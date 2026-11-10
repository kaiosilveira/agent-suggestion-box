/**
 * The UI's one page: markup, styles and script inline, so it works offline and needs no build step. The CSP nonce
 * covers the <style> and <script>. Agent-written text only ever reaches the DOM through textContent.
 *
 * The page is a plain string with two placeholders, so its script avoids template literals.
 */

const ICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="3" y="11" width="26" height="18" rx="4" fill="#c4501a"/><rect x="10" y="15" width="12" height="2.5" rx="1.25" fill="#fff"/><rect x="9" y="3" width="14" height="10" rx="2" fill="#f3c6ad" transform="rotate(-6 16 8)"/></svg>',
  );

export function renderPage({ nonce, title }: { nonce: string; title: string }): string {
  return PAGE.replaceAll("__NONCE__", nonce).replaceAll("__TITLE__", escapeHtml(title)).replace("__ICON__", ICON);
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
:root {
  --bg: #f6f5f1;
  --surface: #ffffff;
  --surface-2: #faf9f6;
  --line: #e7e3da;
  --line-strong: #d6d1c5;
  --ink: #1c1b18;
  --ink-2: #57534b;
  --ink-3: #8a857b;
  --accent: #c4501a;
  --accent-ink: #a8410f;
  --accent-soft: #fbece3;
  --filed: #2c7a4d;
  --filed-soft: #e4f1e8;
  --dropped: #6f6a60;
  --dropped-soft: #eeebe4;
  --mark: #fde5b4;
  --shadow: 0 1px 2px rgb(28 27 24 / 0.04), 0 4px 16px -8px rgb(28 27 24 / 0.10);
  --radius: 14px;
  --sans: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif;
  --mono: ui-monospace, "SF Mono", "Cascadia Code", "JetBrains Mono", Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #121211;
    --surface: #1a1917;
    --surface-2: #1f1e1b;
    --line: #2c2a26;
    --line-strong: #3a3732;
    --ink: #efede7;
    --ink-2: #b6b1a6;
    --ink-3: #847f74;
    --accent: #f08a50;
    --accent-ink: #f6a274;
    --accent-soft: #33221a;
    --filed: #72c796;
    --filed-soft: #16271d;
    --dropped: #a39e93;
    --dropped-soft: #24221e;
    --mark: #5a4417;
    --shadow: 0 1px 2px rgb(0 0 0 / 0.3), 0 8px 24px -12px rgb(0 0 0 / 0.5);
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font: 15px/1.55 var(--sans);
  -webkit-font-smoothing: antialiased;
}
button, input, select { font: inherit; color: inherit; }
a { color: var(--accent-ink); text-underline-offset: 2px; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 6px; }
.wrap { max-width: 880px; margin: 0 auto; padding: 0 20px; }

/* header */
.top { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 22px 0 8px; }
.brand { display: flex; align-items: center; gap: 10px; font-weight: 600; letter-spacing: -0.01em; }
.brand svg { flex: none; }
.brand .sep { color: var(--line-strong); font-weight: 400; }
.brand .project { color: var(--ink-2); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.live { display: inline-flex; align-items: center; gap: 8px; color: var(--ink-3); font-size: 13px; white-space: nowrap; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--filed); position: relative; }
.dot::after { content: ""; position: absolute; inset: -4px; border-radius: 50%; background: var(--filed); opacity: 0.25; animation: pulse 2.4s ease-out infinite; }
.live.offline .dot, .live.offline .dot::after { background: var(--accent); animation: none; }
@keyframes pulse { 0% { transform: scale(0.6); opacity: 0.35; } 80%, 100% { transform: scale(1.6); opacity: 0; } }

/* hero */
.hero { padding: 28px 0 22px; }
.hero h1 { margin: 0; font-size: clamp(26px, 4.4vw, 34px); line-height: 1.15; letter-spacing: -0.025em; font-weight: 650; }
.hero p { margin: 8px 0 0; color: var(--ink-2); max-width: 56ch; }
.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 22px; }
.stat { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; }
.stat .n { display: block; font-size: 24px; font-weight: 650; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.stat .k { color: var(--ink-3); font-size: 12.5px; }
.stat.accent .n { color: var(--accent-ink); }

/* toolbar */
.toolbar { position: sticky; top: 0; z-index: 2; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 12px 0; background: linear-gradient(var(--bg) 75%, transparent); }
.tabs { display: inline-flex; padding: 3px; gap: 2px; background: var(--surface); border: 1px solid var(--line); border-radius: 11px; }
.tab { border: 0; background: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; color: var(--ink-2); font-weight: 500; font-size: 14px; display: inline-flex; gap: 6px; align-items: center; }
.tab:hover { color: var(--ink); }
.tab[aria-selected="true"] { background: var(--ink); color: var(--bg); }
.tab .c { font-variant-numeric: tabular-nums; font-size: 12px; opacity: 0.7; }
.search { flex: 1 1 220px; position: relative; }
.search input { width: 100%; padding: 8px 12px 8px 34px; border: 1px solid var(--line); border-radius: 11px; background: var(--surface); outline: none; }
.search input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.search svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--ink-3); }
.search kbd { position: absolute; right: 9px; top: 50%; transform: translateY(-50%); font: 11px var(--mono); color: var(--ink-3); border: 1px solid var(--line); border-radius: 5px; padding: 1px 6px; background: var(--surface-2); }
.sort { padding: 8px 10px; border: 1px solid var(--line); border-radius: 11px; background: var(--surface); cursor: pointer; }

/* cards */
.cards { list-style: none; margin: 6px 0 0; padding: 0; display: grid; gap: 12px; }
.card { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 18px; padding: 18px 20px 16px 16px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); }
.card.is-new { animation: arrive 1.6s ease-out; }
@keyframes arrive { 0% { box-shadow: 0 0 0 3px var(--accent), var(--shadow); transform: translateY(-4px); } 100% { box-shadow: 0 0 0 0 transparent, var(--shadow); transform: none; } }
.votes { text-align: center; padding-top: 2px; }
.votes .n { display: block; font-size: 28px; line-height: 1; font-weight: 700; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
.votes .k { display: block; font-size: 11.5px; color: var(--ink-3); margin-top: 4px; text-transform: lowercase; }
.meter { height: 4px; border-radius: 4px; background: var(--surface-2); border: 1px solid var(--line); margin: 10px 6px 0; overflow: hidden; }
.meter i { display: block; height: 100%; background: var(--accent); border-radius: 4px; }
.card.filed .votes .n, .card.dropped .votes .n { color: var(--ink-3); }
.card.filed .meter i, .card.dropped .meter i { background: var(--ink-3); }
.suggest { margin: 0; font-size: 16.5px; line-height: 1.45; font-weight: 600; letter-spacing: -0.01em; overflow-wrap: anywhere; }
.hit { margin: 8px 0 0; color: var(--ink-2); overflow-wrap: anywhere; }
.label { display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); margin-right: 8px; }
.meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; margin-top: 12px; font-size: 13px; color: var(--ink-3); }
.chip { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 2px 9px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--line); color: var(--ink-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.id { border: 0; background: none; padding: 0; cursor: pointer; font: 12px var(--mono); color: var(--ink-3); max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.id:hover { color: var(--ink); }
.status { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; margin-top: 14px; padding: 9px 12px; border-radius: 10px; font-size: 13.5px; overflow-wrap: anywhere; }
.status.filed { background: var(--filed-soft); color: var(--filed); }
.status.dropped { background: var(--dropped-soft); color: var(--dropped); }
.status b { font-weight: 600; }
.status .when { opacity: 0.8; }
.actions { display: flex; flex-wrap: wrap; gap: 4px; margin: 10px 0 -4px -8px; }
.btn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid transparent; background: none; border-radius: 8px; padding: 4px 8px; font-size: 13px; color: var(--ink-3); cursor: pointer; }
.btn svg { opacity: 0.8; }
.btn:hover { background: var(--surface-2); border-color: var(--line); color: var(--ink); }
.btn code { font: 12px var(--mono); }
.suggest code, .hit code { font-family: var(--mono); font-size: 0.86em; font-weight: 500; padding: 1px 5px; border-radius: 5px; background: var(--surface-2); border: 1px solid var(--line); }
mark { background: var(--mark); color: inherit; border-radius: 3px; padding: 0 1px; }

/* empty and footer */
.empty { text-align: center; padding: 56px 20px; border: 1px dashed var(--line-strong); border-radius: var(--radius); color: var(--ink-2); }
.empty h2 { margin: 12px 0 6px; font-size: 17px; color: var(--ink); }
.empty p { margin: 0 auto; max-width: 44ch; }
.empty code, .foot code { font: 13px var(--mono); background: var(--surface); border: 1px solid var(--line); padding: 1px 6px; border-radius: 6px; }
.foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; padding: 36px 0 40px; color: var(--ink-3); font-size: 13px; }
.toast { position: fixed; left: 50%; bottom: 24px; transform: translate(-50%, 12px); opacity: 0; background: var(--ink); color: var(--bg); padding: 9px 14px; border-radius: 10px; font-size: 13.5px; transition: opacity 0.18s, transform 0.18s; pointer-events: none; max-width: calc(100vw - 32px); }
.toast.show { opacity: 1; transform: translate(-50%, 0); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

@media (max-width: 640px) {
  .wrap { padding: 0 16px; }
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .card { grid-template-columns: 1fr; gap: 10px; padding: 16px; }
  .votes { display: flex; align-items: baseline; gap: 6px; text-align: left; }
  .votes .n { font-size: 20px; }
  .votes .k { margin: 0; }
  .meter { flex: 1; margin: 0 0 0 6px; align-self: center; }
  .search kbd { display: none; }
  .btn .wide { display: none; }
  .live .txt { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::after { animation: none !important; transition: none !important; }
}
</style>
</head>
<body>
<div class="wrap">
  <header class="top">
    <div class="brand">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="11" width="26" height="18" rx="4" fill="var(--accent)"/><rect x="10" y="15" width="12" height="2.5" rx="1.25" fill="var(--surface)"/><rect x="9" y="3" width="14" height="10" rx="2" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5" transform="rotate(-6 16 8)"/></svg>
      <span>Suggestion box</span><span class="sep">/</span><span class="project" id="project"></span>
    </div>
    <div class="live" id="live" role="status" aria-live="polite"><span class="dot"></span><span class="txt" id="live-text">Connecting…</span></div>
  </header>

  <section class="hero">
    <h1 id="headline">What your agents keep running into</h1>
    <p id="subline">Friction your agents hit while they work: the scripts, skills and checks that cost them a retry, a guess or minutes.</p>
    <div class="stats">
      <div class="stat accent"><span class="n" id="s-open">–</span><span class="k">open</span></div>
      <div class="stat"><span class="n" id="s-votes">–</span><span class="k">votes on open</span></div>
      <div class="stat"><span class="n" id="s-filed">–</span><span class="k">filed</span></div>
      <div class="stat"><span class="n" id="s-dropped">–</span><span class="k">dropped</span></div>
    </div>
  </section>

  <div class="toolbar">
    <div class="tabs" role="tablist" aria-label="Status">
      <button class="tab" role="tab" data-tab="open" aria-selected="true">Open <span class="c" id="c-open"></span></button>
      <button class="tab" role="tab" data-tab="filed" aria-selected="false">Filed <span class="c" id="c-filed"></span></button>
      <button class="tab" role="tab" data-tab="dropped" aria-selected="false">Dropped <span class="c" id="c-dropped"></span></button>
      <button class="tab" role="tab" data-tab="all" aria-selected="false">All <span class="c" id="c-all"></span></button>
    </div>
    <label class="search">
      <span class="sr">Search suggestions</span>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="q" type="search" placeholder="Search suggestions" autocomplete="off">
      <kbd>/</kbd>
    </label>
    <label><span class="sr">Sort</span>
      <select class="sort" id="sort">
        <option value="votes">Most voted</option>
        <option value="newest">Newest</option>
      </select>
    </label>
  </div>

  <main>
    <ol class="cards" id="cards" aria-live="polite"></ol>
    <div class="empty" id="empty" hidden></div>
  </main>

  <footer class="foot">
    <span>Read-only. Triage from the terminal: <code>suggestion-box triage</code></span>
    <span id="version"></span>
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

  function card(s, max, isNew) {
    var votes = h("div", { class: "votes", title: plural(s.votes, "run hit this after it was posted", "runs hit this after it was posted") },
      h("span", { class: "n", text: String(s.votes) }),
      h("span", { class: "k", text: s.votes === 1 ? "vote" : "votes" }),
      (function () {
        var bar = h("i");
        bar.style.width = (max > 0 && s.votes > 0 ? Math.max(4, Math.round((s.votes / max) * 100)) : 0) + "%";
        return h("div", { class: "meter", "aria-hidden": "true" }, bar);
      })());

    var suggest = h("p", { class: "suggest" });
    suggest.appendChild(rich(s.suggest));
    var hit = h("p", { class: "hit" }, h("span", { class: "label", text: "Hit" }));
    hit.appendChild(rich(s.hit));

    var source = h("span", { class: "chip", title: "Who hit it" });
    source.appendChild(highlighted(s.source));
    var posted = h("time", { datetime: s.postedAt, title: fullDate(s.postedAt), text: "posted " + ago(s.postedAt) });
    var id = h("button", { class: "id", type: "button", title: "Copy the id", text: s.id });
    id.addEventListener("click", function () { copy(s.id, "the id"); });
    var meta = h("div", { class: "meta" }, source, posted, id);

    var body = h("div", { class: "body" }, suggest, hit, meta);

    if (s.status === "open") {
      var file = h("button", { class: "btn", type: "button", title: "Copy the command; add where it went" }, copyIcon(), "Copy ", h("code", { text: "file" }), h("span", { class: "wide", text: " command" }));
      file.addEventListener("click", function () { copy("suggestion-box file " + s.id + " ", "the file command: add where it went"); });
      var drop = h("button", { class: "btn", type: "button", title: "Copy the command; add why, if you like" }, copyIcon(), "Copy ", h("code", { text: "drop" }), h("span", { class: "wide", text: " command" }));
      drop.addEventListener("click", function () { copy("suggestion-box drop " + s.id + " ", "the drop command"); });
      body.appendChild(h("div", { class: "actions" }, file, drop));
    } else if (s.resolution) {
      var r = s.resolution;
      var status = h("div", { class: "status " + s.status });
      if (s.status === "filed") {
        status.appendChild(h("b", { text: "Filed" }));
        if (r.ref) {
          status.appendChild(document.createTextNode("as"));
          status.appendChild(/^https?:\\/\\//i.test(r.ref)
            ? h("a", { href: r.ref, target: "_blank", rel: "noopener noreferrer", text: r.ref })
            : h("code", { text: r.ref }));
        }
      } else {
        status.appendChild(h("b", { text: "Dropped" }));
        if (r.reason) status.appendChild(h("span", { text: "· " + r.reason }));
      }
      status.appendChild(h("time", { class: "when", datetime: r.at, title: fullDate(r.at), text: "· " + ago(r.at) }));
      body.appendChild(status);
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
    box.appendChild(h("h2", { text: title }));
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
    $("subline").textContent = by.open.length === 0
      ? "Nothing is waiting for you. Agents post here when a script, skill or check costs them a retry, a guess or minutes."
      : plural(by.open.length, "open suggestion", "open suggestions") + " with " + plural(openVotes, "vote", "votes") +
        ". The most voted is the friction your agents hit most often.";

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
      $("live-text").textContent = "Can\\u2019t reach suggestion-box ui \\u2014 retrying";
    } else if (state.lastOk) {
      live.classList.remove("offline");
      $("live-text").textContent = "Live \\u00b7 updated " + ago(new Date(state.lastOk).toISOString());
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
