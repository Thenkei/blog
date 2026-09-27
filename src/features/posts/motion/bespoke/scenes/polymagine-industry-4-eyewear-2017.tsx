import { useId } from "react";
import { Box, Checkpoint, Comet, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). The viewer on the left shows the one face the whole chain
// works for: scan, mesh, a glasses template stretched to that morphology, the
// AR/VR fit check before any material is cut, then the digital model travels
// to production. The step list closes into a loop once the model reaches the floor.
const T = {
  scan: 8,
  scanEnd: 54,
  mesh: 58,
  meshEnd: 92,
  template: 100,
  stretch: 118,
  stretchEnd: 156,
  ar: 176,
  fit: 204,
  production: 250,
  land: 278,
  loop: 300,
  end: 480,
} as const;

const STEP_AT = [T.scan, T.mesh, T.template, T.ar, T.production] as const;
const STEP_DONE = [T.scanEnd, T.meshEnd, T.stretchEnd, T.fit, T.land] as const;

const COPY = {
  en: {
    viewer: "ONE CUSTOMER, ONE FACE",
    pipeline: "PIPELINE",
    steps: [
      ["Facial scan", "precise biometrics, no guessing"],
      ["3D mesh", "generated in under one second"],
      ["Parametric adaptation", "template → customer morphology"],
      ["AR / VR preview", "right scale and fit, before cutting"],
      ["Production", "the digital model drives the floor"],
    ],
    short: ["biometrics", "< 1 s", "fit", "before cutting", "floor"],
    template: "template",
    fitted: "fitted to morphology",
    ar: "AR PREVIEW",
    fitOk: "✓ scale · fit",
    loop: "closed loop · visibility for every stakeholder",
    loopShort: "closed loop",
  },
  fr: {
    viewer: "UN CLIENT, UN VISAGE",
    pipeline: "CHAÎNE",
    steps: [
      ["Scan facial", "mesures précises, rien d’approximatif"],
      ["Mesh 3D", "généré en moins d’une seconde"],
      ["Ajustement paramétrique", "gabarit → morphologie du client"],
      ["Aperçu AR / VR", "échelle et ajustement, avant découpe"],
      ["Fabrication", "le modèle numérique pilote l’atelier"],
    ],
    short: ["biométrie", "< 1 s", "ajusté", "avant découpe", "atelier"],
    template: "gabarit",
    fitted: "adapté à la morphologie",
    ar: "APERÇU AR",
    fitOk: "✓ échelle · ajustement",
    loop: "boucle fermée · visible de chaque partie prenante",
    loopShort: "boucle fermée",
  },
} as const;

// ─── The face: a low-poly head built on biometric landmarks ─────────────────
// Unit head (±70 × ±92). Landmarks feed both the scan and the mesh; triangles
// are derived from the edges so the mesh can be shaded like a real 3D surface.
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

function Head({ cx, cy, s, scan, mesh }: { cx: number; cy: number; s: number; scan: number; mesh: number }) {
  const id = useId().replaceAll(":", "");
  const p = ([x, y]: P2): [number, number] => [cx + x * s, cy + y * s];
  const scanY = lerp(-104, 104, scan);
  const scanning = scan > 0 && scan < 1;
  return <g>
    <defs>
      <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: TONE.hot, stopOpacity: 0 }} />
        <stop offset="1" style={{ stopColor: TONE.hot, stopOpacity: .22 }} />
      </linearGradient>
    </defs>
    <path d={HEAD} transform={`translate(${cx} ${cy}) scale(${s})`} style={{ fill: tint("line", 6) }} stroke={TONE.line} strokeOpacity={.4} strokeWidth={1 / s} />
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
        <circle cx={px} cy={py} r={2.4 * Math.min(1, .4 + ripple * 3)} fill={TONE.line} />
      </g>;
    })}
    {scanning ? <g>
      <rect x={cx - 90 * s} y={cy + scanY * s - 26} width={180 * s} height={26} fill={`url(#${id}-beam)`} />
      <line className="scene-glow" x1={cx - 90 * s} x2={cx + 90 * s} y1={cy + scanY * s} y2={cy + scanY * s} stroke={TONE.hot} strokeWidth={1.5} style={{ color: TONE.hot }} />
    </g> : null}
  </g>;
}

