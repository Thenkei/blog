import type { ReactNode } from "react";
import { Boundary, Box, Camera, Checkpoint, Comet, during, ease, easeOut, enter, lerp, pop, stagger, Tag, Text, TONE, tint, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). Act 1: three callsites call queue.add directly, each with its
// own options and no jobId, so the same environment lands three times. Act 2: the
// options fly out of the callsites into one jobify contract, then the same three
// triggers go through makeJobId and collapse onto one delayed job.
const T = {
  a: [36, 64, 92],
  countA: 122,
  fix: 172,
  contractIn: 180,
  chips: 198,
  checks: 252,
  b: [292, 386, 432],
  verdict: 486,
  end: 570,
} as const;

const FLY = 24; // act 1 card flight, callsite → queue
const LEG1 = 20; // act 2 comet, callsite → contract
const LEG2 = 18; // act 2, contract → queue
const TYPE = 26; // frames to type the deterministic jobId
const CHIP_FLY = 26;

const JOB_ID = "debounced-synchronize-agent-data-env-42";

// Option drift: every callsite picks its own set. Each chip names the contract
// default it will merge into.
const CALLSITE_OPTS = [
  [{ text: "priority: 2", slot: 2 }, { text: "removeOnFail", slot: 1 }],
  [{ text: "removeOnComplete", slot: 0 }],
  [{ text: "priority: 1", slot: 2 }],
] as const;
const DEFAULTS = ["removeOnComplete", "removeOnFail", "priority", "timeout"] as const;

const CHIP = 11;
const chipW = (text: string, size = CHIP) => text.length * size * .6 + size * 1.5;

