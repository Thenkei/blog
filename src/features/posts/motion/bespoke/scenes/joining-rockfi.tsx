import { Box, Checkpoint, Comet, dim, ease, easeOut, enter, hash, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). Act 1: a traveller climbs the career trail; each waypoint
// raises the chapter it taught. Act 2: the trail tops out at RockFi, where the
// mission is drawn literally: a chaotic stampede of partner data, herded into
// one centralized, real-time view of asset portfolios.
const ARRIVE = [26, 86, 146, 206] as const;
const T = {
  panel: 196,
  mission: 222,
  partners: 234,
  herd: 256,
  view: 288,
  calm: 360,
  end: 480,
} as const;

const COPY = {
  en: {
    chapters: [
      { eyebrow: "START-UP", name: "Polymagine", lines: ["R&D in additive", "manufacturing and AR"], short: "R&D in additive manufacturing and AR" },
      { eyebrow: "INDUSTRY", name: "Michelin", lines: ["industrial production", "and scale"], short: "industrial production and scale" },
      { eyebrow: "2021 · 4 YEARS", name: "Forest Admin", lines: ["Full Stack → Staff → EM", "team ×2, 20+ engineers"], short: "Full Stack → Staff → EM · team ×2, 20+" },
    ],
    rockfi: "ROCKFI · STAFF BACK-END ENGINEER",
    mission: "interconnection with key partners",
    partner: "partner",
    view: "portfolios",
    realtime: "real-time ●",
    central: "CENTRALIZED ✓",
  },
  fr: {
    chapters: [
      { eyebrow: "START-UP", name: "Polymagine", lines: ["R&D impression 3D", "et réalité augmentée"], short: "R&D impression 3D et réalité augmentée" },
      { eyebrow: "INDUSTRIE", name: "Michelin", lines: ["production industrielle", "et échelle"], short: "production industrielle et échelle" },
      { eyebrow: "2021 · 4 ANS", name: "Forest Admin", lines: ["full-stack → Staff → EM", "équipe ×2, 20+ ingés"], short: "full-stack → Staff → EM · équipe ×2, 20+" },
    ],
    rockfi: "ROCKFI · STAFF BACK-END ENGINEER",
    mission: "interconnexion avec les partenaires clés",
    partner: "partenaire",
    view: "portefeuilles",
    realtime: "temps réel ●",
    central: "CENTRALISÉ ✓",
  },
} as const;

type Pt = readonly [number, number];

/** Catmull-Rom through the waypoints, sampled: a smooth trail and exact stop positions. */
function trail(points: readonly Pt[], samples = 18) {
  const path = points.slice(0, -1).flatMap((p1, i) => {
    const p0 = points[Math.max(0, i - 1)]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(points.length - 1, i + 2)]!;
    return Array.from({ length: samples }, (_, k): Pt => {
      const t = k / samples;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
    });
  }).concat([points.at(-1)!]);
  const lengths = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i]![0], p[1] - path[i]![1]));
  const cumulative = lengths.reduce<number[]>((acc, length) => [...acc, acc.at(-1)! + length], [0]);
  const total = cumulative.at(-1)!;
  // Fraction of the trail at each control point (control point i sits at sample i·samples).
  const at = points.map((_, i) => cumulative[i * samples]! / total);
  return { path, at, d: `M${path.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}` };
}

