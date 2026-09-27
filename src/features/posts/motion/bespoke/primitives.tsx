import { useId, type CSSProperties, type ReactNode } from "react";
import { Easing, interpolate, spring } from "remotion";

export const SCENE_FPS = 30;
/** No-break space for French typography (formatters mangle `\u00a0` escapes). */
export const NBSP = "\u00a0";
export const WIDE = { width: 960, height: 540, stageHeight: 420 } as const;
export const COMPACT = { width: 540, height: 720, stageHeight: 520 } as const;

export type Tone = "line" | "ok" | "hot" | "danger" | "muted" | "ink";
type Point = readonly [number, number];

// Semantic colours only: see ART_DIRECTION.md, "Nœuds". Never hard-code a palette.
// `ink`/`muted` resolve to scene tokens so text stays legible on every backdrop.
export const TONE: Record<Tone, string> = {
  line: "var(--accent-primary)",
  ok: "var(--visual-ok)",
  hot: "var(--visual-hot)",
  danger: "var(--visual-danger)",
  muted: "var(--scene-ink-soft)",
  ink: "var(--scene-ink)",
};

/** Tone mixed into transparency: washes, halos and chip backgrounds. */
export function tint(tone: Tone, percent: number) {
  return `color-mix(in srgb, ${TONE[tone]} ${percent}%, transparent)`;
}

const FONT = {
  display: "var(--font-display)",
  mono: "var(--font-mono)",
  main: "var(--font-main)",
} as const;

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.bezier(.16, 1, .3, 1);
const IN_OUT = Easing.bezier(.65, 0, .35, 1);

// ─── Timing ──────────────────────────────────────────────────────────────────

/** 0→1 between two frames, in-out: for moves between two states. */
export function ease(frame: number, start: number, end: number, easing: (t: number) => number = IN_OUT) {
  // "Never" sentinels (Infinity) and zero-length ranges become a step instead of throwing.
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return frame >= start ? 1 : 0;
  return interpolate(frame, [start, end], [0, 1], { ...CLAMP, easing });
}

/** 0→1 with a long deceleration (expo-out): for entrances and reveals. */
export function easeOut(frame: number, start: number, end: number) {
  return ease(frame, start, end, OUT);
}

/** Damped spring starting at `start`; settles near 1 within ~20 frames. */
export function pop(frame: number, start: number, stiffness = 150) {
  return spring({ frame: frame - start, fps: SCENE_FPS, config: { damping: 17, stiffness } });
}

/** 1 while inside [start, end], with short fades on both edges. */
export function during(frame: number, start: number, end: number, fade = 10) {
  return Math.min(ease(frame, start, start + fade), 1 - ease(frame, end - fade, end));
}

/** Start frame of the i-th element of a cascade. */
export const stagger = (index: number, start: number, step = 5) => start + index * step;

