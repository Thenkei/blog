import { Box, Camera, Comet, ease, easeOut, enter, lerp, Meter, pop, Pulse, stagger, Tag, Text, tint, TONE, Wire, type Tone } from "../primitives";
import { defineScene, type Localized, type SceneStageProps } from "../types";

// Timeline (30 fps). Act A: the shared pool creeps up unwatched, a weekend
// spike hits the limit and the failure travels down every link. Act B: the same
// spike replayed once caching, queues and sessions live in isolated instances.
const T = {
  creep: 0,
  spike: 100,
  limit: 146,
  cascade: 160,
  verdictA: 236,
  split: 300,
  splitDone: 336,
  spikeB: 372,
  limitB: 414,
  verdictB: 430,
  end: 540,
} as const;

type Row = {
  key: "cache" | "bull" | "auth" | "security";
  name: Localized;
  role: Localized;
  failA: Localized;
  instance?: string;
  levelB?: number;
  resultB?: { text: Localized; tone: Tone };
};

const ROWS: readonly Row[] = [
  {
    key: "cache", name: { en: "Cache", fr: "Cache" }, role: { en: "large objects", fr: "gros objets" },
    failA: { en: "✗ memory exhausted", fr: "✗ mémoire épuisée" },
    instance: "redis · cache", levelB: .45,
    resultB: { text: { en: "✗ hits its own limit", fr: "✗ bute sur sa limite" }, tone: "danger" },
  },
  {
    key: "bull", name: { en: "BullMQ", fr: "BullMQ" }, role: { en: "background jobs", fr: "jobs d’arrière-plan" },
    failA: { en: "✗ can’t write or read jobs", fr: "✗ jobs ni écrits ni lus" },
    instance: "redis · queues", levelB: .36,
    resultB: { text: { en: "✓ jobs keep running", fr: "✓ les jobs tournent" }, tone: "ok" },
  },
  {
    key: "auth", name: { en: "Authentication", fr: "Authentification" }, role: { en: "user sessions", fr: "sessions" },
    failA: { en: "✗ users can’t log in", fr: "✗ connexion impossible" },
    instance: "redis · sessions", levelB: .28,
    resultB: { text: { en: "✓ sessions hold", fr: "✓ sessions maintenues" }, tone: "ok" },
  },
  {
    key: "security", name: { en: "Security", fr: "Sécurité" }, role: { en: "anti-brute force", fr: "anti-brute force" },
    failA: { en: "✗ anti-brute force offline", fr: "✗ anti-brute force hors ligne" },
  },
];

/** Frame at which the failure reaches row i (the cache fails with the pool). */
const failAt = (index: number) => index === 0 ? T.limit : T.cascade + (index - 1) * 18 + 16;

type Pt = readonly [number, number];

