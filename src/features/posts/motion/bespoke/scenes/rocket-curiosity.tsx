import { useId } from "react";
import { Camera, Comet, ease, easeOut, hash, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// One observer on the horizon, two directions, one method. Above: points of
// light, then a few stable points, then the relations between them. Below:
// forces out of view leave traces in the landscape, and the same method (stable
// points, relations) reconstructs how the system works: the two drawings rhyme.
// The last beat returns both sight lines to the observer: the place we occupy here.

const T = {
  up: 20,
  stable: 80,
  relations: 120,
  down: 180,
  traces: 232,
  rebuild: 282,
  converge: 350,
  end: 480,
} as const;

type Pt = readonly [number, number];

type Layout = {
  horizon: number; left: number; right: number; observer: Pt;
  stars: readonly Pt[]; links: readonly (readonly [number, number])[];
  field: { x0: number; x1: number; y0: number; y1: number; count: number };
  volcano: { x: number; half: number; rim: number; height: number };
  chamber: { cx: number; cy: number; rx: number; ry: number };
  strata: readonly number[];
  rail: "vertical" | "horizontal"; skyRail: Pt; groundRail: Pt;
  skyEyebrow: Pt; groundEyebrow: Pt; here: Pt; same: Pt;
};

const WIDE_L: Layout = {
  horizon: 236, left: 24, right: 936, observer: [476, 236],
  stars: [[252, 152], [304, 100], [366, 128], [424, 78], [490, 110], [534, 164]],
  links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 5]],
  field: { x0: 220, x1: 936, y0: 54, y1: 222, count: 64 },
  volcano: { x: 760, half: 156, rim: 22, height: 76 },
  chamber: { cx: 760, cy: 360, rx: 96, ry: 26 },
  strata: [268, 300, 336, 388],
  rail: "vertical", skyRail: [44, 102], groundRail: [44, 300],
  skyEyebrow: [36, 72], groundEyebrow: [36, 270], here: [476, 212], same: [476, 272],
};

const COMPACT_L: Layout = {
  horizon: 258, left: 0, right: 540, observer: [236, 258],
  stars: [[54, 190], [102, 134], [158, 162], [212, 104], [264, 140], [300, 196]],
  links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 5]],
  field: { x0: 16, x1: 524, y0: 92, y1: 244, count: 50 },
  volcano: { x: 432, half: 100, rim: 16, height: 58 },
  chamber: { cx: 432, cy: 420, rx: 76, ry: 22 },
  strata: [290, 326, 364, 452],
  rail: "horizontal", skyRail: [24, 70], groundRail: [24, 498],
  skyEyebrow: [20, 242], groundEyebrow: [20, 276], here: [236, 234], same: [236, 290],
};

function copy(fr: boolean) {
  return {
    sky: fr ? ["observer", "points stables", "relations"] : ["observe", "stable points", "relations"],
    ground: fr ? ["forces hors de vue", "traces", "reconstruire"] : ["forces out of view", "traces", "reconstruct"],
    skyLabel: fr ? "au-dessus de nous" : "far above",
    groundLabel: fr ? "sous nos pieds" : "beneath our feet",
    here: fr ? "ici" : "here",
    same: fr ? "une même curiosité" : "one curiosity",
  };
}

/** A method as three steps: dots light up as the scene reaches each one. */
function Rail({ items, origin, orientation, active, tone }: {
  items: readonly string[]; origin: Pt; orientation: "vertical" | "horizontal"; active: readonly number[]; tone: Tone;
}) {
  const positions: readonly Pt[] = orientation === "vertical"
    ? items.map((_, index) => [origin[0], origin[1] + index * 32] as const)
    : items.map((_, index) => [origin[0] + items.slice(0, index).reduce((sum, item) => sum + item.length * 7.8 + 34, 0), origin[1]] as const);
  return <g>
    {orientation === "vertical"
      ? <line x1={origin[0]} x2={origin[0]} y1={origin[1]} y2={positions.at(-1)![1]} stroke="var(--scene-hairline)" strokeWidth={1} />
      : null}
    {items.map((item, index) => {
      const on = Math.min(1, active[index] ?? 0);
      const [x, y] = positions[index]!;
      return <g key={item}>
        <circle cx={x} cy={y} r={5} style={{ fill: "var(--scene-card)" }} stroke={on > .5 ? TONE[tone] : "var(--scene-hairline)"} strokeWidth={1.25} />
        <circle cx={x} cy={y} r={2.6 * on} fill={TONE[tone]} />
        <Text x={x + 14} y={y} size={13} weight={on > .5 ? 600 : 500} font="mono" tone={on > .5 ? "ink" : "muted"} opacity={.5 + .5 * on}>{item}</Text>
      </g>;
    })}
  </g>;
}

