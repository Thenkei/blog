import type { PostLocale } from "../../../content/types";
import { Box, Camera, Checkpoint, Comet, dim, during, ease, easeOut, enter, hash, lerp, Meter, pop, Pulse, stagger, Tag, Text, TONE, tint, Wire, type Tone } from "../primitives";
import { defineScene, type Localized, type SceneStageProps } from "../types";

// Same access, same three engineers. One trunk carries Claude Code to all of them;
// the method arrives on that same trunk: the Challenges fix B's context, A's proven
// workflow lifts out of a terminal and comes back to everyone as a plugin, whose PR
// skill then tells C that the large diff should be split.
const T = {
  rows: 10,
  wires: 20,
  outcomes: [42, 56, 70] as const,
  challenges: 150,
  ticks: 162,
  practice: 226,
  practiceFlip: 250,
  slack: 282,
  messages: [294, 306, 318] as const,
  lift: 350,
  plugin: 384,
  typed: 392,
  install: 426,
  installed: 450,
  score: 476,
  split: 510,
  prFlip: 534,
  end: 610,
} as const;

type Outcome = { title: Localized; tag: Localized; tone: Tone };
type Engineer = { before: Outcome; after: Outcome; flipAt: number };

const ENGINEERS: readonly [Engineer, Engineer, Engineer] = [
  {
    before: { title: { en: "Finds a useful workflow", fr: "Trouve un workflow efficace" }, tag: { en: "only in one terminal history", fr: "dans un seul historique" }, tone: "hot" },
    after: { title: { en: "Workflow shared as a plugin", fr: "Workflow partagé en plugin" }, tag: { en: "✓ installable by the team", fr: "✓ installable par l’équipe" }, tone: "ok" },
    flipAt: T.installed,
  },
  {
    before: { title: { en: "Fights stale context", fr: "Se bat avec du contexte obsolète" }, tag: { en: "✗ no method", fr: "✗ sans méthode" }, tone: "danger" },
    after: { title: { en: "Manages context from a baseline", fr: "Gère le contexte depuis une base fiable" }, tag: { en: "✓ practised in a challenge", fr: "✓ pratiqué dans un challenge" }, tone: "ok" },
    flipAt: T.practiceFlip,
  },
  {
    before: { title: { en: "Generates a large diff", fr: "Génère une grosse diff" }, tag: { en: "✗ nobody can confidently review it", fr: "✗ personne ne peut la reviewer" }, tone: "danger" },
    after: { title: { en: "PR skill warns: split it", fr: "Le skill PR alerte : à découper" }, tag: { en: "✓ reviewable pull requests", fr: "✓ pull requests reviewables" }, tone: "ok" },
    flipAt: T.prFlip,
  },
];

type Rect = { x: number; y: number; w: number; h: number };
type Pt = readonly [number, number];
type Layout = {
  access: Rect;
  challenges: Rect;
  slack: Rect;
  plugin: Rect;
  rows: readonly [Rect, Rect, Rect];
  /** Right-hand visual zone inside a row (terminal, diff). */
  zone: { dx: number; w: number };
  /** Wide: the trunk is a vertical at x; compact: a spine on the left edge. */
  trunkX: number;
};

const WIDE: Layout = {
  access: { x: 40, y: 64, w: 300, h: 48 },
  challenges: { x: 40, y: 126, w: 300, h: 92 },
  slack: { x: 40, y: 232, w: 300, h: 80 },
  plugin: { x: 40, y: 326, w: 300, h: 58 },
  rows: [{ x: 420, y: 64, w: 500, h: 98 }, { x: 420, y: 175, w: 500, h: 98 }, { x: 420, y: 286, w: 500, h: 98 }],
  zone: { dx: 344, w: 140 },
  trunkX: 380,
};

const COMPACT: Layout = {
  access: { x: 20, y: 56, w: 500, h: 40 },
  challenges: { x: 42, y: 330, w: 478, h: 54 },
  slack: { x: 42, y: 392, w: 478, h: 54 },
  plugin: { x: 42, y: 454, w: 478, h: 54 },
  rows: [{ x: 42, y: 106, w: 478, h: 66 }, { x: 42, y: 180, w: 478, h: 66 }, { x: 42, y: 254, w: 478, h: 66 }],
  zone: { dx: 346, w: 120 },
  trunkX: 28,
};