/** Glasses frame; `fit` stretches the parametric template to the morphology. */
function Glasses({ cx, cy, s, fit, solid, tone }: { cx: number; cy: number; s: number; fit: number; solid: boolean; tone: Tone }) {
  const centre = lerp(20, 27, fit);
  const lensW = lerp(32, 40, fit);
  const lensH = 26;
  const temple = lerp(52, 69, fit);
  const x = (u: number) => cx + u * s;
  const y = cy - 12 * s;
  const stroke = { stroke: TONE[tone], strokeWidth: 1.75, strokeDasharray: solid ? undefined : "4 3", strokeLinecap: "round" as const, fill: "none" };
  return <g>
    {[-1, 1].map((side) => <rect key={side} x={x(side * centre - lensW / 2)} y={y - (lensH / 2) * s} width={lensW * s} height={lensH * s} rx={10 * s} style={{ fill: tint(tone, solid ? 16 : 8) }} {...stroke} />)}
    <path d={`M${x(-centre + lensW / 2)} ${y}Q${cx} ${y - 8 * s} ${x(centre - lensW / 2)} ${y}`} {...stroke} />
    <path d={`M${x(-centre - lensW / 2)} ${y - 4 * s}L${x(-temple)} ${y - 2 * s}M${x(centre + lensW / 2)} ${y - 4 * s}L${x(temple)} ${y - 2 * s}`} {...stroke} />
  </g>;
}

