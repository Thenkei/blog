import { useId } from "react";
import { Box, Camera, Checkpoint, Comet, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, hash } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// One liftoff, two reactions, kept apart instead of bundled. The collective
// engineering (six disciplines, teams, tests, failures, corrections) gets the
// applause; the vision gets questions: Mars as an exit plan is cut by a
// boundary and the attention comes back to Earth; the shared orbit fills up and
// needs end-of-life, tracking, collision and governance plans. Both positions hold.

const T = {
  lift: 10,
  orbit: 72,
  split: 80,
  landing: 96,
  stack: 124,
  genius: 184,
  mars: 232,
  cut: 266,
  home: 284,
  crowd: 322,
  needs: 356,
  both: 420,
  end: 540,
} as const;

type Pt = readonly [number, number];
type Curve = readonly [Pt, Pt, Pt, Pt];

type Layout = {
  earth: { cx: number; cy: number; r: number }; orbitR: number;
  path: Curve; landing: Pt; mars: Pt;
  panel: { x: number; y: number; w: number; h: number }; rowTop: number; rowH: number;
  teamsY: number; geniusY: number;
  engTag: Pt; visionTag: Pt; cutTag: [number, number, "middle" | "end"]; home: Pt;
  orbitLabel: [number, number, "start" | "end"]; satSpan: [number, number];
  needs: readonly Pt[]; bothTag: Pt;
};

const WIDE_L: Layout = {
  earth: { cx: 600, cy: 930, r: 610 }, orbitR: 748,
  path: [[600, 318], [606, 188], [704, 108], [896, 62]], landing: [526, 322], mars: [918, 60],
  panel: { x: 40, y: 64, w: 214, h: 334 }, rowTop: 110, rowH: 30,
  teamsY: 312, geniusY: 366,
  engTag: [462, 232], visionTag: [712, 262], cutTag: [770, 44, "middle"], home: [600, 360],
  orbitLabel: [566, 166, "end"], satSpan: [-.43, .5],
  needs: [[296, 396], [440, 396], [556, 396], [770, 396]], bothTag: [480, 72],
};

const COMPACT_L: Layout = {
  earth: { cx: 360, cy: 1000, r: 626 }, orbitR: 770,
  path: [[360, 372], [366, 252], [432, 150], [508, 82]], landing: [300, 377], mars: [522, 70],
  panel: { x: 16, y: 64, w: 180, h: 258 }, rowTop: 108, rowH: 24,
  teamsY: 256, geniusY: 300,
  engTag: [270, 318], visionTag: [456, 330], cutTag: [520, 118, "end"], home: [360, 408],
  orbitLabel: [516, 226, "end"], satSpan: [-.2, .2],
  needs: [[60, 448], [310, 448], [60, 478], [310, 478]], bothTag: [372, 30],
};

function copy(fr: boolean) {
  return {
    group: fr ? "projet de groupe" : "group project",
    disciplines: fr
      ? ["propulsion", "mécanique", "logiciel", "matériaux", "opérations", "sécurité"]
      : ["propulsion", "mechanics", "software", "materials", "operations", "safety"],
    teamsA: fr ? "équipes · essais" : "teams · tests",
    teamsB: fr ? "échecs · corrections" : "failures · fixes",
    genius: fr ? "génie solitaire ✗" : "solitary genius ✗",
    engineering: fr ? "ingénierie ✓" : "engineering ✓",
    vision: "vision ?",
    exit: fr ? "pas une porte de sortie ✗" : "not an exit plan ✗",
    home: fr ? "notre place reste ici" : "our place remains here",
    orbit: fr ? "orbite · environnement partagé" : "orbit · shared environment",
    orbitShort: fr ? "orbite commune" : "shared orbit",
    landing: fr ? "retour" : "landing",
    needs: fr ? ["fin de vie", "suivi", "risque de collision", "gouvernance"] : ["end of life", "tracking", "collision risk", "governance"],
    both: fr ? "admirer ✓ · rester critique ✓" : "admire ✓ · stay critical ✓",
  };
}

