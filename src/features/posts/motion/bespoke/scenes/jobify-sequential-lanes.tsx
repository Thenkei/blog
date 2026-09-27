import { Box, Checkpoint, Comet, ease, easeOut, enter, lerp, Meter, pop, stagger, Tag, Text, TONE, tint, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). Two lanes of make-jobify-sequential for sequentialKey
// "user-sync" / processingKey "sync-profile": user 42 receives three calls, user 7
// one. Each lane is a Redis list: RPUSH at the tail, LRANGE reads the head, LPOP in
// finally, onComplete chains the next call. The second call for 42 fails.
type Item = { lane: 0 | 1; label: string; pushAt: number; runAt: number; endAt: number; ok: boolean };

const POP = 12; // frames for the LPOP exit + shift
const FLY = 18; // call → tail slot

const ITEMS: readonly Item[] = [
  { lane: 0, label: "#1", pushAt: 24, runAt: 56, endAt: 116, ok: true },
  { lane: 0, label: "#2", pushAt: 40, runAt: 140, endAt: 190, ok: false },
  { lane: 1, label: "#1", pushAt: 60, runAt: 86, endAt: 146, ok: true },
  { lane: 0, label: "#3", pushAt: 74, runAt: 222, endAt: 274, ok: true },
];
const popAt = (item: Item) => item.endAt + 8;
const LANE_IDS = ["42", "7"] as const;

const T = {
  concurrent: 92,
  fail: ITEMS[1]!.endAt,
  chain: ITEMS[3]!.runAt - 10,
  end: 400,
} as const;

const GANTT = { from: 40, to: 290 } as const;

type Rect = { x: number; y: number; w: number; h: number };
type LaneGeo = {
  card: Rect;
  name: Readonly<{ x: number; y: number }>;
  sub: Readonly<{ x: number; y: number }>;
  cmd: Readonly<{ x: number; y: number; anchor: "start" | "end" }>;
  divider: number | null;
  listY: number;
  head: number;
  pitch: number;
  cellW: number;
  entryX: number;
  proc: Rect;
};

function Ring({ x, y, frame, at, tone, r = 8 }: { x: number; y: number; frame: number; at: number; tone: Tone; r?: number }) {
  const t = easeOut(frame, at, at + 26);
  if (frame < at || t >= 1) return null;
  return <circle cx={x} cy={y} r={r * (1 + 1.8 * t)} fill="none" stroke={TONE[tone]} strokeWidth={1.5} opacity={(1 - t) * .8} />;
}

