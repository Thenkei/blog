import { Box, Camera, Dot, ease, easeOut, enter, hash, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type Localized, type SceneStageProps } from "../types";

// Timeline (30 fps). Each workload arrives as a card and docks into the same
// instance (a new slice of the one memory pool); then clients and cached
// objects grow and the cache slice swells toward the single limit.
const T = {
  cache: 14,
  bull: 84,
  sessions: 134,
  rate: 184,
  pool: 240,
  grow: 300,
  grown: 404,
  end: 480,
} as const;

/** Frames between a card's entrance and the start of its flight, and the flight itself. */
const HOLD = 24;
const FLIGHT = 28;

type Workload = {
  key: "cache" | "bull" | "sessions" | "rate";
  at: number;
  name: Localized;
  role: Localized;
  share: number;
  /** Swatch / pool-slice colour: the cache is the actor, the others are neutral shades. */
  shade: number;
};

const WORKLOADS: readonly Workload[] = [
  { key: "cache", at: T.cache, name: { en: "Cache", fr: "Cache" }, role: { en: "sub-ms reads", fr: "lecture < 1 ms" }, share: .05, shade: 100 },
  { key: "bull", at: T.bull, name: { en: "BullMQ", fr: "BullMQ" }, role: { en: "background jobs", fr: "jobs d’arrière-plan" }, share: .11, shade: 46 },
  { key: "sessions", at: T.sessions, name: { en: "Authentication", fr: "Authentification" }, role: { en: "user sessions", fr: "sessions" }, share: .11, shade: 32 },
  { key: "rate", at: T.rate, name: { en: "Security", fr: "Sécurité" }, role: { en: "anti-brute force", fr: "anti-brute force" }, share: .12, shade: 20 },
];

const CACHE_GROWN = .56;
const CLIENTS_EARLY = 4;

type Rect = { x: number; y: number; w: number; h: number };
type Pt = readonly [number, number];