export const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/** Deterministic 0→1 noise for a seed: stars, jitter, scatter. Never Math.random. */
export function hash(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/** Point at progress t (0→1) along a polyline, by segment length. */
export function along(points: readonly Point[], t: number): [number, number] {
  const segments = points.slice(1).map((point, index) => {
    const from = points[index]!;
    return { from, to: point, length: Math.hypot(point[0] - from[0], point[1] - from[1]) };
  });
  const total = segments.reduce((sum, segment) => sum + segment.length, 0);
  let remaining = Math.max(0, Math.min(1, t)) * total;
  for (const segment of segments) {
    if (remaining <= segment.length || segment === segments.at(-1)) {
      const local = segment.length === 0 ? 1 : Math.min(1, remaining / segment.length);
      return [lerp(segment.from[0], segment.to[0], local), lerp(segment.from[1], segment.to[1], local)];
    }
    remaining -= segment.length;
  }
  const last = points.at(-1)!;
  return [last[0], last[1]];
}

/** Quadratic Bézier point: p0 → p2 bending toward the control point p1. */
export function curve(p0: Point, p1: Point, p2: Point, t: number): [number, number] {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
}

/** Estimated rendered width: mono glyphs are exactly 0.6 em; display/main average ~0.56 em. */
export function textWidth(text: string, size: number, font: "mono" | "display" | "main" = "mono") {
  return text.length * size * (font === "mono" ? .6 : .56);
}

/** Width of a `Tag` chip for layout (rows of chips, text placed after a chip). */
export const tagWidth = (text: string, size = 13) => textWidth(text, size) + size * 1.5;

// ─── Choreography ────────────────────────────────────────────────────────────

type EnterFrom = "up" | "down" | "left" | "right" | "none";

/** Props for a `<g>` entering at `at`: fade + short travel with expo-out. */
/** Returns the group's own `opacity`: pass any extra fade as `opacity` here, not on the same `<g>`. */
export function enter(frame: number, at: number, { dur = 18, from = "up", distance = 14, opacity = 1 }: { dur?: number; from?: EnterFrom; distance?: number; opacity?: number } = {}) {
  const t = easeOut(frame, at, at + dur);
  const offset = (1 - t) * distance;
  const [dx, dy] = from === "up" ? [0, offset] : from === "down" ? [0, -offset] : from === "left" ? [offset, 0] : from === "right" ? [-offset, 0] : [0, 0];
  return { opacity: t * opacity, transform: `translate(${dx} ${dy})` };
}

export function Enter({ frame, at, dur, from, distance, children }: {
  frame: number;
  at: number;
  dur?: number | undefined;
  from?: EnterFrom | undefined;
  distance?: number | undefined;
  children: ReactNode;
}) {
  const props = enter(frame, at, { ...(dur !== undefined ? { dur } : {}), ...(from ? { from } : {}), ...(distance !== undefined ? { distance } : {}) });
  if (props.opacity <= 0) return null;
  return <g {...props}>{children}</g>;
}

export type CameraKey = {
  at: number;
  /** Frames to travel from the previous key (default 36). */
  dur?: number;
  zoom?: number;
  /** Stage point brought to the centre of the frame. */
  focus?: Point;
};

/**
 * Slow push-ins and drifts. Keys are folded in order: the camera holds each shot
 * until the next key's `at`, then travels over `dur` frames. Framing is clamped so
 * content within the margins is never cropped nor pushed under the kicker, which
 * caps the effective zoom near 1.03: emphasise with `focus`/`dim`, not cropping.
 */
export function Camera({ frame, keys, width, height, children }: {
  frame: number;
  keys: readonly CameraKey[];
  width: number;
  height: number;
  children: ReactNode;
}) {
  const centre: Point = [width / 2, height / 2];
  const shot = keys.reduce((state, key, index) => {
    const t = index === 0 ? 1 : ease(frame, key.at, key.at + (key.dur ?? 36));
    const focus = key.focus ?? centre;
    return { zoom: lerp(state.zoom, key.zoom ?? 1, t), x: lerp(state.x, focus[0], t), y: lerp(state.y, focus[1], t) };
  }, { zoom: 1, x: centre[0], y: centre[1] });
  // Safe framing: content inside the side margins (40 px wide, 20 px compact) and
  // below the kicker band stays fully visible and never slides under the kicker.
  // That caps the zoom at ~3 %: the camera breathes, it never crops.
  const margin = width < 700 ? 20 : 40;
  const kicker = 48;
  const bottom = 12;
  const zoom = Math.max(1, Math.min(shot.zoom, width / (width - 2 * margin), (height - kicker) / (height - bottom - kicker)));
  const hw = width / (2 * zoom);
  const hh = height / (2 * zoom);
  const fit = (value: number, low: number, high: number) => low > high ? (low + high) / 2 : Math.max(low, Math.min(high, value));
  const x = fit(shot.x, width - margin - hw, margin + hw);
  const y = fit(shot.y, height - bottom - hh, hh + kicker * (1 - 1 / zoom));
  return <g transform={`translate(${centre[0]} ${centre[1]}) scale(${zoom}) translate(${-x} ${-y})`}>{children}</g>;
}

/** Opacity for an element that recedes while something else holds the stage. */
export const dim = (focus: number, floor = .32) => lerp(1, floor, Math.max(0, Math.min(1, focus)));

// ─── Type ────────────────────────────────────────────────────────────────────

type TextProps = {
  x: number;
  y: number;
  children: ReactNode;
  size?: number | undefined;
  weight?: number | undefined;
  font?: keyof typeof FONT | undefined;
  tone?: Tone | undefined;
  anchor?: "start" | "middle" | "end" | undefined;
  opacity?: number | undefined;
  spacing?: number | undefined;
  /** Uppercase eyebrow style (mono labels). */
  caps?: boolean | undefined;
};

export function Text({ x, y, children, size = 18, weight = 600, font = "display", tone = "ink", anchor = "start", opacity = 1, spacing, caps = false }: TextProps) {
  // `pre` keeps code indentation: SVG collapses leading spaces otherwise.
  const style: CSSProperties = {
    fontFamily: FONT[font],
    fontSize: size,
    fontWeight: weight,
    letterSpacing: spacing ?? (caps ? 1.3 : font === "display" ? -.15 : 0),
    whiteSpace: "pre",
    textTransform: caps ? "uppercase" : undefined,
    fontFeatureSettings: font === "mono" ? '"zero" 0' : undefined,
  };
  return <text x={x} y={y} fill={TONE[tone]} textAnchor={anchor} dominantBaseline="middle" opacity={opacity} style={style}>{children}</text>;
}

/** Numeric value interpolated between two frames, rendered as Text. */
export function Counter({ frame, from, to, start, end, format = (value) => String(Math.round(value)), ...text }: Omit<TextProps, "children"> & {
  frame: number;
  from: number;
  to: number;
  start: number;
  end: number;
  format?: ((value: number) => string) | undefined;
}) {
  return <Text {...text}>{format(lerp(from, to, easeOut(frame, start, end)))}</Text>;
}

// ─── Surfaces ────────────────────────────────────────────────────────────────

type BoxProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  tone?: Tone | undefined;
  label?: ReactNode | undefined;
  sub?: ReactNode | undefined;
  /** 0→1 entrance (fade + slight rise). */
  appear?: number | undefined;
  /** 0→1 accent edge + glow for the currently relevant actor. */
  focus?: number | undefined;
  /** 0→1 tone wash: state flashes (updated, rejected, passed). */
  fill?: number | undefined;
  radius?: number | undefined;
  labelSize?: number | undefined;
  mono?: boolean | undefined;
  /** "card" (default) casts a shadow; "ghost" is a flat tinted region. */
  variant?: "card" | "ghost" | undefined;
  children?: ReactNode | undefined;
};

