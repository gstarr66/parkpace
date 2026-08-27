const fs = require('fs');

const BASE = 'C:/Users/gstar/AppData/Local/Temp/claude/C--users-gstar-parkpace/86f60518-ec43-4011-a1e0-eecae2ef0399/scratchpad/map';

const svg = fs.readFileSync(`${BASE}/mk_map.svg`, 'utf8');
const namedBuildings = JSON.parse(fs.readFileSync(`${BASE}/mk_map.labels.json`, 'utf8'));

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const buildingListHtml = namedBuildings
  .map(
    (b) =>
      `<li><span class="b-name">${escapeHtml(b.name)}</span>${
        b.kind ? `<span class="b-kind">${escapeHtml(b.kind)}</span>` : ''
      }</li>`
  )
  .join('\n        ');

const html = `<title>ParkPace — Magic Kingdom Map (draft)</title>
<style>
  :root {
    --royal-blue: #1F3A93;
    --royal-blue-dim: #33468f;
    --gold: #E4C567;
    --deep-purple: #4B2E83;
    --bg: #FAF9FC;
    --surface: #FFFFFF;
    --border: #E6E1F5;
    --ink: #1A1F36;
    --ink-soft: #5B5E76;
  }
  :root[data-theme="dark"] {
    --bg: #14121F;
    --surface: #1D1A2B;
    --border: #322D48;
    --ink: #F1EFFA;
    --ink-soft: #B4AFC9;
    --royal-blue: #7C9BF0;
    --royal-blue-dim: #5C7AD0;
    --gold: #F0D48A;
    --deep-purple: #B79EE8;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #14121F;
      --surface: #1D1A2B;
      --border: #322D48;
      --ink: #F1EFFA;
      --ink-soft: #B4AFC9;
      --royal-blue: #7C9BF0;
      --royal-blue-dim: #5C7AD0;
      --gold: #F0D48A;
      --deep-purple: #B79EE8;
    }
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: -apple-system, "Segoe UI", system-ui, Roboto, sans-serif;
  }
  .page {
    max-width: 760px;
    margin: 0 auto;
    padding: 32px 20px 56px;
  }
  header {
    margin-bottom: 20px;
  }
  .eyebrow {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--royal-blue);
  }
  h1 {
    font-size: 26px;
    font-weight: 800;
    margin: 6px 0 6px;
    text-wrap: balance;
  }
  .subtitle {
    font-size: 14.5px;
    color: var(--ink-soft);
    line-height: 1.5;
    max-width: 62ch;
  }
  .map-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 10px;
    box-shadow: 0 8px 28px rgba(31, 58, 147, 0.08);
    margin-top: 22px;
  }
  .map-card svg {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 10px;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 16px;
    padding: 14px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--ink-soft);
  }
  .swatch {
    width: 14px;
    height: 14px;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .notes {
    margin-top: 24px;
    display: grid;
    gap: 14px;
  }
  .note-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px 18px;
  }
  .note-card h2 {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--deep-purple);
    margin: 0 0 8px;
  }
  .note-card p, .note-card li {
    font-size: 13.5px;
    color: var(--ink-soft);
    line-height: 1.6;
  }
  .note-card ul {
    margin: 0;
    padding-left: 18px;
  }
  .landmarks {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }
  .landmarks span {
    font-size: 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--ink-soft);
    padding: 4px 9px;
    border-radius: 20px;
  }
  .list-card {
    margin-top: 20px;
    padding: 18px 20px 20px;
  }
  .list-header h2 {
    font-size: 15px;
    font-weight: 800;
    margin: 0 0 4px;
  }
  .list-header .subtitle {
    font-size: 13px;
    margin: 0 0 14px;
  }
  .building-list {
    list-style: none;
    margin: 0;
    padding: 0;
    columns: 2;
    column-gap: 20px;
  }
  .building-list li {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
    padding: 7px 0;
    border-bottom: 1px solid var(--border);
    break-inside: avoid;
    font-size: 13px;
  }
  .b-name {
    color: var(--ink);
  }
  .b-kind {
    color: var(--ink-soft);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }
  @media (max-width: 520px) {
    .building-list { columns: 1; }
  }
  footer {
    margin-top: 22px;
    font-size: 11.5px;
    color: var(--ink-soft);
    text-align: center;
  }
</style>

<div class="page">
  <header>
    <div class="eyebrow">ParkPace — Map Prototype</div>
    <h1>Magic Kingdom, drawn from scratch</h1>
    <p class="subtitle">
      Buildings and walkways generated from real OpenStreetMap survey data — not traced from
      Disney's map art — then styled in ParkPace's own palette, with every named building
      labeled. This pass is for you to mark which buildings are backstage (to cut) and what's
      missing (to add) — the full list is below the map.
    </p>
  </header>

  <div class="map-card">
    ${svg}
  </div>

  <div class="legend">
    <div class="legend-item"><span class="swatch" style="background:#FFFFFF;border:1px solid #1F3A93;"></span>Buildings / attractions</div>
    <div class="legend-item"><span class="swatch" style="background:#FFFFFF;border:1px solid #E3DEF4;"></span>Plazas &amp; walkways</div>
    <div class="legend-item"><span class="swatch" style="background:#D9CFF0;"></span>Gardens &amp; landscaping</div>
    <div class="legend-item"><span class="swatch" style="background:#9DB8E8;"></span>Water</div>
    <div class="legend-item"><span class="swatch" style="background:#1F3A93;border-radius:50%;"></span>Park boundary</div>
  </div>

  <div class="notes">
    <div class="note-card">
      <h2>What's real vs. placeholder</h2>
      <p>
        Every shape and name here comes straight from OpenStreetMap's survey of the park — the
        castle, Space Mountain, the walkway loops, the moat, all geographically accurate, with
        real building names pulled from the data (not hand-placed by me). Land names
        (Frontierland, Fantasyland, etc.) and any custom icons still aren't in this pass.
      </p>
    </div>
    <div class="note-card">
      <h2>Known rough edges to expect</h2>
      <ul>
        <li>Backstage/service buildings are labeled right alongside guest-facing ones — that's what the list below is for.</li>
        <li>Land boundaries (Adventureland, Fantasyland, etc.) aren't drawn — OSM doesn't tag those the same way.</li>
        <li>Some walkway segments may look disconnected where OSM's path data has gaps.</li>
        <li>Labels can overlap in dense clusters (Fantasyland, Main Street) — that'll get a real label-placement pass once the building list itself is finalized.</li>
      </ul>
    </div>
  </div>

  <div class="map-card list-card">
    <div class="list-header">
      <h2>All ${namedBuildings.length} labeled buildings</h2>
      <p class="subtitle">Mark which ones to drop (backstage/service) and tell me what's missing — everything here matches a label on the map above.</p>
    </div>
    <ul class="building-list">
      ${buildingListHtml}
    </ul>
  </div>

  <footer>
    Building &amp; path data © OpenStreetMap contributors, ODbL. Not derived from Disney's official map.
  </footer>
</div>
`;

fs.writeFileSync(
  'C:/Users/gstar/AppData/Local/Temp/claude/C--users-gstar-parkpace/86f60518-ec43-4011-a1e0-eecae2ef0399/scratchpad/map/mk_map_preview.html',
  html
);
console.log('done, bytes:', html.length);