const bezier = (p0: Pt, p1: Pt, p2: Pt, t: number): [number, number] => [
  (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
  (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
];

const docked = (workload: Workload) => workload.at + HOLD + FLIGHT;

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact
    ? {
      rail: { x: 20, y: 60, w: 500 },
      card: { x: 20, y: 94, w: 500, h: 288 },
      slot: (i: number): Rect => ({ x: 36, y: 138 + i * 46, w: 468, h: 38 }),
      bar: { x: 36, y: 346, w: 468, h: 18 },
      stage: { x: 20, y: 398, w: 236, h: 104 },
      inputs: { x: 272, y: 398, w: 248, h: 104 },
      inputsFull: { x: 20, y: 398, w: 500, h: 104 },
    }
    : {
      rail: { x: 380, y: 38, w: 540 },
      card: { x: 40, y: 72, w: 560, h: 312 },
      slot: (i: number): Rect => ({ x: 60, y: 122 + i * 50, w: 520, h: 42 }),
      bar: { x: 60, y: 344, w: 520, h: 20 },
      stage: { x: 640, y: 112, w: 280, h: 64 },
      inputs: { x: 640, y: 208, w: 280, h: 176 },
      inputsFull: { x: 640, y: 112, w: 280, h: 272 },
    };
  const { rail, card, bar } = L;
  const stageCard: Rect = compact ? { x: L.stage.x, y: L.stage.y + 26, w: L.stage.w, h: 62 } : L.stage;

  const growth = ease(frame, T.grow, T.grown);
  const pressure = ease(frame, T.grow + 50, T.grown);
  // Once every workload has docked, the arrival lane retires and the cache inputs take its room.
  const laneOut = ease(frame, T.pool, T.pool + 14);
  const expand = ease(frame, T.pool + 4, T.pool + 34);
  const inputs: Rect = { x: lerp(L.inputs.x, L.inputsFull.x, expand), y: lerp(L.inputs.y, L.inputsFull.y, expand), w: lerp(L.inputs.w, L.inputsFull.w, expand), h: lerp(L.inputs.h, L.inputsFull.h, expand) };
  const poolFocus = ease(frame, T.pool, T.pool + 16) * (1 - ease(frame, T.grow + 10, T.grow + 30));

  const shares = WORKLOADS.map((workload) => (workload.key === "cache" ? lerp(workload.share, CACHE_GROWN, growth) : workload.share) * easeOut(frame, docked(workload) - 4, docked(workload) + 22));
  const offsets = shares.map((_, index) => shares.slice(0, index).reduce((sum, share) => sum + share, 0));
  const used = shares.reduce((sum, share) => sum + share, 0);

  // Time runs from the cache shipping (2–3 years before) toward the outage weekend.
  const cursor = lerp(0, .36, ease(frame, T.cache, docked(WORKLOADS[3]!))) + (.92 - .36) * ease(frame, T.grow, T.grown + 20);
  const cursorX = rail.x + rail.w * cursor;

  const lean = (point: Pt): Pt => [lerp(width / 2, point[0], .22), lerp(height / 2, point[1], .22)];
  const camera = [
    { at: 0 },
    { at: T.grow + 6, dur: 90, zoom: compact ? 1 : 1.025, focus: lean([bar.x + bar.w * .8, bar.y]) },
  ];

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* Time rail: from the feature shipping to the outage weekend. */}
    <g {...enter(frame, 0, { from: "none" })}>
      <line x1={rail.x} x2={rail.x + rail.w} y1={rail.y} y2={rail.y} stroke="var(--scene-hairline)" strokeWidth={1} />
      <line x1={rail.x} x2={cursorX} y1={rail.y} y2={rail.y} stroke={TONE.line} strokeWidth={2} strokeLinecap="round" />
      <line x1={rail.x + rail.w} x2={rail.x + rail.w} y1={rail.y - 5} y2={rail.y + 5} stroke={TONE.danger} strokeWidth={1.5} />
      <Text x={rail.x} y={rail.y + 16} size={13} font="mono" weight={500} tone="muted">{fr ? "2 à 3 ans avant l’incident" : "2–3 years before the incident"}</Text>
      <Text x={rail.x + rail.w} y={rail.y + 16} size={13} font="mono" weight={500} tone={pressure > .5 ? "danger" : "muted"} anchor="end">{fr ? "le week-end de la panne" : "the outage weekend"}</Text>
      <Dot x={cursorX} y={rail.y} r={4.5} tone="line" />
      <Pulse x={rail.x + rail.w} y={rail.y} frame={frame} at={T.grown} period={44} r={6} tone="danger" />
    </g>

    {/* The one instance: every workload docks here and takes a slice of the same pool. */}
    <g {...enter(frame, 4)}>
      <Box x={card.x} y={card.y} w={card.w} h={card.h} tone={poolFocus > 0 ? "hot" : "line"} focus={poolFocus} radius={18}>
        <Text x={card.x + 20} y={card.y + 25} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "une seule instance redis" : "one redis instance"}</Text>
        <Tag x={card.x + card.w - 16} y={card.y + 25} anchor="end" size={11} tone="hot" text={fr ? "4 usages · 1 limite" : "4 workloads · 1 limit"} appear={pop(frame, T.pool + 6)} />
        {WORKLOADS.map((workload, index) => {
          const slot = L.slot(index);
          return <rect key={workload.key} x={slot.x} y={slot.y} width={slot.w} height={slot.h} rx={10} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="3 5" opacity={1 - ease(frame, docked(workload) - 6, docked(workload))} />;
        })}
      </Box>
    </g>

    <Pool frame={frame} compact={compact} fr={fr} bar={bar} shares={shares} offsets={offsets} used={used} pressure={pressure} />

    {/* Arrival lane (wide: right column, compact: below the instance). */}
    <g {...enter(frame, 8)} opacity={enter(frame, 8).opacity * (1 - laneOut)}>
      <Text x={L.stage.x} y={compact ? L.stage.y + 10 : L.stage.y - 16} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "nouveaux besoins → redis" : "new needs → redis"}</Text>
      <rect x={stageCard.x} y={stageCard.y} width={stageCard.w} height={stageCard.h} rx={14} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="3 5" opacity={.8} />
    </g>
    <Tag x={card.x + card.w - 16} y={card.y + 25} anchor="end" text={fr ? "rapide · fiable" : "fast · reliable"} tone="line" size={11}
      appear={pop(frame, T.bull + 4) * (1 - ease(frame, T.pool - 8, T.pool + 2))} />

    <Inputs frame={frame} compact={compact} fr={fr} rect={inputs} growth={growth} expand={expand} />

    {WORKLOADS.map((workload, index) => {
      const slot = L.slot(index);
      const flight = ease(frame, workload.at + HOLD, docked(workload));
      const arrived = frame >= docked(workload);
      const from: Pt = [stageCard.x + stageCard.w / 2, stageCard.y + stageCard.h / 2];
      const to: Pt = [slot.x + slot.w / 2, slot.y + slot.h / 2];
      const control: Pt = compact ? [lerp(from[0], to[0], .5), lerp(from[1], to[1], .5)] : [lerp(from[0], to[0], .4), to[1] + 12];
      const [cx, cy] = bezier(from, control, to, flight);
      const w = lerp(stageCard.w, slot.w, flight);
      const h = lerp(stageCard.h, slot.h, flight);
      const rect = { x: cx - w / 2, y: cy - h / 2, w, h };
      const isCache = workload.key === "cache";
      const appear = enter(frame, workload.at, { from: compact ? "up" : "right", distance: 22 });
      const settle = arrived ? pop(frame, docked(workload), 220) : 1;
      const tone: Tone = isCache && pressure > .5 ? "danger" : "line";
      const role = isCache && growth > .5 ? (fr ? "objets massifs" : "massive objects") : workload.role[locale];
      return <g key={workload.key} opacity={appear.opacity} transform={flight > 0 ? undefined : appear.transform}>
        <Resident rect={rect} t={flight} name={workload.name[locale]} role={role} shade={workload.shade} tone={tone}
          focus={Math.max(arrived ? 1 - ease(frame, docked(workload) + 6, docked(workload) + 30) : 1, isCache ? pressure : 0)}
          scale={lerp(.97, 1, settle)} compact={compact} />
        {arrived && frame < docked(workload) + 40 ? <Pulse x={slot.x + 20} y={slot.y + slot.h / 2} frame={frame} at={docked(workload)} period={40} r={6} tone="line" /> : null}
      </g>;
    })}
  </Camera>;
}

