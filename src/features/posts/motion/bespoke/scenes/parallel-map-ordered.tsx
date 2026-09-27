import { Box, Camera, ease, easeOut, enter, lerp, pop, Pulse, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// A deterministic replay of `parallelMapOrdered(events, 8, mapper)` from the
// article. Lookup durations are illustrative; #2 is deliberately slow so the
// head-of-line wait (ordered output) is visible.
const CONCURRENCY = 8;
const INTRO = 34;
const PULL_GAP = 5;
const EMIT_GAP = 8;
const FLIGHT = 14;
const DURATIONS = [46, 60, 156, 40, 54, 34, 70, 44, 52, 40, 60, 36] as const;
const N = DURATIONS.length;

type Timing = { start: number; finish: number; emit: number };

// Generator semantics: pull and start an item; once inFlight.size reaches the
// concurrency, await the item at emitIndex and yield it; the next pull happens
// right after that yield. After the source ends, drain in index order.
function simulate(): readonly Timing[] {
  const start: number[] = [];
  const finish: number[] = [];
  const emit: number[] = [];
  let lastEmit = 0;
  for (let index = 0; index < N; index += 1) {
    const s = index < CONCURRENCY ? INTRO + index * PULL_GAP : emit[index - CONCURRENCY]! + 4;
    start.push(s);
    finish.push(s + DURATIONS[index]!);
    const head = index - CONCURRENCY + 1;
    if (head >= 0) {
      lastEmit = Math.max(finish[head]!, lastEmit + EMIT_GAP, s);
      emit[head] = lastEmit;
    }
  }
  for (let head = N - CONCURRENCY + 1; head < N; head += 1) {
    lastEmit = Math.max(finish[head]!, lastEmit + EMIT_GAP);
    emit[head] = lastEmit;
  }
  return start.map((s, index) => ({ start: s, finish: finish[index]!, emit: emit[index]! }));
}

const TIMING = simulate();
const LAST_EMIT = TIMING[N - 1]!.emit;
const SLOW = 2;
const DRAIN_AT = TIMING[N - 1]!.start + 4;
const HOL_AT = Math.max(...TIMING.slice(SLOW + 1, CONCURRENCY).map((t) => t.finish));
const PULL = 12;

type Rect = { x: number; y: number; w: number; h: number };

/** Item token: the same card in the source, the inFlight lane and the output. */
function Token({ x, y, w, h, index, tone, opacity = 1, strong = false }: { x: number; y: number; w: number; h: number; index: number; tone: Tone; opacity?: number; strong?: boolean }) {
  if (opacity <= 0) return null;
  return <g opacity={opacity}>
    <rect className="scene-card" x={x} y={y} width={w} height={h} rx={6} style={{ fill: "var(--scene-card)" }} />
    <rect x={x} y={y} width={w} height={h} rx={6} style={{ fill: tint(tone, strong ? 22 : 12) }} stroke={TONE[tone]} strokeOpacity={strong ? .7 : .4} strokeWidth={1} />
    <Text x={x + w / 2} y={y + h / 2 + .5} size={13} font="mono" weight={600} tone={tone === "muted" ? "muted" : tone} anchor="middle">{`#${index}`}</Text>
  </g>;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const wide = !compact;
  const lane = (slot: number): Rect => wide ? { x: 262, y: 96 + slot * 36, w: 392, h: 28 } : { x: 64, y: 160 + slot * 30, w: 446, h: 24 };
  const tokenSize = wide ? { w: 46, h: 20 } : { w: 38, h: 19 };
  const inLane = (slot: number) => ({ x: lane(slot).x + 6, y: lane(slot).y + (lane(slot).h - tokenSize.h) / 2 });
  const inSource = (rank: number) => wide ? { x: 72, y: 100 + rank * 36 } : { x: 84 + rank * 48, y: 64 };
  const outRow = (index: number): Rect => wide ? { x: 716, y: 98 + index * 24, w: 204, h: 20 } : { x: 20 + index * 42, y: 454, w: 38, h: 22 };

  const inFlight = TIMING.filter((t) => t.start <= frame && frame < t.emit).length;
  const emitIndex = TIMING.findIndex((t) => frame < t.emit);
  const hol = emitIndex === SLOW && TIMING.slice(SLOW + 1, CONCURRENCY).every((t) => frame >= t.finish);
  const holOn = ease(frame, HOL_AT, HOL_AT + 10) * (1 - ease(frame, TIMING[SLOW]!.finish, TIMING[SLOW]!.finish + 10));

  // emitIndex pointer glides from lane to lane.
  const pointerY = TIMING.reduce((y, t, index) => index === 0 ? lane(0).y + lane(0).h / 2
    : lerp(y, lane(index % CONCURRENCY).y + lane(index % CONCURRENCY).h / 2, ease(frame, TIMING[index - 1]!.emit, TIMING[index - 1]!.emit + 10)), 0);
  const pointerOn = easeOut(frame, INTRO + PULL + 2, INTRO + PULL + 18) * (1 - ease(frame, LAST_EMIT, LAST_EMIT + 12));

  const window: Rect = wide ? { x: 250, y: 60, w: 416, h: 332 } : { x: 54, y: 124, w: 466, h: 284 };
  const camera = [
    { at: 0 },
    { at: HOL_AT - 20, dur: 40, zoom: 1.03, focus: [lerp(width / 2, lane(SLOW).x + 120, .25), lerp(height / 2, lane(SLOW).y, .25)] as const },
    { at: TIMING[SLOW]!.emit + 10, dur: 50, zoom: 1 },
  ];

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* inFlight: eight slots; item i always reuses slot i % 8. */}
    <g {...enter(frame, 4)}>
      <Box x={window.x} y={window.y} w={window.w} h={window.h} tone={hol ? "danger" : "line"} variant="ghost" radius={16} />
      <g opacity={1 - ease(frame, DRAIN_AT, DRAIN_AT + 10)}>
        <Text x={window.x + 16} y={window.y + 18} size={11} font="mono" weight={600} tone="muted" caps>{wide ? "inFlight · db.getMetadata" : "inFlight"}</Text>
      </g>
      <g opacity={easeOut(frame, DRAIN_AT + 6, DRAIN_AT + 20)}>
        <Text x={window.x + 16} y={window.y + 18} size={12} font="mono" weight={600} tone="line">{"while (inFlight.size > 0)"}</Text>
      </g>
      <Text x={window.x + window.w - 16 - CONCURRENCY * 11 - 8} y={window.y + 18} size={12} font="mono" weight={600} tone={inFlight >= CONCURRENCY ? "hot" : "muted"} anchor="end">{`size ${inFlight} / ${CONCURRENCY}`}</Text>
      {Array.from({ length: CONCURRENCY }, (_, index) => <circle key={index} cx={window.x + window.w - 16 - (CONCURRENCY - 1 - index) * 11 - 4} cy={window.y + 18} r={3.5}
        fill={index < inFlight ? TONE[inFlight >= CONCURRENCY ? "hot" : "line"] : "none"} stroke={index < inFlight ? "none" : "var(--scene-hairline)"} strokeWidth={1} />)}
    </g>

    {Array.from({ length: CONCURRENCY }, (_, slot) => {
      const r = lane(slot);
      const item = TIMING.map((t, index) => ({ ...t, index })).filter((t) => t.index % CONCURRENCY === slot && t.start <= frame && frame < t.emit).at(-1);
      const barX = r.x + tokenSize.w + 18;
      const barW = r.w - tokenSize.w - 18 - 34;
      const cy = r.y + r.h / 2;
      const ghost = <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={8} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="3 5" opacity={.8} />;
      if (!item) return <g key={slot} {...enter(frame, 6 + slot * 3)}>{ghost}</g>;
      const done = frame >= item.finish;
      const head = item.index === emitIndex;
      const blocking = head && !done && hol;
      const progress = Math.min(1, (frame - item.start) / (item.finish - item.start));
      const tone: Tone = blocking ? "danger" : done ? "hot" : "line";
      const landed = easeOut(frame, item.start, item.start + PULL);
      return <g key={slot}>
        {ghost}
        <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={8} style={{ fill: tint(tone, blocking ? 12 : 6) }} opacity={landed} />
        <rect x={barX} y={cy - 3} width={barW} height={6} rx={3} style={{ fill: tint("ink", 8) }} opacity={landed} />
        <rect className={blocking ? "scene-glow" : undefined} x={barX} y={cy - 3} width={Math.max(6, barW * progress)} height={6} rx={3} fill={TONE[tone]} style={{ color: TONE[tone] }} opacity={landed * (done ? .7 : 1)} />
        {done ? <Text x={r.x + r.w - 16} y={cy + .5} size={13} font="mono" weight={700} tone="hot" anchor="middle" opacity={pop(frame, item.finish)}>✓</Text> : null}
        {blocking ? <Pulse x={barX + barW * progress} y={cy} frame={frame} at={HOL_AT} period={36} r={6} tone="danger" /> : null}
      </g>;
    })}

    {/* emitIndex: the only item allowed to leave next. */}
    {pointerOn > 0 ? <g opacity={pointerOn}>
      <path d={`M${lane(0).x - 14} ${pointerY - 6}L${lane(0).x - 6} ${pointerY}L${lane(0).x - 14} ${pointerY + 6}Z`} fill={TONE[hol ? "danger" : "hot"]} />
      {wide ? <Text x={lane(0).x - 20} y={pointerY} size={11} font="mono" weight={600} tone={hol ? "danger" : "hot"} anchor="end">emitIndex</Text> : null}
    </g> : null}

    {/* Source: events waiting to be pulled; each pull flies into its slot. */}
    <g {...enter(frame, 10)}>
      <Text x={wide ? 72 : 20} y={wide ? 78 : 74} size={11} font="mono" weight={600} tone="muted" caps>source</Text>
      <Tag x={wide ? 72 : 20} y={wide ? 262 : 104} anchor="start" size={11} text={fr ? "⏸ pas de nouveau pull" : "⏸ no new pull"} tone={hol ? "danger" : "hot"} appear={Math.min(pop(frame, TIMING[CONCURRENCY - 1]!.start + 2), 1 - ease(frame, TIMING[SLOW]!.emit, TIMING[SLOW]!.emit + 10))} />
    </g>
    {TIMING.map((t, index) => {
      if (frame >= t.emit) return null;
      const pulled = TIMING.slice(0, index).reduce((sum, earlier) => sum + ease(frame, earlier.start, earlier.start + PULL), 0);
      const src = inSource(index - pulled);
      const dst = inLane(index % CONCURRENCY);
      const fly = easeOut(frame, t.start, t.start + PULL);
      const x = lerp(src.x, dst.x, fly);
      const y = lerp(src.y, dst.y, fly);
      const visibleInSource = wide ? index - pulled < 8 : index - pulled < 9;
      const done = frame >= t.finish;
      const tone: Tone = frame < t.start ? "muted" : index === emitIndex && hol ? "danger" : done ? "hot" : "line";
      return <Token key={index} x={x} y={y} w={tokenSize.w} h={tokenSize.h} index={index} tone={tone}
        opacity={frame < t.start ? (visibleInSource ? easeOut(frame, 10 + index * 2, 26 + index * 2) * (index - pulled < 7.5 || !wide ? 1 : .5) : 0) : 1} />;
    })}

    {/* Output: yielded strictly in index order, whatever the finish order was. */}
    <g {...enter(frame, 14)}>
      <Text x={wide ? outRow(0).x : 20} y={wide ? 78 : 434} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "yield · ordre CSV" : "yield · CSV order"}</Text>
      {TIMING.map((_, index) => {
        const o = outRow(index);
        return <rect key={index} x={o.x} y={o.y} width={o.w} height={o.h} rx={6} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="3 4" opacity={.7} />;
      })}
    </g>
    {TIMING.map((t, index) => {
      if (frame < t.emit) return null;
      const from = inLane(index % CONCURRENCY);
      const o = outRow(index);
      const fly = ease(frame, t.emit, t.emit + FLIGHT, (x) => 1 - (1 - x) ** 3);
      const x = lerp(from.x, o.x, fly);
      const y = lerp(from.y, o.y + (o.h - tokenSize.h) / 2, fly) - Math.sin(Math.PI * fly) * (wide ? 16 : 22);
      const settled = fly >= 1;
      return <g key={index}>
        <Token x={x} y={y} w={tokenSize.w} h={tokenSize.h} index={index} tone="ok" strong={!settled} />
        {wide && settled ? <g opacity={easeOut(frame, t.emit + FLIGHT, t.emit + FLIGHT + 10)}>
          <rect x={o.x + tokenSize.w + 10} y={o.y + o.h / 2 - 2} width={o.w - tokenSize.w - 40} height={4} rx={2} style={{ fill: tint("ok", 30) }} />
          <Text x={o.x + o.w - 12} y={o.y + o.h / 2 + .5} size={11} font="mono" weight={700} tone="ok" anchor="middle">✓</Text>
        </g> : null}
      </g>;
    })}

    {/* Payoff: inFlight drained, every row yielded in index order. */}
    <g {...enter(frame, LAST_EMIT + 12)}>
      <Tag x={window.x + window.w / 2} y={window.y + window.h / 2} size={12} tone="ok" text={fr ? `✓ ${N} lignes, dans l’ordre · jamais plus de ${CONCURRENCY} en vol` : `✓ ${N} rows, in order · never more than ${CONCURRENCY} in flight`} appear={pop(frame, LAST_EMIT + 12)} />
    </g>

    {/* Head-of-line: #2 is still running, every later row is ready and waits. */}
    <Tag x={wide ? 72 : window.x + window.w} y={wide ? 296 : 104} anchor={wide ? "start" : "end"} size={11} tone="danger"
      text={fr ? "#2 lent\u00a0: la sortie attend" : "#2 slow: output waits"} appear={holOn > 0 ? Math.min(pop(frame, HOL_AT), holOn) : 0} />
  </Camera>;
}

