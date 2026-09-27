import type { ReactNode } from "react";
import { Axis, Boundary, Box, Camera, Comet, Dot, ease, easeOut, enter, lerp, Meter, pop, Pulse, stagger, Tag, Text, tint, TONE, Wire, type Tone } from "../primitives";
import { defineScene, type Localized, type SceneStageProps } from "../types";

// Timeline (30 fps). The naive export pipeline runs inside one worker, then the
// four production risks from the article play out one after another in a single
// incident panel, each one leaving its verdict on the part of the pipeline it hits.
const T = {
  panel: 44,
  risks: [66, 156, 246, 336] as const,
  span: 84,
  end: 510,
} as const;

type Rect = { x: number; y: number; w: number; h: number };
type RiskProps = { c: Rect; lt: number; wide: boolean; fr: boolean };

const STAGES: readonly { key: string; label: Localized; sub: Localized }[] = [
  { key: "es", label: { en: "ES scroll", fr: "Scroll ES" }, sub: { en: "Elasticsearch", fr: "Elasticsearch" } },
  { key: "enrich", label: { en: "Enrich", fr: "Enrichir" }, sub: { en: "relational DB", fr: "base relationnelle" } },
  { key: "csv", label: { en: "CSV", fr: "CSV" }, sub: { en: "serialize", fr: "sérialiser" } },
  { key: "s3", label: { en: "S3 upload", fr: "Upload S3" }, sub: { en: "3GB+ CSV", fr: "CSV de 3GB+" } },
];

type Risk = {
  key: string;
  title: Localized;
  verdict: Localized;
  /** Shorter verdict for the compact card. */
  short: Localized;
  /** Pipeline stage the risk hits (-1: the whole worker). */
  stage: number;
  Draw: (props: RiskProps) => ReactNode;
};

// ─── Local pieces ────────────────────────────────────────────────────────────

/** Small raised token: an event, a job. */
function Chip({ x, y, w, h = 28, text, tone, opacity = 1 }: { x: number; y: number; w: number; h?: number; text: string; tone: Tone; opacity?: number }) {
  if (opacity <= 0) return null;
  return <g opacity={opacity}>
    <rect className="scene-card" x={x} y={y} width={w} height={h} rx={8} style={{ fill: "var(--scene-card)" }} />
    <rect x={x} y={y} width={w} height={h} rx={8} style={{ fill: tint(tone, 14) }} stroke={TONE[tone]} strokeOpacity={.45} strokeWidth={1} />
    <Text x={x + w / 2} y={y + h / 2 + .5} size={12} font="mono" weight={600} tone={tone} anchor="middle">{text}</Text>
  </g>;
}

const Eyebrow = ({ x, y, children, tone = "muted", anchor = "start" }: { x: number; y: number; children: ReactNode; tone?: Tone; anchor?: "start" | "end" }) =>
  <Text x={x} y={y} size={11} font="mono" weight={600} tone={tone} caps anchor={anchor}>{children}</Text>;

// ─── 1 · Unbounded producer: the scroll outruns serialization + upload ─────────

