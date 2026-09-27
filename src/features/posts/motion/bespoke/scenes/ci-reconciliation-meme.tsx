import { Boundary, Box, Checkpoint, CodeBlock, Comet, ease, easeOut, enter, lerp, pop, Pulse, Tag, Text, tint, TONE, type CodeLine, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). Ten jobs upload coverage artifacts; each tile flies from its
// job to the matching slot of the merge (same 5×2 grid on both sides).
// Run 1: the merge does not wait, stitches 8 files and shuts the door on two
// stragglers; the tracker reads a partial LCOV. Run 2: a reconciliation job
// waits and counts; node 4's upload fails, 9 !== 10, it throws. Run 3: the whole
// CI is retried, 10 tiles arrive, one LCOV reaches the tracker.
const SHARDS = 10;
const COLS = 5;
const LOST = 3; // node 4
// Job durations (frames): balanced, except two slower uploads (nodes 2 and 9).
const DUR = [32, 62, 36, 30, 38, 34, 40, 31, 70, 35] as const;
const FLY = 14;

const T = {
  runA: 16,
  stitchA: 74,
  lcovA: [78, 98],
  dropA: 100,
  toastA: 110,
  fix: 176,
  typed: 184,
  runB: 232,
  failB: 262,
  checkB: 324,
  retry: 390,
  runC: 400,
  pass: 488,
  lcovC: [492, 514],
  end: 586,
} as const;

type Mode = "naive" | "wait";
type Run = { start: number; mode: Mode; lost: number | undefined };
const RUNS: readonly Run[] = [
  { start: T.runA, mode: "naive", lost: undefined },
  { start: T.runB, mode: "wait", lost: LOST },
  { start: T.runC, mode: "wait", lost: undefined },
];

