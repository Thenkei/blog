import type { PostLocale } from "../../content/types";
import { along, Box, Checkpoint, ease, lerp, pop, Pulse, Text, TONE, tint, type Tone } from "./primitives";

// Shared sequence-diagram language for the identity-federation series
// (security-authentication-idp-openid-connect and its four asset figures).
// Kept outside `scenes/` so the registry glob does not pick it up as a scene.
//
//   Actor      raised card heading a lifeline (display label, mono role)
//   Lifeline   hairline dashed rule under an actor; breaks where text crosses it
//   Message    hairline track drawn by the token riding it; live = toned 1.5 px
//   TokenCard  the artifact itself (JWT, SAML, CODE…) as a small card in transit
//   ClaimList  claims checked one by one: idle → scanning → pass / fail
//
// One rule across the five scenes: only the live exchange is in tone; what has
// already happened settles to hairlines and muted labels.

export type Point = readonly [number, number];

export const tr = (locale: PostLocale, en: string, fr: string) => (locale === "fr" ? fr : en);

export const pt = ([x, y]: readonly [number, number]) => ({ x, y });

/** Point-list → SVG path. */
export const pathOf = (points: readonly Point[]) => points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");

/** Rough rendered width of a label, for layout (mono is exact enough). */
export const textWidth = (text: string, size: number, mono = true) => text.length * size * (mono ? .6 : .54);

/** Position along a route, for packets (tokens, secrets, codes) in transit. */
export const at = (points: readonly Point[], t: number) => along(points, t);

/** 0→1 while a token rides its message: in-out, so it leaves and docks softly. */
export const travel = (frame: number, start: number, end: number) => ease(frame, start, end);

/** 1 while something is in flight, easing in and out at both ends. */
export const inFlight = (t: number) => (t <= 0 || t >= 1 ? 0 : Math.min(1, t * 5, (1 - t) * 5));

/** Portion of a polyline from its start up to progress t (0→1), by length. */
export function partial(points: readonly Point[], t: number): Point[] {
  if (t >= 1) return [...points];
  const lengths = points.slice(1).map((point, index) => Math.hypot(point[0] - points[index]![0], point[1] - points[index]![1]));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  const target = Math.max(0, t) * total;
  const starts = lengths.map((_, index) => lengths.slice(0, index).reduce((sum, length) => sum + length, 0));
  const segment = lengths.findIndex((length, index) => starts[index]! + length >= target);
  if (segment < 0) return [...points];
  const from = points[segment]!;
  const to = points[segment + 1]!;
  const local = lengths[segment] === 0 ? 1 : (target - starts[segment]!) / lengths[segment]!;
  return [...points.slice(0, segment + 1), [lerp(from[0], to[0], local), lerp(from[1], to[1], local)]];
}

// ─── Actors ──────────────────────────────────────────────────────────────────

/** Actor header: a raised card centred on its lifeline. */
export function Actor({ x, y, w, h = 50, label, sub, tone = "line", appear = 1, focus = 0, fill = 0, size = 16 }: {
  x: number;
  y: number;
  w: number;
  h?: number | undefined;
  label: string;
  sub?: string | undefined;
  tone?: Tone | undefined;
  appear?: number | undefined;
  focus?: number | undefined;
  fill?: number | undefined;
  size?: number | undefined;
}) {
  return <Box x={x - w / 2} y={y} w={w} h={h} tone={tone} appear={appear} focus={focus} fill={fill} radius={13} labelSize={size}
    label={label} {...(sub !== undefined ? { sub } : {})} />;
}

export type Gap = readonly [number, number];

/** Text box on stage, used to break lifelines where a label crosses them. */
export type Span = { x0: number; x1: number; y0: number; y1: number };

/** Label span for a text anchored at (x, y). */
export function spanOf(x: number, y: number, text: string, size: number, anchor: "start" | "middle" | "end" = "middle", mono = true): Span {
  const w = textWidth(text, size, mono);
  const x0 = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
  return { x0: x0 - 6, x1: x0 + w + 6, y0: y - size * .8, y1: y + size * .8 };
}