/** A workload card: stacked on the arrival lane (t=0), inline once docked (t=1). */
function Resident({ rect, t, name, role, shade, tone, focus, scale, compact }: {
  rect: Rect;
  t: number;
  name: string;
  role: string;
  shade: number;
  tone: Tone;
  focus: number;
  scale: number;
  compact: boolean;
}) {
  const { x, y, w, h } = rect;
  const cy = y + h / 2;
  const nameX = lerp(x + 18, x + 36, t);
  const nameY = lerp(y + h / 2 - 11, cy, t);
  const roleX = lerp(x + 18, x + (compact ? 212 : 230), t);
  const roleY = lerp(y + h / 2 + 13, cy, t);
  const swatch = tone === "danger" ? TONE.danger : shade >= 100 ? TONE.line : tint("line", shade + 14);
  return <g transform={`translate(${x + w / 2} ${cy}) scale(${scale}) translate(${-(x + w / 2)} ${-cy})`}>
    <Box x={x} y={y} w={w} h={h} tone={tone} focus={focus} radius={lerp(14, 10, t)} />
    <circle cx={x + 20} cy={cy} r={4.5} fill={swatch} opacity={t} />
    <Text x={nameX} y={nameY} size={lerp(18, 16, t)} weight={600} tone={tone === "danger" ? "danger" : "ink"}>{name}</Text>
    <Text x={roleX} y={roleY} size={12.5} font="mono" weight={500} tone="muted">{role}</Text>
  </g>;
}

