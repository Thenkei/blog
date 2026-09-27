import { Axis, Box, Camera, CodeBlock, ease, easeOut, enter, hash, lerp, Meter, pop, Pulse, Tag, Text, tint, TONE, type CodeLine, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Two replays of the same deploy, on the same chart. Act 1: every agent
// reconnects at 0 s. Act 2: each agent first waits a jittered 1–10 s delay.
const T = {
  drain1: 44,
  sweep1: 54,
  melt: 76,
  reset: 140,
  fix: 166,
  drain2: 240,
  sweep2: 250,
  settled: 420,
  end: 500,
} as const;

const AGENTS = 60;
const SECONDS = 12;
const BUCKET = .5;
/** Reconnects one half-second bucket can absorb. */
const CAPACITY = 12;
const SWEEP_FPS = 14;

// Deterministic "random" delays, stratified over [1, 10] s (no Math.random).
const JITTER = Array.from({ length: AGENTS }, (_, i) => 1 + 9 * (((i * 37) % AGENTS) + hash(i + 9)) / AGENTS);

type Slot = { bucket: number; col: number; row: number };
function stack(delays: readonly number[], perRow: number): Slot[] {
  const order = delays.map((d, i) => ({ d, i, bucket: Math.floor(d / BUCKET) })).sort((a, b) => a.d - b.d || a.i - b.i);
  // Rank of each agent inside its bucket, derived without a mutable counter.
  const rank = order.map((item, k) => order.slice(0, k).filter((other) => other.bucket === item.bucket).length);
  const slots = order.map((item, k) => ({ i: item.i, slot: { bucket: item.bucket, col: rank[k]! % perRow, row: Math.floor(rank[k]! / perRow) } }));
  return slots.sort((a, b) => a.i - b.i).map((entry) => entry.slot);
}

type Layout = {
  chart: { x: number; y: number; w: number; h: number };
  x0: number;
  x1: number;
  base: number;
  fleetY: number;
  rowH: number;
  colW: number;
  r: number;
  perRow: number;
  code: { x: number; y: number; w: number; size: number; title: boolean };
  cpu: { x: number; y: number; w: number; h: number } | null;
  meter: { x: number; y: number; w: number };
};

const WIDE_LAYOUT: Layout = {
  chart: { x: 452, y: 64, w: 468, h: 328 },
  x0: 484, x1: 888, base: 350, fleetY: 116, rowH: 7, colW: 7.6, r: 3.1, perRow: 2,
  code: { x: 40, y: 64, w: 388, size: 15, title: true },
  cpu: { x: 40, y: 258, w: 388, h: 134 },
  meter: { x: 60, y: 330, w: 348 },
};

const COMPACT_LAYOUT: Layout = {
  chart: { x: 20, y: 282, w: 500, h: 224 },
  x0: 50, x1: 490, base: 478, fleetY: 330, rowH: 6.4, colW: 6.4, r: 2.6, perRow: 3,
  code: { x: 20, y: 56, w: 500, size: 14, title: false },
  cpu: null,
  meter: { x: 20, y: 232, w: 500 },
};

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT_LAYOUT : WIDE_LAYOUT;
  const C = L.chart;
  const x = (s: number) => lerp(L.x0, L.x1, s / SECONDS);
  const bucketW = (L.x1 - L.x0) / SECONDS * BUCKET;
  const STORM = stack(JITTER.map(() => 0), L.perRow);
  const SPREAD = stack(JITTER, L.perRow);
  const capRows = CAPACITY / L.perRow;

  const act2 = frame >= T.reset;
  const slots = act2 ? SPREAD : STORM;
  const drain = act2 ? T.drain2 : T.drain1;
  const sweepStart = act2 ? T.sweep2 : T.sweep1;
  const now = Math.max(0, (frame - sweepStart) / SWEEP_FPS);
  const drained = frame >= drain;
  // Act 1 clears out before the replay, so act 2 reads as a new run on the same chart.
  const clear = act2 ? 1 : 1 - ease(frame, T.reset - 18, T.reset);

  const t = {
    fleet: fr ? "agents · connexions SSE ouvertes" : "agents · open SSE connections",
    drain: fr ? "déploiement · drain" : "deploy · drain",
    capacity: fr ? "capacité serveur" : "server capacity",
    melt: fr ? "même milliseconde" : "same millisecond",
    window: fr ? "jitter · 1 à 10 s" : "jitter · 1 to 10 s",
    cpu: fr ? "CPU du plan de contrôle · pic" : "control plane CPU · peak",
    overload: fr ? "le CPU fond ✗" : "CPU melts ✗",
    ok: fr ? "sous la capacité ✓" : "under capacity ✓",
    comment: fr ? "// serveur saturé → on recule plus" : "// server at capacity → back off more",
  };

  const landAt = (i: number) => sweepStart + (act2 ? JITTER[i]! : 0) * SWEEP_FPS + (act2 ? 0 : (i % 15) * .5);
  const slotXY = (s: Slot): [number, number] => [
    L.x0 + s.bucket * bucketW + bucketW / 2 + (s.col - (L.perRow - 1) / 2) * L.colW,
    L.base - L.r - 3 - s.row * L.rowH,
  ];
  const fleetXY = (i: number): [number, number] => [lerp(L.x0, L.x1, i / (AGENTS - 1)), L.fleetY];
  const capY = L.base - 3 - capRows * L.rowH + L.rowH / 2 - L.r;

  // Peak reconnects in one bucket so far: the number that decides whether the CPU survives.
  const buckets = [...new Set(slots.map((s) => s.bucket))];
  const peak = drained ? Math.max(0, ...buckets.map((b) => slots.filter((s, i) => s.bucket === b && frame >= landAt(i)).length)) : 0;
  const LIMIT = .62;
  const load = Math.min(1, peak / CAPACITY * LIMIT) * clear;
  const over = peak > CAPACITY;

  const code: CodeLine[] = act2
    ? [
      { text: "agent.on(\"disconnect\", async () => {" },
      { text: "  await sleep(jitter(1_000, 10_000));", tone: "ok", appearAt: T.fix },
      { text: "  reconnect();" },
      { text: "});" },
      { text: t.comment, appearAt: T.fix + 50 },
    ]
    : [
      { text: "agent.on(\"disconnect\", () => {" },
      { text: "  reconnect();", tone: frame >= T.drain1 ? "danger" : undefined },
      { text: "});" },
    ];

  const sweeping = frame >= sweepStart && now <= SECONDS && (act2 ? frame < T.settled + 20 : frame < T.reset - 18);
  const windowOn = act2 ? easeOut(frame, T.fix + 30, T.fix + 54) : 0;
  const stormTop = slotXY({ bucket: 0, col: 0, row: Math.ceil(AGENTS / L.perRow) - 1 });

  const lean = (px: number, py: number): [number, number] => [lerp(width / 2, px, .2), lerp(height / 2, py, .2)];
  const camera = [
    { at: 0 },
    { at: T.drain1 - 6, zoom: 1.03, focus: lean(x(1), (L.fleetY + L.base) / 2) },
    { at: T.reset, zoom: 1.02, focus: lean(L.code.x + L.code.w / 2, L.code.y + 60) },
    { at: T.drain2 - 6, zoom: 1.03, focus: lean(x(6), (L.fleetY + L.base) / 2) },
    { at: T.settled + 10, dur: 50, zoom: 1 },
  ];

  const statusTone: Tone = over ? "danger" : "ok";
  const status = peak === 0 ? null : over ? t.overload : t.ok;
  const statusAppear = status ? pop(frame, over ? T.melt : T.settled) * clear : 0;

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    <g {...enter(frame, 0)}>
      <CodeBlock
        x={L.code.x} y={L.code.y} w={L.code.w} frame={frame} size={L.code.size} lines={code}
        title={L.code.title ? (fr ? "agent · reconnexion" : "agent · reconnect") : undefined}
        appear={act2 ? easeOut(frame, T.reset, T.reset + 14) : clear}
        highlight={act2 && frame >= T.fix ? 1 : !act2 && frame >= T.drain1 ? 1 : undefined}
      />
    </g>

    {/* CPU: the same gauge in both replays, with the server's limit on it. */}
    <g {...enter(frame, 10)}>
      {L.cpu ? <Box x={L.cpu.x} y={L.cpu.y} w={L.cpu.w} h={L.cpu.h} tone={over && load > 0 ? "danger" : "line"} focus={over ? ease(frame, T.melt - 6, T.melt + 4) * clear : 0} radius={16} /> : null}
      <Meter
        x={L.meter.x} y={L.meter.y} w={L.meter.w} h={12} value={load} limit={LIMIT} tone="ok"
        label={L.cpu ? undefined : t.cpu} limitLabel={fr ? "capacité" : "capacity"}
      />
      {L.cpu ? <Text x={L.cpu.x + 20} y={L.cpu.y + 24} size={11} weight={600} font="mono" tone="muted" caps>{t.cpu}</Text> : null}
      {statusAppear > 0 ? <Tag x={L.meter.x + L.meter.w} y={L.cpu ? L.cpu.y + 24 : L.meter.y - 18} text={status!} tone={statusTone} anchor="end" size={12} appear={statusAppear} /> : null}
    </g>

    {/* The chart: fleet on top, reconnects falling into half-second buckets. */}
    <g {...enter(frame, 6)}>
      <Box x={C.x} y={C.y} w={C.w} h={C.h} tone="line" radius={16} />
      <Text x={C.x + 20} y={C.y + 24} size={11} weight={600} font="mono" tone="muted" caps>{t.fleet}</Text>
    </g>
    <Axis x={L.x0} y={L.base} w={L.x1 - L.x0} ticks={[0, 2, 4, 6, 8, 10, 12]} format={(s) => `${s} s`} appear={easeOut(frame, 14, 30)} />
    <g opacity={easeOut(frame, 18, 34)}>
      <line x1={L.x0} x2={L.x1} y1={capY} y2={capY} stroke={TONE.hot} strokeWidth={1.25} strokeDasharray="4 5" />
      <Text x={L.x1} y={capY + 12} size={11} weight={600} font="mono" tone="hot" anchor="end">{t.capacity}</Text>
    </g>

    {/* Jitter window: a soft band where act 2's reconnects are allowed to land. */}
    {windowOn > 0 ? <g opacity={windowOn}>
      <rect x={x(1)} y={capY - 22} width={(x(10) - x(1)) * windowOn} height={L.base - capY + 22} rx={6} style={{ fill: tint("ok", 8) }} />
      <line x1={x(1)} x2={x(1) + (x(10) - x(1)) * windowOn} y1={capY - 22} y2={capY - 22} stroke={TONE.ok} strokeOpacity={.5} strokeWidth={1} />
      <Tag x={(x(1) + x(10)) / 2} y={capY - 22} text={t.window} tone="ok" size={11} appear={pop(frame, T.fix + 44)} />
    </g> : null}

    {/* Deploy marker. */}
    <g opacity={easeOut(frame, drain - 6, drain + 6) * clear}>
      <line x1={x(0)} x2={x(0)} y1={L.fleetY + 14} y2={L.base} stroke={TONE.hot} strokeWidth={1.25} strokeDasharray="3 4" />
      <Tag x={x(0) + 22} y={L.fleetY + 26} anchor="start" text={t.drain} tone="hot" size={11} appear={pop(frame, drain - 2) * clear} />
    </g>
    {sweeping ? <line x1={x(Math.min(now, SECONDS))} x2={x(Math.min(now, SECONDS))} y1={L.fleetY + 12} y2={L.base} stroke="var(--scene-ink)" strokeOpacity={.2} strokeWidth={1} /> : null}

    {Array.from({ length: AGENTS }, (_, i) => {
      const [tx, ty] = fleetXY(i);
      const slot = slots[i]!;
      const [sx, sy] = slotXY(slot);
      const land = landAt(i);
      const fallT = drained ? ease(frame, land - 10, land, (v) => v) : 0;
      const falling = fallT > 0;
      const landed = drained && frame >= land;
      const above = slot.row >= capRows;
      const landTone: Tone = act2 ? "ok" : above ? "danger" : "line";
      // Gravity: horizontal glide eases out, the drop accelerates.
      const px = lerp(tx, sx, 1 - (1 - fallT) ** 2);
      const py = lerp(ty, sy, fallT * fallT);
      const appear = easeOut(frame, 4 + (i % 20) * .8, 18 + (i % 20) * .8);
      return <g key={i}>
        {drained && clear > .01 && !(act2 && landed)
          ? <circle cx={tx} cy={ty} r={L.r} fill="none" stroke={TONE.muted} strokeOpacity={.45} strokeWidth={1} />
          : <circle cx={tx} cy={ty} r={L.r} fill={TONE.ok} opacity={appear * (act2 ? (landed ? easeOut(frame, land, land + 8) : easeOut(frame, T.reset, T.reset + 20)) : 1)} />}
        {falling ? <circle
          className={landed && landTone !== "line" ? "scene-glow" : undefined}
          cx={px} cy={py} r={L.r}
          fill={TONE[landed ? landTone : "muted"]}
          style={{ color: TONE[landTone] }}
          opacity={clear}
        /> : null}
      </g>;
    })}

    {!act2 ? <g opacity={clear}>
      <Pulse x={stormTop[0]} y={stormTop[1]} frame={frame} at={T.melt} period={34} r={10} tone="danger" />
      <Tag x={stormTop[0] + 22} y={(stormTop[1] + capY) / 2} anchor="start" text={t.melt} tone="danger" size={12} appear={pop(frame, T.melt)} />
    </g> : null}
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.settled + 40,
  title: { en: "One deploy, two reconnect rules", fr: "Un déploiement, deux reconnexions" },
  caption: {
    en: "Without jitter, a drain turns every open connection into a reconnect in the same instant. Jittered backoff spreads the same reconnects over 1 to 10 seconds, under server capacity.",
    fr: "Sans jitter, un drain transforme chaque connexion ouverte en reconnexion au même instant. Le backoff avec jitter étale les mêmes reconnexions sur 1 à 10 secondes, sous la capacité du serveur.",
  },
  beats: [
    { at: 0, text: { en: "Thousands of agents hold an open SSE connection to the control plane.", fr: "Des milliers d’agents gardent une connexion SSE ouverte vers le plan de contrôle." } },
    { at: T.drain1, text: { en: "We deploy and gracefully drain connections. Every agent reconnects at the exact same millisecond.", fr: "On déploie et on draine les connexions. Tous les agents se reconnectent à la même milliseconde." } },
    { at: T.melt, text: { en: "The spike is far above what the server can absorb: the CPU melts.", fr: "Le pic dépasse de loin ce que le serveur peut absorber : le CPU fond." } },
    { at: T.fix, text: { en: "The fix: jittered exponential backoff. Each agent waits a random 1–10 s, longer if the server is at capacity.", fr: "La solution : backoff exponentiel avec jitter. Chaque agent attend 1 à 10 s au hasard, plus si ça sature." } },
    { at: T.sweep2 + 20, text: { en: "Same deploy, same agents: reconnects spread across the window and stay under capacity.", fr: "Même déploiement, mêmes agents : les reconnexions s’étalent sur la fenêtre, sous la capacité." } },
  ],
  Stage,
});