function Firehose({ c, lt, wide, fr }: RiskProps) {
  const grid: Rect = wide ? { x: c.x, y: c.y, w: 500, h: c.h } : { x: c.x, y: c.y, w: c.w, h: 100 };
  const pill = { w: 34, h: 10, gap: 6 };
  const cols = Math.floor((grid.w - 32 + pill.gap) / (pill.w + pill.gap));
  const rows = Math.floor((grid.h - 44 + pill.gap) / (pill.h + pill.gap));
  const capacity = cols * rows - 4;
  const flow = Math.max(0, lt - 8);
  const inCount = Math.min(capacity + 4, Math.floor(flow * .85 * (capacity / 55)));
  const outCount = Math.floor(flow / 16);
  const buffered = Math.max(0, Math.min(capacity, inCount - outCount));
  const memory = .1 + .86 * (buffered / capacity);
  const over = memory > .72;
  const pillTone: Tone = over ? "danger" : "line";
  const gridX = grid.x + (grid.w - (cols * (pill.w + pill.gap) - pill.gap)) / 2;
  const floor = grid.y + grid.h - 14;
  const rate = easeOut(lt, 0, 24);
  const meters = wide
    ? { x: c.x + 540, w: c.w - 540, ys: [c.y + 26, c.y + 74, c.y + 122], half: c.w - 540 }
    : { x: c.x, w: c.w, ys: [c.y + 132, c.y + 132, c.y + 176], half: (c.w - 32) / 2 };
  return <g>
    <Box x={grid.x} y={grid.y} w={grid.w} h={grid.h} tone={over ? "danger" : "muted"} variant="ghost" radius={12} fill={over ? .4 : 0} />
    <Eyebrow x={grid.x + 16} y={grid.y + 18} tone={over ? "danger" : "muted"}>{fr ? "buffer en mémoire" : "in-memory buffer"}</Eyebrow>
    <Text x={grid.x + grid.w - 16} y={grid.y + 18} size={12} font="mono" weight={600} tone="danger" anchor="end" opacity={easeOut(lt, 40, 54)}>{fr ? "↑ ça s’empile" : "↑ piling up"}</Text>
    {Array.from({ length: buffered }, (_, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const arrive = 8 + (index + 1) * (55 / capacity) * 1.36;
      const fall = easeOut(lt, arrive, arrive + 8);
      const y = floor - (row + 1) * (pill.h + pill.gap) + pill.gap;
      return <rect key={index} x={gridX + col * (pill.w + pill.gap)} y={y - (1 - fall) * 16} width={pill.w} height={pill.h} rx={pill.h / 2}
        fill={TONE[pillTone]} opacity={(.35 + .3 * ((index * 7) % 5) / 4) * fall} />;
    })}
    {wide ? <>
      <Meter x={meters.x} y={meters.ys[0]!} w={meters.w} h={8} value={.94 * rate} tone="line" label={fr ? "lecture · scroll ES" : "read · ES scroll"} valueLabel={fr ? "rapide" : "fast"} />
      <Meter x={meters.x} y={meters.ys[1]!} w={meters.w} h={8} value={.22 * rate} tone="muted" label={fr ? "écriture · CSV → S3" : "write · CSV → S3"} valueLabel={fr ? "lent" : "slow"} />
    </> : <>
      <Meter x={meters.x} y={meters.ys[0]!} w={meters.half} h={8} value={.94 * rate} tone="line" label={fr ? "lecture ES" : "ES read"} valueLabel={fr ? "rapide" : "fast"} />
      <Meter x={meters.x + meters.half + 32} y={meters.ys[1]!} w={meters.half} h={8} value={.22 * rate} tone="muted" label={fr ? "écriture S3" : "S3 write"} valueLabel={fr ? "lent" : "slow"} />
    </>}
    <Meter x={meters.x} y={meters.ys[2]!} w={meters.w} h={8} value={memory} limit={.72} tone="hot" label={fr ? "mémoire du worker" : "worker memory"}
      valueLabel={over ? (fr ? "↑ sans borne" : "↑ unbounded") : `${Math.round(memory * 100)}%`} />
  </g>;
}

// ─── 2 · N+1 enrichment: one lookup per event until the pool is full ──────────

const POOL = 6;
const EVENTS = 10;
const eventAt = (k: number) => 6 + k * 6;
const TRAVEL = 16;
const HOP = 12;