function Stage({ frame, compact, locale }: SceneStageProps) {
  const c = COPY[locale];

  // Waypoints: start, three chapters, the RockFi summit.
  const control: Pt[] = compact
    ? [[40, 64], [42, 81], [34, 135], [44, 189], [40, 248]]
    : [[48, 356], [122, 334], [306, 300], [490, 250], [588, 224]];
  const route = trail(control);
  const stops = control.slice(1);
  const stopAt = route.at.slice(1);
  const cards = compact
    ? [0, 1, 2].map((i) => ({ x: 70, y: 58 + i * 54, w: 450, h: 46 }))
    : [0, 1, 2].map((i) => ({ x: 40 + i * 184, y: control[i + 1]![1] - 136, w: 164, h: 96 }));
  const panel = compact ? { x: 20, y: 266, w: 500, h: 240 } : { x: 604, y: 60, w: 316, h: 330 };

  // Traveller: walks between stops, pausing briefly at each.
  const progress = ARRIVE.reduce((value, arrive, k) => {
    const from = k === 0 ? 4 : ARRIVE[k - 1]! + 12;
    return frame >= from ? lerp(k === 0 ? 0 : stopAt[k - 1]!, stopAt[k]!, ease(frame, from, arrive)) : value;
  }, 0);
  const current = ARRIVE.reduce((index, at, k) => frame >= at ? k : index, -1);

  return <g>
    {/* The trail: a faint dashed route, filled in as it is walked. */}
    <g opacity={easeOut(frame, 0, 16)}>
      <path d={route.d} fill="none" stroke="var(--scene-hairline)" strokeWidth={1.25} strokeDasharray="2 6" strokeLinecap="round" />
      <path d={route.d} fill="none" stroke={TONE.line} strokeWidth={2} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - progress} />
    </g>

    {c.chapters.map((chapter, i) => {
      const [sx, sy] = stops[i]!;
      const card = cards[i]!;
      const arrived = frame >= ARRIVE[i]!;
      const rise = enter(frame, ARRIVE[i]! - 4, { distance: 12, from: compact ? "left" : "up" });
      const focus = current === i ? ease(frame, ARRIVE[i]!, ARRIVE[i]! + 10) * (1 - ease(frame, ARRIVE[i + 1]! - 6, ARRIVE[i + 1]! + 6)) : 0;
      const recede = current > i ? dim(ease(frame, ARRIVE[i + 1]!, ARRIVE[i + 1]! + 20), .6) : 1;
      const leader = compact
        ? `M${sx + 14} ${sy}H${card.x}`
        : `M${sx} ${card.y + card.h}V${sy - 16}`;
      return <g key={chapter.name}>
        <Checkpoint x={sx} y={sy} r={11} state={arrived ? "pass" : "pending"} appear={easeOut(frame, stagger(i, 6, 5), stagger(i, 22, 5))} />
        {arrived && frame < ARRIVE[i]! + 40 ? <Pulse x={sx} y={sy} frame={frame} at={ARRIVE[i]} period={40} r={12} tone="ok" /> : null}
        {/* Trail blazes: a painted waymark beside each stop (mountain only). */}
        <g className="scene-only-mountain" opacity={easeOut(frame, stagger(i, 6, 5), stagger(i, 22, 5))}>
          <rect x={sx + 16} y={sy + 8} width={10} height={4} rx={1} style={{ fill: "var(--scene-ink)" }} opacity={.7} />
          <rect x={sx + 16} y={sy + 13} width={10} height={4} rx={1} fill={TONE.hot} />
        </g>
        {arrived || frame >= ARRIVE[i]! - 4 ? <g opacity={recede}>
          <path d={leader} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="2 4" opacity={easeOut(frame, ARRIVE[i]!, ARRIVE[i]! + 12)} />
          <g {...rise}>
            <Box x={card.x} y={card.y} w={card.w} h={card.h} tone="line" radius={14} focus={focus}>
              {compact
                ? <>
                  <Text x={card.x + 16} y={card.y + 17} size={15.5} weight={600}>{chapter.name}</Text>
                  <Text x={card.x + card.w - 16} y={card.y + 17} size={10.5} font="mono" weight={600} tone="muted" anchor="end" caps>{chapter.eyebrow}</Text>
                  <Text x={card.x + 16} y={card.y + 35} size={13} font="main" weight={500} tone="muted">{chapter.short}</Text>
                </>
                : <>
                  <Text x={card.x + 16} y={card.y + 20} size={10.5} font="mono" weight={600} tone="muted" caps>{chapter.eyebrow}</Text>
                  <Text x={card.x + 16} y={card.y + 42} size={17} weight={600}>{chapter.name}</Text>
                  <Text x={card.x + 16} y={card.y + 64} size={13} font="main" weight={500} tone="muted">{chapter.lines[0]}</Text>
                  <Text x={card.x + 16} y={card.y + 81} size={13} font="main" weight={500} tone="muted">{chapter.lines[1]}</Text>
                </>}
            </Box>
          </g>
        </g> : null}
      </g>;
    })}

    {/* The summit: RockFi. */}
    <Summit frame={frame} at={ARRIVE[3]} point={stops[3]!} compact={compact} />
    <Mission frame={frame} compact={compact} c={c} panel={panel} />

    {frame < ARRIVE[3] + 12 ? <g opacity={1 - ease(frame, ARRIVE[3], ARRIVE[3] + 12)}>
      <Comet points={route.path} t={Math.min(.999, Math.max(.001, progress))} tone="hot" r={6} tail={.05} />
    </g> : null}
  </g>;
}