type Pt = readonly [number, number];
const bezier = (p0: Pt, p1: Pt, p2: Pt, t: number): [number, number] => [
  (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
  (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
];
const cubicOut = (t: number) => 1 - (1 - t) ** 3;

/** One expanding ring where something just happened (Pulse repeats; this fires once). */
function Ring({ x, y, frame, at, tone, r = 7 }: { x: number; y: number; frame: number; at: number; tone: Tone; r?: number }) {
  const t = easeOut(frame, at, at + 26);
  if (frame < at || t >= 1) return null;
  return <circle cx={x} cy={y} r={r * (1 + 1.8 * t)} fill="none" stroke={TONE[tone]} strokeWidth={1.5} opacity={(1 - t) * .8} />;
}

type Rect = { x: number; y: number; w: number; h: number };
type Layout = {
  calls: readonly Rect[];
  contract: Rect;
  queue: Rect;
  /** Row geometry inside the queue card. */
  rows: { first: number; pitch: number; h: number };
  cols: { id: number; name: number | null; data: number; opts: number };
  /** Contract inner rows (offsets from contract.y). */
  inner: { checks: number; defaults: number; jobId: number; checkX: readonly number[] };
  code: { eyebrow: number; line: number; chips: number };
  chipsAtEnd: boolean;
  size: number;
};

const WIDE_LAYOUT: Layout = {
  calls: [0, 1, 2].map((index) => ({ x: 40, y: 64 + index * 112, w: 276, h: 96 })),
  contract: { x: 352, y: 64, w: 568, h: 150 },
  queue: { x: 352, y: 230, w: 568, h: 154 },
  rows: { first: 64, pitch: 32, h: 28 },
  cols: { id: 22, name: 64, data: 190, opts: 270 },
  inner: { checks: 58, defaults: 92, jobId: 126, checkX: [30, 132, 334] },
  code: { eyebrow: 26, line: 52, chips: 76 },
  chipsAtEnd: false,
  size: 13,
};

const COMPACT_LAYOUT: Layout = {
  calls: [0, 1, 2].map((index) => ({ x: 20, y: 56 + index * 56, w: 500, h: 48 })),
  contract: { x: 20, y: 238, w: 500, h: 132 },
  queue: { x: 20, y: 384, w: 500, h: 126 },
  rows: { first: 46, pitch: 26, h: 22 },
  cols: { id: 18, name: null, data: 46, opts: 128 },
  inner: { checks: 50, defaults: 80, jobId: 110, checkX: [30, 120, 318] },
  code: { eyebrow: 16, line: 34, chips: 34 },
  chipsAtEnd: true,
  size: 13,
};

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT_LAYOUT : WIDE_LAYOUT;
  const { contract: C, queue: Q } = L;

  const actB = frame >= T.fix;
  const toB = ease(frame, T.fix, T.fix + 18);
  const rowY = (index: number) => Q.y + L.rows.first + index * L.rows.pitch;

  // ── Chip geometry: where each option sits on its callsite, and its contract slot.
  const callChipX = (call: number, index: number) => {
    const r = L.calls[call]!;
    const opts = CALLSITE_OPTS[call]!;
    if (!L.chipsAtEnd) return r.x + 16 + opts.slice(0, index).reduce((sum, opt) => sum + chipW(opt.text) + 6, 0);
    const total = opts.reduce((sum, opt) => sum + chipW(opt.text) + 6, -6);
    return r.x + r.w - 14 - total + opts.slice(0, index).reduce((sum, opt) => sum + chipW(opt.text) + 6, 0);
  };
  const defaultsLabelW = compact ? 0 : 84;
  const slotX = (slot: number) => C.x + 20 + defaultsLabelW + DEFAULTS.slice(0, slot).reduce((sum, text) => sum + chipW(text) + 8, 0);
  const defaultsY = C.y + L.inner.defaults;

  const chipFlights = CALLSITE_OPTS.flatMap((opts, call) => opts.map((opt, index) => {
    const start = stagger(call, T.chips, 7) + index * 3;
    return { call, index, opt, start, land: start + CHIP_FLY };
  }));
  const callLanded = (call: number) => Math.max(...chipFlights.filter((flight) => flight.call === call).map((flight) => flight.land));
  const slotLanded = (slot: number) => {
    const first = chipFlights.filter((flight) => flight.opt.slot === slot).map((flight) => flight.land);
    return first.length ? Math.min(...first) : T.chips + CHIP_FLY + 22; // timeout: a new default
  };

  // ── Act 1: three cards land as three rows.
  const rowsOut = (index: number) => ease(frame, stagger(index, T.fix, 3), stagger(index, T.fix, 3) + 16);

  // ── Act 2: comets through the contract.
  const b = T.b.map((start) => ({ start, atContract: start + LEG1, leave: start + LEG1 + 2, atQueue: start + LEG1 + 2 + LEG2 }));
  const firstB = b[0]!;
  const typeFrom = firstB.atContract;
  const cardFlightStart = typeFrom + TYPE + 4;
  const cardLand = cardFlightStart + LEG2 + 6;
  const merges = b.slice(1).filter((hit) => frame >= hit.atQueue).length;
  const jobIdLine: Pt = [C.x + 20, C.y + L.inner.jobId];
  const cometPath = (call: number): Pt[] => {
    const r = L.calls[call]!;
    if (compact) {
      const rail = r.x + r.w + 10;
      return [[r.x + r.w - 6, r.y + r.h / 2], [rail, r.y + r.h / 2], [rail, jobIdLine[1]], [C.x + C.w - 24, jobIdLine[1]]];
    }
    const mid = (r.x + r.w + C.x) / 2;
    return [[r.x + r.w, r.y + r.h / 2], [mid, r.y + r.h / 2], [mid, jobIdLine[1]], [C.x + 24, jobIdLine[1]]];
  };
  const toQueue: Pt[] = compact
    ? [[C.x + C.w - 24, C.y + C.h], [C.x + C.w - 24, rowY(0)]]
    : [[C.x + C.w / 2, C.y + C.h], [C.x + C.w / 2, rowY(0) - L.rows.h / 2]];

  const hitFlash = Math.max(0, ...b.map((hit) => frame >= hit.atContract ? 1 - ease(frame, hit.atContract, hit.atContract + 22) : 0));
  const typed = Math.floor(JOB_ID.length * ease(frame, typeFrom, typeFrom + TYPE, (t) => t));

  // Camera: lean toward the contract while it forms, toward the queue as triggers merge.
  const lean = (point: Pt): Pt => [lerp(width / 2, point[0], .04), lerp(height / 2, point[1], .04)];
  // Compact has no spare margin (the comet rail runs in the right gutter): no drift there.
  const camera = compact ? [{ at: 0 }] : [
    { at: 0 },
    { at: T.contractIn, zoom: 1.02, focus: lean([C.x + C.w / 2, C.y + C.h / 2]) },
    { at: b[1]!.start - 10, zoom: 1.02, focus: lean([Q.x + Q.w / 2, Q.y + Q.h / 2]) },
    { at: T.verdict, dur: 50, zoom: 1 },
  ];

  const size = L.size;
  const callFocus = (call: number) => actB
    ? during(frame, T.b[call]! - 6, b[call]!.atContract + 8, 8)
    : during(frame, T.a[call]! - 6, T.a[call]! + FLY, 8);

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* Callsites */}
    {L.calls.map((r, call) => <g key={call} {...enter(frame, stagger(call, 0, 5), { from: "left", distance: 18 })}>
      <Box x={r.x} y={r.y} w={r.w} h={r.h} tone={actB ? "line" : "hot"} focus={callFocus(call)} radius={compact ? 12 : 14}>
        <Text x={r.x + 16} y={r.y + L.code.eyebrow} size={11} font="mono" weight={600} tone="muted" caps>{(fr ? "appel " : "callsite ") + (call + 1)}</Text>
        <g opacity={1 - toB}>
          <Text x={r.x + 16} y={r.y + L.code.line} size={size} font="mono" weight={500}>queue.add("sync-agent", …)</Text>
        </g>
        <g opacity={ease(frame, T.contractIn + 6, T.contractIn + 22)}>
          <Text x={r.x + 16} y={r.y + L.code.line} size={size} font="mono" weight={600} tone="line">debouncedSynchronize("env-42")</Text>
        </g>
        {!compact ? <Text x={r.x + 16} y={r.y + L.code.chips} size={12} font="mono" weight={500} tone="muted" opacity={easeOut(frame, callLanded(call) - 2, callLanded(call) + 14)}>{"// options → jobify"}</Text> : null}
      </Box>
    </g>)}

    {/* Act 1: the slot where a contract should be. */}
    <g opacity={ease(frame, 14, 30) * (1 - ease(frame, T.fix, T.fix + 14))}>
      <Boundary x={C.x} y={C.y} w={C.w} h={C.h} label={fr ? "aucun contrat partagé" : "no shared contract"} tone="muted" />
      <Text x={C.x + C.w / 2} y={C.y + C.h / 2 + 6} size={14} font="mono" weight={500} tone="muted" anchor="middle">{"@InjectQueue → queue.add"}</Text>
    </g>

    {/* Act 2: the jobify contract. */}
    <g {...enter(frame, T.contractIn, { distance: 16 })}>
      {frame >= T.contractIn ? <Box x={C.x} y={C.y} w={C.w} h={C.h} tone="hot" focus={.6 * hitFlash} radius={16}>
        <Text x={C.x + 20} y={C.y + 24} size={11} font="mono" weight={600} tone="hot" caps>make-jobify.ts</Text>
        <Tag x={C.x + C.w - 16} y={C.y + 24} text={"debounce: \"reschedule\""} tone="muted" anchor="end" size={CHIP} appear={easeOut(frame, T.contractIn + 10, T.contractIn + 24)} />

        {(["name", "delayInMs: 7_000", "makeJobId"] as const).map((label, index) => {
          const at = stagger(index, T.checks, 7);
          return <g key={label} {...enter(frame, stagger(index, T.checks - 14, 4), { dur: 14, distance: 6 })}>
            <Checkpoint x={C.x + L.inner.checkX[index]!} y={C.y + L.inner.checks} r={10} state={frame >= at ? "pass" : "pending"} label={label} />
            {frame >= at ? <circle cx={C.x + L.inner.checkX[index]!} cy={C.y + L.inner.checks} r={10 + 8 * easeOut(frame, at, at + 16)} fill="none" stroke="var(--visual-ok)" strokeWidth={1.25} opacity={1 - easeOut(frame, at, at + 16)} /> : null}
          </g>;
        })}

        {!compact ? <Text x={C.x + 20} y={defaultsY} size={11} font="mono" weight={600} tone="muted" caps opacity={easeOut(frame, T.chips, T.chips + 16)}>{fr ? "défauts" : "defaults"}</Text> : null}
        {DEFAULTS.map((text, slot) => {
          const at = slotLanded(slot);
          if (frame < at - 4) return null;
          const hit = pop(frame, at - 4, 190);
          return <g key={text} transform={`translate(${slotX(slot) + chipW(text) / 2} ${defaultsY}) scale(${.85 + .15 * Math.min(1, hit)}) translate(${-slotX(slot) - chipW(text) / 2} ${-defaultsY})`}>
            <Tag x={slotX(slot)} y={defaultsY} text={text} tone="line" anchor="start" size={CHIP} appear={Math.min(1, hit)} />
          </g>;
        })}

        <line x1={C.x + 16} x2={C.x + C.w - 16} y1={C.y + L.inner.jobId - 17} y2={C.y + L.inner.jobId - 17} stroke="var(--scene-hairline)" strokeWidth={1} opacity={easeOut(frame, T.checks, T.checks + 16)} />
        <rect x={C.x + 8} y={jobIdLine[1] - 12} width={C.w - 16} height={24} rx={7} style={{ fill: tint("ok", 16 * hitFlash) }} />
        <g opacity={easeOut(frame, T.b[0], T.b[0] + 14)}>
          <Text x={jobIdLine[0]} y={jobIdLine[1]} size={size} font="mono" weight={500} tone="muted">{compact ? "jobId →" : "makeJobId(\"env-42\") →"}</Text>
          <Text x={jobIdLine[0] + (compact ? 70 : 180)} y={jobIdLine[1]} size={size} font="mono" weight={600} tone={frame >= typeFrom ? "ok" : "muted"}>{frame >= typeFrom ? `"${JOB_ID.slice(0, typed)}${typed >= JOB_ID.length ? "\"" : ""}` : "…"}</Text>
          {frame >= typeFrom && typed < JOB_ID.length ? <rect x={jobIdLine[0] + (compact ? 70 : 180) + (typed + 1) * size * .6 + 1} y={jobIdLine[1] - 8} width={2} height={16} fill="var(--visual-ok)" /> : null}
        </g>
      </Box> : null}
    </g>

    {/* Queue */}
    <g {...enter(frame, 10, { distance: 16 })}>
      <Box x={Q.x} y={Q.y} w={Q.w} h={Q.h} tone={actB && frame >= cardLand ? "ok" : "line"} radius={16}>
        <Text x={Q.x + 20} y={Q.y + (compact ? 20 : 22)} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "queue bullmq" : "bullmq queue"}</Text>
        {!compact ? <line x1={Q.x + 16} x2={Q.x + Q.w - 16} y1={Q.y + 40} y2={Q.y + 40} stroke="var(--scene-hairline)" strokeWidth={1} /> : null}

        {/* Act 1 rows */}
        {T.a.map((start, index) => {
          const land = start + FLY;
          if (frame < land || rowsOut(index) >= 1) return null;
          const appear = Math.min(1, pop(frame, land, 180));
          const duplicate = index > 0;
          const y = rowY(index);
          const out = rowsOut(index);
          return <g key={index} opacity={appear * (1 - out)} transform={`translate(${24 * out + (compact ? 14 : -14) * (1 - appear)} 0)`}>
            <rect x={Q.x + 10} y={y - L.rows.h / 2} width={Q.w - 20} height={L.rows.h} rx={8} style={{ fill: duplicate ? tint("danger", 13) : tint("ink", 5) }} />
            <Text x={Q.x + L.cols.id} y={y} size={size} font="mono" weight={500} tone="muted">{String(index + 1)}</Text>
            {L.cols.name !== null ? <Text x={Q.x + L.cols.name} y={y} size={size} font="mono" weight={500}>sync-agent</Text> : null}
            <Text x={Q.x + L.cols.data} y={y} size={size} font="mono" weight={600} tone={duplicate ? "danger" : "ink"}>env-42</Text>
            {CALLSITE_OPTS[index]!.reduce<{ x: number; nodes: ReactNode[] }>((acc, opt) => ({
              x: acc.x + chipW(opt.text) + 6,
              nodes: [...acc.nodes, <Tag key={opt.text} x={acc.x} y={y} text={opt.text} tone="muted" anchor="start" size={CHIP} />],
            }), { x: Q.x + L.cols.opts, nodes: [] }).nodes}
            {duplicate && !compact ? <Tag x={Q.x + Q.w - 16} y={y} text={fr ? "doublon" : "duplicate"} tone="danger" anchor="end" size={CHIP} appear={pop(frame, land + 6)} /> : null}
          </g>;
        })}
        <Ring x={Q.x + 10} y={rowY(1)} frame={frame} at={T.a[1] + FLY} tone="danger" />
        <Ring x={Q.x + 10} y={rowY(2)} frame={frame} at={T.a[2] + FLY} tone="danger" />

        {/* Act 2 row: one delayed job with a deterministic id. */}
        {frame >= cardLand ? (() => {
          const appear = Math.min(1, pop(frame, cardLand, 180));
          const y = rowY(0);
          const mergeFlash = Math.max(0, ...b.slice(1).map((hit) => frame >= hit.atQueue ? 1 - ease(frame, hit.atQueue, hit.atQueue + 24) : 0));
          return <g opacity={appear}>
            <rect x={Q.x + 10} y={y - L.rows.h / 2} width={Q.w - 20} height={L.rows.h} rx={8} style={{ fill: tint("ok", 14 + 14 * mergeFlash) }} />
            <Text x={Q.x + L.cols.id} y={y} size={size} font="mono" weight={600} tone="ok">{JOB_ID}</Text>
            {!compact ? <Text x={Q.x + 370} y={y} size={size} font="mono" weight={600}>env-42</Text> : null}
            <Tag x={Q.x + Q.w - 16 - (merges > 0 ? 36 : 0) * Math.min(1, pop(frame, b[1]!.atQueue))} y={y} text="delayed" tone="line" anchor="end" size={CHIP} />
            {merges > 0 ? <g key={merges}>
              <Tag x={Q.x + Q.w - 16} y={y} text={`×${merges + 1}`} tone="ok" anchor="end" size={CHIP} appear={pop(frame, b[merges]!.atQueue, 200)} />
            </g> : null}
          </g>;
        })() : null}
        {b.slice(1).map((hit) => <Ring key={hit.start} x={Q.x + 10} y={rowY(0)} frame={frame} at={hit.atQueue} tone="ok" />)}

        {/* Dedupe ratio, the article's day-one signal: attempts climb, accepted stays at 1. */}
        {(() => {
          const attempts = b.filter((hit) => frame >= hit.atContract).length;
          const accepted = frame >= cardLand ? 1 : 0;
          const bump = attempts > 0 ? pop(frame, b[attempts - 1]!.atContract, 220) : 0;
          const y = rowY(2);
          const cell = (x: number, label: string, value: number, tone: Tone, scale: number) => <>
            <Text x={x} y={y} size={11} font="mono" weight={600} tone="muted" caps>{label}</Text>
            <g transform={`translate(${x + label.length * 8.2 + 12} ${y}) scale(${scale})`}>
              <Text x={0} y={0} size={15} font="mono" weight={700} tone={tone}>{String(value)}</Text>
            </g>
          </>;
          return <g opacity={easeOut(frame, T.b[0], T.b[0] + 16)}>
            <line x1={Q.x + 16} x2={Q.x + Q.w - 16} y1={y - (compact ? 13 : 17)} y2={y - (compact ? 13 : 17)} stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="2 4" />
            {cell(Q.x + 22, fr ? "tentatives" : "enqueue attempts", attempts, "ink", 1 + .25 * (1 - Math.min(1, bump)) * (attempts > 0 ? 1 : 0))}
            {cell(Q.x + (compact ? 250 : 290), fr ? "jobs acceptés" : "accepted jobs", accepted, "ok", 1)}
          </g>;
        })()}
      </Box>
      {/* Count chip: three jobs, then one. */}
      <Tag x={Q.x + Q.w - 16} y={Q.y + (compact ? 20 : 22)} anchor="end" size={CHIP}
        text={fr ? "3 jobs · env-42 ×3" : "3 jobs · env-42 ×3"} tone="danger" appear={pop(frame, T.countA) * (1 - toB)} />
      <Tag x={Q.x + Q.w - 16} y={Q.y + (compact ? 20 : 22)} anchor="end" size={CHIP}
        text={fr ? "3 déclenchements → 1 job" : "3 triggers → 1 job"} tone="ok" appear={pop(frame, T.verdict)} />
    </g>

    {/* Callsite option chips: drawn above every card so they can fly into the contract. */}
    {chipFlights.map(({ call, index, opt, start, land }) => {
      const r = L.calls[call]!;
      const from: Pt = [callChipX(call, index), r.y + L.code.chips];
      const to: Pt = [slotX(opt.slot), defaultsY];
      const t = ease(frame, start, land, cubicOut);
      if (t >= 1) return null;
      // Exit sideways along the chip line, then rise into the slot: never across code.
      const control: Pt = compact ? [to[0], from[1] + 26] : [to[0] - 20, from[1]];
      const [x, y] = t > 0 ? bezier(from, control, to, t) : from;
      const appear = frame < 40 ? easeOut(frame, stagger(call, 8, 5), stagger(call, 8, 5) + 16) : 1;
      return <g key={`${call}-${index}`} opacity={appear * (1 - ease(frame, land - 6, land))}>
        <Tag x={x} y={y} text={opt.text} tone={t > 0 ? "line" : "hot"} anchor="start" size={CHIP} />
      </g>;
    })}

    {/* Act 1 flights: each callsite's own job card, straight to the queue. */}
    {T.a.map((start, call) => {
      const r = L.calls[call]!;
      const points: Pt[] = compact
        ? [[r.x + r.w - 6, r.y + r.h / 2], [r.x + r.w + 10, r.y + r.h / 2], [r.x + r.w + 10, rowY(call)], [Q.x + Q.w - 30, rowY(call)]]
        : [[r.x + r.w, r.y + r.h / 2], [(r.x + r.w + Q.x) / 2, r.y + r.h / 2], [(r.x + r.w + Q.x) / 2, rowY(call)], [Q.x + 40, rowY(call)]];
      return <Comet key={call} points={points} t={ease(frame, start, start + FLY)} tone="hot" r={5.5} tail={.22} />;
    })}

    {/* Act 2: triggers through the contract, then into the queue. */}
    {b.map((hit, call) => <Comet key={call} points={cometPath(call)} t={ease(frame, hit.start, hit.atContract)} tone="line" r={5.5} tail={.25} />)}
    {b.slice(1).map((hit) => <Comet key={hit.start} points={toQueue} t={ease(frame, hit.leave, hit.atQueue)} tone="ok" r={5.5} tail={.4} />)}
    {(() => {
      const t = ease(frame, cardFlightStart, cardLand, cubicOut);
      if (t <= 0 || t >= 1) return null;
      const from: Pt = [toQueue[0]![0], toQueue[0]![1] - 6];
      const to: Pt = compact ? [Q.x + Q.w / 2, rowY(0)] : [Q.x + Q.w / 2, rowY(0)];
      const x = lerp(from[0], to[0], t);
      const y = lerp(from[1], to[1], t);
      const cw = lerp(compact ? 280 : 340, Q.w - 20, t);
      return <g transform={`translate(${x} ${y})`} opacity={Math.min(1, t * 4)}>
        <rect className="scene-card" x={-cw / 2} y={-L.rows.h / 2} width={cw} height={L.rows.h} rx={8} style={{ fill: "var(--scene-card)" }} />
        <rect className="scene-glow" x={-cw / 2} y={-L.rows.h / 2} width={cw} height={L.rows.h} rx={8} style={{ fill: tint("ok", 18), color: "var(--visual-ok)" }} stroke="var(--visual-ok)" strokeOpacity={.6} />
        <Text x={0} y={.5} size={13} font="mono" weight={600} tone="ok" anchor="middle">{compact ? "delayed · env-42" : "add → delayed job · env-42"}</Text>
      </g>;
    })()}
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 1,
  title: { en: "From queue.add to a jobify contract", fr: "De queue.add à un contrat jobify" },
  caption: {
    en: "The issue is not BullMQ but option drift at callsites. jobify centralizes the options and requires a deterministic makeJobId, so repeated triggers for the same entity collapse into one job.",
    fr: "Le problème n’est pas BullMQ mais la dérive des options à chaque appel. jobify centralise les options et impose un makeJobId déterministe\u00a0: les déclenchements répétés pour une même entité se regroupent en un seul job.",
  },
  beats: [
    { at: 0, text: { en: "Three callsites add sync-agent via @InjectQueue, each picking its own options.", fr: "Trois appels ajoutent sync-agent via @InjectQueue, chacun avec ses propres options." } },
    { at: T.a[1] + FLY, text: { en: "No jobId, no shared invariant: the same environment is queued three times.", fr: "Pas de jobId, aucun invariant commun\u00a0: le même environnement part trois fois en queue." } },
    { at: T.fix, text: { en: "jobify pulls the options into one contract; debounce requires name, delayInMs and makeJobId.", fr: "jobify rassemble les options dans un seul contrat\u00a0; le debounce exige name, delayInMs et makeJobId." } },
    { at: T.b[0], text: { en: "makeJobId derives one deterministic jobId from the environment: one delayed job.", fr: "makeJobId dérive un jobId déterministe de l’environnement\u00a0: un seul job delayed." } },
    { at: T.b[1] + LEG1, text: { en: "Same jobId: the existing job is found and its id returned. Three triggers, one job.", fr: "Même jobId\u00a0: le job existant est retrouvé et son id renvoyé. Trois déclenchements, un job." } },
  ],
  Stage,
});
