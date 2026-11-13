// Generates the static geometry of the Mountain home hero.
//
// The scene is authored from a handful of control points; this script adds
// deterministic (seeded) roughness, derives light/shadow facets, snow, tree
// rows and the trail, then writes them as plain path strings. The output is
// committed, so the app never runs this code: re-run it only to change the art.
//
//   node scripts/generate-mountain-scene.mjs
//
// Coordinate system: a 1920 × 1080 scene, anchored bottom-right. Shapes extend
// far to the left of x = 0 so that ultra-wide viewports never show an edge.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/shared/components/parallax/mountainSceneGeometry.ts",
);

const LEFT = -1500;
const RIGHT = 1920;
const BOTTOM = 1080;
// Ground shapes continue below the frame so the camera can travel upwards
// without ever uncovering an edge.
const GROUND_FLOOR = 1500;

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Whole scene units are precise enough at this scale and keep the output small.
const n = (value) => String(Math.round(value));
const pt = ([x, y]) => `${n(x)} ${n(y)}`;
const polygon = (points) => `M${points.map(pt).join("L")}Z`;
const polyline = (points) => `M${points.map(pt).join("L")}`;

/** Midpoint displacement: keeps the control points, roughens between them. */
function roughen(control, { iterations, roughness, seed }) {
  const random = mulberry32(seed);
  let points = control.map(([x, y]) => [x, y]);
  let amount = roughness;
  for (let pass = 0; pass < iterations; pass += 1) {
    const next = [];
    for (let i = 0; i < points.length - 1; i += 1) {
      const [ax, ay] = points[i];
      const [bx, by] = points[i + 1];
      const length = Math.hypot(bx - ax, by - ay);
      next.push(points[i], [
        (ax + bx) / 2 + (random() - 0.5) * length * amount * 0.5,
        (ay + by) / 2 + (random() - 0.5) * length * amount,
      ]);
    }
    next.push(points[points.length - 1]);
    points = next;
    amount *= 0.62;
  }
  return { points, step: 2 ** iterations };
}

function closeToBottom(points) {
  const first = points[0];
  const last = points[points.length - 1];
  return polygon([...points, [last[0], GROUND_FLOOR], [first[0], GROUND_FLOOR]]);
}

function heightAt(points, x) {
  for (let i = 0; i < points.length - 1; i += 1) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    if (x >= ax && x <= bx) {
      return ay + ((x - ax) / (bx - ax || 1)) * (by - ay);
    }
  }
  return x < points[0][0] ? points[0][1] : points[points.length - 1][1];
}