function Summit({ frame, at, point, compact }: { frame: number; at: number; point: Pt; compact: boolean }) {
  const [x, y] = point;
  const reached = frame >= at;
  const flag = pop(frame, at + 4, 160);
  return <g opacity={easeOut(frame, 20, 40)}>
    <circle cx={x} cy={y} r={7} style={{ fill: reached ? TONE.hot : "var(--scene-card)" }} stroke={TONE.hot} strokeWidth={1.25} strokeDasharray={reached ? undefined : "2 2.5"} />
    {reached && frame < at + 44 ? <Pulse x={x} y={y} frame={frame} at={at} period={44} r={10} tone="hot" /> : null}
    {/* Summit flag (mountain only): the climb ends here. */}
    <g className="scene-only-mountain" transform={`translate(${x} ${y}) scale(${Math.max(0, flag)}) translate(${-x} ${-y})`}>
      <line x1={x} x2={x} y1={y - 6} y2={y - 34} style={{ stroke: "var(--scene-ink)" }} strokeWidth={1.5} strokeLinecap="round" />
      <path d={`M${x} ${y - 34}L${x + (compact ? 16 : -18)} ${y - 28}L${x} ${y - 22}Z`} fill={TONE.hot} />
    </g>
  </g>;
}

function Mission({ frame, compact, c, panel }: {
  frame: number;
  compact: boolean;
  c: (typeof COPY)["en"] | (typeof COPY)["fr"];
  panel: { x: number; y: number; w: number; h: number };
}) {
  if (frame < T.panel) return null;
  const inner = { x: panel.x + 16, w: panel.w - 32 };
  const chipW = compact ? 124 : 88;
  const gap = (inner.w - chipW * 3) / 2;
  const chipY = panel.y + (compact ? 76 : 96);
  const view = compact
    ? { x: inner.x, y: panel.y + 134, w: inner.w, h: 94 }
    : { x: inner.x, y: panel.y + 186, w: inner.w, h: 128 };
  const inlet: Pt = [view.x + view.w / 2, view.y];
  const viewIn = pop(frame, T.view);

  // The stampede: each partner emits packets toward the single inlet. Early on
  // they wander wide and irregular; as the herd is tamed the paths straighten.
  const chaos = 1 - ease(frame, T.herd + 20, T.calm);
  const herdIn = easeOut(frame, T.herd, T.herd + 20);
  const packets = [0, 1, 2].flatMap((i) => [0, 1, 2, 3, 4].map((k) => {
    const period = 46 + i * 6 + k * 3;
    const phase = (k / 5 + i * .23 + hash(i * 7 + k) * .2) % 1;
    const t = ((((frame - T.herd) / period + phase) % 1) + 1) % 1;
    const from: Pt = [inner.x + i * (chipW + gap) + chipW / 2, chipY + 15];
    const wobble = Math.sin(t * Math.PI * (2.5 + i) + i * 1.9 + k * 2.1) * (compact ? 26 : 34) * (1 - t) * chaos;
    const x = lerp(from[0], inlet[0], t) + wobble;
    const y = lerp(from[1], inlet[1] - 4, t);
    return { key: `${i}-${k}`, x, y, opacity: herdIn * Math.min(1, t * 6, (1 - t) * 5) };
  }));

  // Portfolio sparkline: deterministic, scrolling with time once the view is live.
  const sparkTop = view.y + (compact ? 34 : 44);
  const sparkH = compact ? 28 : 48;
  const n = 36;
  const drawn = ease(frame, T.view + 6, T.view + 40);
  const scroll = Math.max(0, frame - T.view) * .12;
  const points = Array.from({ length: n }, (_, i) => {
    const u = i + scroll;
    const v = .5 + .2 * Math.sin(u * .45) + .12 * Math.sin(u * 1.1 + 1.3) + .06 * Math.sin(u * 2.3);
    return [view.x + 14 + (view.w - 28) * i / (n - 1), sparkTop + sparkH * (1 - Math.max(0, Math.min(1, v)))] as const;
  }).slice(0, Math.max(2, Math.round(n * drawn)));
  const line = `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}`;
  const area = `${line}L${points.at(-1)![0].toFixed(1)} ${sparkTop + sparkH}L${points[0]![0].toFixed(1)} ${sparkTop + sparkH}Z`;
  const tip = points.at(-1)!;

  return <g>
    <g {...enter(frame, T.panel, { from: "right", distance: 24 })}>
      <Box x={panel.x} y={panel.y} w={panel.w} h={panel.h} tone="hot" radius={18} focus={ease(frame, ARRIVE[3], ARRIVE[3] + 12) * (1 - ease(frame, T.mission + 20, T.mission + 50)) * .8}>
        <Text x={panel.x + 16} y={panel.y + 24} size={11} font="mono" weight={600} tone="hot" caps>{c.rockfi}</Text>
        <g {...enter(frame, T.mission, { distance: 8 })}>
          <Text x={panel.x + 16} y={panel.y + (compact ? 48 : 52)} size={compact ? 15 : 14.5} weight={600}>{c.mission}</Text>
        </g>
      </Box>
    </g>

    {[0, 1, 2].map((i) => {
      const x = inner.x + i * (chipW + gap);
      return <g key={i} {...enter(frame, stagger(i, T.partners, 5), { distance: 8 })}>
        <Box x={x} y={chipY - 15} w={chipW} h={30} tone="line" radius={9}>
          <Text x={x + chipW / 2} y={chipY} size={12} font="mono" weight={600} tone="muted" anchor="middle">{c.partner}</Text>
        </Box>
      </g>;
    })}
    {packets.map((p) => <circle key={p.key} cx={p.x} cy={p.y} r={3.5} fill={TONE.line} opacity={p.opacity} />)}

    <g opacity={Math.min(1, viewIn)} transform={`translate(0 ${(1 - Math.min(1, viewIn)) * 12})`}>
      <Box x={view.x} y={view.y} w={view.w} h={view.h} tone="ok" radius={14} focus={ease(frame, T.view, T.view + 10) * (1 - ease(frame, T.view + 30, T.view + 70))}>
        <Text x={view.x + 14} y={view.y + 20} size={15} weight={600}>{c.view}</Text>
        <Tag x={view.x + view.w - 12} y={view.y + 20} anchor="end" text={c.realtime} tone="ok" size={11} />
        <path d={area} style={{ fill: tint("ok", 12) }} />
        <path d={line} fill="none" stroke={TONE.ok} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
        {drawn > 0 ? <circle className="scene-glow" cx={tip[0]} cy={tip[1]} r={3.5} fill={TONE.ok} style={{ color: TONE.ok }} /> : null}
        {!compact ? <Text x={view.x + 14} y={view.y + view.h - 16} size={10.5} font="mono" weight={600} tone="ok" caps>{c.central}</Text> : null}
      </Box>
      {compact ? <Text x={view.x + 14} y={view.y + view.h - 14} size={10.5} font="mono" weight={600} tone="ok" caps>{c.central}</Text> : null}
    </g>
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "The route to RockFi", fr: "Le chemin jusqu’à RockFi" },
  caption: {
    en: "R&D, industrial scale and team growth lead to one mission: turning partner data into a centralized, real-time view of asset portfolios.",
    fr: "R&D, échelle industrielle et croissance d’équipe mènent à une mission : transformer les données des partenaires en une vision centralisée et en temps réel des portefeuilles.",
  },
  beats: [
    { at: 0, text: { en: "Polymagine: R&D for additive manufacturing and augmented reality.", fr: "Polymagine : R&D sur l’impression 3D et la réalité augmentée." } },
    { at: ARRIVE[1], text: { en: "Michelin: “industrial production” and “scale” are not to be taken lightly.", fr: "Michelin : « production industrielle » et « échelle » ne se prennent pas à la légère." } },
    { at: ARRIVE[2], text: { en: "Forest Admin, 2021: Full Stack → Staff Engineer → Engineering Manager, and a team doubled to 20+ engineers.", fr: "Forest Admin, 2021 : full-stack → Staff Engineer → Engineering Manager, une équipe doublée à plus de 20." } },
    { at: ARRIVE[3], text: { en: "RockFi, as Staff Back-end Engineer: the focus is interconnection with key partners.", fr: "RockFi, en tant que Staff Back-end Engineer : priorité à l’interconnexion avec les partenaires clés." } },
    { at: T.view, text: { en: "A chaotic stampede of client data, herded into one centralized, real-time view of asset portfolios.", fr: "Un troupeau chaotique de données, dompté en une vue centralisée et en temps réel des portefeuilles d’actifs." } },
  ],
  Stage,
});