/** Cubic Bézier sampled into a polyline so a Comet can ride it. */
function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, steps = 16): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    const u = 1 - t;
    return [
      u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
      u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
    ];
  });
}
const toPath = (points: readonly Pt[]) => points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const actB = frame >= T.split;

  // Shared pool: the boiling frog (slow creep), then the weekend spike.
  const level = lerp(.42, .8, ease(frame, T.creep, T.spike, (t) => t)) + .22 * ease(frame, T.spike, T.limit);
  const oom = frame >= T.limit;

  // Wide: once security leaves the replay, the three remaining lanes re-centre.
  const shift = compact ? 0 : 31 * ease(frame, T.split + 8, T.splitDone + 4);
  const G = compact
    ? {
      row: (i: number) => ({ x: 56, y: 188 + i * 68, w: 464, h: 56 }),
      shared: { x: 20, y: 60, w: 500, h: 104 },
      verdict: [270, 480] as Pt,
    }
    : {
      row: (i: number) => ({ x: 380, y: 76 + i * 62 + shift, w: 540, h: 50 }),
      shared: { x: 40, y: 76, w: 250, h: 236 },
      verdict: [650, 350] as Pt,
    };
  const { shared } = G;
  const cyOf = (i: number) => G.row(i).y + G.row(i).h / 2;

  // Wires from the shared instance to each workload (act A).
  const wireA = (i: number): [number, number][] => {
    const r = G.row(i);
    const cy = cyOf(i);
    if (compact) return [[36, shared.y + shared.h], [36, cy - 10], [40, cy - 2], [48, cy], [r.x, cy]];
    const from: Pt = [shared.x + shared.w, shared.y + shared.h / 2];
    return cubic(from, [from[0] + 50, from[1]], [r.x - 50, cy], [r.x, cy]);
  };
  // Act B: a straight link from each isolated instance (wide) or the cache's own card (compact).
  const wireB = (i: number): [number, number][] => compact ? wireA(0) : [[shared.x + shared.w, cyOf(i)], [G.row(i).x, cyOf(i)]];

  const spikeA = [0, 1, 2].map((k) => ease(frame, stagger(k, T.spike - 6, 9), stagger(k, T.spike - 6, 9) + 30));
  const spikeB = [0, 1, 2].map((k) => ease(frame, stagger(k, T.spikeB - 6, 9), stagger(k, T.spikeB - 6, 9) + 30));
  const levelB = (i: number) => i === 0 ? lerp(ROWS[0]!.levelB!, 1.02, ease(frame, T.spikeB, T.limitB)) : ROWS[i]!.levelB ?? 0;

  const lean = (point: Pt): Pt => [lerp(width / 2, point[0], .2), lerp(height / 2, point[1], .2)];
  // A barely-there push toward the failing pool, released for the replay.
  const camera = compact ? [{ at: 0 }] : [
    { at: 0 },
    { at: T.spike - 10, dur: 50, zoom: 1.018, focus: lean([shared.x + shared.w, height / 2]) },
    { at: T.split - 10, zoom: 1 },
  ];

  const actAOut = 1 - ease(frame, T.split, T.split + 16);

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* ACT A — the shared instance and its gauge. */}
    {actAOut > 0 ? <g opacity={actAOut}>
      <g {...enter(frame, 0)}>
        <SharedInstance frame={frame} compact={compact} fr={fr} rect={shared} level={level} oom={oom} />
      </g>
      {ROWS.map((row, index) => {
        const points = wireA(index);
        const failed = frame >= failAt(index);
        const hit = ease(frame, failAt(index) - 22, failAt(index));
        return <g key={row.key}>
          <Wire d={toPath(points)} draw={easeOut(frame, stagger(index, 14, 5), stagger(index, 34, 5))} tone={failed ? "danger" : "line"} width={failed ? 1.5 : 1.5} {...(failed ? { dashed: true } : { flow: frame })} />
          {index > 0 ? <Comet points={points} t={hit} tone="danger" tail={.3} r={5.5} /> : null}
        </g>;
      })}
      {spikeA.map((t, k) => <Comet key={k} points={[...wireA(0)].reverse()} t={t} tone="hot" r={4.5} tail={.22} />)}
    </g> : null}

    {/* ACT B — isolated instances. */}
    {actB ? ROWS.map((row, index) => {
      if (!row.instance) return null;
      const at = stagger(index, T.split + 8, 6);
      const appear = enter(frame, at, { from: "left", distance: 18 });
      const lvl = levelB(index);
      const full = lvl > 1;
      if (compact) {
        if (index > 0) return null;
        return <g key={row.key} {...enter(frame, T.split + 8)}>
          <IsolatedCard compact frame={frame} rect={shared} name={row.instance} level={lvl} full={full} fr={fr} />
          <Wire d={toPath(wireB(0))} draw={easeOut(frame, T.split + 14, T.split + 34)} tone={full ? "danger" : "line"} width={1.5} {...(full ? { dashed: true } : { flow: frame })} />
        </g>;
      }
      const cy = cyOf(index);
      const rect = { x: shared.x, y: cy - 25, w: shared.w, h: 50 };
      return <g key={row.key} {...appear}>
        <IsolatedCard compact={false} frame={frame} rect={rect} name={row.instance} level={lvl} full={full} fr={fr} />
        <Wire d={toPath(wireB(index))} draw={easeOut(frame, at + 8, at + 26)} tone={full ? "danger" : "line"} width={1.5} {...(full ? { dashed: true } : { flow: frame })} />
      </g>;
    }) : null}
    {actB ? spikeB.map((t, k) => <Comet key={k} points={[...wireB(0)].reverse()} t={t} tone="hot" r={4.5} tail={.3} />) : null}

    {/* The four workloads: same positions in both acts. */}
    {ROWS.map((row, index) => {
      const r = G.row(index);
      const cy = cyOf(index);
      // Act A's failures clear smoothly at the split instead of cutting.
      const reset = ease(frame, T.split, T.split + 14);
      const failedA = frame >= failAt(index) && frame < T.split + 14;
      const decidedB = actB && row.resultB !== undefined && frame >= (index === 0 ? T.limitB : T.verdictB);
      const tone: Tone = failedA ? "danger" : decidedB ? row.resultB!.tone : "line";
      const status = failedA ? row.failA[locale] : decidedB ? row.resultB!.text[locale] : (fr ? "✓ opérationnel" : "✓ up");
      const statusAppear = failedA ? pop(frame, failAt(index)) * (1 - reset) : decidedB ? pop(frame, index === 0 ? T.limitB : T.verdictB) : actB ? ease(frame, T.splitDone - 6, T.splitDone + 8) : ease(frame, stagger(index, 30, 5), stagger(index, 44, 5));
      const gone = row.instance ? 0 : ease(frame, T.split, T.split + 20);
      const fill = failedA ? ease(frame, failAt(index), failAt(index) + 10) * (1 - reset) : decidedB && tone === "danger" ? ease(frame, T.limitB, T.limitB + 10) : 0;
      const inlineB = compact && actB && index > 0 && row.instance !== undefined;
      const statusX = r.x + r.w - 14;
      const statusY = compact ? cy - 12 : cy;
      return <g key={row.key} opacity={1 - gone}>
        <g {...enter(frame, stagger(index, 6, 5), { from: "right", distance: 18 })}>
          <Box x={r.x} y={r.y} w={r.w} h={r.h} tone={tone} fill={fill} radius={12} focus={failedA ? 1 - ease(frame, failAt(index) + 10, failAt(index) + 50) : 0}>
            <Text x={r.x + 18} y={compact ? cy - 12 : cy - 9} size={compact ? 16 : 16.5} weight={600} tone={tone === "danger" ? "danger" : "ink"}>{row.name[locale]}</Text>
            <Text x={r.x + 18} y={compact ? cy + 13 : cy + 12} size={12.5} font="mono" weight={500} tone="muted" opacity={inlineB ? 1 - ease(frame, T.split, T.split + 12) : 1}>{row.role[locale]}</Text>
            {inlineB ? <g opacity={ease(frame, T.split + 10, T.splitDone)}>
              <Text x={r.x + 18} y={cy + 13} size={12.5} font="mono" weight={600} tone="line">{row.instance}</Text>
              <Meter x={r.x + 190} y={cy + 9} w={r.w - 206} h={8} value={levelB(index)} limit={.999} />
            </g> : null}
          </Box>
        </g>
        <Tag x={statusX} y={statusY} anchor="end" size={compact ? 12 : 12.5} text={status} tone={failedA ? "danger" : decidedB ? row.resultB!.tone : "ok"} appear={statusAppear * (1 - gone)} />
        {index === 0 && !actB ? <Tag x={compact ? r.x + r.w - 14 : r.x + r.w - 150} y={compact ? cy + 13 : cy} anchor="end" size={11} text={fr ? "week-end · pic de volume" : "weekend · volume spike"} tone="hot"
          appear={pop(frame, T.spike - 12) * (1 - ease(frame, T.limit - 10, T.limit))} /> : null}
        {index === 0 && actB ? <Tag x={compact ? r.x + r.w - 14 : r.x + r.w - 150} y={compact ? cy + 13 : cy} anchor="end" size={11} text={fr ? "même pic, rejoué" : "same spike, replayed"} tone="hot"
          appear={pop(frame, T.spikeB - 12) * (1 - ease(frame, T.limitB - 10, T.limitB))} /> : null}
        {failedA && frame < failAt(index) + 40 ? <Pulse x={r.x} y={cy} frame={frame} at={failAt(index)} period={40} r={7} tone="danger" /> : null}
        {decidedB && tone === "ok" && frame < T.verdictB + 44 ? <Pulse x={r.x} y={cy} frame={frame} at={T.verdictB} period={44} r={7} tone="ok" /> : null}
      </g>;
    })}

    <Tag x={G.verdict[0]} y={G.verdict[1]} text={fr ? "1 pool épuisé → 4 domaines à terre" : "1 exhausted pool → 4 domains down"} tone="danger" appear={pop(frame, T.verdictA) * actAOut} />
    <Tag x={G.verdict[0]} y={compact ? cyOf(3) : cyOf(3) + 4} text={fr ? "le pic reste dans l’instance cache" : "the spike stays in the cache instance"} tone="ok" appear={pop(frame, T.verdictB + 24)} />
  </Camera>;
}