export default defineScene({
  durationInFrames: LAST_EMIT + 90,
  posterFrame: TIMING[SLOW]!.finish - 12,
  title: { en: "Bounded, but in order", fr: "Borné, mais dans l’ordre" },
  caption: {
    en: "parallelMapOrdered keeps at most 8 lookups in flight and always yields the oldest index first: a slow row delays the output, it never breaks the order or the memory bound.",
    fr: "parallelMapOrdered garde au plus 8 requêtes en vol et émet toujours l’index le plus ancien d’abord\u00a0: une ligne lente retarde la sortie, sans casser l’ordre ni la borne mémoire.",
  },
  beats: [
    { at: 0, text: { en: "Each event pulled from the source starts its db.getMetadata lookup in the inFlight map.", fr: "Chaque événement tiré de la source lance sa requête db.getMetadata dans la map inFlight." } },
    { at: TIMING[CONCURRENCY - 1]!.start, text: { en: "8 in flight: the generator stops pulling and awaits the oldest index, emitIndex.", fr: "8 en vol\u00a0: le générateur arrête de tirer et attend l’index le plus ancien, emitIndex." } },
    { at: HOL_AT, text: { en: "#2 is slow. Later rows are done but wait: the CSV must keep its order.", fr: "#2 est lent. Les lignes suivantes sont prêtes mais attendent\u00a0: le CSV doit garder son ordre." } },
    { at: TIMING[SLOW]!.emit, text: { en: "#2 lands: the backlog is yielded in order and new events take the freed slots.", fr: "#2 arrive\u00a0: l’arriéré est émis dans l’ordre et de nouveaux événements prennent les places libérées." } },
    { at: DRAIN_AT, text: { en: "Source exhausted: the final while loop drains inFlight, still in index order.", fr: "Source épuisée\u00a0: la boucle while finale vide inFlight, toujours dans l’ordre des index." } },
  ],
  Stage,
});