/**
 * Card: neutral raised surface, tone carried by a hairline edge and a top wash.
 * Focus brings the full-tone edge and a halo; `fill` floods the card with tone.
 */
export function Box({ x, y, w, h, tone = "line", label, sub, appear = 1, focus = 0, fill = 0, radius = 14, labelSize = 19, mono = false, variant = "card", children }: BoxProps) {
  const colour = TONE[tone];
  const washId = `wash${useId().replaceAll(":", "")}`;
  if (appear <= 0) return null;
  return <g opacity={appear} transform={`translate(0 ${(1 - appear) * 10})`}>
    {focus > 0 ? <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx={radius + 6} style={{ fill: tint(tone, 10 * focus) }} /> : null}
    <rect
      className={variant === "card" ? "scene-card" : undefined}
      x={x} y={y} width={w} height={h} rx={radius}
      style={{ fill: variant === "card" ? "var(--scene-card)" : tint(tone, 6) }}
    />
    <defs>
      <linearGradient id={washId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: colour, stopOpacity: .13 }} />
        <stop offset={Math.min(1, 70 / h)} style={{ stopColor: colour, stopOpacity: 0 }} />
      </linearGradient>
    </defs>
    <rect x={x} y={y} width={w} height={h} rx={radius} fill={`url(#${washId})`} />
    {fill > 0 ? <rect x={x} y={y} width={w} height={h} rx={radius} style={{ fill: tint(tone, 14 * fill) }} /> : null}
    <rect
      className={focus > .01 ? "scene-glow" : undefined}
      x={x + .5} y={y + .5} width={w - 1} height={h - 1} rx={radius - .5}
      fill="none" stroke={colour} strokeWidth={1 + .75 * focus} strokeOpacity={.38 + .62 * Math.max(focus, fill)}
      style={{ color: colour }}
    />
    {label !== undefined ? <Text x={x + w / 2} y={y + h / 2 - (sub !== undefined ? 10 : 0)} size={labelSize} weight={600} anchor="middle" font={mono ? "mono" : "display"}>{label}</Text> : null}
    {sub !== undefined ? <Text x={x + w / 2} y={y + h / 2 + 14} size={12.5} weight={500} anchor="middle" font="mono" tone="muted">{sub}</Text> : null}
    {children}
  </g>;
}

