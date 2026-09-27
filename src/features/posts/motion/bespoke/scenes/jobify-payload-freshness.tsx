import { Box, Camera, CodeBlock, Comet, dim, ease, easeOut, enter, lerp, pop, Tag, Text, TONE, tint, type CodeLine, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). Act 1: the key ignores roleIdsAllowedToApprove, so the second
// trigger collapses into a job that still carries the first payload. Act 2 replays
// both triggers with the article's makeJobId, which encodes the roles.
const T = {
  t1A: 30,
  t2A: 100,
  runA: 176,
  fix: 250,
  t1B: 336,
  t2B: 380,
  runB: 436,
  end: 570,
} as const;

const KEY_LATE = 14; // trigger card in → its jobId is computed
const TRAVEL = 20; // payload comet, trigger → queue
const RUN_FLY = 28; // job card, queue → processor
const RUN_STAGGER = 10;

const PAYLOADS = ["[\"r1\"]", "[\"r1\", \"r7\"]"] as const;
const KEYS_A = ["env-42", "env-42"] as const;
const KEYS_B = ["env-42-r1", "env-42-r1-r7"] as const;

const CODE_A: CodeLine[] = [
  { text: "makeJobId: ({ environmentId }) =>" },
  { text: "  environmentId, // roles ignored", tone: "danger" },
];
const CODE_B: CodeLine[] = [
  { text: "makeJobId: ({ environmentId," },
  { text: "  roleIdsAllowedToApprove }) =>" },
  { text: "  environmentId + \"-\" +", tone: "ok" },
  { text: "  roleIdsAllowedToApprove.join(\"-\"),", tone: "ok" },
];

type Rect = { x: number; y: number; w: number; h: number };
type Pt = readonly [number, number];