function bezier([p0, p1, p2, p3]: Curve, t: number): [number, number] {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

const sample = (curve: Curve, from: number, to: number, steps = 40): Pt[] =>
  to <= from ? [] : Array.from({ length: steps + 1 }, (_, index) => bezier(curve, from + (to - from) * (index / steps)));
const toPath = (points: readonly Pt[]) => points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");

// Parameter where the trajectory crosses the orbit ring.
function orbitCrossing(L: Layout) {
  const steps = Array.from({ length: 201 }, (_, step) => step / 200);
  return steps.find((t) => {
    const [x, y] = bezier(L.path, t);
    return Math.hypot(x - L.earth.cx, y - L.earth.cy) >= L.orbitR;
  }) ?? 1;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const c = copy(fr);
  const uid = useId().replaceAll(":", "");
  const L = compact ? COMPACT_L : WIDE_L;
  const E = L.earth;
  const cross = orbitCrossing(L);
  const cutAt = cross + (1 - cross) * .55;

  const intro = easeOut(frame, 0, 24);
  const climb = ease(frame, T.lift, T.orbit, (t) => t * t * (3 - 2 * t));
  const marsDraw = ease(frame, T.mars, T.cut);
  const cut = pop(frame, T.cut);
  const homeT = ease(frame, T.cut + 4, T.home + 22);
  const crowd = easeOut(frame, T.crowd, T.crowd + 44);
  const split = (index: number) => pop(frame, T.split + index * 8);

  const ascent = sample(L.path, 0, cross * climb);
  const vision = sample(L.path, cross, lerp(cross, cutAt, marsDraw));
  const cutPoint = bezier(L.path, cutAt);
  const ahead = bezier(L.path, Math.min(1, cutAt + .02));
  const normal = Math.atan2(ahead[1] - cutPoint[1], ahead[0] - cutPoint[0]) + Math.PI / 2;
  const barrier = compact ? 22 : 28;
  const pad = L.path[0];

  // Booster return: from early ascent back down to the landing zone.
  const boosterFrom = bezier(L.path, cross * .4);
  const landingPoints: Pt[] = Array.from({ length: 24 }, (_, index) => {
    const t = index / 23;
    const control: Pt = [(boosterFrom[0] + L.landing[0]) / 2 - 30, boosterFrom[1] - 18];
    return [(1 - t) ** 2 * boosterFrom[0] + 2 * (1 - t) * t * control[0] + t * t * L.landing[0], (1 - t) ** 2 * boosterFrom[1] + 2 * (1 - t) * t * control[1] + t * t * (L.landing[1] - 8)] as const;
  });
  const landingT = ease(frame, T.landing - 20, T.landing + 16);
  const landed = frame >= T.landing + 16;

  // The attention comes home: from the cut back down to Earth.
  const homePath: Pt[] = [cutPoint, [lerp(cutPoint[0], L.home[0], .35) + (compact ? -10 : 70), lerp(cutPoint[1], L.home[1], .5)], [L.home[0], L.home[1] - 20]];

  const satellites = Array.from({ length: compact ? 16 : 30 }, (_, index) => {
    const span = L.satSpan[1] - L.satSpan[0];
    const theta = L.satSpan[0] + hash(index + 1) * span + frame * .00045 * (hash(index + 7) > .5 ? 1 : .6);
    const r = L.orbitR + (hash(index + 50) - .5) * 12;
    return { x: E.cx + r * Math.sin(theta), y: E.cy - r * Math.cos(theta), debris: index % 6 === 4, at: T.crowd + (index / (compact ? 16 : 30)) * 44 };
  });

  const lean = (point: Pt, k = .28): Pt => [lerp(width / 2, point[0], k), lerp(height / 2, point[1], k)];
  const camera = compact ? [{ at: 0 }] : [
    { at: 0, zoom: 1.05, focus: lean(pad, .4) },
    { at: T.split, dur: 60, zoom: 1 },
    { at: T.mars - 10, dur: 50, zoom: 1.035, focus: lean(L.mars) },
    { at: T.home, dur: 50, zoom: 1.02, focus: lean([E.cx, L.needs[0]![1]]) },
    { at: T.both, dur: 60, zoom: 1 },
  ];

  const P = L.panel;
  const rows = c.disciplines.map((name, index) => ({ name, y: L.rowTop + (c.disciplines.length - 1 - index) * L.rowH, at: stagger(index, T.stack, 6) }));
  const engFocus = ease(frame, T.stack - 10, T.stack + 10) * (1 - ease(frame, T.mars - 10, T.mars + 10));
  const genius = pop(frame, T.genius);

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    <defs>
      <radialGradient id={`${uid}-atmo`} cx=".5" cy=".5" r=".5">
        <stop offset=".92" style={{ stopColor: TONE.ok, stopOpacity: .16 }} />
        <stop offset="1" style={{ stopColor: TONE.ok, stopOpacity: 0 }} />
      </radialGradient>
      <linearGradient id={`${uid}-earth`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: TONE.ok, stopOpacity: .14 }} />
        <stop offset=".25" style={{ stopColor: TONE.ok, stopOpacity: .05 }} />
        <stop offset="1" style={{ stopColor: TONE.ok, stopOpacity: 0 }} />
      </linearGradient>
    </defs>

    {/* Earth: a limb with its atmosphere, the environment that makes us possible. */}
    <g opacity={intro}>
      <circle cx={E.cx} cy={E.cy} r={E.r + 26} fill={`url(#${uid}-atmo)`} />
      <circle cx={E.cx} cy={E.cy} r={E.r} fill={`url(#${uid}-earth)`} stroke={TONE.ok} strokeOpacity={.55} strokeWidth={1.25} />
      {[34, 70].map((inset) => <circle key={inset} cx={E.cx} cy={E.cy} r={E.r - inset} fill="none" stroke="var(--scene-hairline)" strokeOpacity={.5} strokeWidth={1} />)}
    </g>
    {/* The shared orbit. */}
    <circle cx={E.cx} cy={E.cy} r={L.orbitR} fill="none" stroke="var(--scene-hairline)" strokeWidth={1.25 + .5 * crowd} strokeDasharray="3 7" strokeDashoffset={-frame * .3} opacity={intro} />
    <g opacity={intro}>
      <Text x={L.orbitLabel[0]} y={L.orbitLabel[1]} size={11} weight={600} font="mono" tone="muted" anchor={L.orbitLabel[2]} caps>{compact ? c.orbitShort : c.orbit}</Text>
    </g>

    {/* Satellites and debris accumulate, drifting along the orbit. */}
    {satellites.map((sat, index) => {
      const on = easeOut(frame, sat.at, sat.at + 12);
      if (on <= 0) return null;
      return sat.debris
        ? <path key={index} d={`M${sat.x - 3.5} ${sat.y - 3.5}L${sat.x + 3.5} ${sat.y + 3.5}M${sat.x + 3.5} ${sat.y - 3.5}L${sat.x - 3.5} ${sat.y + 3.5}`} stroke={TONE.danger} strokeWidth={1.5} strokeLinecap="round" opacity={on} />
        : <g key={index} opacity={on * .85}>
          <rect x={sat.x - 2.5} y={sat.y - 2.5} width={5} height={5} rx={1} style={{ fill: "var(--scene-ink)" }} />
          <line x1={sat.x - 7} x2={sat.x + 7} y1={sat.y} y2={sat.y} stroke="var(--scene-ink)" strokeOpacity={.5} strokeWidth={1} />
        </g>;
    })}

    {/* Liftoff: the visible part. */}
    <g opacity={intro}>
      <rect x={pad[0] - 14} y={pad[1] - 2} width={28} height={4} rx={2} style={{ fill: "var(--scene-ink)" }} opacity={.8} />
    </g>
    {ascent.length > 1 ? <path d={toPath(ascent)} fill="none" stroke={TONE.line} strokeWidth={2} strokeLinecap="round" /> : null}
    <Comet points={sample(L.path, 0, cross)} t={climb > 0 && climb < 1 ? climb : 0} tone="line" r={5} tail={.18} />
    {frame >= T.lift && frame < T.lift + 36 ? <Pulse x={pad[0]} y={pad[1]} frame={frame} at={T.lift} period={36} r={10} tone="line" /> : null}
    {/* The booster comes back and lands: almost absurdly spectacular. */}
    {landingT > 0 ? <path d={toPath(landingPoints.slice(0, Math.max(2, Math.ceil(landingT * landingPoints.length))))} fill="none" stroke={TONE.ok} strokeWidth={1.25} strokeDasharray="3 5" /> : null}
    <Comet points={landingPoints} t={landingT < 1 ? landingT : 0} tone="ok" r={4} tail={.2} />
    {landed ? <g transform={`translate(${L.landing[0]} ${L.landing[1] - 8}) scale(${.5 + .5 * pop(frame, T.landing + 16)}) translate(${-L.landing[0]} ${-(L.landing[1] - 8)})`}>
      <Checkpoint x={L.landing[0]} y={L.landing[1] - 8} r={8} state="pass" />
    </g> : null}
    {!compact ? <g opacity={easeOut(frame, T.landing + 16, T.landing + 30)}>
      <Text x={L.landing[0] - 16} y={L.landing[1] - 10} size={13} weight={600} font="mono" tone="ok" anchor="end">{c.landing}</Text>
    </g> : null}

    {/* The vision points further: Mars as a fallback, cut by a boundary. */}
    <g opacity={easeOut(frame, T.mars - 10, T.mars + 16)}>
      <circle cx={L.mars[0]} cy={L.mars[1]} r={16} className="scene-only-rocket" style={{ fill: tint("hot", 14) }} />
      <circle cx={L.mars[0]} cy={L.mars[1]} r={7} style={{ fill: "var(--scene-card)" }} stroke={TONE.muted} strokeWidth={1.25} />
      <Text x={L.mars[0] - 16} y={L.mars[1] + (compact ? 20 : 0)} size={14} weight={600} tone="muted" anchor={compact ? "end" : "end"}>Mars</Text>
    </g>
    {vision.length > 1 ? <path d={toPath(vision)} fill="none" stroke={TONE.hot} strokeWidth={1.5} strokeDasharray="4 6" strokeLinecap="round" /> : null}
    <Comet points={sample(L.path, cross, cutAt)} t={marsDraw > 0 && marsDraw < 1 ? marsDraw : 0} tone="hot" r={4.5} tail={.25} />
    <g opacity={Math.min(1, cut) * .9}>
      <path d={toPath(sample(L.path, cutAt, 1, 20))} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="1.5 6" />
    </g>
    {frame >= T.cut ? <g opacity={Math.min(1, cut)}>
      <line
        x1={cutPoint[0] - Math.cos(normal) * barrier * cut} y1={cutPoint[1] - Math.sin(normal) * barrier * cut}
        x2={cutPoint[0] + Math.cos(normal) * barrier * cut} y2={cutPoint[1] + Math.sin(normal) * barrier * cut}
        stroke={TONE.danger} strokeWidth={2} strokeLinecap="round"
      />
      <Checkpoint x={cutPoint[0]} y={cutPoint[1]} r={10} state="fail" />
    </g> : null}
    {frame >= T.cut && frame < T.cut + 40 ? <Pulse x={cutPoint[0]} y={cutPoint[1]} frame={frame} at={T.cut} period={40} r={11} tone="danger" /> : null}
    <Tag x={L.cutTag[0]} y={L.cutTag[1]} text={c.exit} tone="danger" anchor={L.cutTag[2]} appear={pop(frame, T.cut + 6)} size={compact ? 12 : 13} />
    <Comet points={homePath} t={homeT > 0 && homeT < 1 ? homeT : 0} tone="ok" r={4.5} tail={.3} />
    <g {...enter(frame, T.home + 16, { distance: 8 })}>
      <Text x={L.home[0]} y={L.home[1]} size={compact ? 15 : 17} weight={600} tone="ok" anchor="middle">{c.home}</Text>
    </g>

    {/* Two reactions at liftoff, kept separate. */}
    <Tag x={L.engTag[0]} y={L.engTag[1]} text={c.engineering} tone="ok" appear={split(0)} size={compact ? 12 : 13} />
    <Tag x={L.visionTag[0]} y={L.visionTag[1]} text={c.vision} tone="hot" appear={split(1)} size={compact ? 12 : 13} />
    {!compact ? <path d={`M${L.engTag[0] - 64} ${L.engTag[1]}L${P.x + P.w + 6} ${L.engTag[1]}`} fill="none" stroke={TONE.ok} strokeOpacity={.6} strokeWidth={1} strokeDasharray="3 5" opacity={easeOut(frame, T.stack - 16, T.stack)} /> : null}

    {/* What the launch footage never shows: one system, many disciplines. */}
    <g {...enter(frame, T.stack - 14, { from: "left", distance: 16 })}>
      <Box x={P.x} y={P.y} w={P.w} h={P.h} tone="ok" focus={engFocus * .8} radius={16} />
      <Text x={P.x + 18} y={P.y + 22} size={11} weight={600} font="mono" tone="ok" caps>{c.group}</Text>
      {!compact ? <Text x={P.x + P.w - 18} y={P.y + 22} size={11} weight={600} font="mono" tone="muted" anchor="end">×6</Text> : null}
    </g>
    {rows.map((row) => {
      const appear = easeOut(frame, row.at, row.at + 16);
      if (appear <= 0) return null;
      return <g key={row.name} opacity={appear} transform={`translate(0 ${(1 - appear) * -10})`}>
        <line x1={P.x + 16} x2={P.x + P.w - 16} y1={row.y + L.rowH / 2} y2={row.y + L.rowH / 2} stroke="var(--scene-hairline)" strokeOpacity={.7} strokeWidth={1} />
        <rect x={P.x + 18} y={row.y - 5} width={10} height={10} rx={3} style={{ fill: tint("line", 30) }} stroke={TONE.line} strokeWidth={1} />
        <Text x={P.x + 40} y={row.y} size={compact ? 13 : 14} weight={500} font="mono">{row.name}</Text>
      </g>;
    })}
    <g opacity={easeOut(frame, T.stack + 40, T.stack + 58)}>
      <Text x={P.x + 18} y={L.teamsY} size={13} weight={500} font="mono" tone="muted">{c.teamsA}</Text>
      <Text x={P.x + 18} y={L.teamsY + 20} size={13} weight={500} font="mono" tone="muted">{c.teamsB}</Text>
    </g>
    <Tag x={P.x + 18} y={L.geniusY} anchor="start" text={c.genius} tone="danger" appear={genius} size={compact ? 11 : 12} />

    {/* What rapid deployment must also plan for: conditions still to verify. */}
    {c.needs.map((need, index) => {
      const [x, y] = L.needs[index]!;
      return <g key={need} {...enter(frame, stagger(index, T.needs, 7), { distance: 8 })}>
        <Checkpoint x={x} y={y} r={compact ? 7 : 8} state="pending" />
        <Text x={x + (compact ? 14 : 16)} y={y} size={13} weight={600} font="mono" tone="hot">{need}</Text>
      </g>;
    })}

    {/* Both positions survive re-entry. */}
    <Tag x={L.bothTag[0]} y={L.bothTag[1]} text={c.both} tone="ok" appear={pop(frame, T.both)} size={compact ? 12 : 14} />
    {frame >= T.both && frame < T.both + 50 ? <Pulse x={L.bothTag[0]} y={L.bothTag[1]} frame={frame} at={T.both} period={50} r={24} tone="ok" /> : null}
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 1,
  title: { en: "Admire, without subscribing", fr: "Admirer sans s’abonner" },
  caption: {
    en: "Admiration for exploration does not erase orbital responsibility or our attachment to Earth.",
    fr: "L’admiration pour l’exploration n’efface ni la responsabilité orbitale ni notre attachement à la Terre.",
  },
  beats: [
    { at: 0, text: { en: "Liftoff brings two reactions: extraordinary engineering, and much less conviction about the vision around it.", fr: "Au décollage, deux réactions : quelle prouesse d’ingénierie, et bien moins de conviction pour la vision." } },
    { at: T.stack - 10, text: { en: "Behind the footage: six disciplines, one system, teams and tests. That collective work gets the applause.", fr: "Derrière les images : six disciplines, un seul système, des équipes, des essais. C’est ça qu’on applaudit." } },
    { at: T.mars, text: { en: "The vision points further: Mars as humanity’s fallback. For me it is not an exit plan; our place is here.", fr: "La vision va plus loin : Mars en repli. Pour moi, ce n’est pas une porte de sortie ; notre place reste ici." } },
    { at: T.crowd, text: { en: "Closer to home, orbit fills up. Speed needs an equal plan: end of life, tracking, collisions, governance.", fr: "Plus près, l’orbite se remplit : il faut prévoir fin de vie, suivi, collisions et gouvernance." } },
    { at: T.both, text: { en: "Both positions survive re-entry: admire the engineering, stay critical of the rest.", fr: "Les deux positions tiennent : admirer l’ingénierie, rester critique sur le reste." } },
  ],
  Stage,
});