/** Named responsibility boundary. A boundary must always carry a label. */
export function Boundary({ x, y, w, h, label, tone = "muted", appear = 1, labelAt = "top-start", keepCase = false }: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  tone?: Tone | undefined;
  appear?: number | undefined;
  /** Move the label away from wires that cross the frame's edge. */
  labelAt?: "top-start" | "top-end" | "bottom-start" | "bottom-end" | undefined;
  /** Keep the label's case (units, identifiers). */
  keepCase?: boolean | undefined;
}) {
  const end = labelAt.endsWith("end");
  const bottom = labelAt.startsWith("bottom");
  const text = keepCase ? label : label.toUpperCase();
  const labelW = text.length * 11 * .62 + 16;
  const labelX = end ? x + w - 18 - labelW : x + 18;
  const labelY = bottom ? y + h : y;
  if (appear <= 0) return null;
  return <g opacity={appear}>
    <rect x={x} y={y} width={w} height={h} rx={22} style={{ fill: tint(tone, 4) }} stroke={TONE[tone]} strokeOpacity={.5} strokeWidth={1.25} strokeDasharray="5 6" />
    <rect x={labelX} y={labelY - 10} width={labelW} height={20} rx={10} style={{ fill: "var(--scene-bg-b)" }} />
    <rect x={labelX} y={labelY - 10} width={labelW} height={20} rx={10} style={{ fill: tint(tone, 12) }} />
    <Text x={labelX + labelW / 2} y={labelY + .5} size={11} weight={600} font="mono" tone={tone} anchor="middle" spacing={1.2}>{text}</Text>
  </g>;
}

// ─── Signals ─────────────────────────────────────────────────────────────────

/**
 * A connection. `draw` reveals it; `flow` (pass the frame) animates dots along
 * it, for a link that is actively carrying data.
 */
export function Wire({ d, draw = 1, tone = "line", width = 2, dashed = false, opacity = 1, flow }: {
  d: string;
  draw?: number | undefined;
  tone?: Tone | undefined;
  width?: number | undefined;
  dashed?: boolean | undefined;
  opacity?: number | undefined;
  flow?: number | undefined;
}) {
  if (draw <= 0) return null;
  if (dashed) {
    return <path d={d} fill="none" stroke={TONE[tone]} strokeWidth={width * .75} strokeDasharray="4 7" strokeLinecap="round" opacity={opacity * .75 * Math.min(1, draw * 3)} />;
  }
  return <g opacity={opacity}>
    <path d={d} fill="none" stroke={TONE[tone]} strokeOpacity={flow !== undefined ? .3 : 1} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
    {flow !== undefined && draw >= 1 ? <path className="scene-glow" d={d} fill="none" stroke={TONE[tone]} strokeWidth={width + 1} strokeLinecap="round" strokeDasharray="1.5 14" strokeDashoffset={-flow * 1.1} style={{ color: TONE[tone] }} /> : null}
  </g>;
}