function Ring({ x, y, frame, at, tone, r = 7 }: { x: number; y: number; frame: number; at: number; tone: Tone; r?: number }) {
  const t = easeOut(frame, at, at + 26);
  if (frame < at || t >= 1) return null;
  return <circle cx={x} cy={y} r={r * (1 + 1.8 * t)} fill="none" stroke={TONE[tone]} strokeWidth={1.5} opacity={(1 - t) * .8} />;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const actB = frame >= T.fix;
  const aOut = 1 - ease(frame, T.fix, T.fix + 16);

  const L = compact
    ? {
      code: { x: 20, y: 54, w: 500 }, codeSize: 13.5,
      trig: [{ x: 20, y: 196, w: 500, h: 46 }, { x: 20, y: 248, w: 500, h: 46 }] as Rect[],
      queue: { x: 20, y: 306, w: 500, h: 94 }, jobH: 24, jobY: [36, 64],
      proc: { x: 20, y: 412, w: 500, h: 96 },
    }
    : {
      code: { x: 40, y: 64, w: 400 }, codeSize: 14,
      trig: [{ x: 40, y: 226, w: 400, h: 70 }, { x: 40, y: 310, w: 400, h: 70 }] as Rect[],
      queue: { x: 480, y: 64, w: 440, h: 170 }, jobH: 54, jobY: [44, 106],
      proc: { x: 480, y: 250, w: 440, h: 130 },
    };
  const { queue: Q, proc: P } = L;

  const starts = actB ? [T.t1B, T.t2B] : [T.t1A, T.t2A];
  const keys = actB ? KEYS_B : KEYS_A;
  const runAt = actB ? T.runB : T.runA;
  const landAt = (index: number) => starts[index]! + KEY_LATE + TRAVEL;
  // In act 1 both payloads target the one job; act 2 gives each its own slot.
  const slotOf = (index: number) => actB ? index : 0;
  const jobTop = (slot: number) => Q.y + L.jobY[slot]!;
  const jobMid = (slot: number) => jobTop(slot) + L.jobH / 2;
  const replayIn = actB ? easeOut(frame, T.t1B - 20, T.t1B) : 1;
  const act = actB ? replayIn : aOut;

  // ── Triggers
  const trigger = (index: number) => {
    const r = L.trig[index]!;
    const start = starts[index]!;
    const keyAt = start + KEY_LATE;
    const sameKey = !actB && index === 1;
    const keyTone: Tone = sameKey ? "danger" : actB ? "ok" : "ink";
    const firing = ease(frame, keyAt - 4, keyAt + 4) * (1 - ease(frame, landAt(index), landAt(index) + 12));
    const chipText = `jobId ${keys[index]}`;
    if (frame < start) return null;
    return <g key={`${actB ? "b" : "a"}-${index}`} opacity={act} transform={enter(frame, start, { from: "left", distance: 18 }).transform}>
      <g opacity={easeOut(frame, start, start + 18)}>
        <Box x={r.x} y={r.y} w={r.w} h={r.h} tone="line" focus={firing} radius={compact ? 12 : 14}>
          <Text x={r.x + 16} y={r.y + (compact ? 15 : 22)} size={11} font="mono" weight={600} tone="muted" caps>{(fr ? "déclenchement " : "trigger ") + (index + 1)}</Text>
          <Text x={r.x + 16} y={r.y + (compact ? 32 : 46)} size={13} font="mono" weight={500}>{"roleIdsAllowedToApprove: "}<tspan fill={TONE[index === 1 ? "hot" : "ink"]} fontWeight={600}>{PAYLOADS[index]}</tspan></Text>
          <Tag x={r.x + r.w - 14} y={r.y + (compact ? r.h / 2 : 22)} text={chipText} tone={keyTone === "ink" ? "line" : keyTone} anchor="end" size={11} appear={pop(frame, keyAt, 190)} />
        </Box>
      </g>
    </g>;
  };

  // ── Payload comets through the gutter (wide) or the right rail (compact).
  const cometPath = (index: number): Pt[] => {
    const r = L.trig[index]!;
    const y = jobMid(slotOf(index));
    if (compact) {
      const rail = r.x + r.w + 10;
      return [[r.x + r.w - 6, r.y + r.h / 2], [rail, r.y + r.h / 2], [rail, y], [Q.x + Q.w - 24, y]];
    }
    const gutter = (r.x + r.w + Q.x) / 2;
    return [[r.x + r.w, r.y + r.h / 2], [gutter, r.y + r.h / 2], [gutter, y], [Q.x + 22, y]];
  };

  // ── Queue job rows
  const jobRow = (slot: number, key: string, payload: string, tone: Tone, appear: number, flash: number) => {
    const top = jobTop(slot);
    const x = Q.x + 12;
    const w = Q.w - 24;
    return <g opacity={appear} transform={`translate(${(compact ? 12 : -12) * (1 - appear)} 0)`}>
      <rect x={x} y={top} width={w} height={L.jobH} rx={10} style={{ fill: tint(tone, 10 + 14 * flash) }} stroke={TONE[tone]} strokeOpacity={.3 + .4 * flash} />
      {frame >= runAt + 8 ? <Tag x={x + w - 12} y={compact ? top + L.jobH / 2 : top + 18} text="completed" tone="muted" anchor="end" size={11} appear={easeOut(frame, runAt + 8, runAt + 20)} /> : null}
      {compact
        ? <>
          <Text x={x + 14} y={top + L.jobH / 2} size={13} font="mono" weight={600}>{key}</Text>
          <Text x={x + 150} y={top + L.jobH / 2} size={13} font="mono" weight={600} tone={tone === "danger" ? "danger" : "muted"}>{payload}</Text>
        </>
        : <>
          <Text x={x + 16} y={top + 18} size={13} font="mono" weight={600}>{`jobId "${key}"`}</Text>
          <Text x={x + 16} y={top + 37} size={13} font="mono" weight={500} tone={tone === "danger" ? "danger" : "muted"}>{`roleIdsAllowedToApprove: ${payload}`}</Text>
        </>}
    </g>;
  };

  // Ran jobs stay listed, dimmed and marked completed.
  const rowsOut = dim(ease(frame, runAt, runAt + 14), .45);
  const kept = !actB && frame >= landAt(1);
  const keptFlash = kept ? 1 - ease(frame, landAt(1), landAt(1) + 30) : 0;

  // ── Run: job cards fly from the queue into the processor.
  const flyStart = (slot: number) => runAt + slot * RUN_STAGGER;
  const landed = (slot: number) => flyStart(slot) + RUN_FLY;
  const lastSlot = actB ? 1 : 0;
  const arrived = frame >= landed(0);
  const doneAt = landed(lastSlot);
  const verdictOn = pop(frame, doneAt + 8);
  const procLines = actB
    ? KEYS_B.map((key, index) => ({ key, payload: PAYLOADS[index]! }))
    : [{ key: KEYS_A[0], payload: PAYLOADS[0] }];
  const procY = (index: number) => P.y + (compact ? 48 : 58) + index * (compact ? 24 : 30);

  const lean = (point: Pt): Pt => [lerp(width / 2, point[0], .04), lerp(height / 2, point[1], .04)];
  const camera = compact ? [{ at: 0 }] : [
    { at: 0 },
    { at: T.runA - 6, zoom: 1.02, focus: lean([P.x + P.w / 2, P.y + P.h / 2]) },
    { at: T.fix + 4, zoom: 1.02, focus: lean([L.code.x + L.code.w / 2, L.code.y + 70]) },
    { at: T.t1B - 10, zoom: 1 },
    { at: T.runB - 6, zoom: 1.02, focus: lean([P.x + P.w / 2, P.y + P.h / 2]) },
    { at: T.runB + 60, dur: 50, zoom: 1 },
  ];

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* makeJobId: the naive key, then the article's */}
    <g opacity={aOut} transform={enter(frame, 0).transform}>
      <g opacity={easeOut(frame, 0, 18)}>
        <CodeBlock x={L.code.x} y={L.code.y} w={L.code.w} frame={frame} lines={CODE_A} title="makeJobId" size={L.codeSize} highlight={frame >= T.t2A + KEY_LATE ? 1 : undefined} />
      </g>
    </g>
    <g opacity={easeOut(frame, T.fix + 10, T.fix + 26)}>
      <CodeBlock x={L.code.x} y={L.code.y} w={L.code.w} frame={frame} title="action-approvers-notifier-service.ts" size={L.codeSize} highlight={frame >= T.fix + 76 ? 3 : undefined}
        lines={CODE_B.map((line, index) => index >= 2 ? { ...line, appearAt: T.fix + 24 + (index - 2) * 30 } : line)} />
    </g>

    {trigger(0)}
    {trigger(1)}

    {/* Queue */}
    <g {...enter(frame, 6, { distance: 16 })}>
      <Box x={Q.x} y={Q.y} w={Q.w} h={Q.h} tone="line" radius={16}>
        <Text x={Q.x + 20} y={Q.y + (compact ? 20 : 24)} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "queue · jobs delayed" : "queue · delayed jobs"}</Text>
        <Tag x={Q.x + Q.w - 16} y={Q.y + (compact ? 20 : 24)} anchor="end" size={11} tone="danger" text={fr ? "payload conservé" : "payload kept"} appear={kept ? pop(frame, landAt(1) + 4) * aOut * rowsOut : 0} />
      </Box>
      <g opacity={act * rowsOut}>
        {[0, 1].map((index) => {
          if (actB ? frame < landAt(index) : index > 0 || frame < landAt(0)) return null;
          const appear = Math.min(1, pop(frame, landAt(index), 180));
          const tone: Tone = actB ? "ok" : kept ? "danger" : "line";
          return <g key={`${actB ? "b" : "a"}-${index}`}>{jobRow(slotOf(index), keys[index]!, PAYLOADS[index]!, tone, appear, actB ? 0 : keptFlash)}</g>;
        })}
        {/* Act 1: the second payload is dropped, shown as a struck-through ghost. */}
        {kept ? (() => {
          const top = jobTop(1);
          const g = easeOut(frame, landAt(1), landAt(1) + 16);
          const strike = easeOut(frame, landAt(1) + 8, landAt(1) + 22);
          const textX = Q.x + (compact ? 26 : 28);
          const payloadW = PAYLOADS[1].length * 13 * .6;
          return <g opacity={g * .9}>
            <rect x={Q.x + 12} y={top} width={Q.w - 24} height={L.jobH} rx={10} fill="none" stroke="var(--scene-hairline)" strokeDasharray="4 5" />
            <Text x={textX} y={top + L.jobH / 2} size={13} font="mono" weight={600} tone="muted">{PAYLOADS[1]}</Text>
            <line x1={textX - 3} x2={textX - 3 + (payloadW + 6) * strike} y1={top + L.jobH / 2} y2={top + L.jobH / 2} stroke={TONE.danger} strokeWidth={1.5} />
            <Text x={textX + payloadW + 16} y={top + L.jobH / 2} size={12.5} font="mono" weight={500} tone="danger" opacity={strike}>{fr ? "ignoré\u00a0: le job existe déjà" : "dropped: the job already exists"}</Text>
          </g>;
        })() : null}
      </g>
      {!actB ? <Ring x={Q.x + 12} y={jobMid(0)} frame={frame} at={landAt(1)} tone="danger" /> : null}
      {actB ? [0, 1].map((index) => <Ring key={index} x={Q.x + 12} y={jobMid(index)} frame={frame} at={landAt(index)} tone="ok" />) : null}
    </g>

    {/* Processor */}
    <g {...enter(frame, 12, { distance: 16 })}>
      <Box x={P.x} y={P.y} w={P.w} h={P.h} tone={frame >= doneAt + 8 ? (actB ? "ok" : "danger") : "line"} focus={arrived ? ease(frame, doneAt, doneAt + 10) * (1 - ease(frame, doneAt + 40, doneAt + 70)) : 0} radius={16}>
        <Text x={P.x + 20} y={P.y + (compact ? 20 : 24)} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "processor · notifie les approbateurs" : "processor · notifies approvers"}</Text>
      </Box>
      <Tag x={P.x + P.w - 16} y={P.y + (compact ? 20 : 24)} anchor="end" size={11.5} tone={actB ? "ok" : "danger"}
        text={actB ? (fr ? "✓ à jour" : "✓ fresh") : (fr ? "✗ obsolète" : "✗ stale")} appear={verdictOn * (actB ? 1 : aOut)} />
      {arrived ? <g opacity={actB ? 1 : aOut}>
        {procLines.map((line, index) => <g key={line.key} opacity={easeOut(frame, landed(index) - 4, landed(index) + 8)}>
          <Text x={P.x + 20} y={procY(index)} size={13} font="mono" weight={500} tone="muted">{`${line.key} →`}</Text>
          <Text x={P.x + 20 + (line.key.length + 2) * 13 * .6 + 6} y={procY(index)} size={compact ? 14 : 15} font="mono" weight={700} tone={actB ? "ok" : "danger"}>{line.payload}</Text>
        </g>)}
        {!actB ? <Text x={P.x + 20} y={procY(1)} size={13} font="mono" weight={500} tone="muted" opacity={easeOut(frame, doneAt + 12, doneAt + 26)}>
          {fr ? "dernier déclenchement\u00a0: " : "latest trigger: "}<tspan fill={TONE.hot} fontWeight={600}>{PAYLOADS[1]}</tspan>
        </Text> : null}
      </g> : null}
    </g>

    {/* Payload comets */}
    {[0, 1].map((index) => <Comet key={`${actB ? "b" : "a"}-${index}`} points={cometPath(index)} t={ease(frame, starts[index]! + KEY_LATE, landAt(index))} tone={actB ? "ok" : index === 1 ? "danger" : "line"} r={5.5} tail={.22} />)}

    {/* Run flights: queue → processor */}
    {(actB ? [0, 1] : [0]).map((slot) => {
      const t = ease(frame, flyStart(slot), landed(slot));
      if (t <= 0 || t >= 1) return null;
      const from: Pt = [Q.x + Q.w / 2, jobMid(slot)];
      const to: Pt = [P.x + P.w / 2, procY(slot)];
      const cx = lerp(from[0], to[0], t);
      const cy = lerp(from[1], to[1], t);
      const w = lerp(Q.w - 24, compact ? 260 : 300, t);
      const h = lerp(L.jobH, 26, t);
      const tone: Tone = actB ? "ok" : "danger";
      return <g key={slot} transform={`translate(${cx} ${cy})`} opacity={Math.min(1, t * 5) * (1 - ease(t, .88, 1))}>
        <rect className="scene-card" x={-w / 2} y={-h / 2} width={w} height={h} rx={9} style={{ fill: "var(--scene-card)" }} />
        <rect className="scene-glow" x={-w / 2} y={-h / 2} width={w} height={h} rx={9} style={{ fill: tint(tone, 18), color: TONE[tone] }} stroke={TONE[tone]} strokeOpacity={.55} />
        <Text x={0} y={.5} size={13} font="mono" weight={600} tone={tone} anchor="middle">{`${keys[slot]} · ${PAYLOADS[slot]}`}</Text>
      </g>;
    })}
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.runA + RUN_FLY + 40,
  title: { en: "When debounce runs stale data", fr: "Debounce et payload obsolète" },
  caption: {
    en: "A debounced job keeps the payload it was created with. Include every behavior-changing argument in makeJobId, or read the latest state inside the processor.",
    fr: "Un job debouncé conserve le payload de sa création. Inclure tous les arguments qui changent le comportement dans makeJobId, ou relire l’état le plus récent dans le processor.",
  },
  beats: [
    { at: 0, text: { en: "The key only uses environmentId. Trigger 1 queues a job with roles [\"r1\"].", fr: "La clé n’utilise que environmentId. Le déclenchement\u00a01 crée un job avec les rôles [\"r1\"]." } },
    { at: T.t2A + KEY_LATE, text: { en: "Trigger 2 adds \"r7\", but maps to the same jobId: the existing job keeps its original payload.", fr: "Le déclenchement\u00a02 ajoute \"r7\", mais tombe sur le même jobId\u00a0: le job existant garde son payload." } },
    { at: T.runA, text: { en: "The processor runs with the old roles: stale data, although the key deduplicated correctly.", fr: "Le processor s’exécute avec les anciens rôles\u00a0: données obsolètes, alors que la clé a bien dédupliqué." } },
    { at: T.fix, text: { en: "Encode every behavior-changing argument in makeJobId, as the approvers notifier does.", fr: "Encoder dans makeJobId tous les arguments qui changent le comportement, comme le notifier d’approbateurs." } },
    { at: T.t2B + KEY_LATE, text: { en: "Same triggers: different roles now mean a different jobId, so each run carries its own fresh payload.", fr: "Mêmes déclenchements\u00a0: des rôles différents donnent un autre jobId, chaque exécution porte son payload frais." } },
  ],
  Stage,
});