function laneGeo(compact: boolean, index: number): LaneGeo {
  if (compact) {
    const y = 56 + index * 162;
    return {
      card: { x: 20, y, w: 500, h: 150 },
      name: { x: 38, y: y + 26 },
      sub: { x: 100, y: y + 26 },
      cmd: { x: 502, y: y + 26, anchor: "end" },
      divider: null,
      listY: y + 78,
      head: 468,
      pitch: 60,
      cellW: 52,
      entryX: 60,
      proc: { x: 36, y: y + 102, w: 468, h: 38 },
    };
  }
  const y = 60 + index * 110;
  return {
    card: { x: 40, y, w: 880, h: 98 },
    name: { x: 62, y: y + 28 },
    sub: { x: 62, y: y + 50 },
    cmd: { x: 62, y: y + 76, anchor: "start" },
    divider: 244,
    listY: y + 52,
    head: 570,
    pitch: 74,
    cellW: 62,
    entryX: 290,
    proc: { x: 628, y: y + 14, w: 272, h: 70 },
  };
}

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";

  const lane = (laneIndex: 0 | 1) => {
    const G = laneGeo(compact, laneIndex);
    const items = ITEMS.filter((item) => item.lane === laneIndex);
    const id = LANE_IDS[laneIndex];
    const running = items.find((item) => frame >= item.runAt && frame < popAt(item));
    const done = running ? frame >= running.endAt : false;
    const waitingNext = !running ? items.find((item) => frame < item.runAt && items.some((prev) => popAt(prev) <= frame)) : undefined;

    // Last Redis command on this lane: the lane's instrument readout.
    const events = items.flatMap((item): { at: number; text: string; tone: Tone }[] => [
      { at: item.pushAt, text: `RPUSH ${item.label}`, tone: "line" },
      { at: item.runAt, text: `LRANGE → ${item.label}`, tone: "line" },
      { at: popAt(item), text: `finally → LPOP ${item.label}`, tone: (item.ok ? "muted" : "danger") },
    ]).filter((event) => event.at <= frame).sort((a, b) => a.at - b.at);
    const last = events.at(-1);

    const headX = G.head - G.cellW / 2;

    return <g key={laneIndex} {...enter(frame, stagger(laneIndex, 0, 6))}>
      <Box x={G.card.x} y={G.card.y} w={G.card.w} h={G.card.h} tone="line" radius={16}>
        <Text x={G.name.x} y={G.name.y} size={15.5} font="mono" weight={600}>{`id ${id}`}</Text>
        <Text x={G.sub.x} y={G.sub.y} size={12} font="mono" weight={500} tone="muted">user-sync · sync-profile</Text>
        {G.divider !== null ? <line x1={G.divider} x2={G.divider} y1={G.card.y + 16} y2={G.card.y + G.card.h - 16} stroke="var(--scene-hairline)" strokeWidth={1} /> : null}
        {/* list rail: tail on the left, head on the right */}
        <line x1={G.entryX - 18} x2={G.head + G.cellW / 2} y1={G.listY} y2={G.listY} stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="1 5" strokeLinecap="round" />
        <Text x={G.entryX - 18} y={G.listY - 26} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "liste redis" : "redis list"}</Text>
        <Text x={G.head} y={G.listY - 26} size={11} font="mono" weight={600} tone="muted" anchor="middle" caps>{fr ? "tête" : "head"}</Text>
        <Text x={(G.entryX + G.head) / 2} y={G.listY + .5} size={12} font="mono" weight={500} tone="muted" anchor="middle" opacity={.8 * easeOut(frame, popAt(items.at(-1)!) + POP, popAt(items.at(-1)!) + POP + 16)}>{fr ? "liste vide" : "list empty"}</Text>
      </Box>
      {last ? <g key={last.at} transform={`translate(${G.cmd.x} ${G.cmd.y}) scale(${.92 + .08 * Math.min(1, pop(frame, last.at, 200))}) translate(${-G.cmd.x} ${-G.cmd.y})`}>
        <Tag x={G.cmd.x} y={G.cmd.y} text={last.text} tone={last.tone} anchor={G.cmd.anchor} size={11} />
      </g> : null}

      {/* Cells: fly in at the tail, shift toward the head, leave on LPOP. */}
      {items.map((item, order) => {
        if (frame < item.pushAt) return null;
        const shifted = items.slice(0, order).reduce((sum, prev) => sum + ease(frame, popAt(prev), popAt(prev) + POP), 0);
        const slot = order - shifted;
        const fly = ease(frame, item.pushAt, item.pushAt + FLY, (t) => 1 - (1 - t) ** 3);
        const x = lerp(G.entryX, G.head - slot * G.pitch, fly) - G.cellW / 2;
        const leaving = easeOut(frame, popAt(item), popAt(item) + POP);
        if (leaving >= 1) return null;
        const isHead = running === item;
        const failed = isHead && done && !item.ok;
        const tone: Tone = failed ? "danger" : isHead ? (done ? "ok" : "hot") : "line";
        return <g key={order} opacity={Math.min(1, fly * 3) * (1 - leaving)} transform={`translate(0 ${-leaving * 16})`}>
          <Box x={x} y={G.listY - 16} w={G.cellW} h={32} tone={tone} focus={isHead ? 1 : 0} radius={9}>
            <Text x={x + G.cellW / 2} y={G.listY + .5} size={13} font="mono" weight={600} tone={isHead ? tone : "ink"} anchor="middle">{`${id} ${item.label}`}</Text>
          </Box>
        </g>;
      })}
      {items.map((item) => <Ring key={item.label} x={G.head} y={G.listY} frame={frame} at={item.runAt} tone="hot" r={10} />)}

      {/* Args travel from the head into the processor on each LRANGE. */}
      {items.map((item) => <Comet key={item.label} points={compact ? [[G.head, G.listY + 16], [G.head, G.proc.y]] : [[headX + G.cellW, G.listY], [G.proc.x, G.listY]]} t={ease(frame, item.runAt - 2, item.runAt + 12)} tone="hot" r={4.5} tail={.3} />)}

      {/* Processor */}
      <Box x={G.proc.x} y={G.proc.y} w={G.proc.w} h={G.proc.h} tone={running ? (done ? (running.ok ? "ok" : "danger") : "hot") : "line"} focus={running && !done ? .5 : 0} radius={12}>
        <Text x={G.proc.x + 16} y={G.proc.y + (compact ? 13 : 22)} size={13} font="mono" weight={600}>{`syncUserProfile(${id})`}</Text>
      </Box>
      {running ? (() => {
        const progress = ease(frame, running.runAt, running.endAt, (t) => t);
        const meterW = G.proc.w - (compact ? 130 : 112);
        const meterY = G.proc.y + (compact ? 25 : 46);
        return <g opacity={1 - ease(frame, popAt(running) - 4, popAt(running))}>
          <Meter x={G.proc.x + 16} y={meterY} w={meterW} h={6} value={progress} tone={done && !running.ok ? "danger" : done ? "ok" : "hot"} />
          <Text x={G.proc.x + 16 + meterW + 10} y={meterY + 3} size={12} font="mono" weight={600} tone={done ? (running.ok ? "ok" : "danger") : "ink"}>{running.label}</Text>
          {done ? <>
            <Checkpoint x={G.proc.x + G.proc.w - 22} y={G.proc.y + G.proc.h / 2} r={11} state={running.ok ? "pass" : "fail"} appear={Math.min(1, pop(frame, running.endAt))} />
            <Ring x={G.proc.x + G.proc.w - 22} y={G.proc.y + G.proc.h / 2} frame={frame} at={running.endAt} tone={running.ok ? "ok" : "danger"} r={11} />
          </> : null}
        </g>;
      })() : <Text x={G.proc.x + 16} y={G.proc.y + (compact ? 28 : 48)} size={12} font="mono" weight={500} tone={waitingNext ? "hot" : "muted"}>
        {waitingNext ? (fr ? "onComplete → appel suivant" : "onComplete → next call") : (fr ? "au repos" : "idle")}
      </Text>}
    </g>;
  };

  // Calls arriving: runSyncUser(id) chips that drop into the tail.
  const calls = ITEMS.map((item, index) => {
    const G = laneGeo(compact, item.lane);
    const on = easeOut(frame, item.pushAt - 12, item.pushAt) * (1 - ease(frame, item.pushAt + 2, item.pushAt + 12));
    if (on <= 0) return null;
    return <g key={index} transform={`translate(${-14 * (1 - on)} 0)`}>
      <Tag x={G.entryX - 20} y={G.listY} tone="line" text={`runSyncUser(${LANE_IDS[item.lane]})`} appear={on} anchor="start" size={11.5} />
    </g>;
  });

  // Run history: serialized inside a lane, overlapping across lanes.
  const gc: Rect = compact ? { x: 20, y: 382, w: 500, h: 126 } : { x: 40, y: 284, w: 880, h: 98 };
  const track = compact ? { x0: 96, x1: 500 } : { x0: 150, x1: 900 };
  const rowY = compact ? [gc.y + 50, gc.y + 80] : [gc.y + 52, gc.y + 78];
  const tagY = compact ? gc.y + 108 : gc.y + 24;
  const gx = (f: number) => lerp(track.x0, track.x1, Math.max(0, Math.min(1, (f - GANTT.from) / (GANTT.to - GANTT.from))));
  const lane42 = ITEMS[0]!;
  const lane7 = ITEMS[2]!;
  const overlap = { from: Math.max(lane42.runAt, lane7.runAt), to: Math.min(lane42.endAt, lane7.endAt) };
  const band = easeOut(frame, T.concurrent, T.concurrent + 16);

  return <g>
    {lane(0)}
    {lane(1)}
    {calls}

    <g {...enter(frame, 14)}>
      <Box x={gc.x} y={gc.y} w={gc.w} h={gc.h} tone="line" radius={16}>
        <Text x={gc.x + 22} y={gc.y + 24} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "exécutions dans le temps" : "runs over time"}</Text>
        {LANE_IDS.map((id, index) => <g key={id}>
          <Text x={gc.x + 22} y={rowY[index]!} size={12.5} font="mono" weight={600} tone="muted">{`id ${id}`}</Text>
          <line x1={track.x0} x2={track.x1} y1={rowY[index]} y2={rowY[index]} stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="1 5" strokeLinecap="round" />
        </g>)}
      </Box>
      {/* the two ids overlap in time: concurrency across entities */}
      <rect x={gx(overlap.from)} y={rowY[0]! - 16} width={(gx(overlap.to) - gx(overlap.from)) * band} height={rowY[1]! - rowY[0]! + 32} rx={8} style={{ fill: tint("ok", 9) }} stroke={TONE.ok} strokeOpacity={.35 * band} strokeDasharray="3 4" />
      {ITEMS.map((item) => {
        if (frame < item.runAt) return null;
        const end = Math.min(frame, item.endAt);
        const finished = frame >= item.endAt;
        const tone: Tone = finished ? (item.ok ? "ok" : "danger") : "hot";
        const y = rowY[item.lane]!;
        const w = Math.max(3, gx(end) - gx(item.runAt));
        return <g key={`${item.lane}${item.label}`}>
          <rect className={finished ? undefined : "scene-glow"} x={gx(item.runAt)} y={y - 8} width={w} height={16} rx={8} fill={TONE[tone]} opacity={finished ? .9 : 1} style={{ color: TONE[tone] }} />
          {w > 40 ? <Text x={gx(item.runAt) + 12} y={y + .5} size={11} font="mono" weight={700} tone="ink" opacity={.9}>
            <tspan style={{ fill: "var(--scene-card)" }}>{`${item.label}${finished ? (item.ok ? " ✓" : " ✗") : ""}`}</tspan>
          </Text> : null}
        </g>;
      })}
      {frame < GANTT.to ? <line x1={gx(frame)} x2={gx(frame)} y1={rowY[0]! - 18} y2={rowY[1]! + 18} stroke="var(--scene-ink)" strokeOpacity={.3 * easeOut(frame, GANTT.from, GANTT.from + 10)} strokeWidth={1} /> : null}
      <Tag x={(gx(overlap.from) + gx(overlap.to)) / 2} y={tagY} tone="ok" size={11} text={fr ? "autre id → en parallèle" : "other id → concurrent"} appear={pop(frame, T.concurrent + 6)} />
      <Tag x={(gx(ITEMS[3]!.runAt) + gx(ITEMS[3]!.endAt)) / 2} y={tagY} tone="ok" size={11} text={fr ? "lane non bloquée" : "lane not blocked"} appear={pop(frame, ITEMS[3]!.runAt + 4)} />
    </g>
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 1,
  title: { en: "Sequential lanes in Redis", fr: "Lanes séquentielles dans Redis" },
  caption: {
    en: "make-jobify-sequential serializes calls for the same entity with a Redis list per lane and id, while other ids run concurrently. Dequeuing in finally keeps a failed processor from blocking its lane.",
    fr: "make-jobify-sequential sérialise les appels d’une même entité avec une liste Redis par lane et par id, tandis que les autres ids avancent en parallèle. Le dépilement dans finally empêche un processor en échec de bloquer sa lane.",
  },
  beats: [
    { at: 0, text: { en: "runSyncUser is called three times for user 42: each call's args are RPUSHed onto that lane's Redis list.", fr: "runSyncUser est appelé trois fois pour l’utilisateur 42\u00a0: chaque appel est ajouté par RPUSH à la liste Redis." } },
    { at: T.concurrent, text: { en: "Only the head runs (LRANGE). User 7 has its own identifier, so it runs concurrently.", fr: "Seule la tête s’exécute (LRANGE). L’utilisateur 7 a son propre identifier\u00a0: il s’exécute en parallèle." } },
    { at: T.fail, text: { en: "Call #2 fails. The dequeue sits in finally, so it is popped anyway.", fr: "L’appel n°\u00a02 échoue. Le dépilement est dans finally\u00a0: il est retiré quand même." } },
    { at: T.chain, text: { en: "onComplete chains the next queued call: the failure does not block the lane forever.", fr: "onComplete enchaîne l’appel suivant\u00a0: l’échec ne bloque pas la lane indéfiniment." } },
  ],
  Stage,
});
