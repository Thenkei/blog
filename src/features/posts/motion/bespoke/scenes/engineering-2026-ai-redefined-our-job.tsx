import { Box, Comet, ease, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, Wire, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// An altitude map of the job, between two poles: "what I want" (top) and "what
// the compiler forces me to type" (bottom). Act 1: the engineer lives in the
// friction band and drags each intent through syntax, boilerplate and context
// windows by hand. Act 2: Claude Code, embedded in the terminal, the repo and the
// project, absorbs the friction chips; the engineer climbs to the engineering
// band (tradeoffs, design for failure, reading systems, review).
const T = {
  intro: 0,
  hand: [[56, 72], [72, 84], [96, 108], [120, 134], [146, 160]] as const,
  arrive: [84, 108, 134] as const,
  byHand: 168,
  act2: 206,
  plugs: [226, 234, 242] as const,
  absorb: [244, 254, 264] as const,
  climb: [268, 300] as const,
  work: [296, 304, 312, 320] as const,
  conduit: 322,
  ship: 356,
  end: 470,
} as const;

type Pt = readonly [number, number];

const FRICTION = {
  en: ["syntax", "boilerplate", "context windows"],
  fr: ["syntaxe", "boilerplate", "limites de contexte"],
} as const;
const WORK = {
  en: ["tradeoffs", "design for failure", "reading systems", "review"],
  fr: ["compromis", "design résilient", "lire les systèmes", "revue"],
} as const;
const PLUGS = { en: ["terminal", "repo", "project"], fr: ["terminal", "dépôt", "projet"] } as const;

const chipW = (text: string, size: number) => text.length * size * .6 + size * 1.5;

/** Progress along a polyline where each segment has its own [start, end] frames (holds in between). */
function keyed(frame: number, segments: readonly (readonly [number, number])[]) {
  return segments.reduce((sum, [start, end]) => sum + ease(frame, start, end), 0) / segments.length;
}

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const act2 = frame >= T.act2;
  const friction = FRICTION[locale];
  const work = WORK[locale];
  const chip = compact ? 12.5 : 13;

  // ── Geometry ──────────────────────────────────────────────────────────────
  const G = compact
    ? {
      left: 20, right: 520, topY: 112, bottomY: 392,
      eng: { y: 136, h: 106 }, fri: { y: 262, h: 106 },
      engineer: { x: 32, w: 124, h: 42 },
      chipX: 172, chipRows: [40, 74],
      claude: { x: 172, y: 270, w: 336, h: 90 },
      conduitX: 470,
    }
    : {
      left: 40, right: 920, topY: 104, bottomY: 340,
      eng: { y: 130, h: 78 }, fri: { y: 234, h: 78 },
      engineer: { x: 200, w: 150, h: 44 },
      chipX: 468, chipRows: [22, 56],
      claude: { x: 700, y: 226, w: 220, h: 100 },
      conduitX: 810,
    };
  const bandMid = (band: { y: number; h: number }) => band.y + band.h / 2;
  const engineerRow = (band: { y: number; h: number }) => compact ? band.y + 36 : bandMid(band) - G.engineer.h / 2;

  // Act 1 friction chips: one row in wide, two rows in compact.
  const frictionAt = (i: number): Pt => compact
    ? i < 2 ? [G.chipX + (i === 0 ? 0 : chipW(friction[0], chip) + 10) + chipW(friction[i]!, chip) / 2, G.fri.y + G.chipRows[0]!] : [G.chipX + chipW(friction[2], chip) / 2, G.fri.y + G.chipRows[1]!]
    : [[500, 620, 780][i]!, bandMid(G.fri)];
  const workAt = (i: number): Pt => {
    const row = i < 2 ? 0 : 1;
    const first = work[row * 2]!;
    const x = i % 2 === 0 ? G.chipX : G.chipX + chipW(first, chip) + 10;
    return [x + chipW(work[i]!, chip) / 2, G.eng.y + G.chipRows[row]!];
  };

  // ── Engineer ──────────────────────────────────────────────────────────────
  const climb = ease(frame, T.climb[0], T.climb[1]);
  const engineerY = lerp(engineerRow(G.fri), engineerRow(G.eng), climb);
  const engineerMid: Pt = [G.engineer.x + G.engineer.w / 2, engineerY + G.engineer.h / 2];

  // Act 1: the intent is dragged by hand through each friction chip, with holds.
  const handPath: Pt[] = [
    [engineerMid[0], G.topY],
    [engineerMid[0], engineerRow(G.fri)],
    ...[0, 1, 2].map((i) => frictionAt(i)),
    compact ? [frictionAt(2)[0], G.bottomY] : [frictionAt(2)[0], G.bottomY],
  ];
  const handT = keyed(frame, T.hand);
  const act1Out = 1 - ease(frame, T.act2 - 10, T.act2 + 6);
  const arrived = (i: number) => frame >= T.arrive[i]!;

  // ── Act 2 ─────────────────────────────────────────────────────────────────
  const claudeIn = enter(frame, T.act2, { from: "right", distance: 24 });
  const conduit = ease(frame, T.conduit, T.conduit + 16);
  const plugIn = (i: number) => frame >= T.plugs[i]! ? pop(frame, T.plugs[i]!) : 0;

  const bandRect = (band: { y: number; h: number }, tone: Tone, strength: number) =>
    <rect x={G.left} y={band.y} width={G.right - G.left} height={band.h} rx={16} style={{ fill: tint(tone, strength) }} />;
  const frictionHot = act2 ? 0 : 1;
  const engLit = ease(frame, T.climb[0], T.climb[1]);

  return <g>
    {/* Poles. */}
    <g {...enter(frame, 0)}>
      <Text x={G.left} y={G.topY - 18} size={compact ? 20 : 22} weight={650} tone="hot">{fr ? "« ce que je veux »" : "“what I want”"}</Text>
      <line x1={G.left} x2={G.right} y1={G.topY} y2={G.topY} stroke={TONE.hot} strokeOpacity={.5} strokeWidth={1.25} />
    </g>
    <g {...enter(frame, 8)}>
      <line x1={G.left} x2={G.right} y1={G.bottomY} y2={G.bottomY} stroke={TONE.line} strokeOpacity={.5} strokeWidth={1.25} />
      <Text x={G.left} y={G.bottomY + 20} size={compact ? 13 : 14} font="mono" weight={600} tone="line">{fr ? "ce que le compilateur m'oblige à taper" : "what the compiler forces me to type"}</Text>
    </g>

    {/* Bands: engineering (high) and friction (low). */}
    <g {...enter(frame, 4, { from: "none" })}>
      {bandRect(G.eng, act2 ? "hot" : "ink", lerp(3, 7, engLit))}
      <Text x={compact ? G.left + 12 : G.left + 16} y={G.eng.y + (compact ? 16 : G.eng.h / 2)} size={11} font="mono" weight={600} tone={act2 ? "hot" : "muted"} caps opacity={lerp(.7, 1, engLit)}>{fr ? "ingénierie" : "engineering"}</Text>
    </g>
    <g {...enter(frame, 10, { from: "none" })}>
      {bandRect(G.fri, act2 ? "ink" : "danger", act2 ? 3 : 5)}
      <Text x={compact ? G.left + 12 : G.left + 16} y={G.fri.y + (compact ? 16 : G.fri.h / 2)} size={11} font="mono" weight={600} tone={act2 ? "muted" : "danger"} caps>{fr ? "friction" : "friction"}</Text>
    </g>

    {/* Hand trace + the intent being dragged. */}
    <g opacity={act1Out * frictionHot}>
      <path d={`M${handPath.map(([x, y]) => `${x} ${y}`).join("L")}`} fill="none" stroke={TONE.danger} strokeOpacity={.45} strokeWidth={1.5} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - handT} />
      <Comet points={handPath} t={handT < 1 && frame >= T.hand[0][0] ? Math.max(.001, handT) : 0} tone="hot" r={5.5} tail={.05} />
    </g>
    {/* Act 1: friction chips; act 2: they fly into Claude Code and vanish. */}
    {friction.map((word, i) => {
      const [x, y] = frictionAt(i);
      const at = stagger(i, 26, 6);
      const target: Pt = [G.claude.x + G.claude.w / 2, G.claude.y + G.claude.h / 2];
      const suck = ease(frame, T.absorb[i]!, T.absorb[i]! + 26);
      const cx = lerp(x, target[0], suck);
      const cy = lerp(y, target[1], suck) - Math.sin(Math.PI * suck) * 26;
      const lit = !act2 && arrived(i) ? 1 - ease(frame, T.arrive[i]! + 14, T.arrive[i]! + 40) * .5 : 0;
      if (frame < at || suck >= 1) return null;
      return <g key={word} opacity={1 - ease(frame, T.absorb[i]! + 16, T.absorb[i]! + 26)} transform={`translate(${cx} ${cy}) scale(${1 - .45 * suck}) translate(${-cx} ${-cy})`}>
        <Tag x={cx} y={cy} text={word} tone={lit > 0 || frame >= T.byHand ? "danger" : "muted"} size={chip} appear={Math.min(1, pop(frame, at))} />
        {lit > 0 && frame < T.arrive[i]! + 30 ? <Pulse x={cx} y={cy} frame={frame} at={T.arrive[i]} period={30} r={12} tone="danger" /> : null}
      </g>;
    })}

    {/* Autocomplete: helps only at the very bottom. */}
    <g opacity={act1Out}>
      <Tag x={G.right - 4} y={G.bottomY} anchor="end" text={fr ? "autocomplétion" : "autocomplete"} tone="muted" size={12} appear={enter(frame, 44).opacity} />
      {frame >= T.hand[4][1] && frame < T.hand[4][1] + 36 ? <Pulse x={G.right - 4 - chipW(fr ? "autocomplétion" : "autocomplete", 12) / 2} y={G.bottomY} frame={frame} at={T.hand[4][1]} period={36} r={10} tone="line" /> : null}
    </g>

    <Tag x={compact ? G.right - 4 : 560} y={compact ? G.bottomY + 50 : G.bottomY + 20} anchor={compact ? "end" : "middle"} text={fr ? "traduction à la main" : "translation by hand"} tone="danger" size={12.5} appear={pop(frame, T.byHand) * act1Out} />

    {/* Act 2: Claude Code, plugged into the real project. */}
    {act2 ? <g {...claudeIn}>
      <Box x={G.claude.x} y={G.claude.y} w={G.claude.w} h={G.claude.h} tone="line" radius={16} focus={during(frame, T.absorb[0], T.absorb[2] + 24) * .8}>
        <Text x={G.claude.x + 16} y={G.claude.y + 24} size={17} weight={650}>Claude Code</Text>
        <Text x={G.claude.x + 16} y={G.claude.y + (compact ? 44 : 46)} size={12.5} font="mono" weight={600} tone="line">{fr ? "collaborateur actif" : "active collaborator"}</Text>
        {PLUGS[locale].map((plug, i) => {
          const widths = PLUGS[locale].map((p) => chipW(p, 11));
          const x = G.claude.x + 16 + widths.slice(0, i).reduce((sum, w) => sum + w + 6, 0);
          return <Tag key={plug} x={x} y={G.claude.y + G.claude.h - 22} anchor="start" text={plug} tone="line" size={11} appear={plugIn(i)} />;
        })}
      </Box>
    </g> : null}

    {/* Conduit: intent flows straight down through Claude Code to the compiler. */}
    {act2 ? <g opacity={conduit}>
      <Wire d={`M${G.conduitX} ${G.topY + 4}V${G.claude.y - 4}`} tone="hot" width={1.5} flow={frame} draw={conduit} />
      <Wire d={`M${G.conduitX} ${G.claude.y + G.claude.h + 2}V${G.bottomY - 3}`} tone="line" width={1.5} flow={frame} draw={conduit} />
    </g> : null}

    {/* Engineering band work, around the engineer once it has climbed. */}
    {work.map((word, i) => {
      const [x, y] = workAt(i);
      const lit = frame >= T.work[i]! ? pop(frame, T.work[i]!) : 0;
      // Act 1: the work the day never reaches, as faint outlines.
      const ghost = enter(frame, stagger(i, 30, 5)).opacity * (1 - Math.min(1, lit * 2));
      return <g key={word}>
        {ghost > 0 ? <g opacity={ghost * .42}>
          <rect x={x - chipW(word, chip) / 2} y={y - chip - 1} width={chipW(word, chip)} height={chip * 2 + 2} rx={chip + 1} fill="none" style={{ stroke: "var(--scene-hairline)" }} strokeDasharray="3 4" />
          <Text x={x} y={y + .5} size={chip} font="mono" weight={600} tone="muted" anchor="middle">{word}</Text>
        </g> : null}
        <Tag x={x} y={y} text={word} tone="hot" size={chip} appear={lit} />
      </g>;
    })}

    {/* The engineer. */}
    <g {...enter(frame, 18, { distance: 12 })}>
      <Box x={G.engineer.x} y={engineerY} w={G.engineer.w} h={G.engineer.h} tone="hot" radius={12} focus={act2 ? during(frame, T.climb[0], T.climb[1] + 30) : during(frame, T.hand[0][0], T.hand[4][1])} label={fr ? "ingénieur" : "engineer"} labelSize={compact ? 15 : 16} />
    </g>

    <Tag x={G.right - 4} y={compact ? G.bottomY + 50 : G.bottomY + 20} anchor="end" text={fr ? "moins à la main · plus livré" : "less by hand · more shipped"} tone="ok" size={12.5} appear={frame >= T.ship ? pop(frame, T.ship) : 0} />

    {/* Theme flourish: a summit marker on the engineering band (mountain). */}
    <g className="scene-only-mountain" opacity={engLit}>
      <path d={`M${G.engineer.x + G.engineer.w - 16} ${engineerY - 4}l7 -12l7 12z`} style={{ fill: tint("hot", 75) }} />
    </g>
  </g>;
}