/** The shared memory pool: one bar, one limit, a slice per workload. */
function Pool({ frame, compact, fr, bar, shares, offsets, used, pressure }: {
  frame: number;
  compact: boolean;
  fr: boolean;
  bar: { x: number; y: number; w: number; h: number };
  shares: readonly number[];
  offsets: readonly number[];
  used: number;
  pressure: number;
}) {
  const free = 1 - used;
  const freeW = free * bar.w;
  return <g {...enter(frame, 10)}>
    <Text x={bar.x} y={bar.y - 16} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "pool mémoire partagé" : "shared memory pool"}</Text>
    <Text x={bar.x + bar.w} y={bar.y - 16} size={11} font="mono" weight={600} tone="danger" anchor="end" caps opacity={1 - pressure}>{fr ? "limite mémoire" : "memory limit"}</Text>
    <Tag x={bar.x + bar.w} y={bar.y - 16} anchor="end" size={11} tone="danger" text={fr ? "limite · presque plus de marge" : "limit · almost no headroom"} appear={pop(frame, T.grow + 60) * pressure} />
    <rect x={bar.x} y={bar.y} width={bar.w} height={bar.h} rx={bar.h / 2} style={{ fill: tint("ink", 8) }} />
    <clipPath id={`pool-${compact ? "c" : "w"}`}><rect x={bar.x} y={bar.y} width={bar.w} height={bar.h} rx={bar.h / 2} /></clipPath>
    <g clipPath={`url(#pool-${compact ? "c" : "w"})`}>
      {shares.map((share, index) => {
        const segW = share * bar.w;
        if (segW <= .5) return null;
        const isCache = index === 0;
        const fill = isCache ? (pressure > .5 ? TONE.danger : TONE.line) : tint("line", WORKLOADS[index]!.shade + 14);
        return <rect key={index} className={isCache && pressure > .5 ? "scene-glow" : undefined} x={bar.x + offsets[index]! * bar.w} y={bar.y} width={segW} height={bar.h}
          style={{ fill, color: fill }} stroke="var(--scene-card)" strokeWidth={index > 0 ? 1.5 : 0} />;
      })}
    </g>
    <line x1={bar.x + bar.w} x2={bar.x + bar.w} y1={bar.y - 6} y2={bar.y + bar.h + 6} stroke={TONE.danger} strokeWidth={1.5} strokeDasharray="2 3" />
    {freeW > 70 ? <Text x={bar.x + used * bar.w + freeW / 2} y={bar.y + bar.h / 2 + .5} size={12} font="mono" weight={500} tone="muted" anchor="middle" opacity={Math.min(1, (freeW - 70) / 30)}>{fr ? "libre" : "free"}</Text> : null}
    {frame < T.pool + 54 ? <Pulse x={bar.x + bar.w} y={bar.y + bar.h / 2} frame={frame} at={T.pool + 4} period={50} r={8} tone="hot" /> : null}
  </g>;
}