/** Straight arrow drawn from `from` to `to`; a filled head rides the tip. */
export function Arrow({ from, to, draw = 1, tone = "line", width = 2, opacity = 1 }: {
  from: Point;
  to: Point;
  draw?: number | undefined;
  tone?: Tone | undefined;
  width?: number | undefined;
  opacity?: number | undefined;
}) {
  if (draw <= 0) return null;
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const tip: [number, number] = [lerp(from[0], to[0], draw), lerp(from[1], to[1], draw)];
  const head = 6 + width * 2;
  const back: Point = [tip[0] - head * Math.cos(angle), tip[1] - head * Math.sin(angle)];
  const left = [tip[0] - head * Math.cos(angle - .42), tip[1] - head * Math.sin(angle - .42)];
  const right = [tip[0] - head * Math.cos(angle + .42), tip[1] - head * Math.sin(angle + .42)];
  return <g opacity={opacity}>
    <line x1={from[0]} y1={from[1]} x2={back[0] + (tip[0] - back[0]) * .3} y2={back[1] + (tip[1] - back[1]) * .3} stroke={TONE[tone]} strokeWidth={width} strokeLinecap="round" />
    <path d={`M${left[0]} ${left[1]}L${tip[0]} ${tip[1]}L${right[0]} ${right[1]}Q${back[0]} ${back[1]} ${left[0]} ${left[1]}Z`} fill={TONE[tone]} />
  </g>;
}

export function Dot({ x, y, r = 7, tone = "ok", opacity = 1, halo = true }: { x: number; y: number; r?: number | undefined; tone?: Tone | undefined; opacity?: number | undefined; halo?: boolean | undefined }) {
  return <g opacity={opacity}>
    {halo ? <circle cx={x} cy={y} r={r * 2.4} style={{ fill: tint(tone, 16) }} /> : null}
    <circle className={halo ? "scene-glow" : undefined} cx={x} cy={y} r={r} fill={TONE[tone]} style={{ color: TONE[tone] }} />
  </g>;
}

/** A packet travelling along a polyline with a fading tail. */
export function Comet({ points, t, tone = "hot", r = 6.5, tail = .09, opacity = 1 }: {
  points: readonly Point[];
  t: number;
  tone?: Tone | undefined;
  r?: number | undefined;
  /** Tail length as a share of the path. */
  tail?: number | undefined;
  opacity?: number | undefined;
}) {
  if (t <= 0 || t >= 1 || opacity <= 0) return null;
  const steps = 9;
  return <g opacity={opacity}>
    {Array.from({ length: steps }, (_, index) => {
      const k = index / steps;
      const [px, py] = along(points, Math.max(0, t - tail * k));
      return <circle key={index} cx={px} cy={py} r={r * (1 - k * .75)} fill={TONE[tone]} opacity={(1 - k) * .45} />;
    })}
    <Dot x={along(points, t)[0]} y={along(points, t)[1]} r={r} tone={tone} />
  </g>;
}

/**
 * A chip or record travelling from `from` to `to` along a bend, widening from
 * `startWidth` to `endWidth` as it lands. Render it only while in flight; the
 * destination draws the settled state.
 */
export function Flight({ from, to, bend = [0, -60], t, label, tone = "line", startWidth, endWidth, height = 30, size = 13 }: {
  from: Point;
  to: Point;
  /** Control-point offset from the midpoint. */
  bend?: Point | undefined;
  t: number;
  label: string;
  tone?: Tone | undefined;
  startWidth?: number | undefined;
  endWidth?: number | undefined;
  height?: number | undefined;
  size?: number | undefined;
}) {
  if (t <= 0 || t >= 1) return null;
  const control: Point = [(from[0] + to[0]) / 2 + bend[0], (from[1] + to[1]) / 2 + bend[1]];
  const [cx, cy] = curve(from, control, to, easeOut(t, 0, 1));
  const natural = tagWidth(label, size);
  const w = lerp(startWidth ?? natural, endWidth ?? natural, ease(t, .55, 1));
  return <g transform={`translate(${cx} ${cy})`}>
    <rect className="scene-card" x={-w / 2} y={-height / 2} width={w} height={height} rx={height / 2} style={{ fill: "var(--scene-card)" }} />
    <rect className="scene-glow" x={-w / 2} y={-height / 2} width={w} height={height} rx={height / 2} style={{ fill: tint(tone, 18), color: TONE[tone] }} stroke={TONE[tone]} strokeOpacity={.55} />
    <Text x={0} y={.5} size={size} weight={600} font="mono" tone={tone} anchor="middle">{label}</Text>
  </g>;
}