function NPlusOne({ c, lt, wide, fr }: RiskProps) {
  const chipW = wide ? 70 : 62;
  const laneY = wide ? c.y + 74 : c.y + 46;
  const gateX = wide ? c.x + 420 : c.x + c.w;
  const pool: Rect = wide ? { x: c.x + 470, y: c.y, w: c.w - 470, h: c.h } : { x: c.x, y: c.y + 90, w: c.w, h: 90 };
  const slotGap = 10;
  const slotW = (pool.w - 32 - 2 * slotGap) / 3;
  const slotH = wide ? 36 : 24;
  const slot = (k: number) => ({ x: pool.x + 16 + (k % 3) * (slotW + slotGap), y: pool.y + (wide ? 36 : 30) + Math.floor(k / 3) * (slotH + (wide ? 12 : 8)) });
  const landed = Array.from({ length: POOL }, (_, k) => lt >= eventAt(k) + TRAVEL + HOP).filter(Boolean).length;
  const full = landed >= POOL;
  const waitingShown = lt >= eventAt(POOL) + TRAVEL - 2;
  return <g>
    <Eyebrow x={c.x} y={c.y + 14}>{fr ? "événements à enrichir" : "events to enrich"}</Eyebrow>
    <Tag x={gateX} y={c.y + 14} anchor="end" size={11} text={fr ? "1 événement = 1 SELECT" : "1 event = 1 SELECT"} tone="hot" appear={pop(lt, 4)} />
    <line x1={c.x} x2={gateX} y1={laneY} y2={laneY} stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="2 5" />

    <Box x={pool.x} y={pool.y} w={pool.w} h={pool.h} tone={full ? "danger" : "line"} focus={full ? ease(lt, eventAt(POOL - 1) + TRAVEL + HOP, eventAt(POOL - 1) + TRAVEL + HOP + 10) : 0} radius={12}>
      <Eyebrow x={pool.x + 16} y={pool.y + 18} tone={full ? "danger" : "muted"}>{fr ? "pool de connexions DB" : "DB connection pool"}</Eyebrow>
      <Text x={pool.x + pool.w - 16} y={pool.y + 18} size={12} font="mono" weight={600} tone={full ? "danger" : "muted"} anchor="end">{full ? (fr ? `${landed}/${POOL} · saturé` : `${landed}/${POOL} · saturated`) : `${landed}/${POOL}`}</Text>
      {Array.from({ length: POOL }, (_, k) => {
        const s = slot(k);
        const on = pop(lt, eventAt(k) + TRAVEL + HOP, 200);
        const tone: Tone = full ? "danger" : "hot";
        return <g key={k}>
          <rect x={s.x} y={s.y} width={slotW} height={slotH} rx={8} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="3 4" />
          {on > .01 ? <g opacity={Math.min(1, on)} transform={`translate(${s.x + slotW / 2} ${s.y + slotH / 2}) scale(${.85 + .15 * on}) translate(${-s.x - slotW / 2} ${-s.y - slotH / 2})`}>
            <rect x={s.x} y={s.y} width={slotW} height={slotH} rx={8} style={{ fill: tint(tone, 18) }} stroke={TONE[tone]} strokeOpacity={.55} strokeWidth={1} />
            <Text x={s.x + slotW / 2} y={s.y + slotH / 2 + .5} size={12} font="mono" weight={600} tone={tone} anchor="middle">SELECT</Text>
          </g> : null}
        </g>;
      })}
    </Box>

    {Array.from({ length: EVENTS }, (_, k) => {
      const at = eventAt(k);
      const queued = k >= POOL;
      const dest = gateX - chipW - (queued ? (k - POOL) * (chipW + 8) : 0);
      const t = ease(lt, at, at + TRAVEL, queued ? (x) => 1 - (1 - x) ** 2 : (x) => x);
      if (lt < at) return null;
      const x = lerp(c.x - 10, dest, t);
      const fade = queued ? Math.min(1, t * 3) : Math.min(1, t * 3) * (1 - ease(lt, at + TRAVEL - 2, at + TRAVEL + 3));
      const tone: Tone = queued && t >= 1 ? "danger" : "line";
      return <Chip key={k} x={x} y={laneY - 14} w={chipW} text={fr ? "évén." : "event"} tone={tone} opacity={fade} />;
    })}
    {Array.from({ length: POOL }, (_, k) => {
      const at = eventAt(k) + TRAVEL;
      const s = slot(k);
      const from: [number, number] = [gateX - 6, laneY];
      const to: [number, number] = [s.x + slotW / 2, s.y + slotH / 2];
      const mid: [number, number] = wide ? [lerp(from[0], to[0], .6), from[1]] : [to[0], lerp(from[1], to[1], .35)];
      return <Comet key={k} points={[from, mid, to]} t={ease(lt, at - 1, at + HOP)} tone="hot" r={4.5} tail={.3} />;
    })}
    {waitingShown ? <g {...enter(lt, eventAt(POOL) + TRAVEL - 2, { distance: 6 })}>
      <Text x={gateX - 4} y={laneY + (wide ? 34 : 28)} size={12} font="mono" weight={600} tone="danger" anchor="end">{fr ? "en attente d’une connexion" : "waiting for a connection"}</Text>
    </g> : null}
  </g>;
}