/** Catmull-Rom spline through the points, as cubic Bézier segments. */
function splineSegments(points) {
  const segments = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    segments.push([
      p1,
      [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
      [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
      p2,
    ]);
  }
  return segments;
}

function splinePath(points) {
  const segments = splineSegments(points);
  return (
    `M${pt(segments[0][0])}` +
    segments.map(([, c1, c2, end]) => `C${pt(c1)} ${pt(c2)} ${pt(end)}`).join("")
  );
}

function flatten(points, stepsPerSegment = 16) {
  const out = [];
  for (const [p0, c1, c2, p3] of splineSegments(points)) {
    for (let step = 0; step < stepsPerSegment; step += 1) {
      const t = step / stepsPerSegment;
      const u = 1 - t;
      out.push([
        u ** 3 * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * p3[0],
        u ** 3 * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * p3[1],
      ]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

function pointAtFraction(flat, fraction) {
  const lengths = [0];
  for (let i = 1; i < flat.length; i += 1) {
    lengths.push(
      lengths[i - 1] +
        Math.hypot(flat[i][0] - flat[i - 1][0], flat[i][1] - flat[i - 1][1]),
    );
  }
  const target = lengths[lengths.length - 1] * fraction;
  const index = lengths.findIndex((length) => length >= target);
  return flat[Math.max(0, index)];
}

// ---------------------------------------------------------------------------
// Far ranges: two hazy silhouettes behind the main massif.
// ---------------------------------------------------------------------------

const farRangeA = roughen(
  [
    [LEFT, 600], [-1240, 520], [-1010, 566], [-800, 476], [-620, 548],
    [-420, 500], [-230, 560], [-60, 488], [110, 540], [260, 470],
    [420, 536], [590, 498], [760, 560], [900, 520], [1060, 580],
    [1240, 540], [1480, 600], [1700, 560], [RIGHT, 610],
  ],
  { iterations: 3, roughness: 0.34, seed: 11 },
).points;

const farRangeB = roughen(
  [
    [LEFT, 660], [-1300, 600], [-1100, 640], [-900, 566], [-700, 626],
    [-520, 580], [-330, 640], [-150, 590], [40, 650], [200, 572],
    [330, 610], [470, 540], [620, 612], [780, 590], [900, 650],
    [1100, 640], [1400, 680], [RIGHT, 690],
  ],
  { iterations: 3, roughness: 0.38, seed: 23 },
).points;

// ---------------------------------------------------------------------------
// Main massif: silhouette, sun-facing facets (light comes from the right) and
// snow above the snow line.
// ---------------------------------------------------------------------------

const massifControl = [
  [700, 700], [820, 632], [930, 566], [1010, 600], [1090, 488],
  [1170, 552], [1250, 522], [1330, 440], [1400, 470], [1470, 332],
  [1560, 248], [1622, 330], [1682, 384], [1742, 356], [1806, 442],
  [RIGHT, 506],
];
const massif = roughen(massifControl, { iterations: 3, roughness: 0.3, seed: 7 });
const MASSIF_BASE = 780;

/** Control-point indices of each summit and of the valley to its right. */
const SUMMITS = [
  { summit: 2, valley: 3 },
  { summit: 4, valley: 5 },
  { summit: 7, valley: 8 },
  { summit: 10, valley: 12 },
  { summit: 13, valley: 15 },
];

function divideLine(summit, seed) {
  const random = mulberry32(seed);
  const line = [];
  let [x, y] = summit;
  let side = 1;
  while (y < MASSIF_BASE) {
    const drop = 34 + random() * 40;
    y += drop;
    x += side * (8 + random() * 16) + drop * 0.16;
    side *= -1;
    line.push([x, Math.min(y, MASSIF_BASE)]);
  }
  return line;
}

const massifLit = SUMMITS.map(({ summit, valley }, index) => {
  const ridge = massif.points.slice(summit * massif.step, valley * massif.step + 1);
  const valleyPoint = ridge[ridge.length - 1];
  const divide = divideLine(ridge[0], 301 + index * 17);
  return {
    d: polygon([
      ...ridge,
      [valleyPoint[0] + 26, MASSIF_BASE],
      ...divide.reverse(),
    ]),
    // The first light reaches the highest summits; lower ones stay dimmer.
    strength: Math.round(Math.min(1, Math.max(0.4, (640 - ridge[0][1]) / 300)) * 100) / 100,
  };
});

const SNOW_LINE = 468;

function snowCap(fromControl, toControl, seed) {
  const random = mulberry32(seed);
  const ridge = massif.points
    .slice(fromControl * massif.step, toControl * massif.step + 1)
    .filter(([, y]) => y < SNOW_LINE);
  if (ridge.length < 4) {
    return "";
  }
  // The lower edge hangs below the ridge in broad tongues: long where the
  // ridge is high, short near the snow line.
  const lower = [];
  let tongue = true;
  for (let i = ridge.length - 1; i >= 0; i -= 3) {
    const [x, y] = ridge[i];
    const reach = Math.min(118, 20 + (SNOW_LINE - y) * (0.42 + random() * 0.2));
    lower.push([
      x + (random() - 0.5) * 12,
      y + reach * (tongue ? 1 : 0.46 + random() * 0.12),
    ]);
    tongue = !tongue;
  }
  return polygon([...ridge, ...lower]);
}

const massifSnow = [snowCap(3, 6, 91), snowCap(6, 9, 92), snowCap(8, 15, 93)].filter(
  Boolean,
);

// ---------------------------------------------------------------------------
// Near ground: a forested hill on the left, then the grass slope that carries
// the trail up to the pass on the right.
// ---------------------------------------------------------------------------

const forestHill = roughen(
  [
    [LEFT, 740], [-1200, 690], [-900, 730], [-600, 664], [-300, 716],
    [-40, 668], [220, 626], [470, 676], [760, 730], [1040, 770], [1300, 800],
  ],
  { iterations: 2, roughness: 0.1, seed: 41 },
).points;

const slopeControl = [
  [LEFT, 880], [-1100, 852], [-700, 866], [-300, 842], [0, 828],
  [300, 800], [600, 768], [900, 716], [1150, 640], [1400, 560],
  [1600, 508], [1700, 484], [1772, 468], [1830, 446],
];
const slopeEdge = flatten(slopeControl, 10);

const shoulder = roughen(
  [[1830, 446], [1862, 404], [1888, 420], [RIGHT, 352]],
  { iterations: 2, roughness: 0.34, seed: 53 },
).points;

const slopeSkyline = [...slopeEdge, ...shoulder.slice(1)];

const slopeContours = [58, 128, 212, 310].map((offset, index) =>
  splinePath(
    slopeControl.map(([x, y], i) => [
      x,
      y + offset + Math.sin(i * 1.7 + index) * 10 + (x > 900 ? offset * 0.16 : 0),
    ]),
  ),
);

const foreground = roughen(
  [
    [LEFT, 1062], [-900, 1050], [-300, 1066], [200, 1058], [700, 1070],
    [1100, 1052], [1380, 1016], [1600, 968], [1780, 930], [RIGHT, 896],
  ],
  { iterations: 2, roughness: 0.12, seed: 67 },
).points;

// ---------------------------------------------------------------------------
// Trail: from the trailhead in the foreground, across the meadow, up two
// switchbacks to the pass.
// ---------------------------------------------------------------------------

const trailControl = [
  [60, 1014], [250, 972], [460, 950], [670, 908], [880, 882],
  [1080, 842], [1280, 806], [1450, 776], [1532, 756], [1548, 736],
  [1506, 722], [1420, 708], [1346, 692], [1304, 676], [1298, 658],
  [1338, 646], [1424, 630], [1540, 598], [1652, 558], [1722, 516],
  [1770, 472],
];
const trailFlat = flatten(trailControl, 18);
const PASS = trailControl[trailControl.length - 1];
const CHECKPOINT_FRACTIONS = [0.3, 0.62];
const checkpoints = CHECKPOINT_FRACTIONS.map((at) => {
  const [x, y] = pointAtFraction(trailFlat, at);
  return { at, x: Math.round(x), y: Math.round(y) };
});

// ---------------------------------------------------------------------------
// Conifers.
// ---------------------------------------------------------------------------

function fir(x, baseY, height, random) {
  const tiers = 4;
  const halfWidth = height * (0.2 + random() * 0.05);
  const lean = (random() - 0.5) * height * 0.04;
  const left = [];
  const right = [];
  for (let tier = 1; tier <= tiers; tier += 1) {
    const y = baseY - height + (height * tier) / tiers;
    const width = halfWidth * (tier / tiers) * (0.9 + random() * 0.2);
    const tuck = width * 0.46;
    const lift = (height / tiers) * 0.22;
    left.push([x - width + lean, y], [x - tuck + lean, y - lift]);
    right.unshift([x + tuck + lean, y - lift], [x + width + lean, y]);
  }
  left.pop();
  right.shift();
  return polygon([[x + lean, baseY - height], ...left, ...right]);
}

function firRow({ from, to, spacing, height, baseAt, seed, skip = () => false }) {
  const random = mulberry32(seed);
  let path = "";
  for (let x = from; x < to; x += spacing[0] + random() * (spacing[1] - spacing[0])) {
    const size = height[0] + random() * (height[1] - height[0]);
    if (skip(x, random)) {
      continue;
    }
    path += fir(x, baseAt(x, random), size, random);
  }
  return path;
}

const hillTrees = firRow({
  from: LEFT,
  to: 1180,
  spacing: [15, 30],
  height: [26, 54],
  baseAt: (x) => heightAt(forestHill, x) + 9,
  seed: 71,
});

const slopeTreesBack = firRow({
  from: LEFT,
  to: 640,
  spacing: [26, 70],
  height: [44, 78],
  baseAt: (x, random) => heightAt(slopeSkyline, x) + 16 + random() * 44,
  seed: 83,
  skip: (x, random) => random() < 0.34 || (x > 380 && random() < 0.5),
});

const slopeTreesRight = firRow({
  from: 1596,
  to: RIGHT,
  spacing: [30, 64],
  height: [60, 104],
  baseAt: (x, random) => 824 + (x - 1596) * -0.16 + random() * 70,
  seed: 97,
  skip: (_, random) => random() < 0.2,
});

const foregroundTrees = firRow({
  from: 1560,
  to: RIGHT + 60,
  spacing: [54, 96],
  height: [176, 290],
  baseAt: () => BOTTOM + 24,
  seed: 109,
});

const foregroundTreesLeft = firRow({
  from: LEFT,
  to: -90,
  spacing: [70, 150],
  height: [150, 280],
  baseAt: () => BOTTOM + 24,
  seed: 113,
  skip: (_, random) => random() < 0.3,
});

// ---------------------------------------------------------------------------
// Rocks and stars.
// ---------------------------------------------------------------------------

function rock(x, y, size, seed) {
  const random = mulberry32(seed);
  const body = [
    [x - size, y],
    [x - size * 0.74, y - size * (0.5 + random() * 0.2)],
    [x - size * 0.1, y - size * (0.86 + random() * 0.2)],
    [x + size * 0.62, y - size * (0.5 + random() * 0.2)],
    [x + size, y],
  ];
  return {
    body: polygon(body),
    lit: polygon([body[2], body[3], body[4], [x + size * 0.16, y]]),
  };
}

const rocks = [
  rock(742, 944, 22, 1),
  rock(1168, 862, 16, 2),
  rock(1604, 780, 26, 3),
  rock(1392, 722, 13, 4),
  rock(1484, 632, 17, 5),
  rock(1812, 500, 24, 6),
  rock(322, 1004, 18, 7),
];

const starRandom = mulberry32(131);
const stars = Array.from({ length: 150 }, () => {
  const x = LEFT + starRandom() * (RIGHT - LEFT);
  const y = -780 + starRandom() ** 1.5 * 1240;
  return {
    x: Math.round(x),
    y: Math.round(y),
    r: Math.round((0.9 + starRandom() ** 3 * 2.1) * 10) / 10,
    tier: Math.floor(starRandom() * 3),
  };
});
const starTiers = [0, 1, 2].map((tier) =>
  stars
    .filter((star) => star.tier === tier)
    .map(({ x, y, r }) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`)
    .join(""),
);

// ---------------------------------------------------------------------------

const geometry = {
  farRangeA: closeToBottom(farRangeA),
  farRangeB: closeToBottom(farRangeB),
  massif: closeToBottom(massif.points),
  massifRidge: polyline(massif.points),
  massifLit,
  massifSnow,
  forestHill: closeToBottom(forestHill),
  hillTrees,
  slope: closeToBottom(slopeSkyline),
  slopeRim: polyline(slopeSkyline.filter(([x]) => x > 760)),
  slopeContours,
  slopeTreesBack,
  slopeTreesRight,
  foreground: closeToBottom(foreground),
  foregroundTrees: foregroundTrees + foregroundTreesLeft,
  rocks,
  trail: splinePath(trailControl),
  checkpoints,
  pass: { x: PASS[0], y: PASS[1] },
  starTiers,
};

const banner = `// Generated by scripts/generate-mountain-scene.mjs. Do not edit by hand:
// change the control points in the script and re-run it.
`;

writeFileSync(
  OUTPUT,
  `${banner}
export const MOUNTAIN_SCENE_GEOMETRY = ${JSON.stringify(geometry, null, 2)} as const;
`,
);

console.log(`Wrote ${OUTPUT}`);