/** A stable point: the same mark above and below the horizon. */
function Anchor({ x, y, appear, tone = "line", core = "ink" }: { x: number; y: number; appear: number; tone?: Tone; core?: Tone }) {
  if (appear <= 0) return null;
  const s = Math.min(1.15, appear);
  return <g opacity={Math.min(1, appear)}>
    <circle cx={x} cy={y} r={11 * s} style={{ fill: tint(tone, 12) }} />
    <circle cx={x} cy={y} r={8 * s} fill="none" stroke={TONE[tone]} strokeWidth={1.25} />
    <circle cx={x} cy={y} r={2.8} fill={TONE[core]} />
  </g>;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const c = copy(fr);
  const uid = useId().replaceAll(":", "");
  const L = compact ? COMPACT_L : WIDE_L;
  const [ox, oy] = L.observer;
  const { horizon: H } = L;
  const V = L.volcano;
  const K = L.chamber;

  const intro = easeOut(frame, 0, 26);
  const upLine = easeOut(frame, T.up, T.up + 30);
  const downLine = easeOut(frame, T.down, T.down + 30);
  const stable = (index: number) => pop(frame, stagger(index, T.stable, 7), 170);
  const link = (index: number) => easeOut(frame, stagger(index, T.relations, 8), stagger(index, T.relations, 8) + 20);
  const rise = easeOut(frame, T.down - 6, T.down + 30);
  const traces = easeOut(frame, T.traces, T.traces + 36);
  const converge = ease(frame, T.converge, T.converge + 26);
  const reach = ease(frame, T.converge + 10, T.converge + 40);

  // Volcano silhouette with concave flanks; it rises out of the horizon.
  const peak = H - V.height * rise;
  const volcanoPath = `M${V.x - V.half} ${H}Q${V.x - V.half * .38} ${H - 6} ${V.x - V.rim} ${peak}L${V.x + V.rim} ${peak}Q${V.x + V.half * .38} ${H - 6} ${V.x + V.half} ${H}Z`;
  const vent: Pt = [V.x, peak + 2];
  // The lava flow runs down the right flank, just inside its edge.
  const flank = (t: number): Pt => {
    const p0: Pt = [V.x + V.rim, peak];
    const p1: Pt = [V.x + V.half * .38, H - 6];
    const p2: Pt = [V.x + V.half, H];
    return [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];
  };
  const flowPoints: Pt[] = Array.from({ length: 14 }, (_, index) => {
    const [x, y] = flank(index / 13 * .72);
    return [x - 3 - index * .2, y + 3 + Math.sin(index * 1.3) * .8] as const;
  });
  const flowEnd = flowPoints.at(-1)!;
  const flowD = flowPoints.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");

  const groundAnchors: readonly Pt[] = [[K.cx, K.cy], [V.x, lerp(K.cy - K.ry, H, .55)], [V.x, H - V.height + 2], flowEnd];
  const skyCentre: Pt = [L.stars.reduce((sum, [x]) => sum + x, 0) / L.stars.length, L.stars.reduce((sum, [, y]) => sum + y, 0) / L.stars.length];
  const groundTarget: Pt = [K.cx - K.rx * .62, K.cy - K.ry * .5];

  const field = Array.from({ length: L.field.count }, (_, index) => ({
    x: L.field.x0 + hash(index + 1) * (L.field.x1 - L.field.x0),
    y: L.field.y0 + hash(index + 101) ** 1.3 * (L.field.y1 - L.field.y0),
    r: .7 + hash(index + 201) * 1.3,
    phase: hash(index + 301) * 6.28,
  })).filter(({ x, y }) => (y < H - V.height - 20 || Math.abs(x - V.x) > V.half)
    && L.stars.every(([sx, sy]) => Math.hypot(sx - x, sy - y) > 20)
    && !(compact ? y < 84 : x < 216 || (x > ox - 40 && x < ox + 40 && y > H - 40)));

  const strata = (y: number, index: number) => Array.from({ length: 33 }, (_, step) => {
    const x = L.left + (step / 32) * (L.right - L.left);
    // Layers bow upward over the chamber: pressure from below, a trace.
    const bulge = Math.exp(-(((x - K.cx) / (compact ? 96 : 140)) ** 2)) * (4 + (8 + index * 3) * traces);
    return `${step === 0 ? "M" : "L"}${x.toFixed(1)} ${(y - bulge + Math.sin(step * .7 + index * 1.3) * 2.2).toFixed(1)}`;
  }).join("");

  const breathe = 1 + .06 * Math.sin(frame / 16);
  const conduit: Pt[] = [[V.x, K.cy - K.ry + 2], [V.x, peak + 4]];

  const skyActive = [upLine, stable(L.stars.length - 1), link(L.links.length - 1)];
  const groundActive = [rise, traces, easeOut(frame, T.rebuild + 30, T.rebuild + 50)];

  const lean = (point: Pt): Pt => [lerp(width / 2, point[0], .3), lerp(height / 2, point[1], .3)];
  const camera = compact ? [{ at: 0 }] : [
    { at: 0, zoom: 1.03, focus: lean(skyCentre) },
    { at: T.down - 20, dur: 70, zoom: 1.025, focus: lean([V.x, (H + K.cy) / 2]) },
    { at: T.converge - 10, dur: 70, zoom: 1 },
  ];

  const sightTone: Tone = converge > .5 ? "hot" : "muted";
  const sight = (to: Pt, draw: number) => {
    const end: Pt = [lerp(ox, to[0], draw), lerp(oy, to[1], draw)];
    return <line x1={ox} y1={oy} x2={end[0]} y2={end[1]} stroke={converge > .5 ? TONE.hot : "var(--scene-hairline)"} strokeWidth={converge > .5 ? 1.5 : 1.25} strokeDasharray="3 6" strokeLinecap="round" />;
  };

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    <defs>
      <linearGradient id={`${uid}-ground`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: TONE.ink, stopOpacity: .07 }} />
        <stop offset="1" style={{ stopColor: TONE.ink, stopOpacity: .01 }} />
      </linearGradient>
      <linearGradient id={`${uid}-horizon`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" style={{ stopColor: TONE.ink, stopOpacity: 0 }} />
        <stop offset=".2" style={{ stopColor: TONE.ink, stopOpacity: .5 }} />
        <stop offset=".8" style={{ stopColor: TONE.ink, stopOpacity: .5 }} />
        <stop offset="1" style={{ stopColor: TONE.ink, stopOpacity: 0 }} />
      </linearGradient>
      <linearGradient id={`${uid}-cone`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: "var(--scene-card)", stopOpacity: 1 }} />
        <stop offset="1" style={{ stopColor: "var(--scene-card)", stopOpacity: .55 }} />
      </linearGradient>
      <radialGradient id={`${uid}-magma`} cx=".5" cy=".5" r=".5">
        <stop offset="0" style={{ stopColor: TONE.danger, stopOpacity: .55 }} />
        <stop offset=".6" style={{ stopColor: TONE.danger, stopOpacity: .18 }} />
        <stop offset="1" style={{ stopColor: TONE.danger, stopOpacity: 0 }} />
      </radialGradient>
      <radialGradient id={`${uid}-milky`} cx=".5" cy=".5" r=".5">
        <stop offset="0" style={{ stopColor: "var(--accent-tertiary)", stopOpacity: .12 }} />
        <stop offset="1" style={{ stopColor: "var(--accent-tertiary)", stopOpacity: 0 }} />
      </radialGradient>
    </defs>

    {/* Rocket flourish: a faint galactic band across the sky. */}
    <g className="scene-only-rocket" opacity={easeOut(frame, T.up, T.up + 60)}>
      <ellipse cx={width * .5} cy={H * .42} rx={width * .46} ry={H * .16} fill={`url(#${uid}-milky)`} transform={`rotate(-9 ${width * .5} ${H * .42})`} />
    </g>

    {/* Ground: a quiet section of the crust, layered. */}
    <rect x={0} y={H} width={width} height={height - H} fill={`url(#${uid}-ground)`} opacity={intro} />
    <g opacity={easeOut(frame, 10, 40)}>
      {L.strata.map((y, index) => <path key={y} d={strata(y, index)} fill="none" stroke="var(--scene-hairline)" strokeOpacity={.7 - index * .12} strokeWidth={1} />)}
    </g>

    {/* Magma chamber and conduit: forces out of view. */}
    <g opacity={rise}>
      <ellipse cx={K.cx} cy={K.cy} rx={K.rx * 1.35 * breathe} ry={K.ry * 2 * breathe} fill={`url(#${uid}-magma)`} />
      <ellipse cx={K.cx} cy={K.cy} rx={K.rx} ry={K.ry} fill="none" stroke={TONE.danger} strokeOpacity={.45} strokeWidth={1} />
      <line x1={V.x} x2={V.x} y1={K.cy - K.ry} y2={peak + 4} stroke={TONE.danger} strokeOpacity={.4} strokeWidth={1.25} />
    </g>
    {frame >= T.down + 6 ? [0, 1, 2].map((index) => {
      const cycle = 46;
      const local = (frame - T.down - 6 - index * 15);
      const t = local < 0 ? 0 : (local % cycle) / cycle;
      return <Comet key={index} points={conduit} t={t} tone="danger" r={2.6} tail={.22} opacity={.9} />;
    }) : null}

    {/* The volcano rises out of the horizon; the landscape keeps its traces. */}
    <g className="scene-only-mountain" opacity={rise * .8}>
      {[1, 2, 3].map((ring) => <path key={ring} d={`M${V.x - V.half - ring * 22} ${H}Q${V.x - V.half * .38 - ring * 12} ${H - 6} ${V.x - V.rim - ring * 10} ${peak - ring * 9}L${V.x + V.rim + ring * 10} ${peak - ring * 9}Q${V.x + V.half * .38 + ring * 12} ${H - 6} ${V.x + V.half + ring * 22} ${H}`} fill="none" stroke="var(--scene-hairline)" strokeOpacity={.55 - ring * .12} strokeWidth={1} />)}
    </g>
    {rise > 0 ? <path className="scene-card" d={volcanoPath} fill={`url(#${uid}-cone)`} /> : null}
    {rise > 0 ? <path d={volcanoPath} fill="none" stroke="var(--scene-hairline)" strokeWidth={1.25} strokeLinejoin="round" /> : null}
    {traces > 0 ? <path className="scene-glow" d={flowD} fill="none" stroke={TONE.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - traces} style={{ color: TONE.danger }} /> : null}
    {/* A plume of ash drifting off the vent. */}
    {frame >= T.traces ? Array.from({ length: 6 }, (_, index) => {
      const period = 90;
      const t = ((frame - T.traces + index * 15) % period) / period;
      const x = vent[0] + t * (compact ? 26 : 40) + Math.sin(t * 5 + index) * 3;
      const y = vent[1] - 6 - t * (compact ? 44 : 60);
      return <circle key={index} cx={x} cy={y} r={3 + t * 7} style={{ fill: tint("muted", 30) }} opacity={(1 - t) * .7 * traces} />;
    }) : null}

    {/* Horizon and sky. */}
    <line x1={lerp(ox, L.left, intro)} x2={lerp(ox, L.right, intro)} y1={H} y2={H} stroke={`url(#${uid}-horizon)`} strokeWidth={1.25} />
    {field.map((star, index) => {
      const born = easeOut(frame, T.up + 4 + index * .7, T.up + 24 + index * .7);
      return born > 0 ? <circle key={index} cx={star.x} cy={star.y} r={star.r} style={{ fill: "var(--scene-ink)" }} opacity={born * (.28 + .22 * Math.sin(frame / 17 + star.phase)) * (1 - .3 * ease(frame, T.stable, T.stable + 30))} /> : null;
    })}

    {/* Above: the stable points, then their relations. */}
    {L.links.map(([a, b], index) => {
      const from = L.stars[a]!;
      const to = L.stars[b]!;
      const t = link(index);
      return t > 0 ? <line key={index} x1={from[0]} y1={from[1]} x2={lerp(from[0], to[0], t)} y2={lerp(from[1], to[1], t)} stroke={TONE.line} strokeWidth={1.25} strokeOpacity={.85} /> : null;
    })}
    {L.stars.map(([x, y], index) => {
      const born = easeOut(frame, T.up + 8 + index * 3, T.up + 30 + index * 3);
      return <g key={index}>
        <circle cx={x} cy={y} r={1.8} style={{ fill: "var(--scene-ink)" }} opacity={born * .8} />
        <Anchor x={x} y={y} appear={stable(index)} />
      </g>;
    })}

    {/* Below: the same method rebuilds the system from its traces. */}
    {groundAnchors.slice(1).map((to, index) => {
      const from = groundAnchors[index]!;
      const t = easeOut(frame, stagger(index, T.rebuild + 22, 9), stagger(index, T.rebuild + 22, 9) + 20);
      return t > 0 ? <line key={index} x1={from[0]} y1={from[1]} x2={lerp(from[0], to[0], t)} y2={lerp(from[1], to[1], t)} stroke={TONE.line} strokeWidth={1.25} strokeOpacity={.85} /> : null;
    })}
    {groundAnchors.map(([x, y], index) => <Anchor key={index} x={x} y={y} appear={pop(frame, stagger(index, T.rebuild, 7), 170)} core="danger" />)}

    {/* Sight lines from the observer, and the observer itself. */}
    {sight(skyCentre, upLine)}
    {sight(groundTarget, downLine)}
    <g opacity={intro}>
      <circle cx={ox} cy={oy} r={14 + 4 * converge} style={{ fill: tint(converge > .5 ? "hot" : "ink", 10 + 8 * converge) }} />
      <circle className={converge > .5 ? "scene-glow" : undefined} cx={ox} cy={oy} r={6.5} style={{ fill: "var(--scene-card)", color: TONE.hot }} stroke={converge > .5 ? TONE.hot : TONE.ink} strokeWidth={2} />
      <circle cx={ox} cy={oy} r={2.6} fill={converge > .5 ? TONE.hot : TONE.ink} />
      <Text x={L.here[0]} y={L.here[1]} size={15} weight={600} anchor="middle" tone={sightTone === "hot" ? "hot" : "ink"}>{c.here}</Text>
    </g>
    {frame >= T.converge + 10 ? <Pulse x={ox} y={oy} frame={frame} at={T.converge + 10} period={60} r={14} tone="hot" /> : null}
    {/* The two sight lines return to the observer: the attention comes home. */}
    <Comet points={[skyCentre, [ox, oy]]} t={reach} tone="hot" r={4} tail={.35} />
    <Comet points={[groundTarget, [ox, oy]]} t={reach} tone="hot" r={4} tail={.35} />
    <Tag x={L.same[0]} y={L.same[1]} text={c.same} tone="hot" appear={pop(frame, T.converge + 34)} />

    {/* The method, named once per direction. */}
    <g opacity={easeOut(frame, T.up, T.up + 20)}>
      {L.rail === "vertical" ? <Text x={L.skyEyebrow[0]} y={L.skyEyebrow[1]} size={11} weight={600} font="mono" tone="muted" caps>{c.skyLabel}</Text> : null}
      <Rail items={c.sky} origin={L.skyRail} orientation={L.rail} active={skyActive} tone="line" />
    </g>
    <g opacity={easeOut(frame, T.down, T.down + 20)}>
      {L.rail === "vertical" ? <Text x={L.groundEyebrow[0]} y={L.groundEyebrow[1]} size={11} weight={600} font="mono" tone="muted" caps>{c.groundLabel}</Text> : null}
      <Rail items={c.ground} origin={L.groundRail} orientation={L.rail} active={groundActive} tone="danger" />
    </g>
    {L.rail === "horizontal" ? <>
      <g opacity={easeOut(frame, T.up, T.up + 20)}><Text x={L.skyEyebrow[0]} y={L.skyEyebrow[1]} size={11} weight={600} font="mono" tone="muted" caps>{c.skyLabel}</Text></g>
      <g opacity={easeOut(frame, T.down, T.down + 20)}><Text x={L.groundEyebrow[0]} y={L.groundEyebrow[1]} size={11} weight={600} font="mono" tone="muted" caps>{c.groundLabel}</Text></g>
    </> : null}
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 1,
  title: { en: "Two directions, one curiosity", fr: "Deux directions, une curiosité" },
  caption: {
    en: "Looking up and looking beneath our feet are two directions of the same desire to understand.",
    fr: "Lever les yeux et regarder sous nos pieds sont deux directions d’une même envie de comprendre.",
  },
  beats: [
    { at: 0, text: { en: "Two directions have always drawn me in: far above us, and deep beneath our feet.", fr: "Deux directions m’ont toujours attiré : très loin au-dessus de nous, et très profondément sous nos pieds." } },
    { at: T.up + 10, text: { en: "Looking up: at first, there are only points of light.", fr: "Lever les yeux : au départ, il n’y a que des points lumineux." } },
    { at: T.stable, text: { en: "Then you pick out a few stable points and understand the relationships between them.", fr: "Puis on identifie quelques points stables et on comprend les relations entre eux." } },
    { at: T.down, text: { en: "Looking down: volcanoes expose forces that usually work out of view, and leave traces in the landscape.", fr: "Regarder sous nos pieds : les volcans montrent des forces hors de vue, et laissent des traces." } },
    { at: T.rebuild, text: { en: "The same work: from the traces, reconstruct how the system operates.", fr: "Le même travail : à partir des traces, reconstruire le fonctionnement du système." } },
    { at: T.converge, text: { en: "One curiosity, two directions, and both bring me back to the place we occupy here.", fr: "Une même curiosité, deux directions, qui me ramènent à la place que nous occupons ici." } },
  ],
  Stage,
});