// ─── 3 · Worker starvation: one export holds the worker, jobs line up ─────────

const JOBS = 6;
const jobAt = (j: number) => 8 + j * 10;

function Starvation({ c, lt, wide, fr }: RiskProps) {
  const queue: Rect = wide ? { x: c.x, y: c.y, w: 400, h: c.h } : { x: c.x, y: c.y, w: c.w, h: 92 };
  const worker: Rect = wide ? { x: c.x + 450, y: c.y, w: c.w - 450, h: c.h } : { x: c.x, y: c.y + 100, w: c.w, h: 80 };
  const chip = { w: 56, h: 32, gap: 8 };
  const chipY = wide ? c.y + 54 : c.y + 28;
  const headX = queue.x + queue.w - chip.w;
  const progress = ease(lt, 0, T.span - 6, (x) => x);
  const minutes = Math.round(lerp(0, 15, progress));
  return <g>
    <Eyebrow x={queue.x} y={queue.y + 14}>{fr ? "jobs critiques · en file" : "critical jobs · waiting in line"}</Eyebrow>
    {Array.from({ length: JOBS }, (_, j) => {
      const at = jobAt(j);
      if (lt < at) return null;
      const t = easeOut(lt, at, at + 18);
      const x = lerp(queue.x - 12, headX - j * (chip.w + chip.gap), t);
      const tone: Tone = lt > at + 22 ? "danger" : "hot";
      return <Chip key={j} x={x} y={chipY} w={chip.w} h={chip.h} text="job" tone={tone} opacity={Math.min(1, t * 2.5)} />;
    })}
    <Wire d={wide ? `M${queue.x + queue.w + 6} ${chipY + chip.h / 2}H${worker.x - 6}` : `M${headX + chip.w / 2} ${chipY + chip.h + 6}V${worker.y - 6}`} tone="danger" width={1.5} dashed draw={ease(lt, 10, 20)} />
    <Tag x={queue.x} y={wide ? c.y + 118 : c.y + 78} anchor="start" size={11} text={fr ? "aucun worker libre" : "no free worker"} tone="danger" appear={pop(lt, jobAt(1) + 12)} />

    <Box x={worker.x} y={worker.y} w={worker.w} h={worker.h} tone="danger" focus={ease(lt, 0, 12) * .8} radius={12}>
      <Eyebrow x={worker.x + 16} y={worker.y + 18} tone="danger">{fr ? "le worker · occupé" : "the worker · busy"}</Eyebrow>
      <Text x={worker.x + 16} y={worker.y + (wide ? 58 : 42)} size={wide ? 18 : 16} weight={600}>{fr ? "export d’historique" : "history export"}</Text>
      <Text x={worker.x + worker.w - 16} y={worker.y + (wide ? 58 : 42)} size={wide ? 18 : 16} font="mono" weight={600} tone="hot" anchor="end">{`${minutes} min`}</Text>
      <Meter x={worker.x + 16} y={worker.y + (wide ? 90 : 60)} w={worker.w - 32} h={8} value={progress} tone="hot" />
      {wide ? <Text x={worker.x + 16} y={worker.y + 118} size={12} font="mono" weight={500} tone="muted">{fr ? "10 à 15 min pour les plus gros clients" : "10–15 min for the largest tenants"}</Text> : null}
    </Box>
    <Dot x={worker.x + worker.w - 20} y={worker.y + 18} r={3.5} tone="danger" halo={false} />
    <Pulse x={worker.x + worker.w - 20} y={worker.y + 18} frame={lt} at={4} period={40} r={5} tone="danger" />
  </g>;
}

