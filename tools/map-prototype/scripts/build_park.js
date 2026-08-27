// Generalized pipeline: fetch OSM geometry for a park's boundary way,
// project to a flat schematic SVG, label named buildings, and wrap it
// in the same HTML preview page used for the Magic Kingdom prototype.
//
// Usage: node build_park.js <boundaryWayId> <fileKey> "<Display Name>"

const fs = require('fs');

const BASE = __dirname;
const [, , boundaryIdArg, fileKey, displayName] = process.argv;
const BOUNDARY_ID = Number(boundaryIdArg);

if (!BOUNDARY_ID || !fileKey || !displayName) {
  console.error('Usage: node build_park.js <boundaryWayId> <fileKey> "<Display Name>"');
  process.exit(1);
}

async function fetchOverpass(query, attempt = 1) {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: '*/*',
      'User-Agent': 'ParkPace-dev-prototype/1.0',
    },
  });
  const text = await res.text();
  if (text.trim().startsWith('<')) {
    if (attempt < 4) {
      console.log(`  Overpass busy, retrying (${attempt})...`);
      await new Promise((r) => setTimeout(r, 4000 * attempt));
      return fetchOverpass(query, attempt + 1);
    }
    throw new Error('Overpass API returned an error page after retries:\n' + text.slice(0, 300));
  }
  return JSON.parse(text);
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function centroid(pts) {
  let area = 0, cx = 0, cy = 0;
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-6) {
    const avgX = pts.reduce((s, p) => s + p[0], 0) / n;
    const avgY = pts.reduce((s, p) => s + p[1], 0) / n;
    return { x: avgX, y: avgY, area: 0 };
  }
  cx /= 6 * area;
  cy /= 6 * area;
  return { x: cx, y: cy, area: Math.abs(area) };
}

function isClosed(geometry) {
  const first = geometry[0];
  const last = geometry[geometry.length - 1];
  return first.lat === last.lat && first.lon === last.lon;
}

function buildingKind(tags) {
  return tags.attraction || tags.tourism || tags.amenity || tags.shop || tags.leisure || tags.historic || '';
}