/** Expanding ring that repeats every `period` frames after `at`: attention, heartbeat. */
export function Pulse({ x, y, frame, at = 0, period = 48, r = 14, tone = "hot", once = false }: {
  x: number;
  y: number;
  frame: number;
  at?: number | undefined;
  period?: number | undefined;
  r?: number | undefined;
  tone?: Tone | undefined;
  /** A single ring, for "this just happened" (prefer it: endless rings add noise). */
  once?: boolean | undefined;
}) {
  if (frame < at || (once && frame >= at + period)) return null;
  const t = ((frame - at) % period) / period;
  return <circle cx={x} cy={y} r={r * (1 + 1.6 * t)} fill="none" stroke={TONE[tone]} strokeWidth={1.5} opacity={(1 - t) * .7} />;
}

/** Chip: metadata, verdicts, measurements. */
export function Tag({ x, y, text, tone = "line", appear = 1, anchor = "middle", size = 13 }: {
  x: number;
  y: number;
  text: string;
  tone?: Tone | undefined;
  appear?: number | undefined;
  anchor?: "start" | "middle" | "end" | undefined;
  size?: number | undefined;
}) {
  if (appear <= 0) return null;
  const width = tagWidth(text, size);
  const height = size * 2 + 2;
  const left = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  const scale = .9 + .1 * Math.min(1, appear);
  return <g opacity={Math.min(1, appear)} transform={`translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})`}>
    <rect x={left} y={y - height / 2} width={width} height={height} rx={height / 2} style={{ fill: "var(--scene-card)" }} />
    <rect x={left} y={y - height / 2} width={width} height={height} rx={height / 2} style={{ fill: tint(tone, 16) }} stroke={TONE[tone]} strokeOpacity={.35} strokeWidth={1} />
    <Text x={left + width / 2} y={y + .5} size={size} weight={600} font="mono" tone={tone} anchor="middle" spacing={.2}>{text}</Text>
  </g>;
}

