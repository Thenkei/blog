import { useId } from "react";
import { Box, ease, easeOut, enter, lerp, pop, Pulse, Tag, Text, tint, TONE } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). Act 1: one face is scanned, its biometric landmarks are
// captured and a mesh is generated while the track runs against the one-second
// budget; the finished mesh is filed as customer 1. Act 2 replays the same
// pipeline on a different face: a different mesh, still inside the budget.
// The track shows the budget, not measured times.
const ACT = [
  { scan: 10, bio: 56, mesh: 76, done: 128, fly: 136, land: 162 },
  { scan: 206, bio: 246, mesh: 262, done: 308, fly: 316, land: 342 },
] as const;
const T = { morph: 176, morphEnd: 200, end: 450 } as const;

// Two morphologies: x/y stretch of the same landmark topology.
const FACES = [{ sx: 1, sy: 1 }, { sx: 1.13, sy: .9 }] as const;
// Where each stage ends on the budget track (share of one second).
const SPLIT = [.3, .46, .84] as const;

const COPY = {
  en: {
    viewer: "FACIAL SCAN",
    budget: "BUDGET · ONE SECOND",
    stages: ["scan", "biometrics", "3D mesh"],
    ready: "mesh ready · < 1 s ✓",
    customer: (n: number) => `customer ${n}`,
    specific: "own mesh",
    waiting: "waiting for a face",
    waitingShort: "waiting",
    note: "same pipeline, one mesh per face",
  },
  fr: {
    viewer: "SCAN FACIAL",
    budget: "BUDGET · UNE SECONDE",
    stages: ["scan", "biométrie", "mesh 3D"],
    ready: "mesh prêt · < 1 s ✓",
    customer: (n: number) => `client ${n}`,
    specific: "mesh unique",
    waiting: "en attente d’un visage",
    waitingShort: "en attente",
    note: "même chaîne, un mesh par visage",
  },
} as const;

// ─── The face: a low-poly head built on biometric landmarks ─────────────────
type P2 = readonly [number, number];
const LANDMARKS: readonly P2[] = [
  [0, -72], [-44, -54], [44, -54], [-62, -18], [62, -18], [-42, -12], [-14, -12], [14, -12], [42, -12], [0, -14],
  [0, 20], [-16, 26], [16, 26], [-56, 28], [56, 28], [-22, 48], [22, 48], [-38, 70], [38, 70], [0, 88], [-67, 2], [67, 2],
];
const EDGES: readonly P2[] = [
  [0, 1], [0, 2], [1, 3], [2, 4], [0, 9], [1, 5], [1, 6], [2, 7], [2, 8], [1, 9], [2, 9], [3, 5], [4, 8], [5, 6], [7, 8], [6, 9], [7, 9],
  [9, 10], [6, 10], [7, 10], [10, 11], [10, 12], [5, 13], [8, 14], [3, 20], [4, 21], [20, 13], [21, 14], [11, 13], [12, 14], [11, 15],
  [12, 16], [15, 16], [13, 15], [14, 16], [13, 17], [14, 18], [15, 17], [16, 18], [17, 19], [18, 19], [15, 19], [16, 19], [3, 13], [4, 14], [5, 11], [8, 12],
];
const linked = (a: number, b: number) => EDGES.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
const TRIANGLES: readonly (readonly [number, number, number])[] = EDGES.flatMap(([a, b]) => LANDMARKS
  .map((_, c) => c)
  .filter((c) => c > Math.max(a, b) && linked(a, c) && linked(b, c))
  .map((c) => [a, b, c] as const))
  .sort((u, v) => (LANDMARKS[u[0]]![1] + LANDMARKS[u[1]]![1] + LANDMARKS[u[2]]![1]) - (LANDMARKS[v[0]]![1] + LANDMARKS[v[1]]![1] + LANDMARKS[v[2]]![1]));
const HEAD = "M0 -92C50 -92 71 -54 70 -10C69 36 44 84 0 94C-44 84 -69 36 -70 -10C-71 -54 -50 -92 0 -92Z";