function during(frame: number, start: number, end: number) {
  return Math.min(ease(frame, start, start + 10), 1 - ease(frame, end - 10, end));
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: 430,
  title: { en: "Engineering at a different altitude", fr: "L'ingénierie à une autre altitude" },
  caption: {
    en: "The leverage was not typing faster. An active collaborator embedded in the terminal, the repo and the project absorbs the translation from “what I want” to what the compiler needs, and the engineer's time moves up to tradeoffs, design and review.",
    fr: "Le levier n'était pas de taper plus vite. Un collaborateur actif, intégré au terminal, au dépôt et au projet, absorbe la traduction entre « ce que je veux » et ce qu'exige le compilateur, et le temps de l'ingénieur remonte vers les compromis, le design et la revue.",
  },
  beats: [
    { at: 0, text: { en: "Before: “what I want” is translated by hand into what the compiler forces me to type.", fr: "Avant : « ce que je veux » se traduit à la main jusqu'à ce qu'exige le compilateur." } },
    { at: 80, text: { en: "Syntax, boilerplate, context windows: the day stays at the lowest altitude, with autocomplete at best.", fr: "Syntaxe, boilerplate, limites de contexte : la journée reste à basse altitude, l'autocomplétion au mieux." } },
    { at: T.act2, text: { en: "Claude Code: an active collaborator embedded in the terminal, the repo and the project.", fr: "Claude Code : un collaborateur actif, intégré au terminal, au dépôt et au projet." } },
    { at: T.absorb[0], text: { en: "It absorbs the translation. The engineer climbs to tradeoffs, design for failure and review.", fr: "Il absorbe la traduction. L'ingénieur remonte vers les compromis, le design résilient et la revue." } },
    { at: T.ship, text: { en: "Less code written by hand, and yet more shipped. The leverage is the gap it closes.", fr: "Moins de code écrit à la main, et pourtant on livre davantage. Le levier, c'est l'écart qu'il comble." } },
  ],
  Stage,
});
