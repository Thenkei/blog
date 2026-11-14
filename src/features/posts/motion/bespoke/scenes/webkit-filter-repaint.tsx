import { Axis, Box, during, ease, easeOut, enter, lerp, NBSP, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// One second of the Rocket hero scroll at the measured cadence, drawn once per
// engine on the same axis: 60 frames in Chromium (16.7 ms each), 11 in WebKit
// (close to 90 ms each). One cell is one displayed frame; its width is the
// interval. The replay swaps the SVG blur for three translucent strokes.
const SMOOTH_FRAMES = 60;
const SLOW_FRAMES = 11;
/** Scene frames spent on one measured second: the sweep is a slow motion. */
const SWEEP = 110;

const T = {
  sweepA: 46,
  doneA: 156,
  cause: 210,
  fix: 290,
  reset: 312,
  sweepB: 330,
  doneB: 440,
  end: 520,
} as const;

// The three strokes of the article's CSS: spread (× line width) and strength.
const GLOW_STROKES = [
  { spread: 2.4, strength: .2 },
  { spread: 4.2, strength: .1 },
  { spread: 6.5, strength: .06 },
] as const;
/** Stacked strokes standing in for the Gaussian blur: no SVG filter is used here either. */
const BLUR_LAYERS = 9;

type Pt = readonly [number, number];
type Rect = { x: number; y: number; w: number; h: number };
type Anchored = { x: number; y: number; anchor: "start" | "middle" | "end" };

type Layout = {
  glow: Rect;
  eyebrow: Pt;
  sample: { from: Pt; to: Pt; width: number };
  rule: Anchored;
  note: Anchored;
  lane: (index: number) => Rect;
  inset: number;
  footnote: Pt;
};

const WIDE_LAYOUT: Layout = {
  glow: { x: 40, y: 64, w: 250, h: 316 },
  eyebrow: [62, 90],
  sample: { from: [72, 252], to: [258, 152], width: 6 },
  rule: { x: 165, y: 312, anchor: "middle" },
  note: { x: 165, y: 344, anchor: "middle" },
  lane: (index) => ({ x: 314, y: 64 + index * 166, w: 606, h: 150 }),
  inset: 22,
  footnote: [617, 400],
};

const COMPACT_LAYOUT: Layout = {
  glow: { x: 20, y: 54, w: 500, h: 96 },
  eyebrow: [38, 76],
  sample: { from: [44, 130], to: [232, 103], width: 4 },
  rule: { x: 502, y: 92, anchor: "end" },
  note: { x: 502, y: 126, anchor: "end" },
  lane: (index) => ({ x: 20, y: 162 + index * 162, w: 500, h: 150 }),
  inset: 18,
  footnote: [270, 497],
};

/** Flat start, rising end; x is linear in t so the tip stays above the time axis. */
const flightPath = (from: Pt, to: Pt, t = 1) => {
  const endX = lerp(from[0], to[0], t);
  const endY = lerp(from[1], to[1], t * t);
  return `M${from[0]} ${from[1]}Q${lerp(from[0], endX, .5)} ${from[1]} ${endX} ${endY}`;
};

/** The flight line up close: its glow drawn by the blur, then by three strokes. */
function GlowSample({ frame, from, to, width }: { frame: number; from: Pt; to: Pt; width: number }) {
  const d = flightPath(from, to);
  const blur = 1 - ease(frame, T.fix + 4, T.fix + 24);
  return <g fill="none" strokeLinecap="round">
    {blur > 0 ? Array.from({ length: BLUR_LAYERS }, (_, layer) => <path
      key={layer} d={d}
      strokeWidth={width * lerp(1.5, 7.5, layer / (BLUR_LAYERS - 1))}
      stroke={TONE.line} strokeOpacity={.055 * blur}
    />) : null}
    {GLOW_STROKES.map((glow, index) => {
      const drawn = easeOut(frame, stagger(index, T.fix + 18, 7), stagger(index, T.fix + 18, 7) + 20);
      return drawn > 0 ? <path
        key={glow.spread} d={d}
        strokeWidth={width * lerp(1, glow.spread, drawn)}
        stroke={TONE.line} strokeOpacity={glow.strength * 1.7 * drawn}
      /> : null;
    })}
    <path d={d} strokeWidth={width} stroke={TONE.line} />
  </g>;
}

type LaneProps = {
  frame: number;
  rect: Rect;
  inset: number;
  name: string;
  tone: Tone;
  focus: number;
  /** Frames displayed during the measured second. */
  cells: number;
  /** Scene frame at which the measured second starts. */
  start: number;
  /** 0→1 visibility of the run: the replay clears the lane before it starts again. */
  show: number;
  interval: string;
  /** Axis tick formatter (decimal separator depends on the locale). */
  seconds: (tick: string | number) => string;
  count: (frames: number) => string;
  verdict: string;
  /** Written in each cell once the cause is named (0→1 per cell). */
  cellLabel?: { text: string; appear: (index: number) => number } | undefined;
};

function Lane({ frame, rect, inset, name, tone, focus, cells, start, show, interval, seconds, count, verdict, cellLabel }: LaneProps) {
  const x0 = rect.x + inset;
  const w = rect.w - 2 * inset;
  const base: Pt = [x0, rect.y + 86];
  const top: Pt = [x0 + w, rect.y + 54];
  const strip = { y: rect.y + 96, h: 20 };
  const done = start + SWEEP;

  // Time is linear: the cursor is where the scroll is, the tip is the last displayed frame.
  const progress = Math.max(0, Math.min(1, (frame - start) / SWEEP));
  const displayed = Math.floor(progress * cells + 1e-6);
  const shown = displayed / cells;
  const tipX = lerp(base[0], top[0], shown);
  const tipY = lerp(base[1], top[1], shown * shown);
  const heading = Math.atan2(2 * (top[1] - base[1]) * shown, w) * 180 / Math.PI;
  const sweeping = during(frame, start - 6, done + 10, 8);
  const verdictIn = pop(frame, done);
  const gap = cells > 20 ? 1.5 : 2;

  return <>
    <Box x={rect.x} y={rect.y} w={rect.w} h={rect.h} tone={tone} radius={16} focus={focus} />
    <Text x={x0} y={rect.y + 27} size={16} weight={600}>{name}</Text>
    <Text x={x0 + 96} y={rect.y + 27.5} size={13} weight={500} font="mono" tone="muted" opacity={show * easeOut(frame, start + 8, start + 26)}>
      {interval}
    </Text>
    <Text
      x={x0 + w} y={rect.y + 27.5} size={14} weight={600} font="mono" tone="muted" anchor="end"
      opacity={show * easeOut(frame, start - 6, start + 8) * (1 - ease(frame, done, done + 4))}
    >
      {count(displayed)}
    </Text>
    <Tag x={x0 + w} y={rect.y + 27} anchor="end" text={verdict} tone={tone} size={13} appear={verdictIn * show} />

    <path d={flightPath(base, top)} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="2 5" />
    <rect x={x0} y={strip.y} width={w} height={strip.h} rx={4} style={{ fill: tint("ink", 5) }} />
    <Axis x={x0} y={rect.y + 124} w={w} ticks={[0, .5, 1]} format={seconds} />

    <g opacity={show}>
      {sweeping > 0 ? <line
        x1={x0 + progress * w} x2={x0 + progress * w} y1={top[1] - 6} y2={strip.y + strip.h + 2}
        stroke="var(--scene-ink)" strokeOpacity={.3 * sweeping} strokeWidth={1} strokeDasharray="3 4"
      /> : null}
      {shown > 0 ? <>
        <path d={flightPath(base, top, shown)} fill="none" strokeWidth={8} strokeLinecap="round" stroke={TONE.line} strokeOpacity={.16} />
        <path d={flightPath(base, top, shown)} fill="none" strokeWidth={1.75} strokeLinecap="round" stroke="var(--scene-ink)" />
      </> : null}
      <path d="M8 0L-5 -4.5L-2.5 0L-5 4.5Z" fill="var(--scene-ink)" transform={`translate(${tipX} ${tipY}) rotate(${heading})`} />

      {Array.from({ length: cells }, (_, index) => {
        const from = index / cells;
        const to = (index + 1) / cells;
        if (progress <= from) return null;
        const cellW = (Math.min(progress, to) - from) * w - gap;
        if (cellW <= 0) return null;
        const complete = index < displayed;
        const labelled = cellLabel ? cellLabel.appear(index) : 0;
        return <g key={index}>
          <rect
            x={x0 + from * w + gap / 2} y={strip.y} width={cellW} height={strip.h} rx={2.5}
            style={{ fill: tint(tone, lerp(56, 24, labelled)) }} opacity={complete ? 1 : .5}
          />
          {cellLabel && labelled > 0 ? <Text
            x={x0 + (from + to) / 2 * w} y={strip.y + strip.h / 2 + .5} size={13} weight={600} font="mono" tone={tone} anchor="middle" opacity={labelled}
          >
            {cellLabel.text}
          </Text> : null}
        </g>;
      })}
    </g>
  </>;
}

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT_LAYOUT : WIDE_LAYOUT;

  const t = {
    glow: fr ? "Halo de la ligne de vol" : "Flight line glow",
    strokes: fr ? "3 traits translucides" : "3 translucent strokes",
    filter: fr ? "filtre SVG" : "SVG filter",
    recomputed: fr ? "recalculé à chaque image" : "recomputed on every frame",
    noFilter: fr ? "plus de filtre SVG" : "no SVG filter any more",
    fast: fr ? `intervalle${NBSP}: 16,7${NBSP}ms` : `interval: 16.7${NBSP}ms`,
    slow: fr ? `intervalle${NBSP}: ≈${NBSP}90${NBSP}ms` : `interval: ≈${NBSP}90${NBSP}ms`,
    seconds: (tick: string | number) => `${fr ? String(tick).replace(".", ",") : tick}${NBSP}s`,
    count: (frames: number) => (fr ? `${frames} image${frames > 1 ? "s" : ""}` : `${frames} frame${frames === 1 ? "" : "s"}`),
    rate: (frames: number) => (fr ? `${frames} images/s` : `${frames} frames/s`),
    blur: fr ? "flou" : "blur",
    footnote: fr ? "Une seconde de défilement · une case par image affichée" : "One second of scrolling · one cell per displayed frame",
  };

  const caused = frame >= T.cause;
  const fixed = frame >= T.fix;
  const replay = frame >= T.reset;
  // The card turns `ok` when the three strokes are drawn, not while the blur is still fading.
  const glowTone: Tone = frame >= T.fix + 18 ? "ok" : caused && !fixed ? "danger" : "line";
  const glowFocus = fixed ? during(frame, T.fix + 18, T.fix + 78, 12) : during(frame, T.cause, T.fix, 12);

  const chromium = L.lane(0);
  const webkit = L.lane(1);
  // The Chromium run stays on stage as the reference while WebKit is replayed.
  const reference = lerp(1, .5, during(frame, T.fix + 6, T.doneB + 10, 16));

  return <>
    <g {...enter(frame, 0)}>
      <Box x={L.glow.x} y={L.glow.y} w={L.glow.w} h={L.glow.h} tone={glowTone} radius={16} focus={glowFocus} />
      <Text x={L.eyebrow[0]} y={L.eyebrow[1]} size={11} weight={600} font="mono" tone="muted" caps>{t.glow}</Text>
      <GlowSample frame={frame} from={L.sample.from} to={L.sample.to} width={L.sample.width} />
      <Pulse x={(L.sample.from[0] + L.sample.to[0]) / 2} y={lerp(L.sample.from[1], L.sample.to[1], .25)} frame={frame} at={T.cause} period={34} r={12} tone="danger" once />
      <Tag
        x={L.rule.x} y={L.rule.y} anchor={L.rule.anchor} text="feGaussianBlur" tone={caused ? "danger" : "muted"}
        appear={easeOut(frame, 12, 30) * (1 - ease(frame, T.fix, T.fix + 14))}
      />
      <Tag x={L.rule.x} y={L.rule.y} anchor={L.rule.anchor} text={t.strokes} tone="ok" appear={pop(frame, T.fix + 26)} />
      <Text
        x={L.note.x} y={L.note.y} size={13} weight={500} font="mono" tone="muted" anchor={L.note.anchor}
        opacity={easeOut(frame, 18, 36) * (1 - ease(frame, T.cause - 4, T.cause + 6))}
      >
        {t.filter}
      </Text>
      <Text
        x={L.note.x} y={L.note.y} size={13} weight={600} font="mono" tone="danger" anchor={L.note.anchor}
        opacity={ease(frame, T.cause + 4, T.cause + 16) * (1 - ease(frame, T.fix, T.fix + 12))}
      >
        {t.recomputed}
      </Text>
      <Text x={L.note.x} y={L.note.y} size={13} weight={600} font="mono" tone="ok" anchor={L.note.anchor} opacity={ease(frame, T.fix + 32, T.fix + 46)}>
        {t.noFilter}
      </Text>
    </g>

    <g {...enter(frame, 6, { opacity: reference })}>
      <Lane
        frame={frame} rect={chromium} inset={L.inset} name="Chromium" tone="line" focus={0}
        cells={SMOOTH_FRAMES} start={T.sweepA} show={1}
        interval={t.fast} seconds={t.seconds} count={t.count} verdict={t.rate(SMOOTH_FRAMES)}
      />
    </g>

    <g {...enter(frame, 12)}>
      {replay
        ? <Lane
          frame={frame} rect={webkit} inset={L.inset} name="WebKit" tone={frame >= T.doneB ? "ok" : "line"}
          focus={during(frame, T.doneB, T.doneB + 60, 12)}
          cells={SMOOTH_FRAMES} start={T.sweepB} show={easeOut(frame, T.reset, T.reset + 14)}
          interval={t.fast} seconds={t.seconds} count={t.count} verdict={t.rate(SMOOTH_FRAMES)}
        />
        : <Lane
          frame={frame} rect={webkit} inset={L.inset} name="WebKit" tone={frame >= T.doneA ? "danger" : "line"}
          focus={during(frame, T.doneA, T.fix, 12)}
          cells={SLOW_FRAMES} start={T.sweepA} show={1 - ease(frame, T.fix + 4, T.reset)}
          interval={t.slow} seconds={t.seconds} count={t.count} verdict={t.rate(SLOW_FRAMES)}
          cellLabel={{ text: t.blur, appear: (index) => easeOut(frame, stagger(index, T.cause + 6, 3), stagger(index, T.cause + 6, 3) + 14) }}
        />}
    </g>

    <Text x={L.footnote[0]} y={L.footnote[1]} size={13} weight={500} anchor="middle" tone="muted" opacity={easeOut(frame, 20, 38)}>
      {t.footnote}
    </Text>
  </>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.fix - 12,
  title: { fr: "Le même défilement dans deux moteurs", en: "The same scroll in two engines" },
  caption: {
    fr: "Le même défilement du hero Rocket reste à environ 60 images par seconde dans Chromium et tourne à environ 11 dans WebKit, où le flou SVG de la ligne de vol est recalculé à chaque image. Une fois le filtre remplacé par trois traits translucides, WebKit affiche 60 images par seconde.",
    en: "The same scroll of the Rocket hero stays at about 60 frames per second in Chromium and runs at about 11 in WebKit, where the SVG blur on the flight line is recomputed on every frame. Once the filter is replaced by three translucent strokes, WebKit displays 60 frames per second.",
  },
  beats: [
    { at: 0, text: { fr: `Le même défilement du hero Rocket est mesuré dans deux moteurs${NBSP}: Chromium et WebKit.`, en: "The same scroll of the Rocket hero is measured in two engines: Chromium and WebKit." } },
    {
      at: T.sweepA,
      text: {
        fr: `Dans Chromium, l'intervalle entre deux images reste proche de 16,7${NBSP}ms. Dans WebKit, il est proche de 90${NBSP}ms.`,
        en: `In Chromium, the interval between two frames stays close to 16.7${NBSP}ms. In WebKit, it is close to 90${NBSP}ms.`,
      },
    },
    { at: T.doneA + 4, text: { fr: "Sur une seconde, Chromium affiche environ 60 images et WebKit environ 11.", en: "Over one second, Chromium displays about 60 frames and WebKit about 11." } },
    { at: T.cause, text: { fr: "Dans WebKit, le flou SVG de la ligne de vol est recalculé à chaque image.", en: "In WebKit, the SVG blur on the flight line is recomputed on every frame." } },
    { at: T.fix, text: { fr: "Le filtre est remplacé par trois traits translucides sous la ligne. Le défilement est rejoué.", en: "The filter is replaced by three translucent strokes under the line. The scroll is replayed." } },
    { at: T.doneB + 4, text: { fr: "Sans le filtre SVG, WebKit affiche 60 images par seconde.", en: "Without the SVG filter, WebKit displays 60 frames per second." } },
  ],
  Stage,
});