/** What the cache stores: few clients and tiny objects, then many clients and massive structures. */
function Inputs({ frame, compact, fr, rect, growth, expand }: { frame: number; compact: boolean; fr: boolean; rect: Rect; growth: number; expand: number }) {
  const { x, y, w, h } = rect;
  const cols = 5 + (compact ? 0 : 2);
  const rows = 3;
  const gap = compact ? 18 : 20;
  const gapX = compact ? gap : lerp(20, 38, expand);
  // Two layouts: side by side (sharing the column with the arrival lane) and
  // the roomier one it re-flows into once every workload has docked.
  const A = compact
    ? { grid: [x + 22, y + 50], obj: [x + w - 58, y + 66], objHead: [x + w - 58, y + 22], clientTag: [x + 18, y + 22], objTag: [x + w - 18, y + 22], max: 40 }
    : { grid: [x + 22, y + 66], obj: [x + w - 70, y + 100], objHead: [x + w - 70, y + 22], clientTag: [x + 18, y + h - 26], objTag: [x + w - 70, y + h - 26], max: 56 };
  const B = compact
    ? { grid: [x + 22, y + 50], obj: [x + w - 64, y + 60], objHead: [x + w - 64, y + 22], clientTag: [x + 150, y + 68], objTag: [x + w - 118, y + 68], max: 52 }
    : { grid: [x + 22, y + 58], obj: [x + w / 2, y + h - 72], objHead: [x + 18, y + 136], clientTag: [x + w - 18, y + 22], objTag: [x + w - 18, y + 136], max: 84 };
  const at = (key: "grid" | "obj" | "objHead" | "clientTag" | "objTag"): [number, number] => [lerp(A[key][0]!, B[key][0]!, expand), lerp(A[key][1]!, B[key][1]!, expand)];
  // Labels do not travel: they fade out, jump while invisible, and fade back in.
  const snap = (key: "objHead" | "clientTag" | "objTag"): [number, number] => expand < .5 ? [A[key][0]!, A[key][1]!] : [B[key][0]!, B[key][1]!];
  const labelOpacity = expand < .5 ? 1 - Math.min(1, expand / .25) : Math.min(1, Math.max(0, (expand - .75) / .25));
  const [gridX, gridY] = at("grid");
  const [objX, objY] = at("obj");
  const [headX, headY] = compact ? at("objHead") : snap("objHead");
  const [ctX, ctY] = compact ? at("clientTag") : snap("clientTag");
  const [otX, otY] = compact ? at("objTag") : snap("objTag");
  const size = lerp(10, lerp(A.max, B.max, expand), easeOut(frame, T.grow + 8, T.grown));
  const inner = Math.floor(lerp(0, 4, growth));
  const appearAt = 20;
  const grown = growth > .5;
  const tagAnchor = compact || expand <= .5 ? "start" : "end";
  const tagOpacity = compact ? expand : labelOpacity;
  const clientHeadX = x + 18;
  return <g {...enter(frame, appearAt)}>
    <Box x={x} y={y} w={w} h={h} tone="line" radius={16}>
      <Text x={clientHeadX} y={y + 22} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "clients" : "clients"}</Text>
      <Text x={headX} y={headY} size={11} font="mono" weight={600} tone="muted" caps anchor={!compact && expand > .5 ? "start" : "middle"} opacity={!compact ? labelOpacity : 1}>{compact ? (fr ? "objet" : "object") : fr ? "objet en cache" : "cached object"}</Text>
      {Array.from({ length: cols * rows }, (_, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const early = index < CLIENTS_EARLY;
        const start = stagger(Math.floor(hash(index + 3) * 18), T.grow, 4);
        const lit = early ? 1 : easeOut(frame, start, start + 14);
        const cx = gridX + col * gapX;
        const cy = gridY + row * gap;
        return <g key={index}>
          <circle cx={cx} cy={cy} r={4.5} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} />
          {lit > 0 ? <circle cx={cx} cy={cy} r={4.5 * lit} fill={TONE.line} /> : null}
        </g>;
      })}
      {/* The object grows into a nested structure. */}
      <rect className="scene-card" x={objX - size / 2} y={objY - size / 2} width={size} height={size} rx={Math.min(10, size / 4)} style={{ fill: tint(grown ? "danger" : "line", 20) }} stroke={TONE[grown ? "danger" : "line"]} strokeWidth={1} />
      {Array.from({ length: inner }, (_, index) => {
        const lineY = objY - size / 2 + 14 + index * (size - 28) / 3;
        return <line key={index} x1={objX - size / 2 + 10} x2={objX + size / 2 - 10 - (index % 2) * size * .22} y1={lineY} y2={lineY} stroke={TONE.danger} strokeOpacity={.6} strokeWidth={1.5} strokeLinecap="round" />;
      })}
      <g opacity={tagOpacity}>
        <Tag x={ctX} y={ctY} anchor={tagAnchor} size={11} tone={grown ? "danger" : "muted"} text={grown ? (fr ? "de plus en plus" : "more and more") : (fr ? "peu nombreux" : "few")} />
        <Tag x={otX} y={otY} anchor={compact ? "end" : expand > .5 ? "end" : "middle"} size={11} tone={grown ? "danger" : "muted"} text={grown ? (fr ? "massif" : "massive") : (fr ? "minuscule" : "tiny")} />
      </g>
    </Box>
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.grown + 30,
  title: { en: "How everything ended up in one Redis", fr: "Comment tout a fini dans un seul Redis" },
  caption: {
    en: "A cache built for tiny objects, then BullMQ, sessions and rate limiting, all in one instance. As clients grew, the cache's share of the single memory limit grew with them.",
    fr: "Un cache pensé pour des objets minuscules, puis BullMQ, les sessions et le rate limiting, tous dans une seule instance. Avec la croissance des clients, la part du cache dans l’unique limite mémoire a grossi elle aussi.",
  },
  beats: [
    { at: 0, text: { en: "2–3 years before the incident: a cache for sub-millisecond reads, few clients, tiny objects.", fr: "2 à 3 ans avant l’incident : un cache pour lire sous la milliseconde, peu de clients, des objets minuscules." } },
    { at: T.bull, text: { en: "Redis is fast and reliable, so it becomes the default: BullMQ moves in for background jobs.", fr: "Redis est rapide et fiable, il devient la solution par défaut : BullMQ s’y installe pour les jobs." } },
    { at: T.sessions, text: { en: "Then authentication sessions, then anti-brute force and rate limiting.", fr: "Puis les sessions d’authentification, puis l’anti-brute force et le rate limiting." } },
    { at: T.pool, text: { en: "Four unrelated workloads now share one instance and one memory limit.", fr: "Quatre usages sans rapport partagent désormais une instance et une seule limite mémoire." } },
    { at: T.grow, text: { en: "Clients grow, cached objects become massive structures, and the cache silently eats the shared pool.", fr: "Les clients se multiplient, les objets deviennent massifs : le cache dévore en silence le pool commun." } },
  ],
  Stage,
});