// ─── 4 · Late retry: 99 % uploaded, then a naive retry starts from zero ───────

const FAIL = 48;
const DRAIN = [58, 70] as const;
const RESTART = 76;

function Retry({ c, lt, wide, fr }: RiskProps) {
  const parts = wide ? 30 : 20;
  const gap = 4;
  const barY = c.y + (wide ? 48 : 64);
  const barH = wide ? 28 : 34;
  const segW = (c.w - (parts - 1) * gap) / parts;
  const climb = .99 * ease(lt, 4, 46, (x) => 1 - (1 - x) ** 1.6);
  const drained = ease(lt, DRAIN[0], DRAIN[1]);
  const progress = lt < DRAIN[0] ? climb : lt < RESTART ? .99 * (1 - drained) : .06 * easeOut(lt, RESTART, RESTART + 110);
  const failed = lt >= FAIL && lt < RESTART;
  const failIndex = Math.floor(.99 * parts);
  const failX = c.x + failIndex * (segW + gap);
  const pct = Math.round(progress * 100);
  const segmentTone: Tone = failed ? "danger" : lt >= RESTART ? "line" : "line";
  return <g>
    <Eyebrow x={c.x} y={c.y + 14}>{fr ? "upload multipart S3 · 3GB" : "S3 multipart upload · 3GB"}</Eyebrow>
    <Text x={c.x + c.w} y={c.y + 14} size={wide ? 22 : 20} font="mono" weight={600} tone={failed ? "danger" : "ink"} anchor="end">{`${pct}%`}</Text>
    {Array.from({ length: parts }, (_, k) => {
      const x = c.x + k * (segW + gap);
      const share = Math.max(0, Math.min(1, progress * parts - k));
      const failing = failed && k === failIndex;
      return <g key={k}>
        <rect x={x} y={barY} width={segW} height={barH} rx={4} style={{ fill: tint("ink", 7) }} />
        {share > 0 ? <rect x={x} y={barY} width={segW * share} height={barH} rx={4} fill={TONE[segmentTone]} opacity={failed ? .4 : .5} /> : null}
        {failing ? <g>
          <rect className="scene-glow" x={x} y={barY} width={segW} height={barH} rx={4} fill={TONE.danger} style={{ color: TONE.danger }} opacity={pop(lt, FAIL)} />
          <Text x={x + segW / 2} y={barY + barH / 2 + 1} size={13} font="mono" weight={700} anchor="middle" tone="ink" opacity={pop(lt, FAIL)}>✗</Text>
        </g> : null}
      </g>;
    })}
    {lt >= FAIL && lt < RESTART + 20 ? <Pulse x={failX + segW / 2} y={barY + barH / 2} frame={lt} at={FAIL} period={30} r={12} tone="danger" /> : null}
    <Axis x={c.x} y={barY + barH + 14} w={c.w} ticks={["0%", "25%", "50%", "75%", "100%"]} appear={easeOut(lt, 6, 20)} />
    <Tag x={failX + segW} y={barY + barH + 50} anchor="end" size={11} text={fr ? "✗ échec à 99 %" : "✗ failed at 99%"} tone="danger" appear={pop(lt, FAIL + 2)} />
    <Tag x={c.x} y={barY + barH + 50} anchor="start" size={11} text={fr ? "↺ retry naïf → 0 %" : "↺ naive retry → 0%"} tone="danger" appear={pop(lt, DRAIN[0] + 4)} />
  </g>;
}

