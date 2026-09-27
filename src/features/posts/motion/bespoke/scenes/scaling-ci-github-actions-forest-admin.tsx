import { Axis, Box, Camera, Comet, Dot, ease, easeOut, enter, lerp, pop, Pulse, Tag, Text, tint, TONE } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). One 45-minute runner; its bar is cut into 10 pieces that fly
// down into 10 GitHub Actions jobs. Split by test count, one heavy integration
// piece keeps running while the rest idle; re-cut by execution time, the same
// pieces morph to equal length and finish together. Finally the 10 artifacts
// fan into a reconciliation job. Both replays share one clock rate.
const TOTAL_MIN = 45;
const SHARDS = 10;
// Illustrative durations of a split by test count; they tile the 45-minute bar.
const BY_COUNT = [3.5, 3, 17, 3, 2.5, 4, 3, 3.5, 2.5, 3] as const;
const HEAVY = 2;
const BY_TIME = TOTAL_MIN / SHARDS;
const OFFSET = BY_COUNT.map((_, index) => BY_COUNT.slice(0, index).reduce((sum, value) => sum + value, 0));
const DOT_COLS = 44;
const SLOWEST_OTHER = Math.max(...BY_COUNT.filter((_, index) => index !== HEAVY));

const T = {
  runner: [16, 104],
  cut: 112,
  split: 124,
  fly: 130,
  clockA: 200,
  heavy: 228,
  wallA: 284,
  balance: 322,
  morph: [330, 364],
  clockB: 374,
  reconcile: 430,
  artifacts: 448,
  lcov: 504,
  end: 576,
} as const;

// 17 min of the slowest job take 84 frames; the balanced replay uses the same rate.
const RATE = BY_COUNT[HEAVY] / (T.wallA - T.clockA);
const FLY_DUR = 28;
const flyAt = (index: number) => T.fly + index * 4;
const artifactAt = (index: number) => T.artifacts + index * 3;
const ARTIFACT_DUR = 24;