/** A verifiable condition. `state` drives the glyph: pending ring, pass tick, fail cross. */
export function Checkpoint({ x, y, state = "pending", label, appear = 1, r = 14 }: {
  x: number;
  y: number;
  state?: "pending" | "pass" | "fail" | undefined;
  label?: string | undefined;
  appear?: number | undefined;
  r?: number | undefined;
}) {
  if (appear <= 0) return null;
  const tone: Tone = state === "pass" ? "ok" : state === "fail" ? "danger" : "hot";
  const glyph = "var(--scene-card)";
  return <g opacity={appear}>
    {state === "pending"
      ? <>
        <circle cx={x} cy={y} r={r} style={{ fill: "var(--scene-card)" }} stroke={TONE.hot} strokeWidth={1.75} strokeDasharray="3 3.2" />
        <circle cx={x} cy={y} r={r * .32} fill={TONE.hot} />
      </>
      : <circle className="scene-glow" cx={x} cy={y} r={r} fill={TONE[tone]} style={{ color: TONE[tone] }} />}
    {state === "pass" ? <path d={`M${x - r * .42} ${y + r * .02}L${x - r * .1} ${y + r * .34}L${x + r * .46} ${y - r * .32}`} fill="none" stroke={glyph} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" /> : null}
    {state === "fail" ? <path d={`M${x - r * .34} ${y - r * .34}L${x + r * .34} ${y + r * .34}M${x + r * .34} ${y - r * .34}L${x - r * .34} ${y + r * .34}`} stroke={glyph} strokeWidth={2.6} strokeLinecap="round" /> : null}
    {label ? <Text x={x + r + 10} y={y} size={14} weight={600} font="mono" tone={tone}>{label}</Text> : null}
  </g>;
}

// ─── Instruments ─────────────────────────────────────────────────────────────

/** Horizontal gauge with an optional limit; crossing the limit turns it `danger`. */
export function Meter({ x, y, w, h = 12, value, limit, tone = "line", label, valueLabel, limitLabel, appear = 1 }: {
  x: number;
  y: number;
  w: number;
  h?: number | undefined;
  /** 0→1 share of the track. */
  value: number;
  limit?: number | undefined;
  tone?: Tone | undefined;
  label?: string | undefined;
  valueLabel?: string | undefined;
  limitLabel?: string | undefined;
  appear?: number | undefined;
}) {
  if (appear <= 0) return null;
  const over = limit !== undefined && value > limit;
  const colour: Tone = over ? "danger" : tone;
  const filled = Math.max(0, Math.min(1, value)) * w;
  return <g opacity={appear}>
    {label ? <Text x={x} y={y - 16} size={11} weight={600} font="mono" tone="muted" caps>{label}</Text> : null}
    {valueLabel ? <Text x={x + w} y={y - 16} size={13} weight={600} font="mono" tone={colour} anchor="end">{valueLabel}</Text> : null}
    <rect x={x} y={y} width={w} height={h} rx={h / 2} style={{ fill: tint("ink", 9) }} />
    {filled > 0 ? <rect className={over ? "scene-glow" : undefined} x={x} y={y} width={Math.max(h, filled)} height={h} rx={h / 2} fill={TONE[colour]} style={{ color: TONE[colour] }} /> : null}
    {limit !== undefined ? <>
      <line x1={x + w * limit} x2={x + w * limit} y1={y - 5} y2={y + h + 5} stroke={TONE.danger} strokeWidth={1.5} strokeDasharray="2 3" />
      {limitLabel ? <Text x={x + w * limit} y={y + h + 16} size={11} weight={600} font="mono" tone="danger" anchor="middle">{limitLabel}</Text> : null}
    </> : null}
  </g>;
}

/** Time/quantity axis with evenly spaced ticks. */
export function Axis({ x, y, w, ticks, format, appear = 1, label }: {
  x: number;
  y: number;
  w: number;
  /** Tick values, drawn evenly from first to last. */
  ticks: readonly (string | number)[];
  format?: ((tick: string | number) => string) | undefined;
  appear?: number | undefined;
  label?: string | undefined;
}) {
  if (appear <= 0) return null;
  const step = ticks.length > 1 ? w / (ticks.length - 1) : 0;
  return <g opacity={appear}>
    <line x1={x} x2={x + w} y1={y} y2={y} stroke="var(--scene-hairline)" strokeWidth={1} />
    {ticks.map((tick, index) => <g key={index}>
      <line x1={x + index * step} x2={x + index * step} y1={y - 3} y2={y + 3} stroke="var(--scene-hairline)" strokeWidth={1} />
      <Text x={x + index * step} y={y + 15} size={11} weight={500} font="mono" tone="muted" anchor="middle">{format ? format(tick) : String(tick)}</Text>
    </g>)}
    {label ? <Text x={x + w} y={y - 12} size={11} weight={600} font="mono" tone="muted" anchor="end" caps>{label}</Text> : null}
  </g>;
}

// ─── Code ────────────────────────────────────────────────────────────────────

export type CodeLine = { text: string; tone?: Tone | undefined; appearAt?: number | undefined };

const KEYWORDS = new Set([
  "CREATE", "UNIQUE", "INDEX", "ON", "NULLS", "NOT", "DISTINCT", "INSERT", "INTO", "VALUES", "SELECT", "FROM", "WHERE", "JOIN", "UPDATE", "SET", "CONFLICT", "DO", "AND", "OR", "NULL", "AS", "TABLE", "DELETE",
  "const", "let", "var", "await", "async", "function", "return", "if", "else", "for", "of", "in", "while", "new", "import", "export", "from", "type", "interface", "true", "false", "throw", "try", "catch", "finally", "yield", "class", "extends", "null", "undefined",
]);
const TOKEN = /(\/\/.*$|--.*$|#.*$)|('(?:[^'\\]|\\.)*'?|"(?:[^"\\]|\\.)*"?|`(?:[^`\\]|\\.)*`?)|(\b\d[\d_.]*\b)|([A-Za-z_$][\w$]*)|(\s+|[^\sA-Za-z_$\d'"`]+)/g;

function highlight(text: string): ReactNode[] {
  return [...text.matchAll(TOKEN)].map((match, index) => {
    const [token, comment, string, number, word] = match;
    const colour = comment ? "var(--scene-code-com)" : string ? "var(--scene-code-str)" : number ? "var(--scene-code-num)" : word && KEYWORDS.has(word) ? "var(--scene-code-kw)" : undefined;
    return colour ? <tspan key={index} fill={colour}>{token}</tspan> : <tspan key={index}>{token}</tspan>;
  });
}

/**
 * Editor panel with light syntax colouring. Lines with `appearAt` are typed in
 * from that frame with a caret, which keeps "the fix is one line" moments
 * literal. A line `tone` overrides the colouring (inserted fix, failing call).
 */
export function CodeBlock({ x, y, w, lines, frame, title, size = 15, appear = 1, highlight: band, typeRate = 1.3 }: {
  x: number;
  y: number;
  w: number;
  lines: readonly CodeLine[];
  frame: number;
  title?: string | undefined;
  size?: number | undefined;
  appear?: number | undefined;
  /** Index of the line to mark with a tone band. */
  highlight?: number | undefined;
  /** Frames per typed character (lower is faster). */
  typeRate?: number | undefined;
}) {
  if (appear <= 0) return null;
  const lineHeight = size * 1.6;
  const top = title ? 34 : 14;
  const h = top + lines.length * lineHeight + 12;
  const charW = size * .6;
  return <g opacity={appear} transform={`translate(0 ${(1 - appear) * 8})`}>
    <rect className="scene-card" x={x} y={y} width={w} height={h} rx={12} style={{ fill: "var(--scene-code-bg)" }} stroke="var(--scene-code-edge)" strokeWidth={1} />
    {title ? <>
      {[0, 1, 2].map((index) => <circle key={index} cx={x + 16 + index * 12} cy={y + 17} r={3.5} style={{ fill: "var(--scene-code-muted)" }} opacity={.45} />)}
      <text x={x + 60} y={y + 17.5} dominantBaseline="middle" style={{ fontFamily: FONT.mono, fontSize: 11.5, fontWeight: 500, fill: "var(--scene-code-muted)" }}>{title}</text>
      <line x1={x} x2={x + w} y1={y + 32} y2={y + 32} stroke="var(--scene-code-edge)" strokeWidth={1} />
    </> : null}
    {lines.map((line, index) => {
      const lineY = y + top + index * lineHeight + lineHeight / 2 + 2;
      const typed = line.appearAt === undefined ? line.text.length : Math.floor(interpolate(frame, [line.appearAt, line.appearAt + line.text.length * typeRate], [0, line.text.length], CLAMP));
      if (typed <= 0) return null;
      const typing = typed < line.text.length;
      const visible = line.text.slice(0, typed);
      const toned = line.tone && line.tone !== "ink";
      return <g key={index}>
        {band === index ? <>
          <rect x={x + 1} y={lineY - lineHeight / 2} width={w - 2} height={lineHeight} style={{ fill: tint(line.tone ?? "line", 16) }} />
          <rect x={x + 1} y={lineY - lineHeight / 2} width={3} height={lineHeight} fill={TONE[line.tone ?? "line"]} />
        </> : null}
        <text
          x={x + 16} y={lineY} dominantBaseline="middle"
          style={{ fontFamily: FONT.mono, fontSize: size, fontWeight: toned ? 600 : 450, whiteSpace: "pre", fill: toned ? TONE[line.tone!] : "var(--scene-code-ink)" }}
        >{toned ? visible : highlight(visible)}</text>
        {typing ? <rect x={x + 16 + typed * charW + 1} y={lineY - size * .62} width={2} height={size * 1.24} style={{ fill: "var(--scene-code-ink)" }} /> : null}
      </g>;
    })}
  </g>;
}