type Pt = readonly [number, number];
const bezier = (p0: Pt, p1: Pt, p2: Pt, t: number): [number, number] => [
  (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
  (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
];

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact
    ? { jobs: [20, 56, 500, 112], cell: [84, 30, 10], cellTop: 30, merge: [20, 182, 244, 138], tracker: [276, 182, 244, 138], slot: [34, 16, 8], slotTop: 62, toast: [20, 332, 500, 50], code: [20, 396, 500], codeSize: 12.5 }
    : { jobs: [40, 56, 360, 158], cell: [56, 50, 10], cellTop: 34, merge: [424, 56, 220, 158], tracker: [668, 56, 252, 158], slot: [30, 20, 8], slotTop: 72, toast: [668, 234, 252, 114], code: [40, 234, 604], codeSize: 13 };
  const [jx, jy, jw] = L.jobs as [number, number, number, number];
  const [cellW, cellH, cellGap] = L.cell as [number, number, number];
  const [mx, my, mw, mh] = L.merge as [number, number, number, number];
  const [tx, ty, tw, th] = L.tracker as [number, number, number, number];
  const [slotW, slotH, slotGap] = L.slot as [number, number, number];
  const [ox, oy, ow, oh] = L.toast as [number, number, number, number];
  const [cx, cy, cw] = L.code as [number, number, number];

  const gridLeft = jx + (jw - (COLS * cellW + (COLS - 1) * cellGap)) / 2;
  const cellAt = (index: number): Pt => [gridLeft + (index % COLS) * (cellW + cellGap), jy + L.cellTop + Math.floor(index / COLS) * (cellH + cellGap)];
  const slotLeft = mx + (mw - (COLS * slotW + (COLS - 1) * slotGap)) / 2;
  const slotAt = (index: number): Pt => [slotLeft + (index % COLS) * (slotW + slotGap), my + L.slotTop + Math.floor(index / COLS) * (slotH + slotGap)];

  const runIndex = frame >= T.retry ? 2 : frame >= T.fix ? 1 : 0;
  const run = RUNS[runIndex]!;
  const actB = runIndex > 0;
  // Everything of the previous run fades as the next one is set up.
  const resetAt = runIndex === 1 ? T.fix : runIndex === 2 ? T.retry : -99;
  const fresh = ease(frame, resetAt, resetAt + 12);

  const finishAt = (index: number) => run.start + DUR[index]!;
  const landAt = (index: number) => finishAt(index) + FLY;
  const lostHere = (index: number) => run.lost === index;
  const straggler = (index: number) => run.mode === "naive" && landAt(index) > T.stitchA;
  const landedIn = (r: Run, index: number) => r.lost !== index && !(r.mode === "naive" && r.start + DUR[index]! + FLY > T.stitchA) && frame >= r.start + DUR[index]! + FLY;
  const landed = (index: number) => landedIn(run, index);
  const previous = runIndex > 0 ? RUNS[runIndex - 1] : undefined;
  const arrived = Array.from({ length: SHARDS }, (_, index) => index).filter(landed).length;

  const failed = runIndex === 1 && frame >= T.checkB;
  const passed = runIndex === 2 && frame >= T.pass;
  const stitchedA = runIndex === 0 && frame >= T.stitchA;
  const countTone: Tone = passed ? "ok" : failed || stitchedA ? "danger" : "ink";

  // LCOV file handed to the tracker (partial in run 1, complete in run 3).
  const lcovWindow = runIndex === 0 ? T.lcovA : runIndex === 2 ? T.lcovC : undefined;
  const lcovT = lcovWindow ? ease(frame, lcovWindow[0], lcovWindow[1]) : 0;
  const lcovFrom: Pt = compact ? [mx + mw, my + mh / 2] : [mx + mw, my + mh / 2];
  const lcovTo: Pt = [tx + tw / 2, ty + th / 2 + 4];
  const readA = runIndex === 0 && frame >= T.dropA;
  const readC = runIndex === 2 && frame >= T.lcovC[1];

  const throwLine: CodeLine = { text: fr ? "  throw new Error(\"Bon, on a paumé un shard…\");" : "  throw new Error(\"Well, we lost a shard…\");", tone: "danger", appearAt: T.typed + 12 };
  const ifLine: CodeLine = { text: compact ? "if (files.length !== expectedShards)" : "if (files.length !== expectedShards) {", tone: "hot", appearAt: T.typed };
  const codeA: CodeLine[] = [
    ...(compact ? [] : [{ text: "const files = await downloadAllArtifacts(shards);" }]),
    { text: fr ? "// Si on n'attend pas les 10 shards…" : "// If we don't await all 10 shards…", ...(readA ? { tone: "danger" as const } : {}) },
    { text: "return stitchLcov(files);" },
  ];
  const codeB: CodeLine[] = compact
    ? [ifLine, throwLine, { text: "return stitchLcov(files);" }]
    : [{ text: "const files = await downloadAllArtifacts(shards);" }, ifLine, throwLine, { text: "}", appearAt: T.typed + 66 }, { text: "return stitchLcov(files);" }];
  const [ifIndex, throwIndex, returnIndex] = compact ? [0, 1, 2] : [1, 2, 4];
  const bandB = passed ? returnIndex : failed ? throwIndex : frame >= T.runB && runIndex === 1 ? ifIndex : undefined;
  const codeOut = ease(frame, T.fix - 4, T.fix + 6);
  const codeSwap = ease(frame, T.fix + 4, T.fix + 16);

  const cardIn = (index: number) => easeOut(frame, 6 + index * 3, 24 + index * 3);
  const mergeTitle = actB ? (fr ? "job de réconciliation" : "reconciliation job") : (fr ? "fusion" : "merge");

  return <g>
    {/* Ten jobs */}
    <g {...enter(frame, 0)}>
      <Boundary x={jx} y={jy} w={jw} h={L.jobs[3]!} label={fr ? "10 jobs de test" : "10 test jobs"} tone="line" />
    </g>
    {Array.from({ length: SHARDS }, (_, index) => {
      const [x, y] = cellAt(index);
      // Between runs the meters drain, then the new run fills them again.
      const progress = frame < run.start ? (runIndex > 0 ? 1 - fresh : 0) : ease(frame, run.start, finishAt(index), (t) => t);
      const done = frame >= finishAt(index);
      const lost = lostHere(index) && done;
      const late = straggler(index) && frame >= landAt(index) - 4;
      const tone: Tone = lost ? "danger" : late ? "hot" : done ? "ok" : "line";
      const meterW = cellW - 20;
      return <g key={index} opacity={cardIn(index)} transform={`translate(0 ${(1 - cardIn(index)) * 10})`}>
        <Box x={x} y={y} w={cellW} h={cellH} tone={tone} radius={10} fill={lost ? pop(frame, finishAt(index) + 4) : 0} focus={lost ? 1 - ease(frame, finishAt(index) + 20, finishAt(index) + 50) : 0}>
          <Text x={x + (compact ? 14 : cellW / 2)} y={y + (compact ? cellH / 2 : cellH / 2 - 6)} size={compact ? 14 : 17} font={compact ? "mono" : "display"} weight={600} anchor={compact ? "start" : "middle"} tone={lost ? "danger" : "ink"}>{String(index + 1)}</Text>
          <rect x={compact ? x + 36 : x + 10} y={compact ? y + cellH / 2 - 2 : y + cellH - 13} width={compact ? cellW - 50 : meterW} height={4} rx={2} style={{ fill: tint("ink", 10) }} />
          <rect x={compact ? x + 36 : x + 10} y={compact ? y + cellH / 2 - 2 : y + cellH - 13} width={(compact ? cellW - 50 : meterW) * progress} height={4} rx={2} fill={TONE[lost ? "danger" : done || frame < run.start ? "ok" : "line"]} />
          {lost ? <Text x={x + cellW - 8} y={y + 11} size={13} font="mono" weight={700} tone="danger" anchor="end" opacity={pop(frame, finishAt(index) + 4)}>✗</Text> : null}
        </Box>
      </g>;
    })}

    {/* Merge / reconciliation job with a slot per shard */}
    <g {...enter(frame, 10)}>
      <Box x={mx} y={my} w={mw} h={mh} tone={failed ? "danger" : passed ? "ok" : actB ? "hot" : stitchedA ? "danger" : "line"} focus={actB ? .6 * ease(frame, T.fix, T.fix + 16) * (1 - ease(frame, T.pass + 20, T.pass + 40)) : 0} radius={14}>
        <g opacity={actB ? ease(frame, T.fix + 4, T.fix + 16) : 1 - ease(frame, T.fix - 8, T.fix)}>
          <Text x={mx + 16} y={my + 22} size={11} font="mono" weight={600} tone={actB ? "hot" : "muted"} caps>{mergeTitle}</Text>
        </g>
        <Text x={mx + 16} y={my + (compact ? 46 : 52)} size={13} font="mono" weight={500} tone="muted">files.length</Text>
        <Text x={mx + mw - 16} y={my + (compact ? 46 : 52)} size={compact ? 18 : 21} font="mono" weight={700} anchor="end" tone={countTone}>{`${arrived} / ${SHARDS}`}</Text>
        {Array.from({ length: SHARDS }, (_, index) => {
          const [sx, sy] = slotAt(index);
          const filled = landed(index);
          const fading = previous !== undefined && !filled && fresh < 1 && landedIn(previous, index);
          const hole = (failed && index === LOST) || (stitchedA && straggler(index));
          return <g key={index}>
            <rect x={sx + .5} y={sy + .5} width={slotW - 1} height={slotH - 1} rx={5} fill="none" stroke={hole ? TONE.danger : "var(--scene-hairline)"} strokeWidth={1} strokeDasharray="3 3" opacity={filled ? 0 : fading ? fresh : 1} />
            {fading ? <rect x={sx} y={sy} width={slotW} height={slotH} rx={5} opacity={1 - fresh} style={{ fill: tint("line", 30) }} stroke={TONE.line} strokeOpacity={.6} /> : null}
            {filled ? <g opacity={Math.min(1, pop(frame, landAt(index), 220))}>
              <rect x={sx} y={sy} width={slotW} height={slotH} rx={5} style={{ fill: tint(passed || readC ? "ok" : "line", 30) }} stroke={TONE[passed || readC ? "ok" : "line"]} strokeOpacity={.6} />
              <Text x={sx + slotW / 2} y={sy + slotH / 2 + .5} size={11} font="mono" weight={600} anchor="middle" tone={passed || readC ? "ok" : "line"}>{String(index + 1)}</Text>
            </g> : null}
          </g>;
        })}
      </Box>
      {actB ? <g opacity={ease(frame, T.fix + 8, T.fix + 20)}>
        <Checkpoint x={mx + mw - 22} y={my + 22} r={9} state={passed ? "pass" : failed ? "fail" : "pending"} appear={failed ? Math.min(1, pop(frame, T.checkB)) : passed ? Math.min(1, pop(frame, T.pass)) : 1} />
      </g> : <Tag x={mx + mw - 14} y={my + 22} anchor="end" size={11} tone="danger" appear={pop(frame, T.stitchA) * (1 - ease(frame, T.fix - 10, T.fix))} text={fr ? "n’attend pas" : "no wait"} />}
      {failed && frame < T.retry ? <Pulse x={slotAt(LOST)[0] + slotW / 2} y={slotAt(LOST)[1] + slotH / 2} frame={frame} at={T.checkB} period={40} r={10} tone="danger" /> : null}
    </g>

    {/* Coverage tracker */}
    <g {...enter(frame, 16)}>
      <Box x={tx} y={ty} w={tw} h={th} tone={readA ? "danger" : readC ? "ok" : "line"} fill={readA ? .6 * pop(frame, T.dropA) : 0} radius={14}>
        <Text x={tx + 16} y={ty + 22} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "tracker de couverture" : "coverage tracker"}</Text>
        {(() => {
          const big = compact ? 32 : 42;
          const numberY = ty + (compact ? 68 : 82);
          const subY = ty + (compact ? 100 : 126);
          if (readA) return <g opacity={(1 - fresh) || (runIndex === 0 ? 1 : 0)}>
            <g transform={`translate(${tx + tw / 2} ${numberY}) scale(${.7 + .3 * pop(frame, T.dropA, 180)}) translate(${-tx - tw / 2} ${-numberY})`}>
              <Text x={tx + tw / 2} y={numberY} size={big} weight={700} anchor="middle" tone="danger">−20 %</Text>
            </g>
            <Text x={tx + tw / 2} y={subY} size={13} font="mono" weight={600} anchor="middle" tone="danger">{fr ? "en une nuit ?!" : "overnight?!"}</Text>
          </g>;
          if (readC) return <g>
            <g transform={`translate(${tx + tw / 2} ${numberY}) scale(${.7 + .3 * pop(frame, T.lcovC[1], 180)}) translate(${-tx - tw / 2} ${-numberY})`}>
              <Text x={tx + tw / 2} y={numberY} size={big} weight={700} anchor="middle" tone="ok">95%+</Text>
            </g>
            <Text x={tx + tw / 2} y={subY} size={13} font="mono" weight={600} anchor="middle" tone="ok" opacity={ease(frame, T.lcovC[1] + 8, T.lcovC[1] + 20)}>{fr ? "1 LCOV unifié" : "1 unified LCOV"}</Text>
          </g>;
          return <Text x={tx + tw / 2} y={numberY} size={big} weight={600} anchor="middle" tone="muted" opacity={.5}>—</Text>;
        })()}
      </Box>
      {readC ? <Pulse x={tx + tw / 2} y={ty + th / 2} frame={frame} at={T.lcovC[1]} period={60} r={18} tone="ok" /> : null}
    </g>

    {/* Artifact tiles in flight, job → slot */}
    {Array.from({ length: SHARDS }, (_, index) => {
      const start = finishAt(index);
      const [cellX, cellY] = cellAt(index);
      const from: Pt = [cellX + cellW / 2 - slotW / 2, cellY + cellH / 2 - slotH / 2];
      const [slotX, slotY] = slotAt(index);
      if (lostHere(index)) {
        // The upload fails: the tile lifts off, cracks and drops.
        const t = ease(frame, start, start + 26, (value) => value);
        if (t <= 0 || t >= 1) return null;
        const rise = Math.sin(Math.min(1, t * 2.2) * Math.PI / 2) * 22;
        const fall = Math.max(0, t - .45) ** 2 * 120;
        return <g key={index} opacity={1 - ease(frame, start + 12, start + 26)} transform={`translate(${from[0]} ${from[1] - rise + fall}) rotate(${12 * Math.max(0, t - .4)} ${slotW / 2} ${slotH / 2})`}>
          <rect width={slotW} height={slotH} rx={5} style={{ fill: tint("danger", 30) }} stroke={TONE.danger} />
          <Text x={slotW / 2} y={slotH / 2 + .5} size={11} font="mono" weight={700} anchor="middle" tone="danger">✗</Text>
        </g>;
      }
      if (straggler(index)) {
        // Too late: the tile flies to the shut merge and bounces off its edge.
        const door: Pt = compact ? [slotX, my - slotH - 3] : [mx - slotW - 6, slotY];
        const t = ease(frame, start, start + FLY);
        const bounce = easeOut(frame, start + FLY, start + FLY + 22);
        if (t <= 0 || frame > start + FLY + 30) return null;
        const control: Pt = compact ? [lerp(from[0], door[0], .5), (from[1] + door[1]) / 2] : [door[0] - 20, door[1]];
        const [px, py] = t < 1 ? bezier(from, control, door, t) : compact ? [door[0] + 20 * bounce, door[1] - 18 * bounce + 8 * bounce * bounce] : [door[0] - 26 * bounce, door[1] + 30 * bounce * bounce];
        return <g key={index} opacity={1 - ease(frame, start + FLY + 14, start + FLY + 30)} transform={`translate(${px} ${py}) rotate(${-18 * bounce} ${slotW / 2} ${slotH / 2})`}>
          <rect width={slotW} height={slotH} rx={5} style={{ fill: "var(--scene-card)" }} />
          <rect width={slotW} height={slotH} rx={5} style={{ fill: tint("hot", 26) }} stroke={TONE.hot} />
          <Text x={slotW / 2} y={slotH / 2 + .5} size={11} font="mono" weight={700} anchor="middle" tone="hot">{String(index + 1)}</Text>
        </g>;
      }
      const t = ease(frame, start, start + FLY);
      if (t <= 0 || t >= 1) return null;
      const to: Pt = [slotX, slotY];
      const control: Pt = compact ? [lerp(from[0], to[0], .5), (from[1] + to[1]) / 2 + 30] : [mx - 40, to[1]];
      const [px, py] = bezier(from, control, to, t);
      return <g key={index} transform={`translate(${px} ${py})`}>
        <rect className="scene-card" width={slotW} height={slotH} rx={5} style={{ fill: "var(--scene-card)" }} />
        <rect className="scene-glow" width={slotW} height={slotH} rx={5} style={{ fill: tint("line", 30), color: TONE.line }} stroke={TONE.line} />
        <Text x={slotW / 2} y={slotH / 2 + .5} size={11} font="mono" weight={600} anchor="middle" tone="line">{String(index + 1)}</Text>
      </g>;
    })}
    {/* "too late" where the stragglers hit the shut merge */}
    {runIndex === 0 ? (() => {
      const first = RUNS[0]!.start + DUR[1] + FLY;
      return <>
        <Tag x={mx + mw / 2} y={my + mh - 18} size={11} tone="hot" appear={pop(frame, first) * (1 - ease(frame, T.fix - 10, T.fix))} text={fr ? "2 arrivés trop tard" : "2 arrived too late"} />
        {[1, 8].map((index) => {
          // One knock per straggler, where it hits the shut merge.
          const hit = RUNS[0]!.start + DUR[index]! + FLY;
          const [slotX, slotY] = slotAt(index);
          return frame >= hit && frame < hit + 30
            ? <Pulse key={index} x={compact ? slotX + slotW / 2 : mx} y={compact ? my : slotY + slotH / 2} frame={frame} at={hit} period={30} r={8} tone="hot" />
            : null;
        })}
      </>;
    })() : null}

    {/* The stitched LCOV travels to the tracker */}
    {lcovT > 0 && lcovT < 1 ? (() => {
      const control: Pt = [lerp(lcovFrom[0], lcovTo[0], .5), Math.min(lcovFrom[1], lcovTo[1]) - 40];
      const path = Array.from({ length: 13 }, (_, step) => bezier(lcovFrom, control, lcovTo, step / 12));
      const [px, py] = bezier(lcovFrom, control, lcovTo, lcovT);
      const tone: Tone = runIndex === 0 ? "danger" : "ok";
      return <g>
        <Comet points={path} t={lcovT} tone={tone} r={3} tail={.3} />
        <Tag x={px} y={py - 18} size={11} tone={tone} text={runIndex === 0 ? (fr ? "lcov (8/10)" : "lcov (8/10)") : "lcov (10/10)"} />
      </g>;
    })() : null}

    {/* Editor: the naive merge, then the guard typed in */}
    <g opacity={enter(frame, 22).opacity * (1 - codeOut)}>
      <CodeBlock x={cx} y={cy} w={cw} frame={frame} size={L.codeSize} title="mergeCoverage(shards)" lines={codeA} highlight={readA ? (compact ? 0 : 1) : undefined} />
    </g>
    {codeSwap > 0 ? <g opacity={codeSwap}>
      <CodeBlock x={cx} y={cy} w={cw} frame={frame} size={L.codeSize} title="mergeCoverage(shards)" lines={codeB} highlight={bandB} />
    </g> : null}

    {/* Toasts: management reads the partial report; later, the job fails loudly. */}
    {(() => {
      const quoteA = compact
        ? [fr ? "« On a perdu 20 % de couverture en une nuit ?! »" : "“We dropped 20% coverage overnight?!”"]
        : fr ? ["« On a perdu 20 % de", "couverture en une", "nuit ?! »"] : ["“We dropped 20%", "coverage overnight?!”"];
      const quoteB = compact
        ? [fr ? "Bon, on a paumé un shard. Va falloir relancer toute la CI." : "Well, we lost a shard. Time to retry the whole CI."]
        : fr ? ["Bon, on a paumé un shard.", "Va falloir relancer", "toute la CI."] : ["Well, we lost a shard.", "Time to retry", "the whole CI."];
      const quoteC = passed
        ? compact ? [fr ? "Les 10 shards sont là\u00a0: stitchLcov(files)" : "All 10 shards here: stitchLcov(files)"] : fr ? ["Les 10 shards sont là.", "stitchLcov(files)"] : ["All 10 shards here.", "stitchLcov(files)"]
        : compact ? [fr ? "On attend les 10 shards…" : "Waiting for all 10 shards…"] : fr ? ["On attend", "les 10 shards…"] : ["Waiting for", "all 10 shards…"];
      const aOn = easeOut(frame, T.toastA, T.toastA + 18) * (1 - ease(frame, T.fix - 12, T.fix));
      const bOn = easeOut(frame, T.checkB + 8, T.checkB + 26) * (1 - ease(frame, T.retry - 12, T.retry));
      const retryOn = ease(frame, T.retry, T.retry + 14);
      const lineGap = compact ? 0 : 22;
      const toast = (on: number, eyebrow: string, tone: Tone, lines: string[], textTone: Tone) => on > 0 ? <g opacity={on} transform={`translate(${(1 - on) * 18} 0)`}>
        <Box x={ox} y={oy} w={ow} h={compact ? oh : 28 + lines.length * lineGap + 22} tone={tone} focus={on * .7} radius={12}>
          <Text x={ox + 16} y={oy + (compact ? 16 : 22)} size={11} font="mono" weight={600} tone={tone} caps>{eyebrow}</Text>
          {lines.map((line, index) => <Text key={index} x={ox + 16} y={oy + (compact ? 36 : 50 + index * lineGap)} size={compact ? 13.5 : 15} weight={600} tone={textTone}>{line}</Text>)}
        </Box>
      </g> : null;
      return <>
        {toast(aOn, fr ? "la direction" : "management", "hot", quoteA, "ink")}
        {toast(bOn, fr ? "✗ réconciliation échouée" : "✗ reconciliation failed", "danger", quoteB, "ink")}
        {toast(retryOn, passed ? (fr ? "✓ CI relancée" : "✓ CI retried") : (fr ? "↻ CI relancée" : "↻ CI retried"), passed ? "ok" : "muted", quoteC, "ink")}
      </>;
    })()}
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 1,
  title: { en: "Faster CI, new failure point", fr: "CI plus rapide, nouveau point de panne" },
  caption: {
    en: "Parallelism made the tests faster. Artifact reconciliation became the new system to make reliable: wait for every shard, count them, and fail loudly instead of publishing a partial report.",
    fr: "Le parallélisme a accéléré les tests. La réconciliation des artefacts est devenue le nouveau système à fiabiliser : attendre chaque shard, les compter, et échouer franchement plutôt que publier un rapport partiel.",
  },
  beats: [
    { at: 0, text: { en: "Ten jobs finish fast. Each one uploads its coverage artifact to the merge step.", fr: "Dix jobs finissent vite. Chacun envoie son artefact de couverture à l’étape de fusion." } },
    { at: T.stitchA, text: { en: "The merge doesn't wait: it stitches what arrived. Two stragglers find the door shut.", fr: "La fusion n’attend pas : elle coud ce qui est arrivé. Deux retardataires trouvent porte close." } },
    { at: T.dropA, text: { en: "A partial LCOV reaches the tracker, and management thinks we dropped 20% coverage overnight.", fr: "Un LCOV partiel part au tracker, et la direction croit qu’on a perdu 20 % de couverture en une nuit." } },
    { at: T.fix, text: { en: "The fix: a reconciliation job that waits for ALL shards and counts them before stitching.", fr: "La parade : un job de réconciliation qui attend TOUS les shards et les compte avant de coudre." } },
    { at: T.failB, text: { en: "Node 4's upload fails. The job counts 9 !== expectedShards and throws instead of publishing.", fr: "L’upload du nœud 4 échoue. Le job compte 9 !== expectedShards et lève une erreur au lieu de publier." } },
    { at: T.retry, text: { en: "Time to retry the whole CI. All 10 arrive and stitchLcov builds one unified LCOV.", fr: "On relance toute la CI. Les 10 arrivent et stitchLcov produit un LCOV unifié." } },
  ],
  Stage,
});