type Pt = readonly [number, number];
const bezier = (p0: Pt, p1: Pt, p2: Pt, t: number): [number, number] => [
  (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
  (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
];

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact
    ? { m: 20, labelX: 36, x0: 116, x1: 484, runner: [56, 74], jobs: [142, 358], header: 166, chip: 196, lanesTop: 220, pitch: 24, bar: 9, axis: 466, recon: [262, 246, 238, 140], heavySize: 12 }
    : { m: 40, labelX: 60, x0: 200, x1: 872, runner: [58, 56], jobs: [126, 268], header: 150, chip: 170, lanesTop: 192, pitch: 17, bar: 8, axis: 362, recon: [572, 196, 304, 136], heavySize: 13 };
  const [runnerY, runnerH] = L.runner as [number, number];
  const [jobsY, jobsH] = L.jobs as [number, number];
  const [rx, ry, rw, rh] = L.recon as [number, number, number, number];
  const cardW = width - 2 * L.m;
  const x = (minutes: number) => lerp(L.x0, L.x1, minutes / TOTAL_MIN);
  const laneY = (index: number) => L.lanesTop + index * L.pitch;
  const runnerBarY = compact ? runnerY + 50 : runnerY + runnerH / 2;

  // ── Act A: one runner counts to 45 minutes.
  const runnerMin = TOTAL_MIN * ease(frame, T.runner[0], T.runner[1], (t) => t);
  const runnerDone = frame >= T.runner[1];
  const cutIn = easeOut(frame, T.cut, T.cut + 12);

  // ── Split: pieces fly from their slot in the runner bar to the start of a lane.
  const flight = (index: number) => ease(frame, flyAt(index), flyAt(index) + FLY_DUR);
  const landed = (index: number) => frame >= flyAt(index) + FLY_DUR;
  const lanesOn = easeOut(frame, T.split - 6, T.split + 12);

  // ── Clocks. Both replays tick at RATE; the balanced one reaches 4.5 min fast.
  const balanced = frame >= T.balance;
  const morph = ease(frame, T.morph[0], T.morph[1]);
  const length = (index: number) => lerp(BY_COUNT[index]!, BY_TIME, morph);
  const clockA = Math.min(BY_COUNT[HEAVY], Math.max(0, (frame - T.clockA) * RATE));
  const clockB = Math.min(BY_TIME, Math.max(0, (frame - T.clockB) * RATE));
  const clock = balanced ? clockB : clockA;
  const fillsOn = balanced ? (frame >= T.clockB ? 1 : 1 - ease(frame, T.balance, T.balance + 10)) : 1;
  const running = balanced ? frame >= T.clockB && clockB < BY_TIME : frame >= T.clockA && clockA < BY_COUNT[HEAVY];
  const heavyLate = !balanced && clockA > SLOWEST_OTHER;
  const heavyTag = pop(frame, T.heavy) * (1 - ease(frame, T.balance, T.balance + 12));
  const verdictA = pop(frame, T.wallA) * (1 - ease(frame, T.balance, T.balance + 12));
  const verdictB = pop(frame, T.clockB + BY_TIME / RATE);
  const finishB = T.clockB + BY_TIME / RATE;

  // ── Reconciliation: the ten artifacts fan into one job.
  const reconOn = easeOut(frame, T.reconcile, T.reconcile + 20);
  const arrived = Array.from({ length: SHARDS }, (_, index) => index).filter((index) => frame >= artifactAt(index) + ARTIFACT_DUR).length;
  const inlet: Pt = [rx, ry + rh / 2];
  const artifactFrom = (index: number): Pt => [x(BY_TIME) + 22, laneY(index)];
  const artifactPath = (index: number): Pt[] => {
    const from = artifactFrom(index);
    const control: Pt = [lerp(from[0], inlet[0], .55), from[1]];
    return Array.from({ length: 13 }, (_, step) => bezier(from, control, inlet, step / 12));
  };

  const suiteOut = ease(frame, T.split - 4, T.split + 14);
  const lean = (point: Pt): Pt => [lerp(width / 2, point[0], .25), lerp(height / 2, point[1], .25)];
  const camera = [
    { at: 0 },
    { at: T.heavy - 10, dur: 48, zoom: 1.03, focus: lean([x(12), laneY(HEAVY)]) },
    { at: T.balance, dur: 40, zoom: 1 },
  ];

  const ok = TONE.ok;
  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* One runner */}
    <g {...enter(frame, 0)}>
      <Box x={L.m} y={runnerY} w={cardW} h={runnerH} tone={runnerDone ? "danger" : "line"} focus={runnerDone ? 0 : ease(frame, T.runner[0], T.runner[0] + 10)} radius={14}>
        <Text x={L.labelX} y={compact ? runnerBarY : runnerBarY - 9} size={15} weight={600}>1 runner</Text>
        {compact
          ? <Text x={L.labelX} y={runnerY + 22} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "couverture 95\u00a0%+" : "95%+ coverage"}</Text>
          : <Text x={L.labelX} y={runnerBarY + 11} size={12} font="mono" weight={500} tone="muted">{fr ? "couverture 95\u00a0%+" : "95%+ coverage"}</Text>}
        <rect x={L.x0} y={runnerBarY - 6} width={L.x1 - L.x0} height={12} rx={6} style={{ fill: tint("ink", 8) }} />
        {BY_COUNT.map((minutes, index) => {
          // Before the cut the fill is one bar; after, each piece leaves on its own.
          const start = OFFSET[index]!;
          const shown = Math.max(0, Math.min(minutes, runnerMin - start));
          if (cutIn <= 0 || shown <= 0 || flight(index) > 0) return null;
          const gap = index > 0 ? 1.5 * cutIn : 0;
          return <rect key={index} x={x(start) + gap} y={runnerBarY - 6} width={Math.max(0, x(start + shown) - x(start) - gap)} height={12} rx={cutIn > 0 ? 3 + 3 * (1 - cutIn) : 0} fill={TONE.line} />;
        })}
        {/* rounded ends of the uncut bar */}
        {cutIn <= 0 && runnerMin > 0 ? <rect x={L.x0} y={runnerBarY - 6} width={Math.max(12, x(runnerMin) - L.x0)} height={12} rx={6} fill={TONE.line} /> : null}
        {frame >= T.fly ? <rect x={L.x0 + .5} y={runnerBarY - 5.5} width={L.x1 - L.x0 - 1} height={11} rx={5.5} fill="none" stroke="var(--scene-hairline)" strokeDasharray="3 4" /> : null}
        <Tag
          x={Math.max(L.x0 + 44, x(runnerMin))} y={runnerBarY} anchor="end" size={12}
          tone={runnerDone ? "danger" : "line"} appear={easeOut(frame, T.runner[0], T.runner[0] + 10)}
          text={`${Math.round(runnerMin)} min`}
        />
      </Box>
    </g>

    {/* Ten jobs, drawn as a Gantt on the same minute scale */}
    <g {...enter(frame, 6)}>
      <Box x={L.m} y={jobsY} w={cardW} h={jobsH} tone={balanced ? "ok" : "line"} radius={16}>
        <g opacity={1 - suiteOut}>
          <Text x={L.labelX} y={L.header} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "des milliers de tests" : "thousands of tests"}</Text>
          {Array.from({ length: SHARDS }, (_, row) => Array.from({ length: DOT_COLS }, (_, col) => {
            // Tests execute one after another on the single runner: column = minute.
            const dx = lerp(L.x0 + 4, L.x1 - 4, col / (DOT_COLS - 1));
            const ran = dx <= x(runnerMin) + 1;
            const appear = easeOut(frame, 4 + col * .6 + row * .8, 22 + col * .6 + row * .8);
            return <circle key={`${row}-${col}`} cx={dx} cy={laneY(row) - (1 - appear) * 6} r={2.1} opacity={appear} style={{ fill: ran ? tint("line", 75) : tint("ink", 16) }} />;
          }))}
        </g>
        <Text x={L.labelX} y={L.header} size={11} font="mono" weight={600} tone="muted" caps opacity={suiteOut}>{fr ? "10 jobs GitHub Actions" : "10 GitHub Actions jobs"}</Text>
        <g opacity={1 - ease(frame, T.balance, T.balance + 12)}>
          <Tag x={L.x1} y={L.header} anchor="end" size={12} tone="hot" appear={ease(frame, T.split, T.split + 14)} text={fr ? "découpé par nombre de tests" : "split by test count"} />
        </g>
        <g opacity={ease(frame, T.balance + 6, T.balance + 20)}>
          <Tag x={L.x1} y={L.header} anchor="end" size={12} tone="ok" text={fr ? "découpé par temps d’exécution" : "split by execution time"} />
        </g>
        <Axis x={L.x0} y={L.axis} w={L.x1 - L.x0} ticks={[0, 15, 30, 45]} format={(tick) => `${tick} min`} />
      </Box>
    </g>

    {BY_COUNT.map((_, index) => {
      const y = laneY(index);
      const planned = length(index);
      const fill = Math.min(clock, planned) * fillsOn;
      const done = (balanced ? frame >= T.clockB : frame >= T.clockA) && clock >= planned;
      const heavy = index === HEAVY && !balanced;
      const barTone = heavy && heavyLate ? "danger" : done ? "ok" : "line";
      const idleFrom = x(planned) + 20;
      const idleTo = x(clock);
      return <g key={index} opacity={lanesOn}>
        <Text x={L.labelX} y={y} size={13} font="mono" weight={heavy && heavyLate ? 600 : 500} tone={heavy && heavyLate ? "danger" : "muted"}>{compact ? `chunk_${index + 1}` : `test_chunk_${index + 1}`}</Text>
        {landed(index) ? <>
          <rect x={L.x0} y={y - L.bar / 2} width={x(planned) - L.x0} height={L.bar} rx={L.bar / 2} style={{ fill: tint(heavy ? "danger" : "line", heavy ? 20 : 24) }} />
          {fill > 0 ? <rect className={heavy && heavyLate && running ? "scene-glow" : undefined} x={L.x0} y={y - L.bar / 2} width={Math.max(L.bar, x(fill) - L.x0)} height={L.bar} rx={L.bar / 2} fill={TONE[barTone]} style={{ color: TONE[barTone] }} /> : null}
          {done && fillsOn > .5 && !heavy ? <Text x={x(planned) + 10} y={y + .5} size={13} font="mono" weight={700} tone="ok" opacity={pop(frame, (balanced ? T.clockB : T.clockA) + planned / RATE)}>✓</Text> : null}
          {/* idle time: a finished job waiting for the slowest one */}
          {done && !balanced && idleTo > idleFrom ? <line x1={idleFrom} x2={idleTo} y1={y} y2={y} stroke="var(--scene-hairline)" strokeWidth={1.25} strokeDasharray="2 4" opacity={1 - ease(frame, T.balance, T.balance + 10)} /> : null}
        </> : null}
        {heavy ? <Tag x={x(BY_COUNT[HEAVY]) + 14} y={y} anchor="start" size={L.heavySize} tone="danger" appear={heavyTag} text={fr ? "tests d’intégration lourds" : "heavy integration tests"} /> : null}
      </g>;
    })}

    {/* Pieces in flight from the runner bar to their lane */}
    {BY_COUNT.map((minutes, index) => {
      const t = flight(index);
      if (t <= 0 || t >= 1) return null;
      const from: Pt = [x(OFFSET[index]!), runnerBarY];
      const to: Pt = [L.x0, laneY(index)];
      const [px, py] = bezier(from, [from[0], to[1]], to, t);
      const w = x(minutes) - L.x0;
      const h = lerp(12, L.bar, t);
      return <rect key={index} className="scene-glow" x={px} y={py - h / 2} width={w} height={h} rx={h / 2} fill={TONE[index === HEAVY ? "danger" : "line"]} style={{ color: TONE.line }} opacity={.55 + .45 * t} />;
    })}

    {/* Playhead: one clock for all jobs */}
    {running || (frame >= T.clockA && frame < T.balance + 10) || frame >= T.clockB ? (() => {
      const px = x(clock);
      const faded = balanced ? (frame >= T.clockB ? 1 : 0) : 1 - ease(frame, T.balance, T.balance + 10);
      const tone = balanced ? (clockB >= BY_TIME ? "ok" : "line") : clockA >= BY_COUNT[HEAVY] ? "danger" : "line";
      return <g opacity={faded * (1 - .6 * reconOn)}>
        <line x1={px} x2={px} y1={L.chip + 12} y2={laneY(SHARDS - 1) + 12} stroke={TONE[tone]} strokeWidth={running ? 1.5 : 1.25} strokeDasharray={running ? undefined : "3 4"} />
        <Dot x={px} y={L.chip + 12} r={3} tone={tone} halo={running} />
      </g>;
    })() : null}
    <Tag x={x(BY_COUNT[HEAVY]) + 8} y={L.chip} anchor="start" size={12} tone="danger" appear={verdictA} text={fr ? "durée = job le plus lent" : "wall time = slowest job"} />
    <Tag x={x(BY_TIME) + 8} y={L.chip} anchor="start" size={12} tone="ok" appear={verdictB} text={fr ? "tous finis ≈ 45 ÷ 10" : "all done ≈ 45 ÷ 10"} />
    {frame >= finishB ? <Pulse x={x(BY_TIME)} y={L.chip + 12} frame={frame} at={finishB} period={60} r={6} tone="ok" /> : null}
    {/* mountain: a summit flag where the balanced jobs finish */}
    <g className="scene-only-mountain" opacity={verdictB}>
      <line x1={x(BY_TIME)} x2={x(BY_TIME)} y1={L.chip - 22} y2={L.chip - 36} stroke={ok} strokeWidth={1.25} />
      <path d={`M${x(BY_TIME)} ${L.chip - 36}l10 4l-10 4z`} fill={ok} />
    </g>

    {/* Reconciliation job: every artifact must arrive before one LCOV is stitched */}
    {reconOn > 0 ? <>
      {BY_COUNT.map((_, index) => {
        const path = artifactPath(index);
        const t = ease(frame, artifactAt(index), artifactAt(index) + ARTIFACT_DUR);
        const d = path.map(([px, py], step) => `${step === 0 ? "M" : "L"}${px} ${py}`).join("");
        return <g key={index}>
          <path d={d} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} opacity={reconOn * (t > 0 ? 1 : .5)} />
          <Comet points={path} t={t} tone="line" r={3.5} tail={.25} />
        </g>;
      })}
      <g opacity={reconOn} transform={`translate(${(1 - reconOn) * 16} 0)`}>
        <Box x={rx} y={ry} w={rw} h={rh} tone="hot" focus={ease(frame, T.artifacts, T.artifacts + 12) * (1 - ease(frame, T.lcov + 6, T.lcov + 26))} radius={14}>
          <Text x={rx + 18} y={ry + 24} size={11} font="mono" weight={600} tone="hot" caps>{fr ? "job de réconciliation" : "reconciliation job"}</Text>
          <Text x={rx + 18} y={ry + 58} size={13} font="mono" weight={500} tone="muted">{fr ? "artefacts" : "artifacts"}</Text>
          <Text x={rx + rw - 18} y={ry + 58} size={22} font="mono" weight={700} anchor="end" tone={arrived === SHARDS ? "ok" : "ink"}>{`${arrived} / ${SHARDS}`}</Text>
          {BY_COUNT.map((_, index) => {
            const slotW = (rw - 36 - 9 * 5) / SHARDS;
            const sx = rx + 18 + index * (slotW + 5);
            const lit = pop(frame, artifactAt(index) + ARTIFACT_DUR, 200);
            return <rect key={index} x={sx} y={ry + 80} width={slotW} height={6} rx={3} style={{ fill: frame >= artifactAt(index) + ARTIFACT_DUR ? tint("ok", 40 + 60 * Math.min(1, lit)) : tint("ink", 10) }} />;
          })}
          <Tag x={rx + 18} y={ry + rh - 24} anchor="start" size={12} tone="ok" appear={pop(frame, T.lcov)} text={fr ? "→ 1 fichier LCOV unifié" : "→ 1 unified LCOV file"} />
        </Box>
      </g>
      {frame >= T.lcov ? <Pulse x={inlet[0]} y={inlet[1]} frame={frame} at={T.lcov} period={54} r={7} tone="ok" /> : null}
    </> : null}
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 1,
  title: { en: "Wall time = slowest job", fr: "Durée = job le plus lent" },
  caption: {
    en: "Partitioning only pays off when shards are balanced by execution time, not by test count. And every parallel job adds artifacts that must be reconciled at the end.",
    fr: "Le partitionnement ne paie que si les shards sont équilibrés par temps d’exécution, pas par nombre de tests. Et chaque job parallèle ajoute des artefacts à réconcilier à la fin.",
  },
  beats: [
    { at: 0, text: { en: "At 95%+ coverage, one runner executes thousands of tests: 45 minutes per run.", fr: "À plus de 95 % de couverture, un seul runner exécute des milliers de tests : 45 minutes par run." } },
    { at: T.split, text: { en: "Cut into 10 GitHub Actions jobs by test count. The run lasts as long as the slowest job.", fr: "Découpage en 10 jobs GitHub Actions par nombre de tests. Le run dure autant que le job le plus lent." } },
    { at: T.heavy, text: { en: "One heavy block of integration tests keeps running while the unit-test blocks sit idle.", fr: "Un gros bloc de tests d’intégration tourne encore pendant que les blocs unitaires attendent." } },
    { at: T.balance, text: { en: "Split by execution time instead: the same jobs finish together, close to 45 ÷ 10.", fr: "Découpage par temps d’exécution : les mêmes jobs finissent ensemble, proche de 45 ÷ 10." } },
    { at: T.reconcile, text: { en: "Faster tests, one more job: wait for all 10 artifacts, then stitch a single LCOV file.", fr: "Tests plus rapides, un job de plus : attendre les 10 artefacts, puis coudre un seul fichier LCOV." } },
  ],
  Stage,
});
