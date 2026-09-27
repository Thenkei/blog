import { Box, Camera, Checkpoint, Comet, Dot, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). Act 1: the map (the review) ticks its four known risks and
// earns "all tests passed". Act 2: a playhead runs through the territory
// (production); each plus-one that breaks sends a signal back to the map and
// lights the assumption that was sitting in its margin. Act 3: the "all tests
// passed" chip leaves the map and is set against "we modelled everything".
const T = {
  risks: 14,
  passed: 64,
  territory: 96,
  run: 140,
  runEnd: 400,
  verdict: 420,
  land: 452,
  neq: 456,
  claim: 462,
  end: 560,
} as const;

// Positions along the production timeline (0→1), shared by both canvases.
const P = { attempt: [.04, .46], retry: [.26, .8], deleted: .2, event: .7 } as const;
const frameAt = (p: number) => T.run + (T.runEnd - T.run) * p;
const BREAK_A = frameAt(P.retry[0]);
const OVERLAP_DONE = frameAt(P.attempt[1]);
const SIGNAL_A = [OVERLAP_DONE + 4, OVERLAP_DONE + 32] as const;
const EVENT = frameAt(P.event);
const MISS = EVENT + 24;
const SIGNAL_B = [MISS + 6, MISS + 32] as const;

const COPY = {
  en: {
    map: "MAP · ARCHITECTURE REVIEW",
    risks: ["load", "availability", "migrations", "retries"],
    passed: "“all tests passed”",
    claim: "“we modelled everything”",
    margin: "MARGIN · NEVER ON THE LIST",
    assume: ["a retry never overlaps attempt 1", "an event always finds its target"],
    territory: "TERRITORY · PRODUCTION",
    time: "time →",
    offMap: "operators · historical data · production usage",
    lanes: ["request", "event"],
    attempt: "attempt 1",
    retry: "retry",
    target: "target",
    deleted: "deleted",
    event: "event",
    overlap: "✗ overlap",
    gone: "✗ no target",
  },
  fr: {
    map: "CARTE · REVUE D’ARCHITECTURE",
    risks: ["charge", "disponibilité", "migrations", "retries"],
    passed: "« tous les tests passent »",
    claim: "« nous avons tout modélisé »",
    margin: "MARGE · JAMAIS DANS LA LISTE",
    assume: ["un retry ne chevauche pas la tentative 1", "un événement trouve toujours sa cible"],
    territory: "TERRITOIRE · PRODUCTION",
    time: "temps →",
    offMap: "opérateurs · données historiques · usages de production",
    lanes: ["requête", "événement"],
    attempt: "tentative 1",
    retry: "retry",
    target: "cible",
    deleted: "supprimée",
    event: "événement",
    overlap: "✗ chevauchement",
    gone: "✗ cible absente",
  },
} as const;