/** Cubic Bézier sampled as a polyline. */
const cubic = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, steps = 24): Pt[] => Array.from({ length: steps + 1 }, (_, index) => {
  const t = index / steps;
  const u = 1 - t;
  return [
    u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
    u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
  ] as const;
});
const toPath = (points: readonly Pt[]) => points.map((point, index) => `${index === 0 ? "M" : "L"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join("");

/** A link from a method card (or the access card) to engineer row `index`, along the trunk. */
function link(L: Layout, compact: boolean, from: Rect, index: number): Pt[] {
  const row = L.rows[index]!;
  const ry = row.y + (compact ? row.h / 2 : 34);
  if (compact) {
    const start: Pt = from === L.access ? [L.trunkX, from.y + from.h] : [from.x, from.y + from.h / 2];
    const corner = from === L.access ? [] : [[L.trunkX, start[1]] as const];
    return [start, ...corner, [L.trunkX, ry], [row.x, ry]];
  }
  const fy = from.y + from.h / 2;
  return cubic([from.x + from.w, fy], [L.trunkX + 10, fy], [L.trunkX - 10, ry], [row.x, ry]);
}

// Diff bars: deterministic heights, so the "large diff" reads the same on every frame.
const BARS = Array.from({ length: 15 }, (_, index) => .35 + .65 * hash(index * 3 + 11));

function EngineerRow({ rect, index, engineer, frame, locale, compact, zone }: {
  rect: Rect; index: number; engineer: Engineer; frame: number; locale: PostLocale; compact: boolean; zone: Layout["zone"];
}) {
  const fr = locale === "fr";
  const outcomeIn = easeOut(frame, T.outcomes[index]!, T.outcomes[index]! + 16);
  const flip = ease(frame, engineer.flipAt, engineer.flipAt + 18);
  const after = flip >= .5;
  const current = after ? engineer.after : engineer.before;
  const swap = after ? (flip - .5) * 2 : 1 - flip * 2;
  const letter = String.fromCharCode(65 + index);
  const cx = rect.x + (compact ? 24 : 30);
  const cy = rect.y + (compact ? rect.h / 2 : 34);
  const textX = rect.x + (compact ? 48 : 60);
  const titleY = compact ? rect.y + 23 : rect.y + 52;
  const tagY = compact ? rect.y + 46 : rect.y + 78;
  const tone: Tone = outcomeIn <= 0 ? "line" : current.tone;
  const bounce = after ? pop(frame, engineer.flipAt + 9, 200) : 1;
  return <Box x={rect.x} y={rect.y} w={rect.w} h={rect.h} tone={tone} focus={during(frame, engineer.flipAt - 4, engineer.flipAt + 46, 10)} radius={14}>
    <circle cx={cx} cy={cy} r={compact ? 13 : 15} style={{ fill: tint(after ? "ok" : "line", 14) }} stroke={TONE[after ? "ok" : "line"]} strokeOpacity={.5} strokeWidth={1} />
    <Text x={cx} y={cy + 1} size={compact ? 13 : 14} weight={700} font="mono" tone={after ? "ok" : "line"} anchor="middle">{letter}</Text>
    {!compact ? <Text x={textX} y={rect.y + 26} size={11} weight={600} font="mono" tone="muted" caps>{`${fr ? "ingénieur" : "engineer"} ${letter}`}</Text> : null}
    <g opacity={outcomeIn * Math.max(0, swap)} transform={`translate(${(after ? 1 - bounce : 0) * -6} 0)`}>
      <Text x={textX} y={titleY} size={compact ? 14.5 : 16} weight={650}>{current.title[locale]}</Text>
      <Tag x={textX} y={tagY} anchor="start" text={current.tag[locale]} tone={current.tone} size={compact ? 11 : 12} />
    </g>
    {index === 0 ? <Terminal x={rect.x + zone.dx} y={rect.y + (compact ? 9 : 16)} w={zone.w} h={compact ? 48 : 66} frame={frame} appear={outcomeIn} compact={compact} fr={fr} /> : null}
    {index === 2 ? <Diff x={rect.x + zone.dx} y={rect.y + (compact ? 8 : 16)} w={zone.w} frame={frame} appear={outcomeIn} compact={compact} fr={fr} /> : null}
  </Box>;
}

/** Engineer A's terminal: the workflow lives in one history until it is packaged. */
function Terminal({ x, y, w, h, frame, appear, compact, fr }: { x: number; y: number; w: number; h: number; frame: number; appear: number; compact: boolean; fr: boolean }) {
  const lifted = ease(frame, T.lift, T.lift + 10);
  return <g opacity={appear}>
    <rect className="scene-card" x={x} y={y} width={w} height={h} rx={9} style={{ fill: "var(--scene-code-bg)" }} stroke="var(--scene-code-edge)" strokeWidth={1} />
    {[0, 1, 2].map((dot) => <circle key={dot} cx={x + 11 + dot * 9} cy={y + 10} r={2.6} style={{ fill: "var(--scene-code-muted)" }} opacity={.5} />)}
    <text x={x + 42} y={y + 10.5} dominantBaseline="middle" style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fill: "var(--scene-code-muted)" }}>{fr ? "historique" : "history"}</text>
    {!compact ? <text x={x + 10} y={y + 32} dominantBaseline="middle" style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fill: "var(--scene-code-com)" }}>$ claude</text> : null}
    <text x={x + 10} y={y + (compact ? 32 : 51)} dominantBaseline="middle" opacity={1 - .6 * lifted} style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, fill: "var(--scene-code-str)" }}>✓ workflow</text>
  </g>;
}

/** Engineer C's change: one long diff, then the same lines split into reviewable slices. */
function Diff({ x, y, w, frame, appear, compact, fr }: { x: number; y: number; w: number; frame: number; appear: number; compact: boolean; fr: boolean }) {
  const split = ease(frame, T.split, T.split + 24);
  const scoreIn = during(frame, T.score, T.prFlip + 10, 12);
  const score = easeOut(frame, T.score + 6, T.split - 2) * .86;
  const barH = compact ? 20 : 28;
  const gap = 12 * split;
  const step = (w - 2 * 12 * split) / BARS.length;
  const groupOf = (index: number) => index < 5 ? 0 : index < 10 ? 1 : 2;
  const done = frame >= T.prFlip;
  return <g opacity={appear}>
    {BARS.map((value, index) => {
      const bx = x + index * step + groupOf(index) * gap;
      const h = barH * value;
      return <rect key={index} x={bx} y={y + barH - h} width={Math.max(2, step - 2.5)} height={h} rx={1.5}
        style={{ fill: done ? TONE.ok : `color-mix(in srgb, var(--scene-ink) ${lerp(34, 26, split)}%, transparent)` }} opacity={done ? .75 : 1} />;
    })}
    <line x1={x} x2={x + w} y1={y + barH + 3} y2={y + barH + 3} stroke="var(--scene-hairline)" strokeWidth={1} opacity={1 - split} />
    {/* Slice brackets once the change is split. */}
    {[0, 1, 2].map((group) => {
      const gx = x + group * 5 * step + group * gap;
      return <line key={group} x1={gx} x2={gx + 5 * step - 2.5} y1={y + barH + 5} y2={y + barH + 5} stroke={TONE.ok} strokeWidth={1.5} strokeLinecap="round" opacity={ease(frame, T.split + 14, T.split + 26)} />;
    })}
    <Meter x={x} y={y + (compact ? 44 : 64)} w={w} h={compact ? 5 : 6} value={score} limit={.6} tone="line" label={compact ? undefined : (fr ? "complexité" : "complexity")} appear={scoreIn} />
  </g>;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT : WIDE;
  const { access, challenges: ch, slack, plugin } = L;

  const accessLinks = [0, 1, 2].map((index) => link(L, compact, access, index));
  const practiceLink = link(L, compact, ch, 1);
  const installLinks = [0, 1, 2].map((index) => link(L, compact, plugin, index));

  // The workflow lifts out of A's terminal and flies to where the plugin forms.
  const rowA = L.rows[0];
  const liftFrom: Pt = [rowA.x + L.zone.dx + 34, rowA.y + (compact ? 41 : 67)];
  const liftTo: Pt = [plugin.x + (compact ? 230 : 150), plugin.y + plugin.h / 2];
  // Wide: rise above the rows, then ride the trunk down to the plugin slot.
  const liftPath = compact
    ? cubic(liftFrom, [width - 4, liftFrom[1] + 80], [width - 4, liftTo[1] - 90], liftTo)
    : [
      ...cubic(liftFrom, [liftFrom[0] - 10, 44], [rowA.x + 120, 44], [L.trunkX + 8, 60], 16),
      ...cubic([L.trunkX + 8, 60], [L.trunkX - 4, 160], [L.trunkX - 4, liftTo[1] - 40], liftTo, 16).slice(1),
    ];
  const liftT = ease(frame, T.lift + 4, T.plugin + 4, (t) => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const [chipX, chipY] = liftPath[Math.round(liftT * (liftPath.length - 1))]!;

  const typedName = "rockfi-engineering".slice(0, Math.max(0, Math.floor((frame - T.typed) / 1.1)));
  const pluginDone = frame >= T.typed + 22;

  // Attention: the method column recedes while the rows change, and vice versa.
  const methodFocus = (at: number) => during(frame, at - 10, at + 60, 12);
  const zoomIn = compact ? 1.012 : 1.03;
  const camera = [
    { at: 0 },
    { at: T.lift - 10, dur: 44, zoom: zoomIn, focus: [lerp(width / 2, compact ? width / 2 : 380, .25), lerp(height / 2, compact ? 400 : 300, .25)] as const },
    { at: T.score - 12, dur: 44, zoom: zoomIn, focus: [lerp(width / 2, L.rows[2].x + L.rows[2].w * .7, .25), lerp(height / 2, L.rows[2].y + 40, .25)] as const },
    { at: T.prFlip + 20, dur: 50, zoom: 1 },
  ];

  const messages: readonly { glyph: string; tone: Tone; text: Localized }[] = [
    { glyph: "✓", tone: "ok", text: { en: "the prompt that worked", fr: "le prompt qui a marché" } },
    { glyph: "✗", tone: "danger", text: { en: "the approach that failed", fr: "l’approche qui a échoué" } },
  ];

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* Same access for everyone, carried by one trunk. */}
    {accessLinks.map((points, index) => <Wire key={index} d={toPath(points)} draw={ease(frame, stagger(index, T.wires, 5), stagger(index, T.wires, 5) + 20)} tone="line" width={1.5} opacity={dim(ease(frame, T.challenges - 10, T.challenges + 10), .45)} flow={frame < T.challenges ? frame : undefined} />)}

    <g {...enter(frame, 0)}>
      <Box x={access.x} y={access.y} w={access.w} h={access.h} tone="line" radius={12}>
        <Text x={access.x + 18} y={access.y + access.h / 2} size={compact ? 15 : 16} weight={700} font="mono">Claude Code</Text>
        <Tag x={access.x + access.w - 12} y={access.y + access.h / 2} anchor="end" text={fr ? "✓ pour tous" : "✓ for everyone"} tone="ok" size={12} />
      </Box>
    </g>

    {ENGINEERS.map((engineer, index) => <g key={index} {...enter(frame, stagger(index, T.rows, 6), { from: "right", distance: 18 })}>
      <EngineerRow rect={L.rows[index]!} index={index} engineer={engineer} frame={frame} locale={locale} compact={compact} zone={L.zone} />
    </g>)}

    {/* Before the method exists, its place is empty. */}
    {!compact ? <g opacity={easeOut(frame, 84, 104) * (1 - ease(frame, T.challenges - 16, T.challenges))}>
      <Text x={ch.x + ch.w / 2} y={236} size={16} weight={600} tone="muted" anchor="middle">{fr ? "Aucune méthode partagée" : "No shared method"}</Text>
      <Tag x={ch.x + ch.w / 2} y={266} text={fr ? "accès ≠ pratique" : "access ≠ practice"} tone="muted" size={12} />
    </g> : <g opacity={easeOut(frame, 84, 104) * (1 - ease(frame, T.challenges - 16, T.challenges))}>
      <Text x={width / 2} y={400} size={15} weight={600} tone="muted" anchor="middle">{fr ? "Aucune méthode partagée" : "No shared method"}</Text>
      <Tag x={width / 2} y={430} text={fr ? "accès ≠ pratique" : "access ≠ practice"} tone="muted" size={12} />
    </g>}

    {/* The Challenges: ten steps on real code. */}
    <g {...enter(frame, T.challenges - 8)}>
      <Box x={ch.x} y={ch.y} w={ch.w} h={ch.h} tone="line" focus={methodFocus(T.practice)} radius={14}>
        <Text x={ch.x + 16} y={ch.y + (compact ? 16 : 22)} size={11} weight={600} font="mono" tone="line" caps>Claude Code Challenges</Text>
        {!compact ? <Text x={ch.x + ch.w - 16} y={ch.y + 22} size={11} weight={600} font="mono" tone="muted" anchor="end">60–90 min</Text> : null}
        {/* Track + ten checkpoints. */}
        {(() => {
          const trackY = ch.y + (compact ? 37 : 48);
          const x0 = ch.x + (compact ? 24 : 26);
          const stepX = compact ? 21 : 27.5;
          const progress = ease(frame, T.ticks, T.ticks + 60);
          return <>
            <line x1={x0} x2={x0 + 9 * stepX} y1={trackY} y2={trackY} stroke="var(--scene-hairline)" strokeWidth={1} />
            <line x1={x0} x2={x0 + 9 * stepX * progress} y1={trackY} y2={trackY} stroke={TONE.ok} strokeWidth={1.5} />
            {Array.from({ length: 10 }, (_, index) => {
              const at = T.ticks + index * 6.5;
              const passed = frame >= at;
              const k = passed ? pop(frame, at, 240) : 1;
              const cx = x0 + index * stepX;
              return <g key={index} transform={`translate(${cx} ${trackY}) scale(${.6 + .4 * k}) translate(${-cx} ${-trackY})`}>
                {passed ? <Checkpoint x={cx} y={trackY} r={compact ? 6.8 : 8.5} state="pass" /> : <circle cx={cx} cy={trackY} r={compact ? 5 : 6} style={{ fill: "var(--scene-card)" }} stroke="var(--scene-hairline)" strokeWidth={1.25} />}
              </g>;
            })}
          </>;
        })()}
        {compact
          ? <Text x={ch.x + 242} y={ch.y + 37} size={12} weight={600} font="mono" tone="muted" opacity={easeOut(frame, T.ticks + 30, T.ticks + 50)}>{fr ? "60–90 min · un livrable" : "60–90 min · a deliverable"}</Text>
          : <g opacity={easeOut(frame, T.ticks + 30, T.ticks + 50)}>
            <Text x={ch.x + 16} y={ch.y + 74} size={12.5} weight={600} font="mono" tone="muted">{fr ? "vrai code → un livrable, pas un quiz" : "real code → a deliverable, not a quiz"}</Text>
          </g>}
      </Box>
    </g>
    <Comet points={practiceLink} t={ease(frame, T.practice, T.practiceFlip)} tone="ok" r={5.5} tail={.3} />

    {/* Slack-first, failure-friendly. */}
    <g {...enter(frame, T.slack - 8)}>
      <Box x={slack.x} y={slack.y} w={slack.w} h={slack.h} tone="line" focus={methodFocus(T.slack + 10) * .6} radius={14}>
        <Text x={slack.x + 16} y={slack.y + (compact ? 16 : 22)} size={11} weight={600} font="mono" tone="muted" caps>{fr ? "slack-first · sans classement" : "slack-first · no ranking"}</Text>
        {messages.map((message, index) => {
          const at = T.messages[index]!;
          const mx = compact ? slack.x + 16 + index * (fr ? 212 : 206) : slack.x + 16;
          const my = compact ? slack.y + 38 : slack.y + 44 + index * 22;
          return <g key={index} {...enter(frame, at, { from: "left", distance: 10, dur: 14 })}>
            <circle cx={mx + 6} cy={my} r={7} style={{ fill: tint(message.tone, 16) }} />
            <Text x={mx + 6} y={my + .5} size={10.5} weight={700} font="mono" tone={message.tone} anchor="middle">{message.glyph}</Text>
            <Text x={mx + 20} y={my} size={compact ? 13 : 14} weight={600}>{message.text[locale]}</Text>
          </g>;
        })}
      </Box>
    </g>

    {/* The plugin forms where the workflow lands. */}
    {frame >= T.plugin - 6 ? <g {...enter(frame, T.plugin - 6, { dur: 16, distance: 8 })}>
      <Box x={plugin.x} y={plugin.y} w={plugin.w} h={plugin.h} tone={pluginDone ? "ok" : "hot"} focus={during(frame, T.plugin, T.installed + 10, 10)} radius={14}>
        <Text x={plugin.x + 16} y={plugin.y + (compact ? 17 : 20)} size={11} weight={600} font="mono" tone="muted" caps>plugin</Text>
        <Text x={plugin.x + (compact ? 84 : 84)} y={plugin.y + (compact ? 17 : 20)} size={compact ? 14 : 15} weight={700} font="mono" tone="ok">{typedName}</Text>
        {frame >= T.typed && !pluginDone ? <rect x={plugin.x + 84 + typedName.length * (compact ? 8.4 : 9) + 1} y={plugin.y + (compact ? 9 : 11)} width={2} height={compact ? 16 : 18} fill={TONE.ok} /> : null}
        {(fr ? ["versionné", "documenté", "installable"] : ["versioned", "documented", "installable"]).map((word, index) => {
          const tagX = plugin.x + 16 + index * (compact ? 96 : 92);
          return <Tag key={word} x={tagX} y={plugin.y + plugin.h - (compact ? 14 : 16)} anchor="start" text={word} tone="ok" size={10.5} appear={pop(frame, stagger(index, T.typed + 18, 4))} />;
        })}
      </Box>
    </g> : null}

    {/* The workflow chip in flight. */}
    {liftT > 0 && liftT < 1 ? <g transform={`translate(${chipX} ${chipY}) scale(${1 + .12 * Math.sin(Math.PI * liftT)})`}>
      <g className="scene-glow" style={{ color: TONE.hot }}>
        <Tag x={0} y={0} text="workflow" tone="hot" size={12} />
      </g>
    </g> : null}
    {frame >= T.plugin && frame < T.plugin + 44 ? <Pulse x={liftTo[0]} y={liftTo[1]} frame={frame} at={T.plugin} period={44} r={12} tone="hot" /> : null}

    {/* Installed by the team: the plugin travels the same trunk as the access did. */}
    {installLinks.map((points, index) => {
      const at = stagger(index, T.install, 4);
      return <g key={index}>
        <Wire d={toPath(points)} draw={ease(frame, at, at + 20)} tone="ok" width={1.25} opacity={.55 * (1 - ease(frame, T.installed + 40, T.installed + 70))} />
        <Comet points={points} t={ease(frame, at, at + 22)} tone="ok" r={5} tail={.3} />
        {frame >= at + 22 && frame < at + 62 ? <Pulse x={points.at(-1)![0]} y={points.at(-1)![1]} frame={frame} at={at + 22} period={40} r={8} tone="ok" /> : null}
      </g>;
    })}

    {/* Rocket: a tiny orbit around the access card, purely decorative. */}
    <g className="scene-only-rocket" opacity={.8 * easeOut(frame, 10, 40)}>
      <ellipse cx={access.x + access.w - 60} cy={access.y + access.h / 2} rx={82} ry={18} fill="none" stroke={TONE.line} strokeOpacity={.4} strokeWidth={1} strokeDasharray="2 6" strokeDashoffset={-frame * .5} />
    </g>
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "Access is not practice", fr: "L’accès n’est pas la pratique" },
  caption: {
    en: "Giving everyone a coding agent does not produce better engineering. The Challenges build the practice; plugins carry what proved useful to the whole team.",
    fr: "Donner un agent de code à chacun ne produit pas une meilleure ingénierie. Les challenges construisent la pratique ; les plugins transmettent à toute l’équipe ce qui a fait ses preuves.",
  },
  beats: [
    { at: 0, text: { en: "Same agent, no method: a useful workflow stays private, context goes stale, a diff can’t be reviewed.", fr: "Même agent, sans méthode : un workflow reste privé, le contexte vieillit, une diff n’est pas reviewable." } },
    { at: T.challenges, text: { en: "The Challenges: ten short challenges on real code, 60 to 90 minutes each, each ending in a deliverable.", fr: "Les challenges : dix exercices courts sur du vrai code, 60 à 90 minutes, chacun avec un livrable." } },
    { at: T.slack, text: { en: "Slack-first and failure-friendly: share the prompt that worked and the approach that failed. No ranking.", fr: "Slack-first : on partage le prompt qui a marché et l’approche qui a échoué. Pas de classement." } },
    { at: T.lift - 4, text: { en: "A proven workflow leaves one terminal: it becomes a versioned, documented, installable plugin.", fr: "Un workflow éprouvé quitte un seul terminal : il devient un plugin versionné, documenté, installable." } },
    { at: T.score, text: { en: "Its PR skill scores the change’s complexity and warns when a pull request should be split.", fr: "Son skill de PR estime la complexité et avertit quand une pull request doit être découpée." } },
  ],
  Stage,
});