const RISKS: readonly Risk[] = [
  { key: "producer", stage: 0, title: { en: "Unbounded producer", fr: "Producteur non borné" }, verdict: { en: "✗ memory ↑", fr: "✗ mémoire ↑" }, short: { en: "✗ memory ↑", fr: "✗ mémoire ↑" }, Draw: Firehose },
  { key: "n1", stage: 1, title: { en: "N+1 enrichment", fr: "Risque N+1" }, verdict: { en: "✗ pool saturated", fr: "✗ pool saturé" }, short: { en: "✗ pool full", fr: "✗ pool saturé" }, Draw: NPlusOne },
  { key: "worker", stage: -1, title: { en: "Worker starvation", fr: "Starvation worker" }, verdict: { en: "✗ worker hostage", fr: "✗ worker en otage" }, short: { en: "✗ hostage", fr: "✗ en otage" }, Draw: Starvation },
  { key: "retry", stage: 3, title: { en: "Late retry", fr: "Retry tardif" }, verdict: { en: "✗ start over", fr: "✗ tout recommencer" }, short: { en: "✗ from 0", fr: "✗ repart à 0" }, Draw: Retry },
];

// ─── Stage ───────────────────────────────────────────────────────────────────

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const wide = !compact;
  const worker: Rect = wide ? { x: 40, y: 58, w: 880, h: 110 } : { x: 20, y: 62, w: 500, h: 160 };
  const card = (i: number): Rect => wide
    ? { x: 62 + i * 220, y: 78, w: 176, h: 56 }
    // Compact: a U-turn, ES → Enrich on top, then CSV → S3 back underneath.
    : { x: i === 0 || i === 3 ? 34 : 284, y: i < 2 ? 86 : 152, w: 222, h: 54 };
  const panel: Rect = wide ? { x: 40, y: 190, w: 880, h: 196 } : { x: 20, y: 238, w: 500, h: 262 };
  const tabW = panel.w / RISKS.length;
  const content: Rect = wide ? { x: 64, y: 236, w: 832, h: 136 } : { x: 40, y: 306, w: 460, h: 180 };

  const riskStart = (i: number) => T.risks[i]!;
  const active = RISKS.reduce((found, _, i) => frame >= riskStart(i) ? i : found, -1);
  const done = (i: number) => frame >= riskStart(i) + T.span - 8;
  const hitBy = (stage: number) => RISKS.findIndex((risk) => risk.stage === stage);

  const links: string[] = wide
    ? [0, 1, 2].map((i) => `M${card(i).x + card(i).w + 4} ${card(i).y + card(i).h / 2}H${card(i + 1).x - 4}`)
    : [
      `M${card(0).x + card(0).w + 4} ${card(0).y + card(0).h / 2}H${card(1).x - 4}`,
      `M${card(1).x + card(1).w / 2} ${card(1).y + card(1).h + 4}V${card(2).y - 4}`,
      `M${card(2).x - 4} ${card(2).y + card(2).h / 2}H${card(3).x + card(3).w + 4}`,
    ];

  // Tab underline slides from risk to risk.
  const underlineX = panel.x + RISKS.slice(1).reduce((x, _, i) => x + tabW * ease(frame, riskStart(i + 1) - 6, riskStart(i + 1) + 12), 0);
  const panelIn = enter(frame, T.panel, { distance: 18 });

  const lean = (y: number) => lerp(height / 2, y, .22);
  const camera = [
    { at: 0 },
    { at: riskStart(0) - 10, dur: 40, zoom: 1.03, focus: [width / 2, lean(panel.y + panel.h / 2)] as const },
    { at: riskStart(3) + T.span, dur: 50, zoom: 1 },
  ];

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    <Boundary {...worker} tone={active === 2 && !done(3) && frame < riskStart(3) ? "danger" : "hot"} appear={easeOut(frame, 0, 16)}
      label={wide ? (fr ? "un worker · 10 à 15 min pour les plus gros clients" : "one worker · 10–15 min for the largest tenants") : (fr ? "un worker · 10 à 15 min" : "one worker · 10–15 min")} />
    <Tag x={worker.x + worker.w - 18} y={worker.y} anchor="end" size={11} text={RISKS[2]!.verdict[locale]} tone="danger" appear={done(2) ? pop(frame, riskStart(2) + T.span - 8) : 0} />

    {links.map((d, i) => <Wire key={i} d={d} tone="line" width={1.5} draw={ease(frame, stagger(i, 16, 6), stagger(i, 28, 6))} flow={frame} />)}

    {STAGES.map((stage, i) => {
      const b = card(i);
      const riskIndex = hitBy(i);
      const risk = riskIndex >= 0 ? RISKS[riskIndex] : undefined;
      const isActive = riskIndex >= 0 && riskIndex === active && frame < riskStart(riskIndex) + T.span;
      const hit = riskIndex >= 0 && done(riskIndex);
      const tone: Tone = isActive || hit ? "danger" : "line";
      const verdictIn = risk && hit ? pop(frame, riskStart(riskIndex) + T.span - 8) : 0;
      return <g key={stage.key} {...enter(frame, stagger(i, 6, 6))}>
        {wide
          ? <Box x={b.x} y={b.y} w={b.w} h={b.h} tone={tone} focus={isActive ? ease(frame, riskStart(riskIndex), riskStart(riskIndex) + 10) : 0} label={stage.label[locale]} sub={stage.sub[locale]} labelSize={17} radius={12} />
          : <Box x={b.x} y={b.y} w={b.w} h={b.h} tone={tone} focus={isActive ? ease(frame, riskStart(riskIndex), riskStart(riskIndex) + 10) : 0} radius={12}>
            <Text x={b.x + 16} y={b.y + 19} size={15} weight={600}>{stage.label[locale]}</Text>
            <Text x={b.x + 16} y={b.y + 38} size={12} font="mono" weight={500} tone="muted">{stage.sub[locale]}</Text>
          </Box>}
        {risk ? (wide
          ? <Tag x={b.x + b.w / 2} y={b.y + b.h + 17} size={11} text={risk.verdict[locale]} tone="danger" appear={verdictIn} />
          : <Tag x={b.x + b.w - 10} y={b.y + 19} anchor="end" size={11} text={risk.short[locale]} tone="danger" appear={verdictIn} />) : null}
      </g>;
    })}

    {/* Connector from what is failing down to the incident panel (wide only: columns align). */}
    {wide ? RISKS.map((risk, i) => {
      const x = panel.x + tabW * (i + .5);
      const top = risk.stage >= 0 ? card(risk.stage).y + card(risk.stage).h + 1 : worker.y + worker.h + 1;
      const visible = 1 - ease(frame, riskStart(i) + T.span - 8, riskStart(i) + T.span + 4);
      if (frame < riskStart(i) - 4 || visible <= 0) return null;
      return <g key={risk.key} opacity={visible}>
        <Wire d={`M${x} ${top}V${panel.y - 2}`} tone="danger" width={1.5} draw={easeOut(frame, riskStart(i) - 4, riskStart(i) + 8)} flow={frame} />
      </g>;
    }) : null}

    {/* Incident panel: four tabs, one risk at a time. */}
    {panelIn.opacity > 0 ? <g {...panelIn}>
      <Box x={panel.x} y={panel.y} w={panel.w} h={panel.h} tone="muted" radius={16} />
      <line x1={panel.x + 1} x2={panel.x + panel.w - 1} y1={panel.y + 34} y2={panel.y + 34} stroke="var(--scene-hairline)" strokeWidth={1} />
      {RISKS.map((risk, i) => {
        const cx = panel.x + tabW * (i + .5);
        const isActive = i === active;
        const tone: Tone = isActive ? "ink" : done(i) ? "danger" : "muted";
        const number = String(i + 1).padStart(2, "0");
        return <g key={risk.key} {...enter(frame, stagger(i, T.panel + 6, 4), { distance: 6 })}>
          <Text x={cx} y={panel.y + 18} size={11} font="mono" weight={600} tone={tone} anchor="middle" caps opacity={isActive || done(i) ? 1 : .6}>
            {wide ? `${number}  ${risk.title[locale]}` : number}
          </Text>
        </g>;
      })}
      {active >= 0 ? <rect x={underlineX + (wide ? 22 : 18)} y={panel.y + 33} width={tabW - (wide ? 44 : 36)} height={2} rx={1} fill={TONE.danger} opacity={easeOut(frame, riskStart(0) - 6, riskStart(0) + 8)} /> : null}
      {!wide ? RISKS.map((risk, i) => {
        const fade = Math.min(easeOut(frame, riskStart(i) - 2, riskStart(i) + 12), i < RISKS.length - 1 ? 1 - ease(frame, riskStart(i + 1) - 10, riskStart(i + 1)) : 1);
        return fade > 0 ? <g key={risk.key} opacity={fade}>
          <Text x={content.x} y={panel.y + 54} size={15} weight={600} tone="ink">{risk.title[locale]}</Text>
        </g> : null;
      }) : null}

      {RISKS.map((risk, i) => {
        const start = riskStart(i);
        const next = i < RISKS.length - 1 ? riskStart(i + 1) : Infinity;
        if (frame < start - 6 || frame >= next) return null;
        const inT = easeOut(frame, start - 6, start + 14);
        const outT = Number.isFinite(next) ? ease(frame, next - 12, next) : 0;
        const { Draw } = risk;
        return <g key={risk.key} opacity={inT * (1 - outT)} transform={`translate(0 ${(1 - inT) * 12 - outT * 10})`}>
          <Draw c={content} lt={frame - start} wide={wide} fr={fr} />
        </g>;
      })}
    </g> : null}
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 20,
  title: { en: "Four ways the export explodes", fr: "Quatre façons d’exploser" },
  caption: {
    en: "Without a control mechanism, the history export fails on memory, on the DB pool, on worker capacity and on retries. Backpressure, bounded concurrency and queue isolation each answer one of them.",
    fr: "Sans mécanisme de contrôle, l’export d’historique casse sur la mémoire, le pool DB, la capacité des workers et les retries. Backpressure, concurrence bornée et isolation de queue répondent chacune à l’un d’eux.",
  },
  beats: [
    { at: 0, text: { en: "The export: scroll Elasticsearch, enrich every event, serialize to CSV, upload 3GB+ to S3, in one worker.", fr: "L’export\u00a0: scroll Elasticsearch, enrichissement, CSV, upload de 3GB+ sur S3, le tout dans un seul worker." } },
    { at: T.risks[0], text: { en: "Unbounded producer: ES scrolling turns into a firehose that drowns serialization and upload.", fr: "Producteur non borné\u00a0: le scroll ES devient une lance à incendie qui noie la sérialisation en aval." } },
    { at: T.risks[1], text: { en: "N+1: one relational lookup per event brings the DB connection pool to its knees.", fr: "N+1\u00a0: une requête relationnelle par événement met le pool de connexions DB à genoux." } },
    { at: T.risks[2], text: { en: "Worker starvation: a 15-minute export holds a worker hostage while critical jobs wait in line.", fr: "Starvation\u00a0: un export de 15 minutes prend un worker en otage pendant que les jobs critiques patientent." } },
    { at: T.risks[3], text: { en: "Late retry: the 3GB upload fails at 99% and a naive retry starts all over again.", fr: "Retry tardif\u00a0: l’upload de 3GB plante à 99 % et un retry naïf repart de zéro." } },
  ],
  Stage,
});
