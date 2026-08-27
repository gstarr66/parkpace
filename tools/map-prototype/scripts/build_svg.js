const fs = require('fs');

const RAW_PATH = process.argv[2];
const OUT_PATH = process.argv[3];

const data = JSON.parse(fs.readFileSync(RAW_PATH, 'utf8'));

const BOUNDARY_ID = 297428432;
const boundaryEl = data.elements.find((e) => e.id === BOUNDARY_ID);
const elements = data.elements.filter(
  (e) => e.type === 'way' && e.id !== BOUNDARY_ID && e.geometry && e.geometry.length > 1
);

// Bounding box from the park boundary polygon itself (tight, accurate crop)
let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
for (const pt of boundaryEl.geometry) {
  if (pt.lat < minLat) minLat = pt.lat;
  if (pt.lat > maxLat) maxLat = pt.lat;
  if (pt.lon < minLon) minLon = pt.lon;
  if (pt.lon > maxLon) maxLon = pt.lon;
}

const avgLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180);
const lonScaleFactor = Math.cos(avgLatRad); // meters-per-degree-lon correction

const widthDeg = (maxLon - minLon) * lonScaleFactor;
const heightDeg = maxLat - minLat;

const VIEW_WIDTH = 1000;
const PADDING = 20;
const drawableWidth = VIEW_WIDTH - PADDING * 2;
const scale = drawableWidth / widthDeg;
const VIEW_HEIGHT = Math.round(heightDeg * scale) + PADDING * 2;

function project(pt) {
  const x = (pt.lon - minLon) * lonScaleFactor * scale + PADDING;
  const y = (maxLat - pt.lat) * scale + PADDING; // invert lat so north is up
  return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
}

// Area-weighted polygon centroid (shoelace-based) — more reliable than a plain
// vertex average for elongated/L-shaped building footprints.
function centroid(projectedPoints) {
  let area = 0, cx = 0, cy = 0;
  const pts = projectedPoints;
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
    // Degenerate polygon — fall back to a plain vertex average.
    const avgX = pts.reduce((s, p) => s + p[0], 0) / n;
    const avgY = pts.reduce((s, p) => s + p[1], 0) / n;
    return { x: avgX, y: avgY, area: 0 };
  }
  cx /= 6 * area;
  cy /= 6 * area;
  return { x: cx, y: cy, area: Math.abs(area) };
}

function pointsToPath(geometry, closed) {
  const coords = geometry.map(project);
  const d = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  return closed ? d + ' Z' : d;
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isClosed(geometry) {
  const first = geometry[0];
  const last = geometry[geometry.length - 1];
  return first.lat === last.lat && first.lon === last.lon;
}

const buildings = [];
const gardens = [];
const water = [];
const walkwaysArea = []; // closed pedestrian plazas
const walkwaysLine = []; // linear footways/paths
const namedBuildings = []; // for on-map labels + the reference list

function buildingKind(tags) {
  return (
    tags.attraction ||
    tags.tourism ||
    tags.amenity ||
    tags.shop ||
    tags.leisure ||
    tags.historic ||
    ''
  );
}

for (const el of elements) {
  const tags = el.tags || {};
  const closed = isClosed(el.geometry);
  const d = pointsToPath(el.geometry, closed);
  const name = tags.name || '';

  if (tags.building) {
    const entry = { d, name, tags };
    buildings.push(entry);
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
      walkwaysArea.push({ d }); // Speedway track, guest-facing
    }
    // service/track/elevator (backstage) are skipped entirely
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

fs.writeFileSync(OUT_PATH, svg);
fs.writeFileSync(
  OUT_PATH.replace(/\.svg$/, '.labels.json'),
  JSON.stringify(
    namedBuildings.map((b) => ({ name: b.name, kind: b.kind, area: Math.round(b.area) })).sort((a, b) => a.name.localeCompare(b.name)),
    null,
    2
  )
);
console.log('Bounding box:', { minLat, maxLat, minLon, maxLon });
console.log('View size:', VIEW_WIDTH, 'x', VIEW_HEIGHT);
console.log('Counts:', {
  buildings: buildings.length,
  gardens: gardens.length,
  water: water.length,
  walkwaysArea: walkwaysArea.length,
  walkwaysLine: walkwaysLine.length,
});
console.log('Named buildings:', namedBuildings.length);