function Head({ cx, cy, s, sx = 1, sy = 1, scan, mesh, detail = 1 }: {
  cx: number; cy: number; s: number; sx?: number; sy?: number;
  /** 0 → 1 scan beam over the head; landmarks are captured as it passes. */
  scan: number;
  mesh: number;
  /** Opacity of landmarks and mesh (the head outline stays). */
  detail?: number;
}) {
  const id = useId().replaceAll(":", "");
  const p = ([x, y]: P2): [number, number] => [cx + x * s * sx, cy + y * s * sy];
  const scanY = lerp(-104, 104, scan);
  const scanning = scan > 0 && scan < 1;
  const halfW = 90 * s * sx;
  return <g>
    <defs>
      <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: TONE.hot, stopOpacity: 0 }} />
        <stop offset="1" style={{ stopColor: TONE.hot, stopOpacity: .22 }} />
      </linearGradient>
    </defs>
    <path d={HEAD} transform={`translate(${cx} ${cy}) scale(${s * sx} ${s * sy})`} style={{ fill: tint("line", 6) }} stroke={TONE.line} strokeOpacity={.4} strokeWidth={1} vectorEffect="non-scaling-stroke" />
    <g opacity={detail}>
      {TRIANGLES.map(([a, b, c], index) => {
        const on = Math.max(0, Math.min(1, mesh * (TRIANGLES.length + 6) - index));
        if (on <= 0) return null;
        const centroid = (LANDMARKS[a]![0] + LANDMARKS[b]![0] + LANDMARKS[c]![0]) / 3;
        const light = .05 + .13 * (1 - (centroid + 70) / 140);
        const [x1, y1] = p(LANDMARKS[a]!);
        const [x2, y2] = p(LANDMARKS[b]!);
        const [x3, y3] = p(LANDMARKS[c]!);
        return <path key={index} d={`M${x1} ${y1}L${x2} ${y2}L${x3} ${y3}Z`} fill={TONE.line} opacity={light * on} />;
      })}
      {EDGES.map(([a, b], index) => {
        const on = Math.min(1, Math.max(0, mesh * EDGES.length - index));
        if (on <= 0) return null;
        const [x1, y1] = p(LANDMARKS[a]!);
        const [x2, y2] = p(LANDMARKS[b]!);
        return <line key={index} x1={x1} y1={y1} x2={lerp(x1, x2, on)} y2={lerp(y1, y2, on)} stroke={TONE.line} strokeWidth={.9} strokeOpacity={.6} />;
      })}
      {LANDMARKS.map((point, index) => {
        const passed = scanY - point[1];
        if (passed < 0) return null;
        const [px, py] = p(point);
        const ripple = scan >= 1 ? 1 : Math.min(1, passed / 34);
        return <g key={index}>
          {ripple < 1 ? <circle cx={px} cy={py} r={2.4 + 9 * ripple} fill="none" stroke={TONE.hot} strokeWidth={1.25} opacity={1 - ripple} /> : null}
          <circle cx={px} cy={py} r={Math.max(1.4, 2.4 * s) * Math.min(1, .4 + ripple * 3)} fill={TONE.line} />
        </g>;
      })}
    </g>
    {scanning ? <g>
      <rect x={cx - halfW} y={cy + scanY * s * sy - 26} width={halfW * 2} height={26} fill={`url(#${id}-beam)`} />
      <line className="scene-glow" x1={cx - halfW} x2={cx + halfW} y1={cy + scanY * s * sy} y2={cy + scanY * s * sy} stroke={TONE.hot} strokeWidth={1.5} style={{ color: TONE.hot }} />
    </g> : null}
  </g>;
}