/** The single shared instance: gauge with its limit and the Datadog blind spot. */
function SharedInstance({ frame, compact, fr, rect, level, oom }: { frame: number; compact: boolean; fr: boolean; rect: { x: number; y: number; w: number; h: number }; level: number; oom: boolean }) {
  const { x, y, w, h } = rect;
  const tone: Tone = oom ? "danger" : level > .78 ? "hot" : "line";
  const state = oom ? "OOM" : frame >= T.spike - 12 ? (fr ? "pic" : "spike") : (fr ? "monte lentement ↑" : "creeping up ↑");
  const stateTone: Tone = oom ? "danger" : frame >= T.spike - 12 ? "hot" : "muted";
  const alertTone: Tone = oom ? "danger" : "muted";
  const flash = ease(frame, T.limit, T.limit + 8) * (1 - ease(frame, T.limit + 30, T.limit + 60));
  const datadog = <>
    <Text x={0} y={0} size={14} weight={600}>Datadog</Text>
    <Text x={70} y={0} size={12.5} font="mono" weight={500} tone="muted">{fr ? "monitoring ✓" : "monitoring ✓"}</Text>
  </>;
  if (compact) {
    return <Box x={x} y={y} w={w} h={h} tone={tone} focus={oom ? 1 : 0} fill={flash} radius={16}>
      <Text x={x + 16} y={y + 22} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "redis · partagé" : "redis · shared"}</Text>
      <Tag x={x + w - 14} y={y + 22} anchor="end" size={11} text={state} tone={stateTone} appear={oom ? pop(frame, T.limit) : 1} />
      <Meter x={x + 16} y={y + 44} w={w - 32} h={10} value={level} limit={.999} tone={tone} />
      <line x1={x + 16} x2={x + w - 16} y1={y + 68} y2={y + 68} stroke="var(--scene-hairline)" strokeWidth={1} opacity={.6} />
      <g transform={`translate(${x + 16} ${y + 86})`}>{datadog}</g>
      <Tag x={x + w - 14} y={y + 86} anchor="end" size={11} tone={alertTone} text={fr ? "∅ aucune alerte mémoire" : "∅ no memory alert"} appear={oom ? .7 + .3 * pop(frame, T.limit) : 1} />
    </Box>;
  }
  const gauge = { x: x + 24, y: y + 54, w: 26, h: h - 78 };
  const filled = Math.min(1, level) * gauge.h;
  return <>
    <Box x={x} y={y} w={w} h={h} tone={tone} focus={oom ? 1 - .5 * ease(frame, T.limit + 30, T.limit + 70) : 0} fill={flash} radius={18}>
      <Text x={x + 20} y={y + 24} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "redis · partagé" : "redis · shared"}</Text>
      <rect x={gauge.x} y={gauge.y} width={gauge.w} height={gauge.h} rx={gauge.w / 2} style={{ fill: tint("ink", 8) }} />
      <rect className={oom ? "scene-glow" : undefined} x={gauge.x} y={gauge.y + gauge.h - filled} width={gauge.w} height={filled} rx={gauge.w / 2} fill={TONE[tone]} style={{ color: TONE[tone] }} />
      <line x1={gauge.x - 6} x2={gauge.x + gauge.w + 6} y1={gauge.y} y2={gauge.y} stroke={TONE.danger} strokeWidth={1.5} strokeDasharray="2 3" />
      <Text x={gauge.x + gauge.w + 16} y={gauge.y} size={11} font="mono" weight={600} tone="danger" caps>{fr ? "limite mémoire" : "memory limit"}</Text>
      <Text x={gauge.x + gauge.w + 16} y={gauge.y + gauge.h - 14} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "mémoire" : "memory"}</Text>
      <Tag x={gauge.x + gauge.w + 16} y={gauge.y + gauge.h * (1 - Math.min(1, level)) + (oom ? 30 : 18)} anchor="start" size={12} text={state} tone={stateTone} appear={oom ? pop(frame, T.limit) : ease(frame, 20, 34)} />
      {oom && frame < T.limit + 60 ? <Pulse x={gauge.x + gauge.w / 2} y={gauge.y} frame={frame} at={T.limit} period={30} r={12} tone="danger" /> : null}
    </Box>
    <g {...enter(frame, 22)}>
      <Box x={x} y={y + h + 16} w={w} h={48} tone={alertTone} fill={flash * .6} radius={14}>
        <g transform={`translate(${x + 16} ${y + h + 32})`}>{datadog}</g>
        <Text x={x + 16} y={y + h + 50} size={12.5} font="mono" weight={600} tone={alertTone}>{fr ? "∅ aucune alerte mémoire" : "∅ no memory alert"}</Text>
      </Box>
    </g>
  </>;
}