/** Vertical gaps a lifeline at x needs so that no label sits on it. */
export const gapsAt = (x: number, spans: readonly Span[]): Gap[] => spans.filter((span) => span.x0 <= x && span.x1 >= x).map((span) => [span.y0, span.y1] as const);

/**
 * Sequence lifeline: hairline dashed rule that grows down from its actor.
 * `gaps` are [y0, y1] bands left empty where a label crosses the line.
 */
export function Lifeline({ x, top, bottom, grow = 1, gaps = [], opacity = 1, tone }: {
  x: number;
  top: number;
  bottom: number;
  /** 0→1 drawn length from the actor down. */
  grow?: number | undefined;
  gaps?: readonly Gap[] | undefined;
  opacity?: number | undefined;
  /** Optional toned lifeline (the actor that owns the scene). */
  tone?: Tone | undefined;
}) {
  if (grow <= 0) return null;
  const end = lerp(top, bottom, grow);
  const sorted = [...gaps].filter(([a, b]) => b > top && a < end).sort((a, b) => a[0] - b[0]);
  const cuts = [top, ...sorted.flatMap(([a, b]) => [Math.max(top, a), Math.min(end, b)]), end];
  const segments = cuts.reduce<Gap[]>((list, value, index) => (index % 2 === 1 && value > cuts[index - 1]! ? [...list, [cuts[index - 1]!, value]] : list), []);
  return <g opacity={opacity}>
    {segments.map(([a, b]) => <line key={a} x1={x} x2={x} y1={a} y2={b}
      stroke={tone ? TONE[tone] : "var(--scene-hairline)"} strokeOpacity={tone ? .45 : 1} strokeWidth={1} strokeDasharray="2 5" strokeLinecap="round" />)}
  </g>;
}

/** Activation bar on a lifeline: the actor is busy (authenticating, validating). */
export function Activation({ x, y0, y1, t = 1, tone = "hot" }: { x: number; y0: number; y1: number; t?: number | undefined; tone?: Tone | undefined }) {
  if (t <= 0) return null;
  const h = (y1 - y0) * t;
  return <g>
    <rect x={x - 4.5} y={y0} width={9} height={h} rx={4.5} style={{ fill: "var(--scene-card)" }} />
    <rect x={x - 4.5} y={y0} width={9} height={h} rx={4.5} style={{ fill: tint(tone, 26) }} stroke={TONE[tone]} strokeOpacity={.55} strokeWidth={1} />
  </g>;
}

// ─── Messages ────────────────────────────────────────────────────────────────

/**
 * One message between two lifelines. The track is drawn by `progress` (usually
 * the token's own travel), so the line is the trace the artifact leaves. `live`
 * brings tone and a 1.5 px stroke; a settled message is a hairline.
 * Dashed = front-channel redirect carried by the browser.
 */
