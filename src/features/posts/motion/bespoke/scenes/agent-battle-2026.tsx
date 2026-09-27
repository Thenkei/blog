import { Boundary, Box, Checkpoint, Comet, ease, easeOut, enter, hash, lerp, Meter, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Act 1: the article's anti-pattern: ten agents on an uncertain design fan out
// and land as ten interpretations to reconcile, some colliding. Act 2: one unit
// of work goes through the three modes in the article's order: explore in
// pairing until the problem has boundaries, fly into a task contract and a
// bounded delegation, split into genuinely independent units that run in their
// own worktrees, and converge on a human integration gate.
const T = {
  fan: 14,
  land: 70,
  collide: 102,
  wipe: 140,
  modes: 146,
  ping: [160, 222] as const,
  clear: 226,
  fly: [240, 266] as const,
  fields: 266,
  delegate: [298, 324] as const,
  evidence: 328,
  split: [342, 362] as const,
  lanes: [364, 402] as const,
  integrate: 412,
  pass: 446,
  end: 530,
} as const;

type Pt = readonly [number, number];
type Rect = { x: number; y: number; w: number; h: number };

const AGENTS = 10;
const LANDING = [.14, .76, .38, .9, .52, .24, .64, .06, .44, .96] as const;
const COLLIDE = [2, 5, 8] as const;

const MODES = {
  en: [["Interactive pairing", "frequent human direction"], ["Bounded delegation", "sandbox · budget · evidence"], ["Orchestration", "worktrees · explicit integration"]],
  fr: [["Pairing interactif", "direction humaine fréquente"], ["Délégation bornée", "sandbox · budget · preuve"], ["Orchestration", "worktrees · intégration explicite"]],
} as const;
const CONTRACT = {
  en: ["scope", "authorised files", "completion criteria", "expected tests", "stop condition"],
  fr: ["périmètre", "fichiers autorisés", "critères de fin", "tests attendus", "condition d'arrêt"],
} as const;
const CONTRACT_SHORT = {
  en: ["scope · files · criteria", "tests · stop condition"],
  fr: ["périmètre · fichiers · critères", "tests · condition d'arrêt"],
} as const;

const quad = (a: Pt, c: Pt, b: Pt, t: number): [number, number] => [
  (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];
const curve = (a: Pt, c: Pt, b: Pt, steps = 16): Pt[] => Array.from({ length: steps + 1 }, (_, i) => quad(a, c, b, i / steps));
const pathOf = (points: readonly Pt[]) => `M${points.map(([x, y]) => `${x} ${y}`).join("L")}`;

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const act1 = 1 - ease(frame, T.wipe - 14, T.wipe);
  const act2 = frame >= T.wipe - 4;

  // ── Act 1: parallelise first ──────────────────────────────────────────────
  const blob = compact ? { x: 100, y: 250, r: 62 } : { x: 170, y: 226, r: 78 };
  const merge: Rect = compact ? { x: 330, y: 150, w: 190, h: 200 } : { x: 690, y: 110, w: 230, h: 230 };
  const fanX = compact ? 230 : 450;
  const fanSpread = compact ? [90, 430] : [78, 380];
  const slot = (k: number): Pt => {
    const cols = 5;
    const col = k % cols;
    const row = Math.floor(k / cols);
    const w = (merge.w - 36) / cols;
    return [merge.x + 18 + w * (col + .5) + (hash(k + 1) - .5) * 8, merge.y + 70 + row * 56 + LANDING[k]! * 22];
  };
  const fanPath = (k: number) => {
    const from: Pt = [blob.x + blob.r * .9, blob.y];
    const via: Pt = [fanX, lerp(fanSpread[0]!, fanSpread[1]!, k / (AGENTS - 1))];
    return [...curve(from, [lerp(from[0], via[0], .5), via[1]], via, 8), ...curve(via, [lerp(via[0], merge.x, .6), via[1]], slot(k), 8).slice(1)];
  };
  const colliding = (k: number) => (COLLIDE as readonly number[]).includes(k) && frame >= T.collide;

  // ── Act 2: three modes ────────────────────────────────────────────────────
  const col = (i: number): Rect => compact ? { x: 20, y: 54 + i * 152, w: 500, h: 142 } : { x: 40 + i * 300, y: 62, w: 280, h: 334 };
  const modeFocus = frame < T.fly[0] + 4 ? 0 : frame < T.split[0] ? 1 : 2;
  // Focus follows the work; averaging the last 12 frames turns each switch into a ramp.
  const colOn = (i: number) => Array.from({ length: 12 }, (_, k) => {
    const f = frame - k;
    const current = f < T.fly[0] + 4 ? 0 : f < T.split[0] ? 1 : 2;
    return f >= T.pass ? 1 : current === i ? 1 : .42;
  }).reduce((sum, value) => sum + value, 0) / 12;
  const modes = MODES[locale];
  const c1 = col(0);
  const c2 = col(1);
  const c3 = col(2);

  // Mode 1: person ⇄ agent until the problem has boundaries.
  const person: Rect = compact ? { x: c1.x + 16, y: c1.y + 52, w: 100, h: 38 } : { x: c1.x + 18, y: c1.y + 82, w: 106, h: 40 };
  const agent1: Rect = compact ? { x: c1.x + 174, y: c1.y + 52, w: 100, h: 38 } : { x: c1.x + c1.w - 124, y: c1.y + 82, w: 106, h: 40 };
  const pingT = frame >= T.ping[0] && frame < T.ping[1] ? ((frame - T.ping[0]) % 30) / 30 : -1;
  const pingForward = Math.floor(Math.max(0, frame - T.ping[0]) / 30) % 2 === 0;
  const lineY = person.y + person.h / 2;
  const pingPts: Pt[] = pingForward ? [[person.x + person.w + 4, lineY], [agent1.x - 4, lineY]] : [[agent1.x - 4, lineY], [person.x + person.w + 4, lineY]];
  const clear = ease(frame, T.clear - 14, T.clear + 4);
  const shape: Rect = compact ? { x: c1.x + 330, y: c1.y + 54, w: 150, h: 72 } : { x: c1.x + 70, y: c1.y + 172, w: 140, h: 96 };
  const shapeC: Pt = [shape.x + shape.w / 2, shape.y + shape.h / 2];

  // Mode 2: the bounded problem flies in and becomes the task contract.
  const contract: Rect = compact ? { x: c2.x + 16, y: c2.y + 42, w: 262, h: 86 } : { x: c2.x + 18, y: c2.y + 74, w: c2.w - 36, h: 148 };
  const sandbox: Rect = compact ? { x: c2.x + 290, y: c2.y + 46, w: 194, h: 80 } : { x: c2.x + 18, y: c2.y + 240, w: c2.w - 36, h: 78 };
  const flight = ease(frame, T.fly[0], T.fly[1]);
  const flying = frame >= T.fly[0] && frame < T.fly[1];
  const contractIn = frame >= T.fly[1];
  const flyCtrl: Pt = compact ? [shapeC[0] + 60, lerp(shapeC[1], contract.y, .5)] : [lerp(shapeC[0], contract.x + contract.w / 2, .5), shape.y - 60];
  const [fx, fy] = quad(shapeC, flyCtrl, [contract.x + contract.w / 2, contract.y + contract.h / 2], flight);
  const fw = lerp(shape.w, contract.w, flight);
  const fh = lerp(shape.h, contract.h, flight);
  const run = easeOut(frame, T.delegate[0], T.delegate[1]);

  // Mode 3: three independent units, one worktree each, then human integration.
  const lanes: Rect[] = [0, 1, 2].map((k) => compact
    ? { x: c3.x + 16, y: c3.y + 44 + k * 30, w: 220, h: 24 }
    : { x: c3.x + 18, y: c3.y + 78 + k * 46, w: c3.w - 36, h: 34 });
  const integ: Rect = compact ? { x: c3.x + 256, y: c3.y + 44, w: 228, h: 82 } : { x: c3.x + 18, y: c3.y + 236, w: c3.w - 36, h: 82 };
  const unitFrom: Pt = [sandbox.x + sandbox.w - 22, sandbox.y + sandbox.h / 2];
  const laneStart = (k: number): Pt => [lanes[k]!.x + (compact ? 104 : 118), lanes[k]!.y + lanes[k]!.h / 2];
  const laneEnd = (k: number): Pt => [lanes[k]!.x + lanes[k]!.w - 14, lanes[k]!.y + lanes[k]!.h / 2];
  const laneT = (k: number) => ease(frame, T.lanes[0] + k * 5, T.lanes[1] - (2 - k) * 3);
  const integIn: Pt = compact ? [integ.x, integ.y + integ.h / 2] : [integ.x + integ.w / 2, integ.y];

  const header = (i: number) => {
    const c = col(i);
    return <>
      <Text x={c.x + 18} y={c.y + 26} size={17} weight={650}>{modes[i]![0]}</Text>
      <Text x={compact ? c.x + c.w - 16 : c.x + 18} y={compact ? c.y + 26 : c.y + 50} size={12} font="mono" weight={600} tone="muted" anchor={compact ? "end" : "start"}>{modes[i]![1]}</Text>
    </>;
  };

  return <g>
    {/* ── Act 1 ── */}
    {act1 > 0 ? <g opacity={act1}>
      <g {...enter(frame, 0)}>
        <circle cx={blob.x} cy={blob.y} r={blob.r} style={{ fill: tint("danger", 6) }} stroke={TONE.danger} strokeOpacity={.5} strokeWidth={1.25} strokeDasharray="5 6" />
        <circle cx={blob.x} cy={blob.y} r={blob.r * .66} fill="none" stroke={TONE.danger} strokeOpacity={.22} strokeWidth={1} strokeDasharray="3 6" />
        <Text x={blob.x} y={blob.y - 10} size={compact ? 15 : 17} weight={650} anchor="middle">{fr ? "conception" : "uncertain"}</Text>
        <Text x={blob.x} y={blob.y + 12} size={compact ? 15 : 17} weight={650} anchor="middle">{fr ? "incertaine" : "design"}</Text>
      </g>
      {Array.from({ length: AGENTS }, (_, k) => {
        const at = stagger(k, T.fan, 3);
        return <path key={k} d={pathOf(fanPath(k))} fill="none" style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1} opacity={ease(frame, at, at + 16) * lerp(.9, .35, ease(frame, T.land, T.collide))} />;
      })}
      <g {...enter(frame, 6, { from: "right", distance: 18 })}>
        <Box x={merge.x} y={merge.y} w={merge.w} h={merge.h} tone={frame >= T.collide ? "danger" : "line"} radius={16} focus={ease(frame, T.collide, T.collide + 12) * .7}>
          <Text x={merge.x + 18} y={merge.y + 24} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "intégration" : "integration"}</Text>
        </Box>
      </g>
      {Array.from({ length: AGENTS }, (_, k) => {
        const points = fanPath(k);
        const at = stagger(k, T.fan, 3);
        const t = ease(frame, at, at + 56 - k);
        const [sx, sy] = slot(k);
        const landed = t >= 1;
        const tone: Tone = colliding(k) ? "danger" : "line";
        return <g key={k}>
          <Comet points={points} t={t} tone="line" r={4.5} tail={.12} />
          {landed ? <g transform={`translate(${sx} ${sy}) scale(${pop(frame, at + 56 - k, 200)})`}>
            <rect x={-16} y={-11} width={32} height={22} rx={6} style={{ fill: "var(--scene-card)" }} />
            <rect x={-16} y={-11} width={32} height={22} rx={6} style={{ fill: tint(tone, 16) }} stroke={TONE[tone]} strokeOpacity={.5} />
            <Text x={0} y={.5} size={11} font="mono" weight={600} tone={tone} anchor="middle">{`v${k + 1}`}</Text>
          </g> : null}
          {colliding(k) && frame < T.collide + 30 ? <Pulse x={sx} y={sy} frame={frame} at={T.collide + COLLIDE.indexOf(k as 2 | 5 | 8) * 4} period={40} r={14} tone="danger" /> : null}
        </g>;
      })}
      <Tag x={merge.x + merge.w / 2} y={merge.y + merge.h - 28} text={fr ? "collisions ✗" : "collisions ✗"} tone="danger" size={12} appear={frame >= T.collide ? pop(frame, T.collide + 8) : 0} />
      <Tag x={compact ? 520 : merge.x + merge.w} y={merge.y + merge.h + 26} anchor="end" text={fr ? "10 interprétations à réconcilier" : "10 interpretations to reconcile"} tone="danger" size={12.5} appear={frame >= T.collide ? pop(frame, T.collide + 16) : 0} />
      <Tag x={fanX} y={compact ? 62 : 52} text={fr ? "×10 agents" : "×10 agents"} tone="line" size={12} appear={frame >= T.fan + 16 ? pop(frame, T.fan + 16) : 0} />
    </g> : null}

    {/* ── Act 2 ── */}
    {act2 ? <g>
      {[0, 1, 2].map((i) => {
        const c = col(i);
        return <g key={i} {...enter(frame, stagger(i, T.modes, 6), { distance: 14 })}>
          <g opacity={colOn(i)}>
            <Box x={c.x} y={c.y} w={c.w} h={c.h} tone={i === 2 ? "hot" : "line"} radius={18} focus={modeFocus === i && frame < T.pass ? .35 : 0}>
              {header(i)}
            </Box>
          </g>
        </g>;
      })}

      {/* Mode 1. */}
      <g opacity={colOn(0) * enter(frame, T.modes + 8).opacity}>
        <Box x={person.x} y={person.y} w={person.w} h={person.h} tone="hot" radius={10} label={fr ? "personne" : "person"} labelSize={15} />
        <Box x={agent1.x} y={agent1.y} w={agent1.w} h={agent1.h} tone="line" radius={10} label="agent" labelSize={15} />
        <line x1={person.x + person.w + 4} x2={agent1.x - 4} y1={lineY} y2={lineY} style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1} />
        {pingT >= 0 ? <Comet points={pingPts} t={Math.max(.001, pingT)} tone="hot" r={4.5} tail={.3} /> : null}
        {/* The problem: fuzzy, then bounded (and then it leaves for the contract). */}
        <g opacity={1 - clear}>
          <ellipse cx={shapeC[0]} cy={shapeC[1]} rx={shape.w / 2 - 6} ry={shape.h / 2} style={{ fill: tint("danger", 6) }} stroke={TONE.danger} strokeOpacity={.5} strokeWidth={1.25} strokeDasharray="5 6" transform={`rotate(${Math.sin(frame * .05) * 4} ${shapeC[0]} ${shapeC[1]})`} />
          <Text x={shapeC[0]} y={shapeC[1] - 8} size={13} font="mono" weight={600} tone="danger" anchor="middle">{fr ? "problème" : "ambiguous"}</Text>
          <Text x={shapeC[0]} y={shapeC[1] + 10} size={13} font="mono" weight={600} tone="danger" anchor="middle">{fr ? "ambigu" : "problem"}</Text>
        </g>
        {clear > 0 && frame < T.fly[0] ? <g opacity={clear} transform={`translate(${shapeC[0]} ${shapeC[1]}) scale(${.85 + .15 * clear}) translate(${-shapeC[0]} ${-shapeC[1]})`}>
          <Box x={shape.x} y={shape.y} w={shape.w} h={shape.h} tone="ok" radius={12} fill={.5}>
            <Text x={shapeC[0]} y={shapeC[1] - 9} size={13} font="mono" weight={600} tone="ok" anchor="middle">{fr ? "frontières" : "boundaries"}</Text>
            <Text x={shapeC[0]} y={shapeC[1] + 10} size={13} font="mono" weight={600} tone="ok" anchor="middle">{fr ? "nettes ✓" : "clear ✓"}</Text>
          </Box>
        </g> : null}
        <Tag x={shapeC[0]} y={shapeC[1]} text={fr ? "frontières nettes ✓" : "boundaries clear ✓"} tone="ok" size={12} appear={frame >= T.fly[0] + 8 ? pop(frame, T.fly[0] + 8) : 0} />
      </g>

      {/* The bounded problem in flight, growing into the contract. */}
      {flying ? <g>
        <rect className="scene-card" x={fx - fw / 2} y={fy - fh / 2} width={fw} height={fh} rx={12} style={{ fill: "var(--scene-card)" }} />
        <rect className="scene-glow" x={fx - fw / 2} y={fy - fh / 2} width={fw} height={fh} rx={12} style={{ fill: tint("ok", 14), color: TONE.ok }} stroke={TONE.ok} strokeOpacity={.6} />
        <Text x={fx} y={fy} size={12} font="mono" weight={600} tone="ok" anchor="middle" opacity={1 - ease(frame, T.fly[1] - 8, T.fly[1])}>{fr ? "frontières nettes" : "boundaries clear"}</Text>
      </g> : null}

      {/* Mode 2. */}
      <g opacity={colOn(1)}>
        {contractIn ? <Box x={contract.x} y={contract.y} w={contract.w} h={contract.h} tone="ok" radius={12} fill={.25 * (1 - ease(frame, T.fly[1], T.fly[1] + 30))}>
          <Text x={contract.x + 14} y={contract.y + 18} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "contrat de tâche" : "task contract"}</Text>
          {compact
            ? CONTRACT_SHORT[locale].map((line, k) => <g key={k} {...enter(frame, stagger(k, T.fields, 8), { distance: 6, from: "left" })}>
              <Text x={contract.x + 14} y={contract.y + 44 + k * 22} size={13} font="mono" weight={600}>{line}</Text>
            </g>)
            : CONTRACT[locale].map((field, k) => <g key={field} {...enter(frame, stagger(k, T.fields, 5), { distance: 6, from: "left" })}>
              <Checkpoint x={contract.x + 22} y={contract.y + 42 + k * 23} r={7} state="pass" />
              <Text x={contract.x + 38} y={contract.y + 42 + k * 23} size={13.5} font="mono" weight={600}>{field}</Text>
            </g>)}
        </Box> : null}
        <g {...enter(frame, T.delegate[0] - 10)}>
          <Boundary x={sandbox.x} y={sandbox.y} w={sandbox.w} h={sandbox.h} label="sandbox" tone="line" labelAt="top-start" />
          <Box x={sandbox.x + 12} y={sandbox.y + sandbox.h / 2 - 17 + 4} w={compact ? 74 : 84} h={34} tone="line" radius={10} label="agent" labelSize={14} focus={during(frame, T.delegate[0], T.evidence + 8) * .8} />
          <Meter x={sandbox.x + (compact ? 96 : 110)} y={sandbox.y + sandbox.h / 2 + 4 - 4} w={sandbox.w - (compact ? 140 : 156)} h={8} value={run} tone={frame >= T.evidence ? "ok" : "line"} />
          <g transform={`translate(${sandbox.x + sandbox.w - 22} ${sandbox.y + sandbox.h / 2 + 4}) scale(${frame >= T.evidence ? .7 + .3 * pop(frame, T.evidence, 200) : 1}) translate(${-(sandbox.x + sandbox.w - 22)} ${-(sandbox.y + sandbox.h / 2 + 4)})`}>
            <Checkpoint x={sandbox.x + sandbox.w - 22} y={sandbox.y + sandbox.h / 2 + 4} r={11} state={frame >= T.evidence ? "pass" : "pending"} />
          </g>
          {!compact ? <Text x={sandbox.x + sandbox.w - 40} y={sandbox.y + sandbox.h / 2 - 16} size={11} font="mono" weight={600} tone={frame >= T.evidence ? "ok" : "muted"} anchor="end">{fr ? "preuve de fin" : "completion evidence"}</Text> : null}
        </g>
      </g>

      {/* Split: only independent units go on, each to its own worktree. */}
      {[0, 1, 2].map((k) => {
        const to = laneStart(k);
        const ctrl: Pt = compact ? [unitFrom[0] - 40, lerp(unitFrom[1], to[1], .5)] : [lerp(unitFrom[0], to[0], .5), Math.min(unitFrom[1], to[1]) - 40 + k * 20];
        const t = ease(frame, T.split[0] + k * 3, T.split[1] + k * 3);
        return <Comet key={k} points={curve(unitFrom, ctrl, to)} t={t} tone="line" r={4.5} tail={.25} />;
      })}

      {/* Mode 3. */}
      <g opacity={colOn(2)}>
        {lanes.map((lane, k) => {
          const t = laneT(k);
          const done = t >= 1;
          return <g key={k} {...enter(frame, stagger(k, T.modes + 14, 4), { from: "none" })}>
            <Box x={lane.x} y={lane.y} w={lane.w} h={lane.h} variant="ghost" tone={done ? "ok" : "muted"} radius={9}>
              <Text x={lane.x + 12} y={lane.y + lane.h / 2} size={12} font="mono" weight={600} tone={done ? "ok" : "muted"}>{`worktree ${"ABC"[k]}`}</Text>
            </Box>
            <line x1={laneStart(k)[0]} x2={laneEnd(k)[0]} y1={laneStart(k)[1]} y2={laneStart(k)[1]} style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1} />
            {t > 0 ? <line x1={laneStart(k)[0]} x2={lerp(laneStart(k)[0], laneEnd(k)[0], t)} y1={laneStart(k)[1]} y2={laneStart(k)[1]} stroke={TONE[done ? "ok" : "line"]} strokeWidth={2} strokeLinecap="round" /> : null}
            {frame >= T.split[1] + k * 3 ? <circle cx={lerp(laneStart(k)[0], laneEnd(k)[0], t)} cy={laneStart(k)[1]} r={4.5} fill={TONE[done ? "ok" : "line"]} /> : null}
          </g>;
        })}
        {/* Converge on the human gate. */}
        {[0, 1, 2].map((k) => {
          const from = laneEnd(k);
          const ctrl: Pt = compact ? [lerp(from[0], integIn[0], .5), from[1]] : [from[0] - 20, lerp(from[1], integIn[1], .6)];
          return <Comet key={k} points={curve(from, ctrl, integIn)} t={ease(frame, T.lanes[1] + k * 3, T.integrate + k * 2)} tone="ok" r={4} tail={.3} />;
        })}
        <g {...enter(frame, T.integrate - 8, { distance: 10 })}>
          <Box x={integ.x} y={integ.y} w={integ.w} h={integ.h} tone={frame >= T.pass ? "ok" : "hot"} radius={12} focus={during(frame, T.integrate, T.pass + 30)} fill={frame >= T.pass ? .4 : 0}>
            <g transform={`translate(${integ.x + 24} ${integ.y + 24}) scale(${frame >= T.pass ? .7 + .3 * pop(frame, T.pass, 200) : 1}) translate(${-(integ.x + 24)} ${-(integ.y + 24)})`}>
              <Checkpoint x={integ.x + 24} y={integ.y + 24} r={11} state={frame >= T.pass ? "pass" : "pending"} />
            </g>
            <Text x={integ.x + 44} y={integ.y + 24} size={compact ? 14.5 : 15.5} weight={650}>{fr ? "intégration humaine" : "human integration"}</Text>
            <Text x={integ.x + 16} y={integ.y + 50} size={12} font="mono" weight={600} tone="hot">{fr ? "relire les invariants," : "review invariants,"}</Text>
            <Text x={integ.x + 16} y={integ.y + 67} size={12} font="mono" weight={600} tone="muted">{fr ? "pas seulement diff et tests" : "not only diff and tests"}</Text>
          </Box>
        </g>
      </g>
    </g> : null}
  </g>;
}

