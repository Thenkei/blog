import { Box, Camera, Checkpoint, CodeBlock, Comet, dim, ease, easeOut, enter, lerp, pop, Tag, Text, TONE, tint, type CodeLine, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). Act 1: baseline @nestjs/bullmq, where producer and processor
// share nothing but the string "activity-export". Act 2: jobify registers the named
// function once and runs every job through monitoring → onError → timeout → work.
const T = {
  job1: 30,
  rename: 136,
  job2: 172,
  fix: 316,
  job3: 352,
  end: 590,
} as const;

// Per-job schedule: leave the producer, wait in the queue, reach the worker.
const schedule = (start: number) => ({
  start,
  inQueue: start + 22,
  pickup: start + 36,
  atWorker: start + 58,
  verdict: start + 72,
  status: start + 92,
  removed: start + 116,
});
const S1 = schedule(T.job1);
const S2 = schedule(T.job2);
const S3 = schedule(T.job3);
const WRAPPERS = ["monitoring", "onError", "timeout"] as const;
const RING_STEP = 14;
const ringAt = (index: number) => S3.atWorker + 6 + index * RING_STEP;
const workAt = ringAt(WRAPPERS.length);
const workDone = workAt + 16;

const RENAMED = "activity-export-v2";

type Rect = { x: number; y: number; w: number; h: number };
type Pt = readonly [number, number];