/** One isolated instance after the split: its own gauge, its own limit. */
function IsolatedCard({ frame, compact, rect, name, level, full, fr }: { frame: number; compact: boolean; rect: { x: number; y: number; w: number; h: number }; name: string; level: number; full: boolean; fr: boolean }) {
  const { x, y, w, h } = rect;
  const tone: Tone = full ? "danger" : "line";
  const focus = full ? 1 - .5 * ease(frame, T.limitB + 20, T.limitB + 60) : 0;
  const oomTag = <Tag x={x + w - 14} y={compact ? y + 22 : y + h / 2} anchor="end" size={11} text="OOM" tone="danger" appear={full ? pop(frame, T.limitB) : 0} />;
  if (compact) {
    return <Box x={x} y={y} w={w} h={h} tone={tone} focus={focus} radius={16}>
      <Text x={x + 16} y={y + 22} size={11} font="mono" weight={600} tone="muted" caps>{name}</Text>
      {oomTag}
      <Meter x={x + 16} y={y + 44} w={w - 32} h={10} value={level} limit={.999} />
      <line x1={x + 16} x2={x + w - 16} y1={y + 68} y2={y + 68} stroke="var(--scene-hairline)" strokeWidth={1} opacity={.6} />
      <Text x={x + 16} y={y + 86} size={12.5} font="mono" weight={500} tone="muted">{fr ? "une instance isolée par usage" : "one isolated instance per workload"}</Text>
    </Box>;
  }
  return <Box x={x} y={y} w={w} h={h} tone={tone} focus={focus} radius={12}>
    <Text x={x + 16} y={y + 17} size={12.5} font="mono" weight={600} tone={full ? "danger" : "ink"}>{name}</Text>
    <Meter x={x + 16} y={y + 31} w={w - 96} h={7} value={level} limit={.999} />
    {oomTag}
    {full && frame < T.limitB + 44 ? <Pulse x={x + w - 80} y={y + 34} frame={frame} at={T.limitB} period={44} r={8} tone="danger" /> : null}
  </Box>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.verdictA + 30,
  title: { en: "One pool, four outages", fr: "Un pool, quatre pannes" },
  caption: {
    en: "The outage was not four independent failures but one exhausted memory limit shared by four responsibilities. Isolated instances keep the same spike inside the cache.",
    fr: "La panne n’était pas quatre défaillances indépendantes, mais une seule limite mémoire épuisée et partagée par quatre responsabilités. Des instances isolées gardent le même pic dans le cache.",
  },
  beats: [
    { at: 0, text: { en: "Memory creeps up slowly. Datadog is watching, but no alert exists for Redis memory.", fr: "La mémoire monte lentement. Datadog surveille, mais aucune alerte n’existe pour la mémoire Redis." } },
    { at: T.spike, text: { en: "On a weekend, a sudden spike in data volume pushes the cache over the edge: OOM.", fr: "Un week-end, un pic de volume inattendu fait déborder le cache : OOM." } },
    { at: T.cascade, text: { en: "Everything shares that pool: BullMQ stops, users can’t log in, anti-brute force goes offline.", fr: "Tout partage ce pool : BullMQ s’arrête, plus de connexion, l’anti-brute force tombe." } },
    { at: T.split, text: { en: "The fix: caching, queues and sessions each get their own isolated Redis instance.", fr: "La correction : le cache, les files d’attente et les sessions ont chacun leur instance Redis isolée." } },
    { at: T.spikeB, text: { en: "Same spike: the cache instance hits its own limit, jobs and sessions keep running.", fr: "Même pic : l’instance cache bute sur sa limite, les jobs et les sessions continuent." } },
  ],
  Stage,
});