async function main() {
  console.log(`\n=== ${displayName} (way ${BOUNDARY_ID}) ===`);

  console.log('Fetching park geometry from OpenStreetMap...');
  const data = await fetchOverpass(
    `[out:json][timeout:90];way(${BOUNDARY_ID});map_to_area->.a;(way(area.a)["building"];way(area.a)["highway"];way(area.a)["natural"="water"];way(area.a)["leisure"="garden"];way(${BOUNDARY_ID}););out geom;`
  );

  fs.writeFileSync(`${BASE}/${fileKey}_raw.json`, JSON.stringify(data));

  const boundaryEl = data.elements.find((e) => e.id === BOUNDARY_ID);
  if (!boundaryEl) throw new Error('Boundary way not found in response');

  const elements = data.elements.filter(
    (e) => e.type === 'way' && e.id !== BOUNDARY_ID && e.geometry && e.geometry.length > 1
  );

  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const pt of boundaryEl.geometry) {
    if (pt.lat < minLat) minLat = pt.lat;
    if (pt.lat > maxLat) maxLat = pt.lat;
    if (pt.lon < minLon) minLon = pt.lon;
    if (pt.lon > maxLon) maxLon = pt.lon;
  }

  const avgLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const lonScaleFactor = Math.cos(avgLatRad);
  const widthDeg = (maxLon - minLon) * lonScaleFactor;
  const heightDeg = maxLat - minLat;

  const VIEW_WIDTH = 1000;
  const PADDING = 20;
  const drawableWidth = VIEW_WIDTH - PADDING * 2;
  const scale = drawableWidth / widthDeg;
  const VIEW_HEIGHT = Math.round(heightDeg * scale) + PADDING * 2;

  function project(pt) {
    const x = (pt.lon - minLon) * lonScaleFactor * scale + PADDING;
    const y = (maxLat - pt.lat) * scale + PADDING;
    return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
  }

  function pointsToPath(geometry, closed) {
    const coords = geometry.map(project);
    const d = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
    return closed ? d + ' Z' : d;
  }

  const buildings = [];
  const gardens = [];
  const water = [];
  const walkwaysArea = [];
  const walkwaysLine = [];
  const namedBuildings = [];

  for (const el of elements) {
    const tags = el.tags || {};
    const closed = isClosed(el.geometry);
    const d = pointsToPath(el.geometry, closed);
    const name = tags.name || '';

    if (tags.building) {
      buildings.push({ d });
      if (name) {
        const projected = el.geometry.map(project);
        const c = centroid(projected);
        namedBuildings.push({ name, x: c.x, y: c.y, area: c.area, kind: buildingKind(tags) });
      }
    } else if (tags.leisure === 'garden') {
      gardens.push({ d });
    } else if (tags.natural === 'water') {
      water.push({ d });
    } else if (tags.highway) {
      if (['footway', 'pedestrian', 'living_street'].includes(tags.highway) && closed) {
        walkwaysArea.push({ d });
      } else if (['footway', 'pedestrian', 'path', 'living_street', 'steps'].includes(tags.highway)) {
        walkwaysLine.push({ d });
      } else if (tags.highway === 'raceway') {
        walkwaysArea.push({ d });
      }
    }
  }

  function svgGroup(items, fill, stroke, strokeWidth, opacity) {
    return items
      .map(
        (it) =>
          `<path d="${it.d}" fill="${fill}" stroke="${stroke || 'none'}" stroke-width="${strokeWidth || 0}" ${
            opacity ? `opacity="${opacity}"` : ''
          }/>`
      )
      .join('\n    ');
  }
  function svgLines(items, stroke, strokeWidth, opacity) {
    return items
      .map(
        (it) =>
          `<path d="${it.d}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" ${
            opacity ? `opacity="${opacity}"` : ''
          }/>`
      )
      .join('\n    ');
  }

  const boundaryPath = pointsToPath(boundaryEl.geometry, true);

  const svg = `<svg viewBox="0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="parkBoundary">
      <path d="${boundaryPath}"/>
    </clipPath>
  </defs>
  <path d="${boundaryPath}" fill="#F4F1FB"/>
  <g clip-path="url(#parkBoundary)">
    <g id="gardens">
      ${svgGroup(gardens, '#D9CFF0', 'none', 0, 0.6)}
    </g>
    <g id="water">
      ${svgGroup(water, '#9DB8E8', 'none', 0)}
    </g>
    <g id="walkway-areas">
      ${svgGroup(walkwaysArea, '#FFFFFF', '#E3DEF4', 1.5)}
    </g>
    <g id="walkway-lines">
      ${svgLines(walkwaysLine, '#FFFFFF', 4, 0.9)}
    </g>
    <g id="buildings">
      ${svgGroup(buildings, '#FFFFFF', '#1F3A93', 1.2)}
    </g>
    <g id="labels" font-family="-apple-system, Segoe UI, sans-serif" font-size="6.5" font-weight="600" fill="#2A1F4D" text-anchor="middle" paint-order="stroke fill" stroke="#FFFFFF" stroke-width="2.2" stroke-linejoin="round">
      ${namedBuildings
        .map((b) => `<text x="${b.x.toFixed(2)}" y="${b.y.toFixed(2)}">${escapeXml(b.name)}</text>`)
        .join('\n      ')}
    </g>
  </g>
  <path d="${boundaryPath}" fill="none" stroke="#1F3A93" stroke-width="2.5"/>
</svg>`;

  console.log('Counts:', {
    buildings: buildings.length,
    named: namedBuildings.length,
    gardens: gardens.length,
    water: water.length,
    walkwaysArea: walkwaysArea.length,
    walkwaysLine: walkwaysLine.length,
  });
  console.log('View size:', VIEW_WIDTH, 'x', VIEW_HEIGHT);

  const sortedNamed = namedBuildings
    .map((b) => ({ name: b.name, kind: b.kind, area: Math.round(b.area) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const buildingListHtml = sortedNamed
    .map(
      (b) =>
        `<li><span class="b-name">${escapeHtml(b.name)}</span>${
          b.kind ? `<span class="b-kind">${escapeHtml(b.kind)}</span>` : ''
        }</li>`
    )
    .join('\n        ');

  const html = `<title>ParkPace — ${escapeHtml(displayName)} Map (draft)</title>
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
    --bg: #14121F; --surface: #1D1A2B; --border: #322D48; --ink: #F1EFFA; --ink-soft: #B4AFC9;
    --royal-blue: #7C9BF0; --royal-blue-dim: #5C7AD0; --gold: #F0D48A; --deep-purple: #B79EE8;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #14121F; --surface: #1D1A2B; --border: #322D48; --ink: #F1EFFA; --ink-soft: #B4AFC9;
      --royal-blue: #7C9BF0; --royal-blue-dim: #5C7AD0; --gold: #F0D48A; --deep-purple: #B79EE8;
    }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font-family: -apple-system, "Segoe UI", system-ui, Roboto, sans-serif; }
  .page { max-width: 760px; margin: 0 auto; padding: 32px 20px 56px; }
  header { margin-bottom: 20px; }
  .eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--royal-blue); }
  h1 { font-size: 26px; font-weight: 800; margin: 6px 0 6px; text-wrap: balance; }
  .subtitle { font-size: 14.5px; color: var(--ink-soft); line-height: 1.5; max-width: 62ch; }
  .map-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 10px; box-shadow: 0 8px 28px rgba(31, 58, 147, 0.08); margin-top: 22px; }
  .map-card svg { display: block; width: 100%; height: auto; border-radius: 10px; }
  .legend { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 16px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
  .legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-soft); }
  .swatch { width: 14px; height: 14px; border-radius: 4px; flex-shrink: 0; }
  .notes { margin-top: 24px; display: grid; gap: 14px; }
  .note-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px 18px; }
  .note-card h2 { font-size: 13px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; color: var(--deep-purple); margin: 0 0 8px; }
  .note-card p, .note-card li { font-size: 13.5px; color: var(--ink-soft); line-height: 1.6; }
  .note-card ul { margin: 0; padding-left: 18px; }
  .list-card { margin-top: 20px; padding: 18px 20px 20px; }
  .list-header h2 { font-size: 15px; font-weight: 800; margin: 0 0 4px; }
  .list-header .subtitle { font-size: 13px; margin: 0 0 14px; }
  .building-list { list-style: none; margin: 0; padding: 0; columns: 2; column-gap: 20px; }
  .building-list li { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; padding: 7px 0; border-bottom: 1px solid var(--border); break-inside: avoid; font-size: 13px; }
  .b-name { color: var(--ink); }
  .b-kind { color: var(--ink-soft); font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; white-space: nowrap; }
  @media (max-width: 520px) { .building-list { columns: 1; } }
  footer { margin-top: 22px; font-size: 11.5px; color: var(--ink-soft); text-align: center; }
</style>

<div class="page">
  <header>
    <div class="eyebrow">ParkPace — Map Prototype</div>
    <h1>${escapeHtml(displayName)}, drawn from scratch</h1>
    <p class="subtitle">
      Buildings and walkways generated from real OpenStreetMap survey data — not traced from
      Disney's map art — then styled in ParkPace's own palette, with every named building
      labeled. Mark which buildings are backstage (to cut) and what's missing (to add) — the
      full list is below the map.
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
        Every shape and name here comes straight from OpenStreetMap's survey of the park, with
        real building names pulled from the data (not hand-placed). Land/area names and any
        custom icons still aren't in this pass.
      </p>
    </div>
    <div class="note-card">
      <h2>Known rough edges to expect</h2>
      <ul>
        <li>Backstage/service buildings are labeled right alongside guest-facing ones — that's what the list below is for.</li>
        <li>Land boundaries aren't drawn — OSM doesn't tag those the same way.</li>
        <li>Some walkway segments may look disconnected where OSM's path data has gaps.</li>
        <li>Labels can overlap in dense clusters — that'll get a real label-placement pass once the building list is finalized.</li>
      </ul>
    </div>
  </div>

  <div class="map-card list-card">
    <div class="list-header">
      <h2>All ${sortedNamed.length} labeled buildings</h2>
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

  fs.writeFileSync(`${BASE}/${fileKey}_map.svg`, svg);
  fs.writeFileSync(`${BASE}/${fileKey}.labels.json`, JSON.stringify(sortedNamed, null, 2));
  fs.writeFileSync(`${BASE}/${fileKey}_map_preview.html`, html);
  console.log(`Wrote ${fileKey}_map_preview.html`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