type Pt = readonly [number, number];
const bezier = (p0: Pt, p1: Pt, p2: Pt, t: number): [number, number] => [
  (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
  (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
];
const curve = (p0: Pt, p1: Pt, p2: Pt): Pt[] => Array.from({ length: 25 }, (_, index) => bezier(p0, p1, p2, index / 24));
const tagWidth = (text: string, size: number) => text.length * size * .6 + size * 1.5;

/** A Gantt pill that grows with the playhead: one execution in production. */
function Span({ x0, x1, y, label, tone }: { x0: number; x1: number; y: number; label: string; tone: Tone }) {
  const w = x1 - x0;
  if (w <= 0) return null;
  const labelFits = Math.max(0, Math.min(1, (w - label.length * 7.2 - 18) / 12));
  return <g>
    <rect x={x0} y={y - 12} width={Math.max(w, 6)} height={24} rx={12} style={{ fill: "var(--scene-card)" }} />
    <rect x={x0} y={y - 12} width={Math.max(w, 6)} height={24} rx={12} style={{ fill: tint(tone, 18) }} stroke={TONE[tone]} strokeOpacity={.55} strokeWidth={1} />
    <Text x={x0 + 11} y={y + .5} size={12} font="mono" weight={600} tone={tone} opacity={labelFits}>{label}</Text>
  </g>;
}

/** A single attention ring where something just happened. */
function Ping({ x, y, frame, at, r = 12, tone = "hot" }: { x: number; y: number; frame: number; at: number; r?: number; tone?: Tone }) {
  if (frame < at || frame > at + 36) return null;
  return <Pulse x={x} y={y} frame={frame} at={at} period={36} r={r} tone={tone} />;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const c = COPY[locale];
  const map = compact ? { x: 20, y: 52, w: 500, h: 196 } : { x: 40, y: 60, w: 390, h: 292 };
  const ter = compact ? { x: 20, y: 262, w: 500, h: 200 } : { x: 454, y: 60, w: 466, h: 292 };
  const verdictY = compact ? 491 : 387;
  const headY = map.y + 24;

  // ── The map ──
  const riskPos = (index: number): Pt => compact
    ? [map.x + 32 + (index % 2) * 230, map.y + 58 + Math.floor(index / 2) * 30]
    : [map.x + 32, map.y + 60 + index * 32];
  const dividerY = compact ? map.y + 112 : map.y + 190;
  const assumeY = compact ? [map.y + 152, map.y + 177] : [map.y + 238, map.y + 266];
  const running = ease(frame, T.run, T.run + 20) * (1 - ease(frame, T.runEnd, T.runEnd + 20));
  const riskDim = lerp(1, .45, running);
  const marginIn = easeOut(frame, T.territory + 10, T.territory + 34);
  const lit = [pop(frame, SIGNAL_A[1], 170), pop(frame, SIGNAL_B[1], 170)];

  // ── The territory: production, read left → right through time ──
  const lx = ter.x + (compact ? 104 : 112);
  const rx = ter.x + ter.w - (compact ? 20 : 24);
  const tx = (t: number) => lerp(lx, rx, t);
  const laneA = compact ? ter.y + 90 : ter.y + 118;
  const laneB = compact ? ter.y + 160 : ter.y + 212;
  const bandH = compact ? 52 : 64;
  const progress = ease(frame, T.run, T.runEnd, (t) => t);
  const head = tx(progress);
  const clip = (p: number) => Math.min(tx(p), head);
  const overlap = pop(frame, BREAK_A, 120);
  const overlapTag = pop(frame, OVERLAP_DONE);

  // Lane B: the target exists, is deleted, then an event arrives for it.
  const targetX = tx(compact ? .13 : .1);
  const deleted = ease(frame, frameAt(P.deleted), frameAt(P.deleted) + 14);
  const eventX = tx(P.event);
  const arcApex = compact ? laneB - 64 : laneB - 78;
  const arc = curve([eventX, laneB], [lerp(eventX, targetX, .5), arcApex], [targetX, laneB - 14]);
  const arcT = ease(frame, EVENT + 2, MISS);
  const missed = pop(frame, MISS);

  // Signals flying back from production to the margin of the map.
  const marginEnd = map.x + map.w - 28;
  const pathA = curve([tx(.36), laneA - 30], compact ? [marginEnd + 10, laneA - 40] : [map.x + map.w + 20, laneA - 40], [marginEnd, assumeY[0]!]);
  const pathB = curve([targetX, laneB], compact ? [targetX - 60, laneB - 150] : [map.x + map.w + 8, laneB + 40], [marginEnd, assumeY[1]!]);
  const signalA = ease(frame, SIGNAL_A[0], SIGNAL_A[1]);
  const signalB = ease(frame, SIGNAL_B[0], SIGNAL_B[1]);

  // ── The verdict: the chip from the map flies down and is compared ──
  const vSize = compact ? 12 : 13;
  const w1 = tagWidth(c.passed, vSize);
  const w2 = tagWidth(c.claim, vSize);
  const gap = compact ? 14 : 22;
  const rowW = w1 + w2 + gap * 2 + 16;
  const v1: Pt = [width / 2 - rowW / 2 + w1 / 2, verdictY];
  const neqX = width / 2 - rowW / 2 + w1 + gap + 8;
  const v2: Pt = [width / 2 + rowW / 2 - w2 / 2, verdictY];
  // The chip is the review's output: it hangs under the map, then slides into the verdict.
  const passedHome: Pt = compact ? [map.x + w1 / 2, verdictY] : [map.x + map.w / 2, verdictY];
  const flight = ease(frame, T.verdict, T.land);
  const chipX = lerp(passedHome[0], v1[0], flight);
  const chipY = verdictY;

  const lean = (point: Pt): Pt => [lerp(width / 2, point[0], .1), lerp(height / 2, point[1], .1)];
  const camera = [
    { at: 0 },
    { at: T.run - 10, dur: 60, zoom: 1.02, focus: lean([ter.x + ter.w / 2, ter.y + ter.h / 2]) },
    { at: T.runEnd - 20, dur: 50, zoom: 1 },
  ];

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* The map: what the review wrote down. */}
    <g {...enter(frame, 0)}>
      <Box x={map.x} y={map.y} w={map.w} h={map.h} tone="line" radius={16}>
        <Text x={map.x + 18} y={headY} size={11} font="mono" weight={600} tone="muted" caps>{c.map}</Text>
        <g opacity={riskDim}>
          {c.risks.map((risk, index) => {
            const at = stagger(index, T.risks, 9);
            const [x, y] = riskPos(index);
            return <g key={risk} {...enter(frame, at, { from: "left", distance: 10 })}>
              <Checkpoint x={x} y={y} r={10} state={frame >= at + 12 ? "pass" : "pending"} />
              <Text x={x + 22} y={y} size={16} weight={600}>{risk}</Text>
            </g>;
          })}
        </g>
        <g opacity={marginIn}>
          <line x1={map.x + 18} x2={map.x + map.w - 18} y1={dividerY} y2={dividerY} stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="3 5" />
          <Text x={map.x + 18} y={dividerY + (compact ? 16 : 20)} size={11} font="mono" weight={600} tone="muted" caps>{c.margin}</Text>
          {c.assume.map((text, index) => {
            const on = Math.min(1, lit[index]!);
            const y = assumeY[index]!;
            return <g key={text}>
              <rect x={map.x + 12} y={y - 12} width={map.w - 24} height={24} rx={8} style={{ fill: tint("danger", 14 * on) }} />
              <rect x={map.x + 12} y={y - 12} width={3} height={24} rx={1.5} fill={TONE.danger} opacity={on} />
              <Text x={map.x + 26} y={y} size={compact ? 14 : 14.5} font="main" weight={on > .5 ? 600 : 500} tone={on > .5 ? "danger" : "muted"} opacity={.42 + .58 * on}>
                {on > .5 ? "✗ " : "· "}{text}
              </Text>
            </g>;
          })}
        </g>
      </Box>
      <Ping x={map.x + 14} y={assumeY[0]!} frame={frame} at={SIGNAL_A[1]} r={8} tone="danger" />
      <Ping x={map.x + 14} y={assumeY[1]!} frame={frame} at={SIGNAL_B[1]} r={8} tone="danger" />
    </g>

    {/* The passed chip: earned on the map, later carried down to the verdict. */}
    {frame >= T.passed ? <g opacity={1 - .35 * running}>
      <Tag x={chipX} y={chipY} text={c.passed} tone="ok" appear={pop(frame, T.passed)} size={vSize} />
    </g> : null}

    {/* The territory. */}
    <g {...enter(frame, T.territory, { from: "right", distance: 22 })}>
      <Box x={ter.x} y={ter.y} w={ter.w} h={ter.h} tone="hot" radius={16} focus={running * .35}>
        <Text x={ter.x + 18} y={ter.y + 24} size={11} font="mono" weight={600} tone="hot" caps>{c.territory}</Text>
        <Text x={ter.x + ter.w - 18} y={ter.y + 24} size={11} font="mono" weight={600} tone="muted" anchor="end" caps>{c.time}</Text>
        <Text x={ter.x + 18} y={ter.y + 48} size={13.5} font="main" weight={500} tone="muted">{c.offMap}</Text>
        {[laneA, laneB].map((y, index) => <g key={y}>
          <rect x={lx - 10} y={y - bandH / 2} width={rx - lx + 20} height={bandH} rx={12} style={{ fill: tint("ink", 4) }} />
          <Text x={ter.x + 18} y={y} size={compact ? 12.5 : 13} font="mono" weight={600} tone="muted">{c.lanes[index]}</Text>
        </g>)}
      </Box>
    </g>

    {/* Lane A: the retry starts while attempt 1 is still running. */}
    {frame >= BREAK_A ? <rect
      x={tx(P.retry[0]) - 4} y={laneA - bandH / 2 + 3}
      width={Math.max(0, clip(P.attempt[1]) - tx(P.retry[0]) + 8)} height={bandH - 6} rx={9}
      style={{ fill: tint("danger", 14 * Math.min(1, overlap)) }} stroke={TONE.danger} strokeOpacity={.55 * Math.min(1, overlap)} strokeWidth={1} strokeDasharray="3 3"
    /> : null}
    {frame >= frameAt(P.attempt[0]) ? <Span x0={tx(P.attempt[0])} x1={clip(P.attempt[1])} y={laneA - 14} label={c.attempt} tone="line" /> : null}
    {frame >= BREAK_A ? <Span x0={tx(P.retry[0])} x1={clip(P.retry[1])} y={laneA + 14} label={c.retry} tone="hot" /> : null}
    <Tag x={tx(P.attempt[1]) + 10} y={laneA - 14} anchor="start" text={c.overlap} tone="danger" appear={overlapTag} size={12} />
    <Ping x={tx(P.retry[0])} y={laneA + 14} frame={frame} at={BREAK_A} r={9} tone="hot" />

    {/* Lane B: target deleted, then an event aimed at it. */}
    {frame >= T.run - 10 ? <g opacity={easeOut(frame, T.run - 10, T.run + 8)}>
      <g opacity={1 - deleted}>
        <Box x={targetX - 42} y={laneB - 13} w={84} h={26} tone="line" radius={9} label={c.target} labelSize={12} mono />
      </g>
      <g opacity={deleted}>
        <rect x={targetX - 42} y={laneB - 13} width={84} height={26} rx={9} stroke={missed > .05 ? TONE.danger : "var(--scene-hairline)"} strokeWidth={1} strokeDasharray="4 4" style={{ fill: tint("danger", 12 * Math.min(1, missed)) }} />
        <Text x={targetX} y={laneB + .5} size={11.5} font="mono" weight={600} tone={missed > .5 ? "danger" : "muted"} anchor="middle" opacity={.8}>{c.deleted}</Text>
      </g>
    </g> : null}
    {frame >= EVENT - 6 ? <g opacity={easeOut(frame, EVENT - 6, EVENT + 6)}>
      <path d={`M${arc.map(([x, y]) => `${x} ${y}`).join("L")}`} fill="none" stroke={TONE.hot} strokeOpacity={.45} strokeWidth={1.25} strokeDasharray="3 5" opacity={arcT} />
      <Dot x={eventX} y={laneB} r={6} tone="hot" />
      <Text x={eventX + 14} y={laneB} size={12.5} font="mono" weight={600} tone="hot">{c.event}</Text>
    </g> : null}
    <Comet points={arc} t={arcT} tone="hot" r={5.5} tail={.25} />
    <Ping x={targetX} y={laneB} frame={frame} at={MISS} r={16} tone="danger" />
    <Tag x={targetX + 52} y={laneB} anchor="start" text={c.gone} tone="danger" appear={missed} size={12} />

    {/* Playhead: "now" in production. */}
    {frame >= T.run && frame <= T.runEnd + 16 ? <g opacity={1 - ease(frame, T.runEnd, T.runEnd + 16)}>
      <line x1={head} x2={head} y1={laneA - bandH / 2 - 8} y2={laneB + bandH / 2 + 4} stroke={TONE.hot} strokeWidth={1.25} strokeOpacity={.8} />
      <circle cx={head} cy={laneA - bandH / 2 - 8} r={3.5} fill={TONE.hot} />
    </g> : null}

    {/* Signals: production tells the map what it never listed. */}
    <Comet points={pathA} t={signalA} tone="danger" r={5} tail={.22} />
    <Comet points={pathB} t={signalB} tone="danger" r={5} tail={.22} />

    {/* Verdict. */}
    <g transform={`translate(${neqX} ${verdictY}) scale(${.4 + .6 * pop(frame, T.neq, 200)})`} opacity={easeOut(frame, T.neq, T.neq + 8)}>
      <Text x={0} y={0} size={22} font="mono" weight={700} tone="danger" anchor="middle">≠</Text>
    </g>
    <g {...enter(frame, T.claim, { from: "right", distance: 18 })}>
      <Tag x={v2[0]} y={v2[1]} text={c.claim} tone="muted" size={vSize} />
    </g>
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "The map stops at production", fr: "La carte s’arrête à la production" },
  caption: {
    en: "The review covered load, availability, migrations and retries. What broke was the assumption nobody wrote down: tests only answer the questions we planned for.",
    fr: "La revue couvrait charge, disponibilité, migrations et retries. Ce qui casse, c’est l’hypothèse que personne n’a écrite : les tests ne répondent qu’aux questions prévues.",
  },
  beats: [
    { at: 0, text: { en: "The review covers the known risks: load, availability, migrations, retries. Every test passes.", fr: "La revue couvre les risques connus : charge, disponibilité, migrations, retries. Tous les tests passent." } },
    { at: T.territory, text: { en: "The map stops at production: operators, historical data, real usage. Key assumptions stay in the margin.", fr: "La carte s’arrête à la production : opérateurs, données, usages réels. Des hypothèses restent en marge." } },
    { at: BREAK_A - 8, text: { en: "Plus-one: a request is retried during the first attempt. An assumption from the margin breaks.", fr: "Invité surprise : une requête est rejouée pendant la première tentative. Une hypothèse en marge casse." } },
    { at: EVENT - 10, text: { en: "Another: an event arrives after its target is deleted. Nothing on the list described it.", fr: "Autre surprise : un événement arrive après la suppression de sa cible. Rien dans la liste ne le décrivait." } },
    { at: T.verdict, text: { en: "The tests did not lie; we asked the questions we planned for. Passing is not modelling everything.", fr: "Les tests n’ont pas menti : nous avons posé les questions prévues. Tout passer n’est pas tout modéliser." } },
  ],
  Stage,
});
