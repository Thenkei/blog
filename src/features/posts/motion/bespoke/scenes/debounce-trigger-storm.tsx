import { Axis, Box, Checkpoint, Dot, ease, easeOut, enter, lerp, pop, stagger, Tag, Text, TONE, tint, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// One trigger storm for the same makeJobId, replayed under both debounce modes on
// a shared clock. Delays are the article's: time-frame 60_000 ms (approvers
// notifier), reschedule 7_000 ms (cloud synchronize).
const TRIGGERS = [0, 3, 6, 10, 13, 17, 38, 41, 45] as const;
const WINDOW_S = 60;
const DELAY_S = 7;
const SIM_END = 66;

// Piecewise clock: the first trigger holds so both lanes can be read, the first
// burst plays slowly, the rest of the minute plays faster.
const F0 = 50; // first trigger lands
const HOLD = 44; // frames the clock stays at t = 0
const SLOW = { until: 20, fps: 8 };
const FAST_FPS = 4.5;
const frameAt = (seconds: number) => seconds <= 0
  ? F0
  : seconds <= SLOW.until
    ? F0 + HOLD + seconds * SLOW.fps
    : F0 + HOLD + SLOW.until * SLOW.fps + (seconds - SLOW.until) * FAST_FPS;
const simAt = (frame: number) => {
  const f = frame - F0 - HOLD;
  if (f <= 0) return 0;
  if (f <= SLOW.until * SLOW.fps) return f / SLOW.fps;
  return Math.min(SIM_END, SLOW.until + (f - SLOW.until * SLOW.fps) / FAST_FPS);
};

type RescheduleJob = { start: number; dues: { at: number; due: number }[] };
type Window = { start: number; end: number; absorbed: number[] };

// Pure replays of the two rules over the same input.
const RESCHEDULE: RescheduleJob[] = TRIGGERS.reduce<RescheduleJob[]>((jobs, t) => {
  const current = jobs.at(-1);
  const due = current?.dues.at(-1)?.due ?? -Infinity;
  if (current && due > t) return [...jobs.slice(0, -1), { ...current, dues: [...current.dues, { at: t, due: t + DELAY_S }] }];
  return [...jobs, { start: t, dues: [{ at: t, due: t + DELAY_S }] }];
}, []);

const WINDOWS: Window[] = TRIGGERS.reduce<Window[]>((windows, t) => {
  const current = windows.at(-1);
  if (current && t < current.end) return [...windows.slice(0, -1), { ...current, absorbed: [...current.absorbed, t] }];
  return [...windows, { start: t, end: t + WINDOW_S, absorbed: [] }];
}, []);

const firstRescheduleRun = RESCHEDULE[0]!.dues.at(-1)!.due;

const T = {
  secondTrigger: frameAt(TRIGGERS[1]),
  firstRun: frameAt(firstRescheduleRun),
  windowEnd: frameAt(WINDOW_S),
  end: frameAt(SIM_END) + 90,
} as const;

const SLIDE = 10; // frames for a changeDelay push
const DROP = 9; // frames for a trigger to reach both lanes

type Lane = { y: number; h: number; track: number };
type Layout = {
  x0: number;
  x1: number;
  card: { x: number; w: number };
  trig: number;
  lanes: readonly [Lane, Lane];
  axis: number;
  head: { x: number; name: number; sub: number; chip: number };
  divider: number | null;
};

const WIDE_LAYOUT: Layout = {
  x0: 276,
  x1: 900,
  card: { x: 40, w: 880 },
  trig: 86,
  lanes: [{ y: 116, h: 96, track: 164 }, { y: 226, h: 96, track: 274 }],
  axis: 350,
  head: { x: 62, name: 28, sub: 50, chip: 74 },
  divider: 250,
};

const COMPACT_LAYOUT: Layout = {
  x0: 46,
  x1: 494,
  card: { x: 20, w: 500 },
  trig: 88,
  lanes: [{ y: 108, h: 124, track: 194 }, { y: 244, h: 124, track: 330 }],
  axis: 398,
  head: { x: 40, name: 26, sub: 48, chip: 26 },
  divider: null,
};

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT_LAYOUT : WIDE_LAYOUT;
  const [tfLane, rsLane] = L.lanes;
  const sim = frame < F0 ? -1 : simAt(frame);
  const x = (seconds: number) => lerp(L.x0, L.x1, seconds / SIM_END);

  const seen = TRIGGERS.filter((t) => t <= sim);
  // Counters tick when the trigger visibly reaches the lanes, not when it lands.
  const arrived = (t: number) => frame >= frameAt(t) + DROP;
  const changeDelays = RESCHEDULE.reduce((count, job) => count + job.dues.filter((d, i) => i > 0 && arrived(d.at)).length, 0);
  const rsRuns = RESCHEDULE.filter((job) => job.dues.at(-1)!.due <= sim).length;
  const tfRuns = WINDOWS.filter((w) => w.end <= sim).length;
  const absorbed = WINDOWS.reduce((count, w) => count + w.absorbed.filter(arrived).length, 0);
  const clockOn = ease(frame, F0 - 12, F0) * (1 - ease(frame, frameAt(SIM_END) - 6, frameAt(SIM_END) + 14));
  const playheadX = x(Math.max(0, sim));
  const runsText = (runs: number) => fr ? `${runs} exécution${runs > 1 ? "s" : ""}` : `${runs} run${runs === 1 ? "" : "s"}`;

  // A lane card: header column (mode, delay, run count) + track.
  const laneCard = (lane: Lane, index: number, name: string, delay: string, runs: number, counter: string) => <g {...enter(frame, stagger(index, 10, 6))}>
    <Box x={L.card.x} y={lane.y} w={L.card.w} h={lane.h} tone={runs > 0 ? "ok" : "line"} radius={16}>
      <Text x={L.head.x} y={lane.y + L.head.name} size={15.5} font="mono" weight={600}>{name}</Text>
      <Text x={compact ? L.head.x + name.length * 9.6 + 12 : L.head.x} y={lane.y + (compact ? L.head.name : L.head.sub)} size={12.5} font="mono" weight={500} tone="muted">{delay}</Text>
      {compact
        ? <Tag x={L.card.x + L.card.w - 18} y={lane.y + L.head.chip} text={runsText(runs)} tone={runs > 0 ? "ok" : "muted"} anchor="end" size={11} />
        : <Tag x={L.head.x} y={lane.y + L.head.chip} text={runsText(runs)} tone={runs > 0 ? "ok" : "muted"} anchor="start" size={11} />}
      <Text x={L.card.x + L.card.w - 20} y={lane.y + (compact ? L.head.sub + 2 : 24)} size={11} font="mono" weight={600} tone="muted" caps anchor="end" opacity={ease(frame, F0, F0 + 12)}>{counter}</Text>
      {L.divider !== null ? <line x1={L.divider} x2={L.divider} y1={lane.y + 16} y2={lane.y + lane.h - 16} stroke="var(--scene-hairline)" strokeWidth={1} /> : null}
      <line x1={L.x0} x2={L.x1} y1={lane.track} y2={lane.track} stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="1 5" strokeLinecap="round" />
    </Box>
  </g>;

  const ring = (cx: number, cy: number, at: number, tone: Tone, r = 8) => {
    const t = easeOut(frame, at, at + 22);
    if (frame < at || t >= 1) return null;
    return <circle cx={cx} cy={cy} r={r * (1 + 1.6 * t)} fill="none" stroke={TONE[tone]} strokeWidth={1.25} opacity={(1 - t) * .8} />;
  };

  return <g>
    {/* Trigger row */}
    <g {...enter(frame, 0)}>
      <Text x={compact ? L.card.x + 4 : L.head.x} y={compact ? 62 : L.trig - 8} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "déclenchements" : "triggers"}</Text>
      <Text x={compact ? L.card.x + 4 + (fr ? 124 : 82) : L.head.x} y={compact ? 62 : L.trig + 10} size={12} font="mono" weight={500} tone="muted">{fr ? "même jobId …-env-42" : "same jobId …-env-42"}</Text>
      <line x1={L.x0} x2={L.x1} y1={L.trig} y2={L.trig} stroke="var(--scene-hairline)" strokeWidth={1} />
    </g>
    <Tag x={L.x1} y={compact ? 62 : L.trig - 22} anchor="end" tone={seen.length ? "line" : "muted"} size={11} text={`${seen.length} / ${TRIGGERS.length}`} appear={ease(frame, F0 - 10, F0)} />

    {laneCard(tfLane, 0, "time-frame", "delayInMs: 60_000", tfRuns, fr ? `regroupés ${absorbed}` : `collapsed ${absorbed}`)}
    {laneCard(rsLane, 1, "reschedule", "delayInMs: 7_000", rsRuns, `changeDelay ${changeDelays}`)}

    <g {...enter(frame, 22)}>
      <Axis x={L.x0} y={L.axis} w={x(60) - L.x0} ticks={compact ? [0, 20, 40, 60] : [0, 10, 20, 30, 40, 50, 60]} format={(tick) => `${tick} s`} />
    </g>

    {/* Lane 1: time-frame — one fixed window from the first trigger. */}
    {WINDOWS.map((w) => {
      if (sim < w.start) return null;
      const openAt = frameAt(w.start);
      const draw = easeOut(frame, openAt, openAt + 26);
      const done = sim >= w.end;
      const x0 = x(w.start);
      const full = x(w.end) - x0;
      const filled = Math.max(0, x(Math.min(sim, w.end)) - x0);
      const y = tfLane.track;
      return <g key={w.start}>
        <rect x={x0} y={y - 13} width={full * draw} height={26} rx={13} style={{ fill: tint("hot", 7) }} stroke={TONE.hot} strokeOpacity={.45} strokeWidth={1} />
        <rect x={x0} y={y - 13} width={Math.max(26, filled) * draw} height={26} rx={13} style={{ fill: tint(done ? "ok" : "hot", done ? 18 : 20) }} />
        <Text x={x0 + 4} y={y - 26} size={12} font="mono" weight={600} tone={done ? "ok" : "hot"} opacity={easeOut(frame, openAt + 8, openAt + 22)}>{fr ? "1 job delayed" : "1 delayed job"}</Text>
        {w.absorbed.map((t) => {
          if (sim < t) return null;
          const hit = pop(frame, frameAt(t) + DROP, 200);
          return <g key={t}>
            <circle cx={x(t)} cy={y} r={3.6 * Math.min(1.2, hit)} fill={TONE[done ? "ok" : "hot"]} />
            {ring(x(t), y, frameAt(t) + DROP, "hot", 5)}
          </g>;
        })}
        {done
          ? <>
            <Checkpoint x={x(w.end)} y={y} r={12} state="pass" appear={Math.min(1, pop(frame, T.windowEnd))} />
            {ring(x(w.end), y, T.windowEnd, "ok", 12)}
            <Text x={x(w.end)} y={y + 28} size={12} font="mono" weight={600} tone="ok" anchor="middle" opacity={easeOut(frame, T.windowEnd + 4, T.windowEnd + 16)}>{fr ? "exécution" : "run"}</Text>
          </>
          : <Checkpoint x={x(w.end)} y={y} r={12} state="pending" appear={draw} />}
      </g>;
    })}

    {/* Lane 2: reschedule — the delayed job is pushed 7 s past every trigger. */}
    {RESCHEDULE.map((job) => {
      if (sim < job.start) return null;
      const y = rsLane.track;
      const active = job.dues.filter((d) => d.at <= sim);
      const last = active.at(-1)!;
      const prev = active.at(-2);
      const pushAt = frameAt(last.at) + DROP;
      const slide = prev ? ease(frame, pushAt, pushAt + SLIDE) : 1;
      const dueNow = prev ? lerp(prev.due, last.due, slide) : last.due;
      const finalDue = job.dues.at(-1)!.due;
      const ran = sim >= finalDue;
      const created = pop(frame, frameAt(job.start) + DROP, 190);
      const pillW = 44;
      return <g key={job.start}>
        {/* ghosts of the previous due times, fading like a trail */}
        {active.slice(0, -1).map((d, i) => {
          const fade = 1 - ease(frame, frameAt(active[i + 1]!.at) + DROP, frameAt(active[i + 1]!.at) + DROP + 30);
          return fade > 0 ? <line key={d.at} x1={x(d.due)} x2={x(d.due)} y1={y - 9} y2={y + 9} stroke={TONE.line} strokeOpacity={.5 * fade} strokeWidth={1.25} /> : null;
        })}
        {ran
          ? <>
            <Checkpoint x={x(finalDue)} y={y} r={12} state="pass" appear={Math.min(1, pop(frame, frameAt(finalDue)))} />
            {ring(x(finalDue), y, frameAt(finalDue), "ok", 12)}
            <Text x={x(finalDue)} y={y + 28} size={12} font="mono" weight={600} tone="ok" anchor="middle" opacity={easeOut(frame, frameAt(finalDue) + 4, frameAt(finalDue) + 16)}>{fr ? "exécution" : "run"}</Text>
          </>
          : <g opacity={Math.min(1, created)}>
            {/* the quiet period still required: latest trigger → due */}
            <line x1={x(last.at)} x2={x(dueNow) - pillW / 2 - 3} y1={y} y2={y} stroke={TONE.line} strokeOpacity={.55} strokeWidth={1.25} strokeDasharray="3 4" />
            <line x1={x(last.at)} x2={x(last.at)} y1={y - 6} y2={y + 6} stroke={TONE.line} strokeOpacity={.55} strokeWidth={1.25} />
            <Text x={(x(last.at) + x(dueNow) - pillW / 2) / 2} y={y - 16} size={11} font="mono" weight={600} tone="muted" anchor="middle">7 s</Text>
            <Tag x={x(dueNow)} y={y} text="job" tone="line" size={12} appear={Math.min(1, created)} />
            {prev ? <Text x={x(dueNow)} y={y + 28} size={11.5} font="mono" weight={600} tone="line" anchor="middle" opacity={Math.min(ease(frame, pushAt, pushAt + 6), 1 - ease(frame, pushAt + 18, pushAt + 30))}>changeDelay</Text> : null}
          </g>}
      </g>;
    })}

    {/* Triggers: each one lands, then hits both rules at the same instant. */}
    {TRIGGERS.map((t) => {
      const at = frameAt(t);
      if (frame < at - 8) return null;
      const fall = easeOut(frame, at - 8, at);
      const drop = ease(frame, at, at + DROP);
      const flash = 1 - ease(frame, at + DROP - 2, at + DROP + 16);
      return <g key={t}>
        {drop > 0 && flash > 0 ? <line x1={x(t)} x2={x(t)} y1={L.trig + 6} y2={lerp(L.trig + 6, rsLane.track - 14, drop)} stroke={TONE.line} strokeOpacity={.35 * flash} strokeWidth={1.25} /> : null}
        {drop > 0 && drop < 1 ? <Dot x={x(t)} y={lerp(L.trig + 6, rsLane.track - 14, drop)} r={3.5} tone="line" halo={false} /> : null}
        <g opacity={fall}>
          <circle cx={x(t)} cy={L.trig - 14 * (1 - fall)} r={5} fill={TONE.line} />
        </g>
        {ring(x(t), L.trig, at, "line", 5)}
      </g>;
    })}

    {/* Playhead: the shared clock both rules replay against. */}
    {clockOn > 0 ? <g opacity={clockOn}>
      <line x1={playheadX} x2={playheadX} y1={L.trig + 10} y2={L.axis - 4} stroke="var(--scene-ink)" strokeOpacity={.28} strokeWidth={1} />
      <Tag x={Math.max(L.x0 + 22, Math.min(playheadX, L.x1 - 30))} y={L.axis + (compact ? 34 : 38)} text={`t = ${Math.floor(Math.max(0, sim))} s`} tone="ink" size={12} />
    </g> : null}

    {/* Final reading: the same input, two schedules. */}
    {compact
      ? <g>
        {[
          { mode: "time-frame", text: fr ? "une fois par fenêtre" : "once per window", at: T.windowEnd + 10 },
          { mode: "reschedule", text: fr ? "une fois par période calme" : "once per quiet period", at: T.windowEnd + 18 },
        ].map((item, index) => <g key={item.mode} {...enter(frame, item.at)}>
          <Box x={20 + index * 256} y={450} w={244} h={56} tone="ok" radius={14}>
            <Text x={36 + index * 256} y={469} size={11} font="mono" weight={600} tone="muted" caps>{item.mode}</Text>
            <Text x={36 + index * 256} y={489} size={15} weight={600}>{item.text}</Text>
          </Box>
        </g>)}
      </g>
      : <>
        <Tag x={x(33)} y={tfLane.y + 22} tone="ok" size={12} text={fr ? "une fois par fenêtre" : "once per window"} appear={pop(frame, T.windowEnd + 10)} />
        <Tag x={x(31)} y={rsLane.y + 22} tone="ok" size={12} text={fr ? "une fois par période calme" : "once per quiet period"} appear={pop(frame, T.windowEnd + 18)} />
      </>}
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 1,
  title: { en: "One storm, two debounce semantics", fr: "Une rafale, deux sémantiques de debounce" },
  caption: {
    en: "Time-frame collapses every trigger inside a fixed window into one run. Reschedule pushes the delayed job forward with changeDelay and runs only once triggers stop arriving.",
    fr: "Le time-frame regroupe tous les déclenchements d’une fenêtre fixe en une exécution. Le reschedule repousse le job delayed via changeDelay et n’exécute qu’une fois les déclenchements arrêtés.",
  },
  beats: [
    { at: 0, text: { en: "The same trigger storm, with the same makeJobId, replayed under both debounce modes.", fr: "La même rafale de déclenchements, avec le même makeJobId, rejouée dans les deux modes de debounce." } },
    { at: F0, text: { en: "time-frame: the first trigger opens a 60 s window; later triggers with the same key collapse into it.", fr: "time-frame\u00a0: le premier déclenchement ouvre une fenêtre de 60\u00a0s\u00a0; les suivants, même clé, s’y regroupent." } },
    { at: T.secondTrigger, text: { en: "reschedule: the job is already delayed, so changeDelay pushes it 7 s after the latest trigger.", fr: "reschedule\u00a0: le job est déjà delayed, changeDelay le repousse 7\u00a0s après le dernier déclenchement." } },
    { at: T.firstRun, text: { en: "7 s of quiet: reschedule runs. The next burst creates a new delayed job.", fr: "7\u00a0s de calme\u00a0: le reschedule s’exécute. La rafale suivante crée un nouveau job delayed." } },
    { at: T.windowEnd, text: { en: "The window closes: time-frame runs once for all nine triggers. reschedule ran after each quiet period.", fr: "Fin de fenêtre\u00a0: le time-frame s’exécute une fois pour les neuf. Le reschedule, après chaque accalmie." } },
  ],
  Stage,
});