export function Message({ points, progress, live = 0, tone = "line", dashed = false, head = true, opacity = 1 }: {
  points: readonly Point[];
  progress: number;
  live?: number | undefined;
  tone?: Tone | undefined;
  dashed?: boolean | undefined;
  head?: boolean | undefined;
  opacity?: number | undefined;
}) {
  if (progress <= 0 || opacity <= 0) return null;
  const drawn = partial(points, progress);
  const tip = drawn.at(-1)!;
  const prev = drawn.length > 1 ? drawn.at(-2)! : tip;
  const angle = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
  const size = 6.5;
  const chevron = `M${tip[0] - size * Math.cos(angle - .55)} ${tip[1] - size * Math.sin(angle - .55)}L${tip[0]} ${tip[1]}L${tip[0] - size * Math.cos(angle + .55)} ${tip[1] - size * Math.sin(angle + .55)}`;
  const dash = dashed ? "5 5" : undefined;
  return <g opacity={opacity}>
    <path d={pathOf(drawn)} fill="none" stroke="var(--scene-hairline)" strokeWidth={1.1} strokeDasharray={dash} strokeLinecap="round" strokeLinejoin="round" opacity={1 - live * .7} />
    {head ? <path d={chevron} fill="none" stroke="var(--scene-hairline)" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" opacity={1 - live * .7} /> : null}
    {live > 0 ? <g opacity={live}>
      <path d={pathOf(drawn)} fill="none" stroke={TONE[tone]} strokeWidth={1.6} strokeDasharray={dash} strokeLinecap="round" strokeLinejoin="round" />
      {head ? <path d={chevron} fill="none" stroke={TONE[tone]} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" /> : null}
    </g> : null}
  </g>;
}

/** Mono message label: ink while live, muted once settled. */
export function Label({ x, y, text, live = 0, appear = 1, anchor = "middle", size = 12.5, tone }: {
  x: number;
  y: number;
  text: string;
  live?: number | undefined;
  appear?: number | undefined;
  anchor?: "start" | "middle" | "end" | undefined;
  size?: number | undefined;
  tone?: Tone | undefined;
}) {
  if (appear <= 0) return null;
  return <g opacity={appear} transform={`translate(0 ${(1 - appear) * 5})`}>
    <Text x={x} y={y} size={size} font="mono" weight={live > .5 ? 600 : 500} tone={tone ?? (live > .5 ? "ink" : "muted")} anchor={anchor}>{text}</Text>
  </g>;
}

/** Numbered origin of a message: ties it to a numbered line in the article. */
export function Step({ x, y, n, tone = "line", appear = 1, live = 0 }: { x: number; y: number; n: string; tone?: Tone | undefined; appear?: number | undefined; live?: number | undefined }) {
  if (appear <= 0) return null;
  const s = .6 + .4 * appear;
  return <g opacity={Math.min(1, appear)} transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={10} style={{ fill: "var(--scene-card)" }} />
    <circle r={10} style={{ fill: tint(tone, 14 + 16 * live) }} stroke={TONE[tone]} strokeOpacity={.4 + .6 * live} strokeWidth={1} />
    <Text x={0} y={.5} size={11.5} weight={700} font="mono" tone={tone} anchor="middle">{n}</Text>
  </g>;
}

/** A single ring where something just landed (Pulse, once). */
export function Ping({ x, y, frame, at: start, r = 11, tone = "ok", dur = 40 }: { x: number; y: number; frame: number; at: number; r?: number | undefined; tone?: Tone | undefined; dur?: number | undefined }) {
  if (frame < start || frame >= start + dur) return null;
  return <Pulse x={x} y={y} frame={frame} at={start} period={dur} r={r} tone={tone} />;
}

// ─── Artifacts ───────────────────────────────────────────────────────────────

export const tokenWidth = (kind: string, text: string | undefined, size = 12.5) => kind.length * 6.7 + 16 + (text ? text.length * size * .6 + 16 : 0);

/**
 * The artifact in transit (JWT, SAML assertion, code, secret): a small raised
 * card with a toned kind segment. `lift` (0→1) is the in-flight state: a halo
 * and a slight scale-up, so the token visibly leaves the lane and docks again.
 */
export function TokenCard({ x, y, kind, text, tone = "hot", appear = 1, lift = 0, size = 12.5, strike = 0 }: {
  x: number;
  y: number;
  kind: string;
  text?: string | undefined;
  tone?: Tone | undefined;
  appear?: number | undefined;
  lift?: number | undefined;
  size?: number | undefined;
  /** 0→1 danger cross-out: the token is refused. */
  strike?: number | undefined;
}) {
  if (appear <= 0) return null;
  const kindW = kind.length * 6.7 + 16;
  const w = tokenWidth(kind, text, size);
  const h = size + 15;
  const left = -w / 2;
  const s = (.86 + .14 * Math.min(1, appear)) * (1 + .05 * lift);
  const colour = TONE[tone];
  return <g opacity={Math.min(1, appear)} transform={`translate(${x} ${y}) scale(${s})`}>
    {lift > 0 ? <rect x={left - 5} y={-h / 2 - 5} width={w + 10} height={h + 10} rx={h / 2 + 5} style={{ fill: tint(tone, 14 * lift) }} /> : null}
    <rect className="scene-card" x={left} y={-h / 2} width={w} height={h} rx={h / 2} style={{ fill: "var(--scene-card)" }} />
    <path d={`M${left + kindW} ${-h / 2}H${left + h / 2}A${h / 2} ${h / 2} 0 0 0 ${left + h / 2} ${h / 2}H${left + kindW}Z`} style={{ fill: tint(tone, text ? 18 : 22) }} />
    {text ? <line x1={left + kindW} x2={left + kindW} y1={-h / 2 + 5} y2={h / 2 - 5} stroke={colour} strokeOpacity={.3} strokeWidth={1} /> : null}
    <rect className={lift > .05 ? "scene-glow" : undefined} x={left + .5} y={-h / 2 + .5} width={w - 1} height={h - 1} rx={h / 2 - .5} fill="none"
      stroke={colour} strokeOpacity={.45 + .45 * lift} strokeWidth={1} style={{ color: colour }} />
    <Text x={left + kindW / 2 + 2} y={.5} size={10} weight={700} font="mono" tone={tone} anchor="middle" spacing={.8}>{kind}</Text>
    {text ? <Text x={left + kindW + (w - kindW) / 2} y={.5} size={size} weight={600} font="mono" tone="ink" anchor="middle">{text}</Text> : null}
    {strike > 0 ? <line x1={left + 8} x2={left + 8 + (w - 16) * strike} y1={0} y2={0} stroke={TONE.danger} strokeWidth={1.75} strokeLinecap="round" /> : null}
  </g>;
}

/** Checkpoint that springs in on its verdict (pending → pass / fail). */
export function Gate({ x, y, frame, decideAt, result, appear = 1, r = 11, label }: {
  x: number;
  y: number;
  frame: number;
  /** Frame at which the verdict lands; before it, the gate is pending. */
  decideAt: number;
  result: "pass" | "fail";
  appear?: number | undefined;
  r?: number | undefined;
  label?: string | undefined;
}) {
  if (appear <= 0) return null;
  const decided = frame >= decideAt;
  const s = decided ? .7 + .3 * pop(frame, decideAt, 190) : .8 + .2 * appear;
  return <g transform={`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`}>
    <Checkpoint x={x} y={y} r={r} appear={appear} state={decided ? result : "pending"} {...(label !== undefined ? { label } : {})} />
  </g>;
}

// ─── Claims ──────────────────────────────────────────────────────────────────

export type Claim = {
  key: string;
  rule?: string | undefined;
  /** Frame the verdict lands on this row; the scan band leads it by `lead`. */
  decideAt: number;
  result: "pass" | "fail";
  /** Never evaluated (an earlier check already failed). */
  skipped?: boolean | undefined;
};

/**
 * Claims checked one by one. Each row idles as a neutral ring, is scanned
 * (hot band + pending checkpoint) just before its verdict, then springs to
 * pass / fail. A failing row keeps its band; skipped rows recede.
 */
export function ClaimList({ x, y, w, rowH, frame, claims, keyW, size = 14, ruleSize = 12.5, lead = 10, appear = 1, ruleAnchor = "start" }: {
  x: number;
  y: number;
  w: number;
  rowH: number;
  frame: number;
  claims: readonly Claim[];
  /** Offset of the rule column from the key column. */
  keyW: number;
  size?: number | undefined;
  ruleSize?: number | undefined;
  lead?: number | undefined;
  appear?: number | undefined;
  ruleAnchor?: "start" | "end" | undefined;
}) {
  if (appear <= 0) return null;
  return <g opacity={appear}>
    {claims.map((claim, index) => {
      const cy = y + index * rowH + rowH / 2;
      const scan = claim.skipped ? 0 : ease(frame, claim.decideAt - lead, claim.decideAt - lead + 5) * (1 - ease(frame, claim.decideAt + 6, claim.decideAt + 20));
      const decided = !claim.skipped && frame >= claim.decideAt;
      const failed = decided && claim.result === "fail";
      const scanning = !claim.skipped && frame >= claim.decideAt - lead && !decided;
      const band = failed ? ease(frame, claim.decideAt, claim.decideAt + 8) : scan;
      const bandTone: Tone = failed ? "danger" : decided ? "ok" : "hot";
      const keyTone: Tone = failed ? "danger" : decided ? "ok" : "ink";
      const cx = x + 18;
      const recede = claim.skipped ? .38 : 1;
      return <g key={claim.key} opacity={recede}>
        {band > 0 ? <rect x={x} y={cy - rowH / 2 + 2} width={w} height={rowH - 4} rx={(rowH - 4) / 2} style={{ fill: tint(bandTone, 12 * band) }} /> : null}
        {decided || scanning
          ? <Gate x={cx} y={cy} frame={frame} decideAt={claim.decideAt} result={claim.result} r={8.5} />
          : <circle cx={cx} cy={cy} r={7.5} fill="none" stroke="var(--scene-hairline)" strokeWidth={1.2} />}
        <Text x={cx + 18} y={cy} size={size} weight={600} font="mono" tone={keyTone}>{claim.key}</Text>
        {claim.rule ? <Text x={ruleAnchor === "end" ? x + w - 14 : cx + 18 + keyW} y={cy} size={ruleSize} weight={500} font="mono" tone={failed ? "danger" : "muted"} anchor={ruleAnchor}>{claim.rule}</Text> : null}
      </g>;
    })}
  </g>;
}

// ─── Theme flourishes (decorative only; information never lives here) ───────

/** Rocket: a small satellite orbiting an actor card, like a service in the cloud. */
export function Orbit({ x, y, rx, ry, frame, appear = 1 }: { x: number; y: number; rx: number; ry: number; frame: number; appear?: number | undefined }) {
  if (appear <= 0) return null;
  const a = frame * .035;
  return <g className="scene-only-rocket" opacity={appear} aria-hidden="true">
    <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="none" stroke={TONE.line} strokeOpacity={.3} strokeWidth={1} strokeDasharray="1.5 6" />
    <circle cx={x + rx * Math.cos(a)} cy={y + ry * Math.sin(a)} r={2.4} fill={TONE.line} opacity={Math.sin(a) > 0 ? .9 : .35} />
  </g>;
}

/** Mountain: a summit flag planted on a reached checkpoint. */
export function SummitFlag({ x, y, appear = 1, tone = "ok" }: { x: number; y: number; appear?: number | undefined; tone?: Tone | undefined }) {
  if (appear <= 0) return null;
  const rise = 16 * Math.min(1, appear);
  return <g className="scene-only-mountain" opacity={Math.min(1, appear)} aria-hidden="true">
    <line x1={x} x2={x} y1={y} y2={y - rise - 6} stroke="var(--scene-ink-soft)" strokeWidth={1.2} strokeLinecap="round" />
    <path d={`M${x} ${y - rise - 6}L${x + 11} ${y - rise - 2}L${x} ${y - rise + 2}Z`} fill={TONE[tone]} />
  </g>;
}

/** Light: a paper-like registration mark in a corner, like a printed spec. */
export function SpecMark({ x, y, text }: { x: number; y: number; text: string }) {
  return <g className="scene-only-light" aria-hidden="true" opacity={.55}>
    <Text x={x} y={y} size={10} font="mono" weight={500} tone="muted" anchor="end" spacing={1.2}>{text}</Text>
  </g>;
}
