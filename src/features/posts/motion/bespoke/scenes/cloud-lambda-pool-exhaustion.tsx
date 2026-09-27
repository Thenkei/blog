import { Box, Camera, CodeBlock, Comet, Dot, ease, easeOut, enter, lerp, Meter, pop, Pulse, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Same dashboard spike replayed twice. Each tile is one Lambda instance holding
// one database connection. Act 1: no cap, the database hits its limit.
// Act 2: ReservedConcurrentExecutions caps instances; the excess waits at the
// API Gateway; idle instances drop their connection; the next request pays a cold start.
const DB_LIMIT = 100;
const SPIKE = 50;
const DEMAND_PEAK = 110;
/** Drawn below the DB limit; the article gives no value, so none is printed. */
const CAP = 80;
const CLIMB = 70;

const T = {
  spike1: 20,
  climb1: 44,
  fatal: Math.ceil(44 + (DB_LIMIT - SPIKE) / (DEMAND_PEAK - SPIKE) * CLIMB),
  reset: 160,
  fix: 176,
  spike2: 214,
  climb2: 236,
  demandEnd: 318,
  idle: 334,
  cold: 376,
  end: 500,
} as const;
const COLD_STEP = 26;

function demand(frame: number, spikeAt: number, climbAt: number) {
  if (frame < spikeAt) return 0;
  if (frame < climbAt) return Math.round(SPIKE * easeOut(frame, spikeAt, spikeAt + 14));
  return Math.round(lerp(SPIKE, DEMAND_PEAK, Math.min(1, (frame - climbAt) / CLIMB)));
}
/** First frame at which demand reaches `count` instances (inverse of `demand`). */
function spawnAt(count: number, spikeAt: number, climbAt: number) {
  if (count <= SPIKE) return spikeAt + 14 * Math.min(1, (count / SPIKE) ** 2);
  return climbAt + (count - SPIKE) / (DEMAND_PEAK - SPIKE) * CLIMB;
}

type Pt = readonly [number, number];
type Rect = { x: number; y: number; w: number; h: number };
type Layout = {
  card: Rect;
  grid: { x: number; y: number; cols: number; rows: number; cell: number };
  lineLabelX: number;
  db: Rect;
  dbIn: Pt;
  code: { x: number; y: number; w: number; size: number };
  lower: Rect;
};

const WIDE_LAYOUT: Layout = {
  card: { x: 40, y: 64, w: 420, h: 328 },
  grid: { x: 72, y: 98, cols: 10, rows: 12, cell: 24 },
  lineLabelX: 330,
  db: { x: 500, y: 64, w: 420, h: 104 },
  dbIn: [500, 116],
  code: { x: 500, y: 188, w: 420, size: 14 },
  lower: { x: 500, y: 300, w: 420, h: 92 },
};

const COMPACT_LAYOUT: Layout = {
  card: { x: 20, y: 56, w: 500, h: 172 },
  grid: { x: 40, y: 94, cols: 20, rows: 6, cell: 19.5 },
  lineLabelX: 446,
  db: { x: 20, y: 242, w: 500, h: 84 },
  dbIn: [270, 242],
  code: { x: 20, y: 340, w: 500, size: 13 },
  lower: { x: 20, y: 442, w: 500, h: 62 },
};

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT_LAYOUT : WIDE_LAYOUT;
  const G = L.grid;
  const total = G.cols * G.rows;

  const act2 = frame >= T.reset;
  const clear = act2 ? 1 : 1 - ease(frame, T.reset - 16, T.reset);
  const spikeAt = act2 ? T.spike2 : T.spike1;
  const climbAt = act2 ? T.climb2 : T.climb1;
  const wanted = act2 ? (frame >= T.demandEnd ? 0 : demand(frame, T.spike2, T.climb2)) : demand(frame, T.spike1, T.climb1);
  const peakWanted = act2 ? demand(Math.min(frame, T.demandEnd - 1), T.spike2, T.climb2) : wanted;
  const running = act2 ? Math.min(peakWanted, CAP) : Math.min(wanted, total);
  const queued = act2 ? Math.max(0, peakWanted - CAP) * (1 - ease(frame, T.demandEnd, T.demandEnd + 20)) : 0;
  const coldOn = act2 && frame >= T.cold;
  const coldConnected = act2 && frame >= T.cold + 2 * COLD_STEP;
  // Idle instances tear down their connection one after the other.
  const releaseAt = (i: number) => T.idle + ((i * 37) % CAP) / CAP * 28;
  const released = act2 ? Array.from({ length: running }, (_, i) => frame >= releaseAt(i)).filter(Boolean).length : 0;
  const connections = act2 ? running - released + (coldConnected ? 1 : 0) : Math.min(running, DB_LIMIT);
  const fatal = !act2 && frame >= T.fatal;

  const t = {
    grid: fr ? "instances Lambda · 1 connexion chacune" : "Lambda instances · 1 connection each",
    limit: fr ? "limite DB" : "DB limit",
    cap: fr ? "plafond" : "cap",
    db: fr ? "monolithe fini, avec état" : "finite, stateful monolith",
    conns: fr ? "connexions ouvertes" : "open connections",
    queue: fr ? "en file ou throttlées" : "queued or throttled",
    idle: fr ? "inactives → connexion fermée" : "idle → connection closed",
    cold: fr ? "cold start suivant" : "next cold start",
    steps: fr ? ["réveil Lambda", "handshake TLS", "requête"] : ["Lambda wakes", "TLS handshake", "query"],
  };

  const cellXY = (i: number): [number, number] => {
    const col = i % G.cols;
    const row = Math.floor(i / G.cols);
    return [G.x + col * G.cell + G.cell / 2, G.y + (G.rows - 1 - row) * G.cell + G.cell / 2];
  };
  const rowLineY = (count: number) => G.y + (G.rows - count / G.cols) * G.cell;
  const limitY = rowLineY(DB_LIMIT);
  const capY = rowLineY(CAP);
  const gridW = G.cols * G.cell;
  const capOn = act2 ? easeOut(frame, T.fix + 26, T.fix + 44) : 0;

  // Each new instance sends its connection request to Postgres as a packet.
  const packets = Array.from({ length: Math.min(total, DEMAND_PEAK) }, (_, i) => {
    if (act2 && i >= CAP) return null;
    if (i % 2 === 1) return null;
    const born = spawnAt(i + 1, spikeAt, climbAt);
    const k = ease(frame, born, born + 16, (v) => v);
    if (k <= 0 || k >= 1) return null;
    const from = cellXY(i);
    const mid: Pt = compact ? [from[0], lerp(from[1], L.dbIn[1], .6)] : [lerp(from[0], L.dbIn[0], .7), from[1]];
    const rejected = !act2 && i >= DB_LIMIT;
    return <Comet key={i} points={[from, mid, L.dbIn]} t={k} tone={rejected ? "danger" : "line"} r={2.6} tail={.2} opacity={.8 * clear} />;
  });

  const tiles = Array.from({ length: total }, (_, i) => {
    const [cx, cy] = cellXY(i);
    const s = G.cell - 5;
    const isCold = coldOn && i === 0;
    const on = i < running && !(act2 && frame >= releaseAt(i));
    const born = spawnAt(i + 1, spikeAt, climbAt);
    const grow = on ? pop(frame, born, 220) : 1;
    const rejected = !act2 && on && i >= DB_LIMIT;
    const tone: Tone = isCold ? "hot" : rejected ? "danger" : "line";
    const filled = on || isCold;
    const sz = s * (filled ? .55 + .45 * Math.min(1, grow) : 1);
    return <rect
      key={i}
      className={rejected || isCold ? "scene-glow" : undefined}
      x={cx - sz / 2} y={cy - sz / 2} width={sz} height={sz} rx={4}
      style={{ fill: filled ? tint(tone, rejected || isCold ? 70 : 55) : tint("ink", 5), color: TONE[tone] }}
      stroke={filled ? TONE[tone] : "none"} strokeOpacity={.7} strokeWidth={1}
      opacity={clear}
    />;
  });

  const D = L.db;
  const lower = L.lower;
  const gatewayOn = act2 ? easeOut(frame, T.spike2 + 24, T.spike2 + 40) * (1 - ease(frame, T.idle, T.idle + 16)) : 0;
  const coldPanel = act2 ? easeOut(frame, T.cold - 14, T.cold) : 0;
  const idleTag = act2 ? pop(frame, T.idle + 14) * (1 - ease(frame, T.cold - 16, T.cold - 4)) : 0;
  const step = (i: number) => ease(frame, T.cold + i * COLD_STEP, T.cold + (i + 1) * COLD_STEP - 4);
  const tls: Pt[] = [cellXY(0), [compact ? cellXY(0)[0] : lerp(cellXY(0)[0], L.dbIn[0], .7), compact ? lerp(cellXY(0)[1], L.dbIn[1], .6) : cellXY(0)[1]], L.dbIn];
  const tlsT = ease(frame, T.cold + COLD_STEP, T.cold + 2 * COLD_STEP - 4, (v) => v);

  const lean = (p: Pt): Pt => [lerp(width / 2, p[0], .2), lerp(height / 2, p[1], .2)];
  const camera = [
    { at: 0 },
    { at: T.climb1, zoom: 1.03, focus: lean([G.x + gridW / 2, limitY]) },
    { at: T.reset - 6, zoom: 1 },
    { at: T.fix - 4, zoom: 1.025, focus: lean([L.code.x + L.code.w / 2, L.code.y + 40]) },
    { at: T.spike2 + 20, zoom: 1.02, focus: lean([G.x + gridW / 2, capY]) },
    { at: T.cold - 10, zoom: 1.03, focus: lean([lower.x + lower.w / 2, lower.y + 40]) },
    { at: T.cold + 90, dur: 50, zoom: 1 },
  ];

  const dbTone: Tone = fatal ? "danger" : "line";
  const queueDots = Math.min(Math.round(queued), Math.floor((lower.w - 180) / 12));

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    <g {...enter(frame, 0)}>
      <Box {...L.card} tone="line" radius={16} />
      <Text x={L.card.x + 20} y={L.card.y + 22} size={11} weight={600} font="mono" tone="muted" caps>{t.grid}</Text>
    </g>
    <g opacity={easeOut(frame, 4, 20)}>{tiles}</g>

    {/* The DB limit and, in act 2, the concurrency cap on the same grid. */}
    <g opacity={easeOut(frame, 10, 24)}>
      <line x1={G.x - 6} x2={G.x + gridW + 6} y1={limitY} y2={limitY} stroke={TONE.danger} strokeWidth={1.25} strokeDasharray="4 4" />
      <Text x={L.lineLabelX} y={limitY - (compact ? 0 : 8)} size={11} weight={600} font="mono" tone="danger">{compact ? "100" : t.limit}</Text>
      {!compact ? <Text x={L.lineLabelX} y={limitY + 8} size={11} weight={500} font="mono" tone="muted">{`${DB_LIMIT} ${fr ? "connexions" : "connections"}`}</Text> : null}
    </g>
    {capOn > 0 ? <g opacity={capOn}>
      <line x1={G.x - 6} x2={G.x - 6 + (gridW + 12) * capOn} y1={capY} y2={capY} stroke={TONE.hot} strokeWidth={2} strokeLinecap="round" />
      <Text x={L.lineLabelX} y={capY} size={11} weight={600} font="mono" tone="hot">{t.cap}</Text>
    </g> : null}
    {!compact ? <Tag x={L.lineLabelX} y={rowLineY(SPIKE) + 10} anchor="start" text={fr ? "50 Lambdas d’un coup" : "50 Lambdas at once"} tone="line" size={11} appear={pop(frame, T.spike1 + 14) * (1 - ease(frame, T.climb1 + 16, T.climb1 + 28))} /> : null}
    {packets}

    {/* Postgres: one gauge, the same in both replays. */}
    <g {...enter(frame, 6, { from: compact ? "up" : "left" })}>
      <Box {...D} tone={dbTone} focus={fatal ? ease(frame, T.fatal, T.fatal + 8) * clear : 0} fill={fatal ? .6 * clear : 0} radius={16}>
        <Text x={D.x + 20} y={D.y + 26} size={18} weight={650}>Postgres</Text>
        <Text x={D.x + 112} y={D.y + 27} size={12} weight={500} font="mono" tone="muted">{t.db}</Text>
      </Box>
      <Meter
        x={D.x + 20} y={D.y + D.h - (compact ? 26 : 32)} w={D.w - 40} h={10}
        value={Math.min(1, connections / 120) * clear} limit={DB_LIMIT / 120} tone={fatal ? "danger" : act2 ? "ok" : "line"}
        label={compact ? undefined : t.conns} valueLabel={compact ? undefined : `${connections} / ${DB_LIMIT}`}
      />
      {compact ? <Text x={D.x + D.w - 20} y={D.y + 26} size={13} weight={600} font="mono" tone={fatal ? "danger" : "ink"} anchor="end">{`${connections} / ${DB_LIMIT}`}</Text> : null}
    </g>
    {fatal ? <Pulse x={L.dbIn[0]} y={L.dbIn[1]} frame={frame} at={T.fatal} period={36} r={12} tone="danger" /> : null}

    {/* Act 1: the error. Act 2: the fix, as configuration. */}
    <CodeBlock
      x={L.code.x} y={L.code.y} w={L.code.w} frame={frame} size={L.code.size} title="postgres.log"
      appear={fatal ? easeOut(frame, T.fatal - 2, T.fatal + 10) * clear : 0}
      lines={[{ text: "FATAL: sorry, too many clients already", tone: "danger", appearAt: T.fatal + 2 }]}
    />
    <CodeBlock
      x={L.code.x} y={L.code.y} w={L.code.w} frame={frame} size={L.code.size} title={fr ? "config Lambda" : "Lambda config"}
      appear={act2 ? easeOut(frame, T.fix - 6, T.fix + 8) : 0}
      highlight={frame >= T.fix + 30 ? 0 : undefined}
      lines={[
        { text: "ReservedConcurrentExecutions: N", tone: frame >= T.fix + 30 ? "hot" : undefined, appearAt: T.fix },
        { text: fr ? "// N < connexions max de la base" : "// N < the DB's max connections", appearAt: T.fix + 30 },
      ]}
    />

    {/* Act 2: the excess waits at the API Gateway. */}
    {gatewayOn > 0 ? <g opacity={gatewayOn}>
      <Box {...lower} h={compact ? lower.h : 64} tone="hot" radius={14}>
        <Text x={lower.x + 18} y={lower.y + 20} size={11} weight={600} font="mono" tone="muted" caps>API Gateway</Text>
        <Text x={lower.x + lower.w - 18} y={lower.y + 20} size={12} weight={600} font="mono" tone="hot" anchor="end">{t.queue}</Text>
        {Array.from({ length: queueDots }, (_, i) => <Dot key={i} x={lower.x + 24 + i * 12} y={lower.y + 44} r={3.6} tone="hot" halo={false} opacity={easeOut(frame, T.climb2 + (i / Math.max(1, queueDots)) * 40, T.climb2 + (i / Math.max(1, queueDots)) * 40 + 8)} />)}
        <Tag x={lower.x + lower.w - 18} y={lower.y + 44} anchor="end" text="429 · 503" tone="danger" size={11} appear={pop(frame, T.climb2 + 24)} />
      </Box>
    </g> : null}
    <Tag x={lower.x} y={lower.y + 20} anchor="start" text={t.idle} tone="ok" size={12} appear={idleTag} />

    {/* The price of dropping connections: a cold start that includes TLS. */}
    {coldPanel > 0 ? <g opacity={coldPanel}>
      <Text x={lower.x + 2} y={lower.y + 8} size={11} weight={600} font="mono" tone="hot" caps>{t.cold}</Text>
      {t.steps.map((label, i) => {
        const segW = (lower.w - 16) / 3;
        const x = lower.x + i * (segW + 8);
        const y = lower.y + (compact ? 24 : 26);
        const k = step(i);
        return <g key={label}>
          <rect className="scene-card" x={x} y={y} width={segW} height={34} rx={10} style={{ fill: "var(--scene-card)" }} />
          {k > 0 ? <rect x={x} y={y} width={Math.max(20, segW * k)} height={34} rx={10} style={{ fill: tint("hot", 22) }} /> : null}
          <rect x={x + .5} y={y + .5} width={segW - 1} height={33} rx={9.5} fill="none" stroke={TONE.hot} strokeOpacity={.25 + .5 * k} strokeWidth={1} />
          <Text x={x + segW / 2} y={y + 17.5} size={compact ? 12 : 13} weight={600} font="mono" tone={k > 0 ? "ink" : "muted"} anchor="middle">{label}</Text>
        </g>;
      })}
    </g> : null}
    <Comet points={tls} t={tlsT} tone="hot" r={4} tail={.3} />
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.fatal + 34,
  title: { en: "Horizontal compute vs one database", fr: "Compute horizontal contre une base" },
  caption: {
    en: "Every Lambda opens its own connection, so compute scaling becomes connection scaling. Capping concurrency and dropping idle connections protects the database, at the cost of throttled requests and heavier cold starts.",
    fr: "Chaque Lambda ouvre sa propre connexion : scaler le compute revient à scaler les connexions. Brider la concurrence et fermer les connexions inactives protège la base, au prix de requêtes throttlées et de cold starts plus lourds.",
  },
  beats: [
    { at: 0, text: { en: "A dashboard gets hammered: AWS spins up 50 concurrent Lambdas, each opening its own database connection.", fr: "Un dashboard est assailli : AWS lance 50 Lambdas concurrentes, chacune avec sa propre connexion à la base." } },
    { at: T.climb1, text: { en: "Several queries per widget: the Lambdas keep spawning. The database does not scale with them.", fr: "Plusieurs requêtes par widget : les Lambdas continuent d’apparaître. La base, elle, ne suit pas." } },
    { at: T.fatal, text: { en: "Past its connection limit, Postgres answers FATAL: sorry, too many clients already.", fr: "Au-delà de sa limite de connexions, Postgres répond FATAL: sorry, too many clients already." } },
    { at: T.fix, text: { en: "Same spike, ReservedConcurrentExecutions caps Lambdas below the DB limit. The excess waits or gets a 429/503.", fr: "Même pic, avec ReservedConcurrentExecutions sous la limite de la base. L’excédent attend ou reçoit un 429/503." } },
    { at: T.idle, text: { en: "Idle Lambdas ruthlessly tear down their connections, so none holds one hostage.", fr: "Les Lambdas inactives ferment impitoyablement leurs connexions : aucune n’en garde en otage." } },
    { at: T.cold, text: { en: "The price: with no warm pool, the next cold start is Lambda wake-up, TLS handshake with the DB, then query.", fr: "Le prix : sans pool au chaud, le cold start suivant enchaîne réveil Lambda, handshake TLS, puis requête." } },
  ],
  Stage,
});