function during(frame: number, start: number, end: number) {
  return Math.min(ease(frame, start, start + 10), 1 - ease(frame, end - 10, end));
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: 490,
  title: { en: "Three modes, not three brands", fr: "Trois modes, pas trois marques" },
  caption: {
    en: "Ten agents on an uncertain design produce ten interpretations to reconcile. Choose the mode from the shape of the work: explore in pairing, delegate a bounded task under a contract, parallelise only independent units, and integrate under human accountability.",
    fr: "Dix agents sur une conception incertaine produisent dix interprétations à réconcilier. Choisir le mode selon la forme du travail : explorer en pairing, déléguer une tâche bornée sous contrat, paralléliser seulement les unités indépendantes et intégrer sous responsabilité humaine.",
  },
  beats: [
    { at: 0, text: { en: "Ten agents on an uncertain design do not multiply capacity by ten.", fr: "Dix agents sur une conception incertaine ne multiplient pas la capacité par dix." } },
    { at: T.land, text: { en: "They produce ten interpretations to reconcile: file collisions and incompatible decisions.", fr: "Ils produisent dix interprétations à réconcilier : collisions de fichiers et décisions incompatibles." } },
    { at: T.modes, text: { en: "Pick the mode from the shape of the work. Ambiguous: a person and an agent explore until it has boundaries.", fr: "Le mode suit la forme du travail. Ambigu : une personne et un agent explorent jusqu'à des frontières nettes." } },
    { at: T.fly[0], text: { en: "Clear issue: a task contract, then bounded delegation in a sandbox, until there is completion evidence.", fr: "Issue claire : un contrat de tâche, puis une délégation bornée en sandbox, jusqu'à la preuve de fin." } },
    { at: T.split[0], text: { en: "Only genuinely independent units run in parallel, each in its own worktree.", fr: "Seules les unités réellement indépendantes partent en parallèle, chacune dans son worktree." } },
    { at: T.integrate, text: { en: "Integration stays under human accountability: review the invariants, not only the diff and tests.", fr: "L'intégration reste sous responsabilité humaine : relire les invariants, pas seulement le diff et les tests." } },
  ],
  Stage,
});