type Pt = readonly [number, number];
const bezier = (p0: Pt, p1: Pt, p2: Pt, t: number): [number, number] => [
  (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
  (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
];

function Stage({ frame, compact, locale }: SceneStageProps) {
  const c = COPY[locale];
  const act = frame >= T.morph ? 1 : 0;
  const a = ACT[act];
  const morph = ease(frame, T.morph, T.morphEnd);
  const sx = lerp(FACES[0].sx, FACES[1].sx, morph);
  const sy = lerp(FACES[0].sy, FACES[1].sy, morph);

  // Per-act progress; act 1's drawing clears as the next face arrives.
  const scan = ease(frame, a.scan, a.bio, (t) => t);
  const mesh = ease(frame, a.mesh, a.done);
  const detail = act === 0 ? 1 - ease(frame, T.morph - 4, T.morph + 6) : 1;

  // Budget track: fills stage by stage to 84 % of the one-second track, never past the line.
  const fill = frame < a.bio ? lerp(0, SPLIT[0], scan) : frame < a.mesh ? lerp(SPLIT[0], SPLIT[1], ease(frame, a.bio, a.mesh)) : lerp(SPLIT[1], SPLIT[2], mesh);
  const trackIn = act === 0 ? 1 - ease(frame, T.morph, T.morph + 12) : easeOut(frame, a.scan - 10, a.scan);
  const stageIndex = frame < a.bio ? 0 : frame < a.mesh ? 1 : 2;
  const done = frame >= a.done;
  const readyIn = pop(frame, a.done) * (act === 0 ? 1 - ease(frame, T.morph, T.morph + 10) : 1);

  const L = compact
    ? {
      viewer: { x: 20, y: 52, w: 250, h: 244 }, face: { cx: 145, cy: 184, s: .82 },
      budget: { x: 20, y: 312, w: 500, h: 106 },
      slots: [{ x: 284, y: 52, w: 236, h: 116 }, { x: 284, y: 180, w: 236, h: 116 }], thumbS: .4, thumbDx: 52, textDx: 102,
      readyY: 446, noteY: 490,
    }
    : {
      viewer: { x: 40, y: 60, w: 300, h: 330 }, face: { cx: 190, cy: 232, s: 1.1 },
      budget: { x: 372, y: 60, w: 548, h: 112 },
      slots: [{ x: 372, y: 190, w: 548, h: 88 }, { x: 372, y: 292, w: 548, h: 88 }], thumbS: .4, thumbDx: 60, textDx: 112,
      readyY: 0, noteY: 404,
    };
  const { viewer, face, budget } = L;
  const track = { x: budget.x + 20, y: budget.y + (compact ? 58 : 60), w: budget.w - 40, h: 10 };
  const tx = (share: number) => track.x + track.w * share;

  const slot = (i: number) => {
    const card = L.slots[i]!;
    const f = FACES[i]!;
    const act_ = ACT[i]!;
    const landed = frame >= act_.land;
    const land = pop(frame, act_.land);
    const mx = card.x + L.thumbDx;
    const my = card.y + card.h / 2;
    return <g key={i}>
      <g {...enter(frame, 12 + i * 6, { distance: 8 })}>
        <Box x={card.x} y={card.y} w={card.w} h={card.h} tone={landed ? "ok" : "muted"} variant={landed ? "card" : "ghost"} radius={14} fill={landed ? .8 * (1 - ease(frame, act_.land + 4, act_.land + 30)) : 0}>
          {!landed ? <path d={HEAD} transform={`translate(${mx} ${my}) scale(${L.thumbS * f.sx} ${L.thumbS * f.sy})`} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" /> : null}
          <Text x={card.x + L.textDx} y={card.y + card.h / 2 - (compact ? 26 : 12)} size={compact ? 15 : 17} weight={600} tone={landed ? "ink" : "muted"}>{c.customer(i + 1)}</Text>
          <Text x={card.x + L.textDx} y={card.y + card.h / 2 + (compact ? -4 : 12)} size={12.5} font="mono" weight={500} tone="muted">{landed ? c.specific : compact ? c.waitingShort : c.waiting}</Text>
        </Box>
      </g>
      {landed ? <Head cx={mx} cy={my} s={L.thumbS} sx={f.sx} sy={f.sy} scan={1} mesh={1} /> : null}
      <Tag x={compact ? card.x + L.textDx : card.x + card.w - 18} y={compact ? card.y + card.h / 2 + 26 : card.y + card.h / 2} anchor={compact ? "start" : "end"} text="< 1 s ✓" tone="ok" size={12.5} appear={land} />
      {landed && frame < act_.land + 40 ? <Pulse x={mx} y={my} frame={frame} at={act_.land} period={40} r={24} tone="ok" /> : null}
    </g>;
  };

  // The finished mesh is filed: it flies from the viewer into its customer slot.
  const flights = ACT.map((act_, i) => {
    if (frame < act_.fly || frame >= act_.land) return null;
    const card = L.slots[i]!;
    const f = FACES[i]!;
    const t = ease(frame, act_.fly, act_.land);
    const to: Pt = [card.x + L.thumbDx, card.y + card.h / 2];
    const from: Pt = [face.cx, face.cy];
    const control: Pt = compact ? [lerp(from[0], to[0], .5), Math.min(from[1], to[1]) - 20] : [lerp(from[0], to[0], .55), i === 0 ? to[1] - 30 : to[1] + 40];
    const [x, y] = bezier(from, control, to, t);
    const s = lerp(face.s, L.thumbS, t);
    return <g key={i} opacity={Math.min(1, t * 5)}>
      <Head cx={x} cy={y} s={s} sx={f.sx} sy={f.sy} scan={1} mesh={1} />
    </g>;
  });

  return <g>
    {/* Viewer */}
    <g {...enter(frame, 0)}>
      <Box x={viewer.x} y={viewer.y} w={viewer.w} h={viewer.h} tone="line" radius={18}>
        <Text x={viewer.x + 18} y={viewer.y + 24} size={11} font="mono" weight={600} tone="muted" caps>{c.viewer}</Text>
      </Box>
    </g>
    <g opacity={easeOut(frame, 2, 18)}>
      <Head cx={face.cx} cy={face.cy} s={face.s} sx={sx} sy={sy} scan={scan} mesh={mesh} detail={detail} />
    </g>

    {/* One-second budget */}
    <g {...enter(frame, 6, { from: "right", distance: 18 })}>
      <Box x={budget.x} y={budget.y} w={budget.w} h={budget.h} tone="line" radius={16}>
        <Text x={budget.x + 20} y={budget.y + 24} size={11} font="mono" weight={600} tone="muted" caps>{c.budget}</Text>
        <rect x={track.x} y={track.y} width={track.w} height={track.h} rx={track.h / 2} style={{ fill: tint("ink", 9) }} />
        <g opacity={trackIn}>
          {SPLIT.map((end, i) => {
            const start = i === 0 ? 0 : SPLIT[i - 1]!;
            const width = Math.max(0, Math.min(fill, end) - start) * track.w;
            if (width <= 0) return null;
            return <rect key={i} x={tx(start) + (i === 0 ? 0 : 1)} y={track.y} width={Math.max(track.h, width - (i === 0 ? 0 : 1))} height={track.h} rx={track.h / 2} fill={done ? TONE.ok : TONE.line} opacity={.55 + .15 * i} />;
          })}
          {fill > 0 && !done ? <circle className="scene-glow" cx={tx(fill)} cy={track.y + track.h / 2} r={6} fill={TONE.line} style={{ color: TONE.line }} /> : null}
          {c.stages.map((stage, i) => {
            const reached = stageIndex >= i && fill > 0;
            const centre = tx(((i === 0 ? 0 : SPLIT[i - 1]!) + SPLIT[i]!) / 2);
            return <g key={stage} opacity={reached ? 1 : .35}>
              {i > 0 ? <line x1={tx(SPLIT[i - 1]!)} x2={tx(SPLIT[i - 1]!)} y1={track.y - 4} y2={track.y + track.h + 4} stroke="var(--scene-hairline)" strokeWidth={1} /> : null}
              <Text x={centre} y={track.y + track.h + 18} size={12} font="mono" weight={600} tone={stageIndex === i && !done ? "line" : done ? "ok" : "muted"} anchor="middle">{stage}</Text>
            </g>;
          })}
        </g>
        <line x1={tx(1)} x2={tx(1)} y1={track.y - 10} y2={track.y + track.h + 10} stroke={TONE.hot} strokeWidth={1.5} />
        <Text x={tx(1)} y={budget.y + 24} size={12} font="mono" weight={600} tone="hot" anchor="end">1 s</Text>
        <Text x={track.x} y={track.y + track.h + 18} size={11} font="mono" weight={500} tone="muted">0</Text>
      </Box>
    </g>
    {compact
      ? <Tag x={270} y={L.readyY} text={c.ready} tone="ok" size={13} appear={readyIn} />
      : <Tag x={tx(SPLIT[2]) - 6} y={budget.y + 24} anchor="end" text={c.ready} tone="ok" size={12} appear={readyIn} />}

    {/* One mesh per customer: geometry differs, the budget holds. */}
    {[0, 1].map(slot)}
    {flights}
    <g {...enter(frame, ACT[1].land + 12, { distance: 8 })}>
      <Text x={compact ? 270 : 646} y={L.noteY} size={13} font="mono" weight={600} tone="ok" anchor="middle">{c.note}</Text>
    </g>
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "A mesh in under one second", fr: "Un mesh en moins d’une seconde" },
  caption: {
    en: "Polymagine, 2017: from facial biometrics to a customer-specific 3D mesh in under one second.",
    fr: "Polymagine, 2017 : de la biométrie faciale à un mesh 3D personnalisé en moins d’une seconde.",
  },
  beats: [
    { at: 0, text: { en: "A facial scan captures precise biometric information: no guessing.", fr: "Un scan facial capture des mesures biométriques précises : rien d’approximatif." } },
    { at: ACT[0].mesh, text: { en: "From those biometrics, a 3D mesh of this face is generated against a one-second budget.", fr: "À partir de ces données biométriques, un mesh 3D de ce visage est généré dans un budget d’une seconde." } },
    { at: ACT[0].done, text: { en: "The mesh is ready before the one-second mark: fast enough to feel instantaneous.", fr: "Le mesh est prêt avant la barre de la seconde : assez vite pour paraître instantané." } },
    { at: T.morph, text: { en: "Another customer, another face: the same pipeline builds a different mesh, still in under one second.", fr: "Autre client, autre visage : la même chaîne produit un autre mesh, toujours en moins d’une seconde." } },
  ],
  Stage,
});
