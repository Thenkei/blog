import { useId } from "react";
import { interpolate } from "remotion";
import { Boundary, Box, Checkpoint, dim, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// The same 100 km race clock replayed twice under a changed tool. A playhead
// sweeps the race clock across a schematic profile and two watch lanes.
// Act 1: the smartwatch records for about four GPS hours, its battery gone,
// while the runner keeps going unrecorded. Act 2: the sport watch in Endurance
// mode records the whole 13–15 h target window. Only the article's numbers
// appear: ~4 h GPS, 13–15 h, 100 km. Battery levels carry no figures on purpose.

const T = {
  clockA: 30,
  clockAEnd: 200,
  swap: 232,
  clockB: 262,
  clockBEnd: 412,
  end: 480,
} as const;

const AXIS_HOURS = 16;
const SMART_LIMIT = 4;
const WINDOW = [13, 15] as const;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const hoursA = (frame: number) => interpolate(frame, [T.clockA, T.clockAEnd], [0, WINDOW[1]], clamp);
const hoursB = (frame: number) => interpolate(frame, [T.clockB, T.clockBEnd], [0, WINDOW[1]], clamp);
const frameA = (hours: number) => T.clockA + (hours / WINDOW[1]) * (T.clockAEnd - T.clockA);
const frameB = (hours: number) => T.clockB + (hours / WINDOW[1]) * (T.clockBEnd - T.clockB);

// Schematic relief over the race clock: context only, not a real profile.
const relief = (hours: number) => .44 + .24 * Math.sin(hours * .62 - .4) + .13 * Math.sin(hours * 1.55 + 1.2) + .04 * Math.sin(hours * 3.3);

type Layout = {
  x0: number; x1: number; axis: number; rise: number; lift: number;
  note: [number, number]; clock: [number, number];
  laneA: [number, number]; laneB: [number, number]; laneX: number; laneW: number;
  trackDy: number; nameDy: number; nameX: number; batteryX: number; batteryDy: number;
  band: [number, number]; stacked: boolean;
};

const WIDE_L: Layout = {
  x0: 212, x1: 908, axis: 216, rise: 104, lift: 14,
  note: [40, 150], clock: [920, 40],
  laneA: [244, 68], laneB: [326, 68], laneX: 40, laneW: 880,
  trackDy: 40, nameDy: 24, nameX: 58, batteryX: 172, batteryDy: 48,
  band: [78, 402], stacked: false,
};

const COMPACT_L: Layout = {
  x0: 40, x1: 500, axis: 214, rise: 100, lift: 12,
  note: [20, 78], clock: [520, 40],
  laneA: [252, 104], laneB: [372, 104], laneX: 20, laneW: 500,
  trackDy: 76, nameDy: 26, nameX: 38, batteryX: 460, batteryDy: 26,
  band: [70, 494], stacked: true,
};

function copy(fr: boolean) {
  return {
    smart: fr ? "Montre connectée" : "Smartwatch",
    smartSub: fr ? "~4 h de GPS" : "~4 h GPS",
    sport: fr ? "Montre sport" : "Sport watch",
    sportSub: fr ? "mode Endurance" : "Endurance mode",
    lowBattery: fr ? "batterie faible ✗" : "low battery ✗",
    lost: fr ? "trace non enregistrée" : "track not recorded",
    covered: fr ? "fenêtre couverte ✓" : "window covered ✓",
    window: fr ? "fenêtre cible" : "target window",
    clock: fr ? "horloge de course" : "race clock",
    trail: fr ? "trail 100 km" : "100 km trail",
    schematic: fr ? "relief schématique" : "schematic relief",
  };
}

function formatClock(hours: number) {
  const whole = Math.floor(hours);
  const minutes = Math.floor((hours - whole) * 60);
  return `T+ ${String(whole).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Battery glyph: level only, no figure (the article gives none). */
function Battery({ x, y, level, tone }: { x: number; y: number; level: number; tone: Tone }) {
  const w = 30;
  const h = 14;
  return <g>
    <rect x={x} y={y - h / 2} width={w} height={h} rx={3.5} fill="none" stroke="var(--scene-hairline)" strokeWidth={1.25} />
    <rect x={x + w + 1.5} y={y - 3} width={2.5} height={6} rx={1} style={{ fill: "var(--scene-hairline)" }} />
    {level > 0 ? <rect className={tone === "danger" ? "scene-glow" : undefined} x={x + 2.5} y={y - h / 2 + 2.5} width={Math.max(1.5, (w - 5) * level)} height={h - 5} rx={1.75} fill={TONE[tone]} style={{ color: TONE[tone] }} /> : null}
  </g>;
}

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const c = copy(fr);
  const uid = useId().replaceAll(":", "");
  const L = compact ? COMPACT_L : WIDE_L;
  const x = (hours: number) => L.x0 + (hours / AXIS_HOURS) * (L.x1 - L.x0);
  const y = (hours: number) => L.axis - L.lift - relief(hours) * L.rise;
  const path = (from: number, to: number) => {
    if (to <= from) return "";
    const steps = Math.max(2, Math.ceil((to - from) * 14));
    return Array.from({ length: steps + 1 }, (_, index) => {
      const hours = lerp(from, to, index / steps);
      return `${index === 0 ? "M" : "L"}${x(hours).toFixed(1)} ${y(hours).toFixed(1)}`;
    }).join("");
  };

  const actB = frame >= T.swap;
  const hA = hoursA(frame);
  const hB = hoursB(frame);
  const failed = hA >= SMART_LIMIT;
  const failAt = frameA(SMART_LIMIT);
  const fail = pop(frame, failAt);
  const swap = ease(frame, T.swap, T.swap + 22);
  const coveredAt = frameB(WINDOW[1]);
  const covered = pop(frame, coveredAt);

  // The playhead: sweeps act 1, rewinds during the swap, sweeps act 2.
  const rewind = ease(frame, T.swap + 4, T.clockB - 4);
  const playHours = frame < T.swap + 4 ? hA : frame < T.clockB ? lerp(WINDOW[1], 0, rewind) : hB;
  const clockHours = frame < T.swap + 4 ? hA : hB;
  const playX = x(playHours);
  const playTone: Tone = actB ? "ok" : failed ? "danger" : "line";

  const full = path(0, AXIS_HOURS);
  const area = `${full}L${x(AXIS_HOURS)} ${L.axis}L${x(0)} ${L.axis}Z`;
  const drawn = easeOut(frame, 0, 30);
  const actAFade = 1 - ease(frame, T.swap, T.swap + 16);

  // Batteries: the smartwatch empties by hour 4; the sport watch barely moves.
  const smartLevel = interpolate(hA, [0, SMART_LIMIT * .8, SMART_LIMIT], [1, .3, .06], clamp);
  const sportLevel = lerp(1, .72, hB / WINDOW[1]);

  const [bandTop, bandBottom] = L.band;
  const laneTrack = (lane: [number, number]) => lane[0] + L.trackDy;
  const trackA = laneTrack(L.laneA);
  const trackB = laneTrack(L.laneB);
  const barH = 8;
  const ticks: readonly number[] = [0, SMART_LIMIT, WINDOW[0], WINDOW[1]];
  const lane = (key: "A" | "B") => {
    const [top, h] = key === "A" ? L.laneA : L.laneB;
    const name = key === "A" ? c.smart : c.sport;
    const sub = key === "A" ? c.smartSub : c.sportSub;
    const focus = key === "A" ? (actB ? 0 : during01(frame, failAt - 6, failAt + 30)) : (actB ? .6 * ease(frame, T.clockB, T.clockB + 20) : 0);
    const recede = key === "A" ? dim(swap, .45) : dim(1 - swap, .55);
    const tone: Tone = key === "A" ? (failed ? "danger" : "line") : "ok";
    return <g opacity={recede}><g {...enter(frame, stagger(key === "A" ? 0 : 1, 10, 6), { distance: 10 })}>
      <Box x={L.laneX} y={top} w={L.laneW} h={h} tone={tone} focus={focus} radius={14} />
      <Text x={L.nameX} y={top + L.nameDy} size={16} weight={600}>{name}</Text>
      <Tag x={L.stacked ? L.nameX + name.length * 8.4 + 14 : L.nameX} y={L.stacked ? top + L.nameDy : top + 48} anchor="start" text={sub} tone={key === "A" ? "muted" : "ok"} size={11} />
      <Battery x={L.batteryX} y={top + L.batteryDy} level={key === "A" ? smartLevel : sportLevel} tone={key === "A" ? (smartLevel < .25 ? "danger" : "line") : "ok"} />
    </g></g>;
  };

  return <g>
    <defs>
      <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: TONE.line, stopOpacity: .13 }} />
        <stop offset="1" style={{ stopColor: TONE.line, stopOpacity: 0 }} />
      </linearGradient>
      <linearGradient id={`${uid}-rec`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: TONE[actB ? "ok" : "line"], stopOpacity: .3 }} />
        <stop offset="1" style={{ stopColor: TONE[actB ? "ok" : "line"], stopOpacity: .02 }} />
      </linearGradient>
      <clipPath id={`${uid}-clip`}>
        <rect x={x(0)} y={0} width={Math.max(0, x(actB ? hB : Math.min(hA, SMART_LIMIT)) - x(0))} height={L.axis} />
      </clipPath>
    </defs>

    {/* The target window: the boundary the tool must cover. */}
    <Boundary x={x(WINDOW[0]) - 10} y={bandTop} w={x(WINDOW[1]) - x(WINDOW[0]) + 20} h={bandBottom - bandTop} label={c.window} tone="hot" appear={easeOut(frame, 6, 26)} labelAt="top-end" />

    {/* Profile and its recorded share. */}
    <g opacity={easeOut(frame, 0, 20)}>
      <Text x={L.note[0]} y={L.note[1]} size={11} font="mono" weight={600} tone="muted" caps>{c.trail}</Text>
      <Text x={L.note[0]} y={L.note[1] + 18} size={13} font="mono" weight={500} tone="muted" opacity={.8}>{c.schematic}</Text>
    </g>
    {/* Topographic echoes of the relief: a mountain-theme flourish only. */}
    <g className="scene-only-mountain" opacity={drawn}>
      {[14, 28].map((offset, index) => <path key={offset} d={full} transform={`translate(0 ${-offset})`} fill="none" stroke="var(--scene-hairline)" strokeOpacity={.45 - index * .15} strokeWidth={1} />)}
    </g>
    <path d={area} fill={`url(#${uid}-fill)`} opacity={easeOut(frame, 8, 36)} />
    <path d={area} fill={`url(#${uid}-rec)`} clipPath={`url(#${uid}-clip)`} opacity={actB ? 1 : actAFade} />
    <path d={full} fill="none" stroke="var(--scene-hairline)" strokeWidth={1.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - drawn} />
    <g opacity={actAFade}>
      <path d={path(0, Math.min(hA, SMART_LIMIT))} fill="none" stroke={TONE.line} strokeWidth={2.25} strokeLinecap="round" />
      {failed ? <path d={path(SMART_LIMIT, hA)} fill="none" stroke={TONE.danger} strokeOpacity={.75} strokeWidth={1.5} strokeDasharray="3 5" strokeLinecap="round" /> : null}
    </g>
    {actB ? <path d={path(0, hB)} fill="none" stroke={TONE.ok} strokeWidth={2.25} strokeLinecap="round" /> : null}

    {/* Race clock axis. */}
    <line x1={x(0)} x2={x(AXIS_HOURS)} y1={L.axis} y2={L.axis} stroke="var(--scene-hairline)" strokeWidth={1} opacity={drawn} />
    {ticks.map((hours, index) => <g key={hours} {...enter(frame, stagger(index, 8, 4), { distance: 6 })}>
      <line x1={x(hours)} x2={x(hours)} y1={L.axis - 4} y2={L.axis + 4} stroke="var(--scene-hairline)" strokeWidth={1} />
      <Text
        x={x(hours) + (hours === WINDOW[0] ? -5 : hours === WINDOW[1] ? 5 : 0)} y={L.axis + 16} size={12} weight={600} font="mono"
        tone={hours === SMART_LIMIT && failed && !actB ? "danger" : "muted"}
        anchor={hours === WINDOW[0] ? "end" : hours === WINDOW[1] ? "start" : "middle"}
      >{`${hours} h`}</Text>
    </g>)}

    {lane("A")}
    {lane("B")}

    {/* Lane tracks share the race-clock x axis. */}
    {([["A", trackA], ["B", trackB]] as const).map(([key, trackY]) => <g key={key} opacity={key === "A" ? dim(swap, .45) : dim(1 - swap, .55)}>
      <rect x={x(0)} y={trackY - barH / 2} width={x(WINDOW[1]) - x(0)} height={barH} rx={barH / 2} style={{ fill: tint("ink", 8) }} opacity={easeOut(frame, 14, 30)} />
    </g>)}
    <g opacity={dim(swap, .45)}>
      <rect x={x(0)} y={trackA - barH / 2} width={Math.max(0, x(Math.min(hA, SMART_LIMIT)) - x(0))} height={barH} rx={barH / 2} fill={TONE.line} />
      {failed ? <g opacity={easeOut(frame, failAt + 4, failAt + 20)}>
        <Box x={x(SMART_LIMIT) + 16} y={trackA - 12} w={Math.max(24, x(hA) - x(SMART_LIMIT) - 16)} h={24} tone="danger" variant="ghost" radius={8} />
        <g opacity={easeOut(frame, frameA(compact ? 11 : 9.5), frameA(compact ? 12 : 10.5))}>
          <Text x={x(SMART_LIMIT) + 30} y={trackA + .5} size={12.5} weight={600} font="mono" tone="danger">{c.lost}</Text>
        </g>
      </g> : null}
      {frame >= failAt ? <g transform={`translate(${x(SMART_LIMIT)} ${trackA}) scale(${.5 + .5 * fail}) translate(${-x(SMART_LIMIT)} ${-trackA})`}>
        <Checkpoint x={x(SMART_LIMIT)} y={trackA} state="fail" r={compact ? 10 : 11} />
      </g> : null}
      {frame >= failAt && frame < failAt + 60 ? <Pulse x={x(SMART_LIMIT)} y={trackA} frame={frame} at={failAt} period={30} r={11} tone="danger" /> : null}
      <Tag x={x(SMART_LIMIT) + (compact ? 0 : 0)} y={trackA - (compact ? 26 : 22)} text={c.lowBattery} tone="danger" appear={fail} size={12} />
    </g>
    <g>
      {actB ? <rect x={x(0)} y={trackB - barH / 2} width={Math.max(0, x(hB) - x(0))} height={barH} rx={barH / 2} fill={TONE.ok} /> : null}
      {WINDOW.map((hours) => {
        const hit = pop(frame, frameB(hours), 200);
        const passed = actB && hB >= hours;
        return <g key={hours} opacity={easeOut(frame, T.swap, T.swap + 20)}>
          {passed
            ? <g transform={`translate(${x(hours)} ${trackB}) scale(${.5 + .5 * hit}) translate(${-x(hours)} ${-trackB})`}><Checkpoint x={x(hours)} y={trackB} state="pass" r={compact ? 10 : 11} /></g>
            : <Checkpoint x={x(hours)} y={trackB} state="pending" r={compact ? 9 : 10} />}
          {passed && frame < frameB(hours) + 40 ? <Pulse x={x(hours)} y={trackB} frame={frame} at={frameB(hours)} period={40} r={11} tone="ok" /> : null}
        </g>;
      })}
      <Tag x={x(WINDOW[1]) + 10} y={trackB - (compact ? 26 : 22)} text={c.covered} tone="ok" anchor="end" appear={covered} size={12} />
    </g>

    {/* Playhead: one cursor reading the same instant on terrain and both lanes. */}
    {frame >= T.clockA - 8 ? <g opacity={easeOut(frame, T.clockA - 8, T.clockA + 4) * (frame > T.clockBEnd + 12 ? 1 - .5 * ease(frame, T.clockBEnd + 12, T.clockBEnd + 36) : 1)}>
      <line x1={playX} x2={playX} y1={y(playHours) + 10} y2={trackB + 18} stroke={TONE[playTone]} strokeOpacity={.45} strokeWidth={1} />
      <circle cx={playX} cy={y(playHours)} r={compact ? 12 : 14} style={{ fill: tint(playTone, 16) }} />
      <circle className="scene-glow" cx={playX} cy={y(playHours)} r={compact ? 5.5 : 6.5} style={{ fill: "var(--scene-card)", color: TONE[playTone] }} stroke={TONE[playTone]} strokeWidth={2.25} />
      {/* Recording lamps where the playhead crosses each lane. */}
      {!actB ? <circle cx={playX} cy={trackA} r={4.5} style={{ fill: failed ? "var(--scene-card)" : TONE.line }} stroke={failed ? TONE.danger : TONE.line} strokeWidth={1.5} /> : null}
      {actB && frame >= T.clockB ? <>
        <circle className="scene-glow" cx={playX} cy={trackB} r={4.5} fill={TONE.ok} style={{ color: TONE.ok }} />
        {frame < T.clockBEnd ? <Pulse x={playX} y={trackB} frame={frame} at={T.clockB} period={22} r={6} tone="ok" /> : null}
      </> : null}
      {!actB && !failed ? <Pulse x={playX} y={trackA} frame={frame} at={T.clockA} period={22} r={6} tone="line" /> : null}
    </g> : null}

    {/* Race clock readout. */}
    <g {...enter(frame, 4, { from: "down", distance: 8 })}>
      <Text x={L.clock[0]} y={L.clock[1] - 12} size={11} weight={600} font="mono" tone="muted" anchor="end" caps>{c.clock}</Text>
      <Text x={L.clock[0]} y={L.clock[1] + 10} size={compact ? 20 : 22} weight={600} font="mono" tone={actB ? (frame >= T.clockB ? "ok" : "muted") : failed ? "danger" : "ink"} anchor="end">{formatClock(clockHours)}</Text>
    </g>
  </g>;
}

function during01(frame: number, start: number, end: number) {
  return Math.min(ease(frame, start, start + 8), 1 - ease(frame, end - 10, end));
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 1,
  title: { en: "Battery vs race window", fr: "Batterie contre fenêtre" },
  caption: {
    en: "The requirement is not another feature: it is enough battery to cover the complete race window.",
    fr: "Le besoin n’est pas une fonction supplémentaire : c’est une autonomie qui couvre l’intégralité de la fenêtre de course.",
  },
  beats: [
    { at: 0, text: { en: "The race clock of a 100 km trail. The target: a window of 13 to 15 hours on the move.", fr: "L’horloge d’un trail de 100 km. L’objectif : une fenêtre de 13 à 15 heures d’effort." } },
    { at: frameA(1.5), text: { en: "The smartwatch records the trace… until about 4 hours of GPS. Low battery.", fr: "La montre connectée enregistre la trace… jusqu’à environ 4 heures de GPS. Batterie faible." } },
    { at: frameA(7), text: { en: "The runner keeps going, the watch doesn’t: everything after hour 4 is lost, long before the window opens.", fr: "Le coureur continue, pas la montre : tout ce qui suit la 4e heure est perdu, bien avant la fenêtre cible." } },
    { at: T.swap, text: { en: "Same race, sport watch in Endurance mode, which optimises GNSS selection.", fr: "Même course, montre sport en mode Endurance, qui optimise la sélection GNSS." } },
    { at: frameB(WINDOW[0]), text: { en: "The trace runs through the whole 13–15 h window. The need was never a feature: it was autonomy.", fr: "La trace traverse toute la fenêtre de 13 à 15 h. Le besoin n’était pas une fonction : c’était l’autonomie." } },
  ],
  Stage,
});