type Pt = readonly [number, number];
const bezier = (p0: Pt, p1: Pt, p2: Pt, t: number): [number, number] => [
  (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
  (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
];

function Stage({ frame, compact, locale }: SceneStageProps) {
  const c = COPY[locale];
  const viewer = compact ? { x: 20, y: 52, w: 500, h: 236 } : { x: 40, y: 60, w: 330, h: 330 };
  const face = compact ? { cx: 270, cy: 176, s: .86 } : { cx: viewer.x + viewer.w / 2, cy: 226, s: 1.16 };
  const panel = compact ? { x: 20, y: 300, w: 500, h: 208 } : { x: 400, y: 60, w: 520, h: 330 };
  const rowY = (i: number) => compact ? panel.y + 42 + i * 35 : panel.y + 64 + i * 56;
  const rowH = compact ? 32 : 48;
  const checkX = panel.x + (compact ? 24 : 30);

  const templateIn = easeOut(frame, T.template, T.template + 16);
  const fit = ease(frame, T.stretch, T.stretchEnd);
  const arOn = frame >= T.ar;
  const fitOk = frame >= T.fit;
  const arIn = easeOut(frame, T.ar, T.ar + 18);
  const loopIn = ease(frame, T.loop, T.loop + 30);
  const current = STEP_AT.reduce((index, at, i) => frame >= at ? i : index, -1);

  // The digital model leaves the viewer and lands on the Production step.
  const flight = ease(frame, T.production, T.land);
  const flying = frame >= T.production && frame < T.land;
  const from: Pt = [face.cx, face.cy - 12 * face.s];
  const to: Pt = [checkX, rowY(4)];
  const control: Pt = compact ? [lerp(from[0], to[0], .1), rowY(0) - 30] : [385, 372];
  const [gx, gy] = bezier(from, control, to, flight);
  const gs = lerp(face.s, compact ? .34 : .4, flight);

  // Closed loop: data flows from the floor back to the scan, along the panel's right edge.
  const loopX = panel.x + panel.w - (compact ? 14 : 18);
  const loopTop = rowY(0);
  const loopBottom = rowY(4);
  const loopPts: Pt[] = [[loopX - 20, loopBottom], [loopX, loopBottom - 10], [loopX, loopTop + 10], [loopX - 20, loopTop]];
  const loopD = `M${loopX - 20} ${loopBottom}Q${loopX} ${loopBottom} ${loopX} ${loopBottom - 20}V${loopTop + 20}Q${loopX} ${loopTop} ${loopX - 20} ${loopTop}`;
  const lap = (offset: number) => ((((frame - T.loop - 30) / 64 + offset) % 1) + 1) % 1;

  return <g>
    {/* Viewer */}
    <g {...enter(frame, 0)}>
      <Box x={viewer.x} y={viewer.y} w={viewer.w} h={viewer.h} tone={arOn ? "hot" : "line"} radius={18} focus={arIn * (1 - ease(frame, T.fit + 10, T.fit + 40)) * .7}>
        <Text x={viewer.x + 18} y={viewer.y + 24} size={11} font="mono" weight={600} tone={arOn ? "hot" : "muted"} caps>{arOn ? c.ar : c.viewer}</Text>
      </Box>
    </g>
    <g opacity={easeOut(frame, 2, 18)}>
      <Head cx={face.cx} cy={face.cy} s={face.s} scan={ease(frame, T.scan, T.scanEnd, (t) => t)} mesh={ease(frame, T.mesh, T.meshEnd)} />
    </g>
    {templateIn > 0 ? <g opacity={templateIn} transform={`translate(0 ${(1 - templateIn) * -10})`}>
      <Glasses cx={face.cx} cy={face.cy} s={face.s} fit={fit} solid={arOn} tone={fitOk ? "ok" : arOn ? "hot" : "line"} />
    </g> : null}
    {/* Parametric dimension: the template's width grows to the head. */}
    <g opacity={templateIn * (1 - ease(frame, T.ar - 6, T.ar + 6))}>
      {(() => {
        const half = lerp(52, 69, fit) * face.s;
        const y = face.cy - 44 * face.s;
        return <g stroke={TONE.hot} strokeWidth={1} strokeOpacity={.8}>
          <line x1={face.cx - half} x2={face.cx + half} y1={y} y2={y} />
          <line x1={face.cx - half} x2={face.cx - half} y1={y - 5} y2={y + 5} />
          <line x1={face.cx + half} x2={face.cx + half} y1={y - 5} y2={y + 5} />
        </g>;
      })()}
    </g>
    <Tag
      x={compact ? viewer.x + viewer.w - 16 : face.cx} y={compact ? viewer.y + 24 : viewer.y + viewer.h - 24} anchor={compact ? "end" : "middle"}
      text={fitOk ? c.fitOk : fit > .98 ? c.fitted : c.template}
      tone={fitOk ? "ok" : "hot"} appear={templateIn} size={12}
    />
    {/* AR viewfinder: the customer's own head, at scale. */}
    <g opacity={arIn} stroke={TONE.hot} strokeWidth={1.5} fill="none" strokeLinecap="round">
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => {
        const reach = lerp(1.1, 1, arIn);
        const bx = face.cx + sx! * (compact ? 92 : 104) * face.s * reach;
        const by = face.cy + sy! * 104 * face.s * reach;
        return <path key={`${sx}${sy}`} d={`M${bx} ${by - sy! * 14}L${bx} ${by}L${bx - sx! * 14} ${by}`} />;
      })}
    </g>

    {/* The chain, one checkpoint per step. */}
    <g {...enter(frame, 4, { from: "right", distance: 18 })}>
      <Box x={panel.x} y={panel.y} w={panel.w} h={panel.h} tone="line" radius={18}>
        <Text x={panel.x + 18} y={panel.y + (compact ? 20 : 26)} size={11} font="mono" weight={600} tone="muted" caps>{c.pipeline}</Text>
      </Box>
    </g>
    <Tag x={panel.x + panel.w - 16} y={panel.y + (compact ? 20 : 26)} anchor="end" text={compact ? c.loopShort : c.loop} tone="ok" size={11} appear={pop(frame, T.loop + 24)} />
    {c.steps.map(([main, sub], i) => {
      const y = rowY(i);
      const at = STEP_AT[i]!;
      const done = frame >= STEP_DONE[i]!;
      const active = current === i && !done;
      const isGate = i === 3;
      const band = active ? ease(frame, at, at + 10) : done && frame < STEP_DONE[i]! + 20 ? 1 - ease(frame, STEP_DONE[i]!, STEP_DONE[i]! + 20) : 0;
      const bandTone: Tone = done ? "ok" : isGate ? "hot" : "line";
      const reveal = easeOut(frame, stagger(i, 10, 5), stagger(i, 28, 5));
      const lit = frame >= at ? 1 : .45;
      return <g key={main} opacity={reveal}>
        {i > 0 ? <line x1={panel.x + 18} x2={panel.x + panel.w - (compact ? 40 : 50)} y1={y - (compact ? 17.5 : 28)} y2={y - (compact ? 17.5 : 28)} stroke="var(--scene-hairline)" strokeOpacity={.55} strokeWidth={1} /> : null}
        <rect x={panel.x + 10} y={y - rowH / 2} width={panel.w - (compact ? 44 : 54)} height={rowH} rx={10} style={{ fill: tint(bandTone, 12 * band) }} />
        <g opacity={lit}>
          <Checkpoint x={checkX} y={y} r={compact ? 10 : 12} state={done ? "pass" : "pending"} />
          {compact
            ? <>
              <Text x={checkX + 22} y={y} size={14.5} weight={600}>{main}</Text>
              <Text x={panel.x + panel.w - 44} y={y} size={12} font="mono" weight={600} tone={isGate ? "hot" : done ? "ok" : "muted"} anchor="end">{c.short[i]}</Text>
            </>
            : <>
              <Text x={checkX + 26} y={y - 9} size={16} weight={600}>{main}</Text>
              <Text x={checkX + 26} y={y + 11} size={12.5} font="mono" weight={500} tone={isGate ? "hot" : "muted"}>{sub}</Text>
            </>}
        </g>
        {done && frame < STEP_DONE[i]! + 36 ? <Pulse x={checkX} y={y} frame={frame} at={STEP_DONE[i]} period={36} r={12} tone="ok" /> : null}
      </g>;
    })}

    {/* Closed loop. */}
    <path d={loopD} fill="none" stroke={TONE.ok} strokeWidth={1.5} strokeOpacity={.7} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - loopIn} strokeLinecap="round" />
    {loopIn >= 1 ? [0, .5].map((offset) => <Comet key={offset} points={loopPts} t={lap(offset)} tone="ok" r={4} tail={.18} />) : null}

    {/* The digital model in flight to the floor. */}
    {flying ? <g transform={`translate(${gx} ${gy}) scale(${gs / face.s}) translate(${-from[0]} ${-from[1]})`}>
      <rect className="scene-card" x={from[0] - 84 * face.s} y={from[1] - 26 * face.s} width={168 * face.s} height={52 * face.s} rx={14 * face.s} style={{ fill: "var(--scene-card)" }} opacity={Math.min(1, flight * 4)} />
      <Glasses cx={face.cx} cy={face.cy} s={face.s} fit={1} solid tone="ok" />
    </g> : null}
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "From one face to the floor", fr: "D’un visage à l’atelier" },
  caption: {
    en: "Scan, one-second mesh, parametric fit and AR/VR preview were one closed loop that fed production: Industry 4.0 as an integrated system, not an isolated demo.",
    fr: "Scan, mesh en une seconde, ajustement paramétrique et aperçu AR/VR formaient une boucle fermée reliée à la fabrication : l’industrie 4.0 comme système intégré, pas comme démo isolée.",
  },
  beats: [
    { at: 0, text: { en: "A facial scan captures precise biometrics, then a 3D mesh of this face is generated in under one second.", fr: "Un scan facial capture des mesures précises, puis un mesh 3D de ce visage est généré en moins d’une seconde." } },
    { at: T.template, text: { en: "Parametric adaptation: the glasses template is adjusted strictly to the customer’s morphology.", fr: "Ajustement paramétrique : le gabarit de la monture est adapté strictement à la morphologie du client." } },
    { at: T.ar, text: { en: "AR/VR preview: the customer sees the mount on their own head, at scale, before any acetate or metal is cut.", fr: "Aperçu AR/VR : le client voit la monture sur sa tête, à la bonne échelle, avant toute découpe de matière." } },
    { at: T.production, text: { en: "The digital model directly informs physical production.", fr: "Le design numérique alimente directement la fabrication physique." } },
    { at: T.loop, text: { en: "From scan to manufacturing floor, data flows in a closed loop, visible to every stakeholder.", fr: "Du scan à la production, la donnée circule en boucle fermée, visible pour toutes les parties prenantes." } },
  ],
  Stage,
});