function Ring({ x, y, frame, at, tone, r = 8 }: { x: number; y: number; frame: number; at: number; tone: Tone; r?: number }) {
  const t = easeOut(frame, at, at + 26);
  if (frame < at || t >= 1) return null;
  return <circle cx={x} cy={y} r={r * (1 + 1.8 * t)} fill="none" stroke={TONE[tone]} strokeWidth={1.5} opacity={(1 - t) * .8} />;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const actB = frame >= T.fix;
  const aOut = 1 - ease(frame, T.fix, T.fix + 16);
  const bIn = easeOut(frame, T.fix + 12, T.fix + 30);

  const L = compact
    ? {
      prod: { x: 20, y: 54, w: 500 }, work: { x: 20, y: 168, w: 500 }, codeSize: 12.5,
      queue: { x: 20, y: 284, w: 500, h: 46 },
      exec: { x: 20, y: 342, w: 500, h: 170 },
    }
    : {
      prod: { x: 40, y: 64, w: 420 }, work: { x: 500, y: 64, w: 420 }, codeSize: 13.5,
      queue: { x: 40, y: 196, w: 420, h: 184 },
      exec: { x: 500, y: 196, w: 420, h: 184 },
    };
  const { queue: Q, exec: E } = L;
  const codeH = 34 + 3 * L.codeSize * 1.6 + 12;

  // ── Editors
  const suffix = "-v2".slice(0, Math.max(0, Math.floor((frame - T.rename) / 5)));
  const producerA: CodeLine[] = [
    { text: `this.queue.add("activity-export${suffix}", payload, {`, tone: frame >= T.rename ? "danger" : undefined },
    { text: "  priority: 2," },
    { text: "  removeOnComplete: true, removeOnFail: true," },
  ];
  const workerA: CodeLine[] = [
    { text: "async process(job: Job<ExportPayload>) {" },
    { text: "  if (job.name === \"activity-export\")" },
    { text: "    await this.runActivityExport(job.data);" },
  ];
  const producerB: CodeLine[] = [
    { text: "await runExport({" },
    { text: "  userId, projectId, environmentId," },
    { text: "  from, to });" },
  ];
  const workerB: CodeLine[] = [
    { text: "const runExport = jobify(exportApprovals, {" },
    { text: "  timeoutInMinutes: 180," },
    { text: "  onError: onExportError, … });" },
  ];
  const comparing = (frame >= S1.atWorker && frame < S1.status) || (frame >= S2.atWorker && frame < T.fix);

  // ── Queue rows (wide: a list; compact: one strip showing the latest job)
  const rowY = (index: number) => compact ? Q.y + Q.h / 2 : Q.y + 60 + index * 42;
  const jobs = [
    { s: S1, name: "activity-export", ran: true },
    { s: S2, name: RENAMED, ran: false },
    { s: S3, name: "exportApprovals", ran: true },
  ] as const;
  const stateOf = (index: number): { text: string; tone: Tone } => {
    const { s, ran } = jobs[index]!;
    const done = index === 2 ? frame >= workDone : frame >= s.status;
    if (done) return ran ? { text: index === 2 ? "completed · monitored" : (fr ? "completed · exécuté" : "completed · ran"), tone: "ok" } : { text: fr ? "completed · rien exécuté" : "completed · nothing ran", tone: "danger" };
    if (frame >= s.pickup) return { text: "active", tone: "line" };
    return { text: "waiting", tone: "muted" };
  };

  const current = frame >= S2.atWorker - 1 ? S2 : S1;
  const currentName = current === S2 ? RENAMED : "activity-export";
  const matches = current === S1;
  const cmpOn = easeOut(frame, current.atWorker, current.atWorker + 12);
  const verdict = pop(frame, current.verdict);

  // ── Paths
  const leg1 = (index: number): Pt[] => compact
    ? [[L.prod.x + L.prod.w - 6, L.prod.y + codeH / 2], [L.prod.x + L.prod.w + 10, L.prod.y + codeH / 2], [L.prod.x + L.prod.w + 10, rowY(index)], [Q.x + Q.w - 30, rowY(index)]]
    : [[L.prod.x + L.prod.w / 2, L.prod.y + codeH], [L.prod.x + L.prod.w / 2, rowY(index)]];
  const cmpY = E.y + (compact ? 54 : 62);
  const leg2 = (index: number): Pt[] => compact
    ? [[Q.x + Q.w / 2, Q.y + Q.h], [Q.x + Q.w / 2, E.y + 6]]
    : [[Q.x + Q.w - 12, rowY(index)], [(Q.x + Q.w + E.x) / 2, rowY(index)], [(Q.x + Q.w + E.x) / 2, cmpY], [E.x + 14, cmpY]];

  // ── Act 2 onion: wrappers applied in strict order.
  const onionTop = E.y + (compact ? 38 : 40);
  const innerH = E.h - (onionTop - E.y) - 12;
  const step = compact ? 22 : 25;
  const inset = compact ? 14 : 16;
  const layer = (index: number): Rect => ({
    x: E.x + 14 + index * inset,
    y: onionTop + index * step,
    w: E.w - 28 - index * inset * 2,
    h: innerH - index * step - index * 7,
  });
  const onionPath: Pt[] = [compact ? [Q.x + Q.w / 2, E.y + 6] : [E.x - 2, cmpY], ...[0, 1, 2].map((index) => [layer(index).x + 14, layer(index).y + 13] as Pt), [layer(3).x + 18, layer(3).y + layer(3).h / 2]];
  const lit = (index: number) => easeOut(frame, ringAt(index), ringAt(index) + 10);

  const lean = (point: Pt): Pt => [lerp(width / 2, point[0], .04), lerp(height / 2, point[1], .04)];
  const execFocus = lean([E.x + E.w / 2, E.y + E.h / 2]);
  const camera = compact ? [{ at: 0 }] : [
    { at: 0 },
    { at: S2.atWorker - 10, zoom: 1.02, focus: execFocus },
    { at: T.fix, zoom: 1 },
    { at: S3.atWorker - 8, zoom: 1.02, focus: execFocus },
    { at: workDone + 30, dur: 50, zoom: 1 },
  ];

  const flyingChip = (from: Pt, to: Pt, t: number, text: string, tone: Tone, w0: number, w1: number) => {
    if (t <= 0 || t >= 1) return null;
    const x = lerp(from[0], to[0], t);
    const y = lerp(from[1], to[1], t);
    const w = lerp(w0, w1, ease(t, .5, 1));
    return <g transform={`translate(${x} ${y})`} opacity={Math.min(1, t * 5)}>
      <rect className="scene-card" x={-w / 2} y={-15} width={w} height={30} rx={9} style={{ fill: "var(--scene-card)" }} />
      <rect className="scene-glow" x={-w / 2} y={-15} width={w} height={30} rx={9} style={{ fill: tint(tone, 16), color: TONE[tone] }} stroke={TONE[tone]} strokeOpacity={.55} />
      <Text x={0} y={.5} size={13} font="mono" weight={600} tone={tone} anchor="middle">{text}</Text>
    </g>;
  };

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* Producer */}
    <g opacity={aOut * easeOut(frame, 0, 18)} transform={enter(frame, 0).transform}>
      <CodeBlock x={L.prod.x} y={L.prod.y} w={L.prod.w} frame={frame} size={L.codeSize} title="ExportsService · producer" lines={producerA} highlight={frame >= T.rename ? 0 : undefined} />
    </g>
    <g opacity={bIn}>
      <CodeBlock x={L.prod.x} y={L.prod.y} w={L.prod.w} frame={frame} size={L.codeSize} title={fr ? "n’importe quel service · runner typé" : "any service · typed runner"} lines={producerB} highlight={frame >= S3.start - 6 && frame < S3.inQueue + 10 ? 0 : undefined} />
    </g>

    {/* Worker */}
    <g opacity={aOut * easeOut(frame, 5, 23)} transform={enter(frame, 5).transform}>
      <CodeBlock x={L.work.x} y={L.work.y} w={L.work.w} frame={frame} size={L.codeSize} title="ExportsProcessor · WorkerHost" lines={workerA} highlight={comparing ? 1 : undefined} />
    </g>
    <g opacity={bIn}>
      <CodeBlock x={L.work.x} y={L.work.y} w={L.work.w} frame={frame} size={L.codeSize} title={fr ? "worker · enregistré une fois" : "worker · registered once"} lines={workerB} highlight={frame >= S3.atWorker ? 0 : undefined} />
    </g>

    {/* Queue */}
    <g {...enter(frame, 10, { distance: 16 })}>
      <Box x={Q.x} y={Q.y} w={Q.w} h={Q.h} tone="line" radius={compact ? 12 : 16}>
        <Text x={Q.x + 20} y={compact ? Q.y + Q.h / 2 : Q.y + 24} size={12} font="mono" weight={600} tone="muted">{"queue \"exports\""}</Text>
      </Box>
      {!compact && actB ? <Tag x={Q.x + Q.w - 16} y={Q.y + 24} anchor="end" size={11} tone="ok" text={fr ? "clé = nom de la fonction" : "key = function name"} appear={pop(frame, S3.inQueue + 8)} /> : null}
      {jobs.map((job, index) => {
        if (frame < job.s.inQueue) return null;
        // Compact shows only the newest job in its single strip.
        const next = jobs[index + 1];
        if (compact && next && frame >= next.s.inQueue) return null;
        const appear = Math.min(1, pop(frame, job.s.inQueue, 180));
        const removed = index === 1 ? easeOut(frame, S2.removed, S2.removed + 18) : 0;
        const faded = index < 2 ? dim(ease(frame, T.fix, T.fix + 20), .4) : 1;
        const state = stateOf(index);
        const y = rowY(index);
        const x0 = compact ? Q.x + 160 : Q.x + 12;
        const w = compact ? Q.w - 172 : Q.w - 24;
        const nameTone: Tone = index === 1 ? "danger" : index === 2 ? "ok" : "ink";
        return <g key={index} opacity={faded}>
          {/* removeOnComplete: the silent no-op leaves no trace */}
          {removed > 0 ? <g opacity={removed}>
            <rect x={x0} y={y - 16} width={w} height={32} rx={9} fill="none" stroke="var(--scene-hairline)" strokeDasharray="4 5" />
            <Text x={x0 + 14} y={y} size={12.5} font="mono" weight={500} tone="muted">{fr ? "supprimé · removeOnComplete" : "removed · removeOnComplete"}</Text>
          </g> : null}
          <g opacity={appear * (1 - removed)} transform={`translate(0 ${(1 - appear) * -8})`}>
            <rect x={x0} y={y - 16} width={w} height={32} rx={9} style={{ fill: tint(state.tone === "muted" ? "ink" : state.tone, state.tone === "muted" ? 5 : 11) }} />
            <Text x={x0 + 14} y={y} size={13} font="mono" weight={600} tone={nameTone}>{job.name}</Text>
            <Tag x={x0 + w - 8} y={y} text={state.text} tone={state.tone} anchor="end" size={11} />
          </g>
        </g>;
      })}
      <Ring x={Q.x + 12} y={rowY(1)} frame={frame} at={S2.status} tone="danger" />
    </g>

    {/* Execution */}
    <g {...enter(frame, 14, { distance: 16 })}>
      <Box x={E.x} y={E.y} w={E.w} h={E.h} tone={!actB && frame >= S2.verdict ? "danger" : "line"} focus={!actB ? verdict * cmpOn * (1 - ease(frame, current.status + 20, current.status + 50)) : 0} radius={16}>
        <g opacity={aOut}>
          <Text x={E.x + 20} y={E.y + 24} size={12} font="mono" weight={600} tone="muted">process(job)</Text>
        </g>
        <g opacity={bIn}>
          <Text x={E.x + 20} y={E.y + 24} size={12} font="mono" weight={600} tone="muted">worker-service.ts</Text>
        </g>
      </Box>

      {/* Act 1 comparator: two strings that must stay identical by hand. */}
      <g opacity={aOut * cmpOn}>
        <Text x={E.x + 20} y={cmpY} size={13} font="mono" weight={500} tone="muted">job.name</Text>
        <Text x={E.x + (compact ? 110 : 116)} y={cmpY} size={14.5} font="mono" weight={600} tone={matches ? "ink" : "danger"}>{`"${currentName}"`}</Text>
        <g transform={`translate(${E.x + 20} ${cmpY + 30})`}>
          <Text x={0} y={0} size={13} font="mono" weight={500} tone="muted">===</Text>
        </g>
        <Text x={E.x + (compact ? 110 : 116)} y={cmpY + 30} size={14.5} font="mono" weight={600}>{"\"activity-export\""}</Text>
        <g transform={`translate(${E.x + E.w - 16} ${cmpY + 30}) scale(${.7 + .3 * Math.min(1.1, verdict)})`}>
          <Tag x={0} y={0} anchor="end" tone={matches ? "ok" : "danger"} text={matches ? "true" : "false"} appear={verdict} />
        </g>
      </g>
      <g opacity={aOut * Math.min(1, verdict)}>
        {matches
          ? <Checkpoint x={E.x + 32} y={cmpY + 66} r={11} state="pass" label="runActivityExport(job.data)" />
          : <Checkpoint x={E.x + 32} y={cmpY + 66} r={11} state="fail" label={fr ? "if ignoré\u00a0: rien ne s’exécute" : "if skipped: nothing runs"} />}
      </g>
      {!matches ? <g opacity={aOut * easeOut(frame, S2.status, S2.status + 14)}>
        <Text x={E.x + 20} y={cmpY + 100} size={13} font="mono" weight={600} tone="danger">{fr ? "completed · aucune erreur, aucun log" : "completed · no error, no log"}</Text>
      </g> : null}

      {/* Act 2 onion */}
      <g opacity={bIn}>
        {[0, 1, 2, 3].map((index) => {
          const r = layer(index);
          const isWork = index === 3;
          const on = isWork ? easeOut(frame, workAt, workAt + 10) : lit(index);
          const focus = on * (1 - .65 * ease(frame, (isWork ? workAt : ringAt(index)) + 14, (isWork ? workAt : ringAt(index)) + 34));
          return <g key={index} {...enter(frame, T.fix + 16 + index * 6, { distance: 8 })}>
            <Box x={r.x} y={r.y} w={r.w} h={r.h} tone={isWork ? "ok" : "line"} variant={isWork ? "card" : "ghost"} focus={focus} radius={12 - index}>
              {isWork
                ? <>
                  <Text x={r.x + 14} y={r.y + r.h / 2} size={12} font="mono" weight={600} tone="muted">4 · work</Text>
                  <Text x={r.x + (compact ? 90 : 96)} y={r.y + r.h / 2} size={13} font="mono" weight={600} tone={frame >= workDone ? "ok" : "ink"}>exportApprovals(args)</Text>
                </>
                : <Text x={r.x + 14} y={r.y + 13} size={12} font="mono" weight={600} tone={on > .5 ? "line" : "muted"}>{`${index + 1} · ${WRAPPERS[index]}`}</Text>}
            </Box>
            {!isWork ? <Ring x={r.x + 14} y={r.y + 13} frame={frame} at={ringAt(index)} tone="line" r={5} /> : null}
          </g>;
        })}
        {frame >= workDone ? <>
          <Checkpoint x={layer(3).x + layer(3).w - 20} y={layer(3).y + layer(3).h / 2} r={10} state="pass" appear={Math.min(1, pop(frame, workDone))} />
          <Ring x={layer(3).x + layer(3).w - 20} y={layer(3).y + layer(3).h / 2} frame={frame} at={workDone} tone="ok" r={10} />
        </> : null}
      </g>
      <Comet points={onionPath} t={ease(frame, S3.atWorker, workAt)} tone="ok" r={5} tail={.18} />
    </g>

    {/* Jobs travelling: producer → queue → worker */}
    {jobs.map((job, index) => {
      const tone: Tone = index === 1 ? "danger" : index === 2 ? "ok" : "line";
      const t1 = ease(frame, job.s.start, job.s.inQueue);
      const t2 = ease(frame, job.s.pickup, job.s.atWorker);
      const path1 = leg1(index);
      return <g key={index}>
        {compact
          ? <Comet points={path1} t={t1} tone={tone} r={5} tail={.2} />
          : flyingChip(path1[0]!, path1[1]!, t1, job.name, tone, 170, Q.w - 24)}
        <Comet points={leg2(index)} t={t2} tone={tone} r={5} tail={.25} />
      </g>;
    })}
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 1,
  title: { en: "A string contract vs a jobify contract", fr: "Contrat par chaîne vs contrat jobify" },
  caption: {
    en: "In the baseline, producer and processor only share a job name string. jobify registers one named function on workers, exposes a typed runner, and wraps every run the same way.",
    fr: "Dans le modèle de base, producer et processor ne partagent qu’une chaîne de nom de job. jobify enregistre une fonction nommée côté worker, expose un runner typé et enveloppe chaque exécution de la même façon.",
  },
  beats: [
    { at: 0, text: { en: "Baseline NestJS: the producer adds \"activity-export\"; the processor matches job.name against the same string.", fr: "NestJS de base\u00a0: le producer ajoute \"activity-export\"\u00a0; le processor compare job.name à la même chaîne." } },
    { at: T.rename, text: { en: "Change the name on the producer side only: nothing ties the two ends together but a literal.", fr: "On change le nom côté producer seulement\u00a0: rien ne relie les deux bouts, sauf un littéral." } },
    { at: S2.verdict, text: { en: "The if does not match. The job completes without running, and removeOnComplete deletes the evidence.", fr: "Le if ne correspond pas. Le job se termine sans rien exécuter, et removeOnComplete efface la preuve." } },
    { at: T.fix, text: { en: "jobify: register exportApprovals once on workers, call the typed runner runExport everywhere.", fr: "jobify\u00a0: exportApprovals est enregistré une fois côté worker, le runner typé runExport est appelé partout." } },
    { at: ringAt(0), text: { en: "Every job runs through the same wrappers, in strict order: monitoring → onError → timeout → work.", fr: "Chaque job traverse les mêmes wrappers, dans un ordre strict\u00a0: monitoring → onError → timeout → work." } },
  ],
  Stage,
});
