import { useId } from "react";
import { Box, ease, easeOut, enter, hash, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Rhythm break. Two counters tell the joke: the AI writes 0 → 500 lines in a
// second; the human, reading, crawls from line 1. Meanwhile the reviewer bots
// argue with each other, catch the hallucinated crypto library, and leave the
// subtle race condition to the human. Then the API goes down: the bots go
// quiet, the writer panel asks for a 150-line migration by hand, and the human
// counter keeps crawling.
const T = {
  write: [12, 40] as const,
  done: 42,
  read: 54,
  comments: [84, 110, 134, 174, 214] as const,
  outage: 272,
  butter: 304,
  end: 400,
} as const;

// Deterministic code silhouette: [indent, width] per row.
const ROWS: readonly (readonly [number, number])[] = Array.from({ length: 40 }, (_, i) => {
  const indent = [0, 1, 2, 2, 1, 2, 3, 2, 1, 0][i % 10]!;
  return [indent, .3 + .6 * hash(i + 3)] as const;
});
const FLAG_ROW = 7;

type Comment = { author: { en: string; fr: string }; text: { en: string; fr: string }; tone: Tone; bot: boolean };
const COMMENTS: readonly Comment[] = [
  { author: { en: "reviewer skill · Claude", fr: "skill de relecture · Claude" }, text: { en: "cyclomatic complexity too high", fr: "trop de complexité cyclomatique" }, tone: "line", bot: true },
  { author: { en: "Codex", fr: "Codex" }, text: { en: "disagree.", fr: "pas d'accord." }, tone: "line", bot: true },
  { author: { en: "reviewer skill · Claude", fr: "skill de relecture · Claude" }, text: { en: "disagree with your disagreement.", fr: "pas d'accord avec ton désaccord." }, tone: "line", bot: true },
  { author: { en: "Codex", fr: "Codex" }, text: { en: "✗ that crypto library doesn't exist", fr: "✗ cette lib crypto n'existe pas" }, tone: "danger", bot: true },
  { author: { en: "you", fr: "vous" }, text: { en: "race condition here?", fr: "race condition ici ?" }, tone: "hot", bot: false },
];

/** Code silhouette in a clipped window; `scroll` is in rows. */
function CodeRows({ x, y, w, h, rowH, scroll, visible = ROWS.length, tone = "ink" }: { x: number; y: number; w: number; h: number; rowH: number; scroll: number; visible?: number; tone?: Tone }) {
  const id = `rows${useId().replaceAll(":", "")}`;
  return <g>
    <defs><clipPath id={id}><rect x={x - 6} y={y} width={w + 12} height={h} /></clipPath></defs>
    <g clipPath={`url(#${id})`}>
      {ROWS.map(([indent, width], index) => {
        if (index >= visible) return null;
        const ry = y + (index - scroll) * rowH;
        if (ry < y - rowH || ry > y + h) return null;
        const kind = index % 7 === 3 ? "ok" : index % 5 === 1 ? "line" : tone;
        return <rect key={index} x={x + indent * 12} y={ry + rowH * .32} width={Math.max(10, (w - indent * 12) * width)} height={rowH * .36} rx={rowH * .18} style={{ fill: tint(kind, kind === "ink" ? 26 : 60) }} />;
      })}
    </g>
  </g>;
}

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const outage = ease(frame, T.outage, T.outage + 14);
  const botsOff = outage;

  // ── Geometry ──────────────────────────────────────────────────────────────
  const W = compact
    ? { x: 20, y: 54, w: 500, h: 122 }
    : { x: 40, y: 64, w: 290, h: 316 };
  const R = compact
    ? { x: 20, y: 188, w: 500, h: 312 }
    : { x: 350, y: 64, w: 570, h: 316 };
  const read = compact
    ? { x: R.x + 18, y: R.y + 86, w: 140, h: 206, rowH: 14 }
    : { x: R.x + 20, y: R.y + 92, w: 200, h: 204, rowH: 17 };
  const bubbles = compact
    ? { x: R.x + 176, y: R.y + 44, w: 308, h: 46, gap: 6 }
    : { x: R.x + 244, y: R.y + 42, w: 306, h: 48, gap: 6 };

  // Writing: 0 → 500 lines in about a second, the rows streaming past.
  const written = Math.round(500 * easeOut(frame, T.write[0], T.write[1]));
  const writeScroll = ease(frame, T.write[0], T.write[1], (t) => t) * 26;
  // Reading: line 1 → 15 over the rest of the clip, still crawling after the outage.
  const readLine = 1 + Math.floor(14 * ease(frame, T.read, T.end, (t) => t));
  const flagged = frame >= T.comments[4];
  const cursor = flagged ? FLAG_ROW : lerp(0, 3.4, ease(frame, T.read, T.comments[4], (t) => t));
  const cursorY = read.y + cursor * read.rowH;

  const writerContent = 1 - outage;

  return <g>
    {/* WRITING · AI */}
    <g {...enter(frame, 0, { distance: 12 })}>
      <Box x={W.x} y={W.y} w={W.w} h={W.h} tone={frame >= T.outage ? "danger" : frame >= T.done ? "ok" : "line"} radius={16} fill={frame >= T.done && frame < T.outage ? .25 * (1 - ease(frame, T.done + 20, T.done + 60)) : 0}>
        <Text x={W.x + 18} y={W.y + 24} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "écrire · IA" : "writing · AI"}</Text>
        <Tag x={W.x + W.w - 14} y={W.y + 24} anchor="end" size={11} text={fr ? "fini" : "done"} tone="ok" appear={frame >= T.done ? pop(frame, T.done) * writerContent : 0} />
        <g opacity={writerContent}>
          <Text x={W.x + 18} y={W.y + (compact ? 70 : 86)} size={compact ? 44 : 60} weight={700} tone={frame >= T.done ? "ok" : "ink"}>{String(written)}</Text>
          <Text x={W.x + 20} y={W.y + (compact ? 104 : 124)} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "lignes générées" : "lines generated"}</Text>
          <CodeRows x={compact ? W.x + 200 : W.x + 20} y={compact ? W.y + 40 : W.y + 146} w={compact ? 280 : W.w - 40} h={compact ? 72 : 150} rowH={compact ? 9 : 15} scroll={writeScroll} visible={frame < T.write[0] ? 0 : ROWS.length} />
        </g>
        {/* Outage: the writer panel asks the unthinkable. */}
        <g opacity={outage}>
          <Tag x={W.x + 18} y={W.y + (compact ? 56 : 72)} anchor="start" text={fr ? "panne d'API" : "API outage"} tone="danger" size={13} appear={outage} />
          <Text x={W.x + 18} y={W.y + (compact ? 88 : 122)} size={compact ? 16 : 19} weight={650}>{fr ? "Migration de 150 lignes" : "150-line schema migration"}</Text>
          <Text x={W.x + 18} y={W.y + (compact ? 108 : 148)} size={compact ? 14 : 16} font="mono" weight={600} tone="danger">{fr ? "…à la main ?" : "…by hand?"}</Text>
          <Tag x={compact ? W.x + W.w - 14 : W.x + 18} y={compact ? W.y + 98 : W.y + 204} anchor={compact ? "end" : "start"} text={fr ? "≈ baratter son beurre" : "≈ churning your own butter"} tone="hot" size={compact ? 12 : 12.5} appear={frame >= T.butter ? pop(frame, T.butter) : 0} />
          {!compact ? <g opacity={ease(frame, T.butter + 10, T.butter + 30)}>
            {/* A butter churn, drawn in hairlines: the only illustration in the scene. */}
            <g transform={`translate(${W.x + W.w / 2} ${W.y + 272})`}>
              <path d="M-26 -20L-20 26H20L26 -20Z" fill="none" style={{ stroke: TONE.hot }} strokeWidth={1.25} strokeLinejoin="round" />
              <line x1={-28} x2={28} y1={-20} y2={-20} style={{ stroke: TONE.hot }} strokeWidth={1.25} />
              <line x1={0} x2={0} y1={-48 + 8 * Math.sin(frame * .25)} y2={10 + 8 * Math.sin(frame * .25)} style={{ stroke: TONE.hot }} strokeWidth={1.5} strokeLinecap="round" />
              <line x1={-9} x2={9} y1={10 + 8 * Math.sin(frame * .25)} y2={10 + 8 * Math.sin(frame * .25)} style={{ stroke: TONE.hot }} strokeWidth={1.5} strokeLinecap="round" />
            </g>
          </g> : null}
        </g>
      </Box>
    </g>

    {/* REVIEWING · YOU */}
    <g {...enter(frame, T.read - 16, { distance: 12 })}>
      <Box x={R.x} y={R.y} w={R.w} h={R.h} tone="hot" radius={16}>
        <Text x={R.x + 18} y={R.y + 24} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "relire · vous" : "reviewing · you"}</Text>
        {/* The human counter: the only number that moves slowly. */}
        <Text x={read.x} y={R.y + (compact ? 58 : 64)} size={compact ? 22 : 30} weight={700} tone="hot">{fr ? `ligne ${readLine}` : `line ${readLine}`}</Text>
        <Text x={read.x + (fr ? `ligne ${readLine}` : `line ${readLine}`).length * (compact ? 22 : 30) * .56 + 8} y={R.y + (compact ? 60 : 66)} size={13} font="mono" weight={600} tone="muted">/ 500</Text>
        <rect x={read.x - 8} y={cursorY} width={read.w + 16} height={read.rowH} rx={5} style={{ fill: tint("hot", 20) }} />
        <CodeRows x={read.x} y={read.y} w={read.w} h={read.h} rowH={read.rowH} scroll={0} />
        {flagged ? <Pulse x={read.x - 8} y={read.y + FLAG_ROW * read.rowH + read.rowH / 2} frame={frame} at={T.comments[4]} period={44} r={6} tone="hot" /> : null}
      </Box>
    </g>

    {COMMENTS.map((comment, index) => {
      const at = T.comments[index]!;
      if (frame < at) return null;
      const appear = pop(frame, at);
      const y = bubbles.y + index * (bubbles.h + bubbles.gap);
      const human = !comment.bot;
      const off = comment.bot ? botsOff : 0;
      const tone: Tone = off > .5 ? "muted" : comment.tone;
      return <g key={index} opacity={Math.min(1, appear) * (1 - .55 * off)} transform={`translate(${(1 - Math.min(1, appear)) * 14} 0)`}>
        <Box x={bubbles.x} y={y} w={bubbles.w} h={bubbles.h} tone={human ? "hot" : comment.tone === "danger" ? "danger" : "line"} radius={12} focus={human ? ease(frame, at, at + 10) * .8 : 0}>
          <Text x={bubbles.x + 14} y={y + 15} size={11} font="mono" weight={600} tone={human ? "hot" : "muted"}>{comment.author[locale]}</Text>
          <Text x={bubbles.x + 14} y={y + 33} size={compact ? 14 : 15} weight={600} tone={tone === "line" ? "ink" : tone}>{comment.text[locale]}</Text>
        </Box>
        {comment.bot && off > 0 ? <Tag x={bubbles.x + bubbles.w - 12} y={y + 15} anchor="end" text="offline" tone="muted" size={10.5} appear={ease(frame, T.outage + stagger(index, 4, 3), T.outage + stagger(index, 14, 3))} /> : null}
      </g>;
    })}

    {/* The human comment points at the line it questions. */}
    {flagged ? <path
      d={`M${read.x + read.w + 10} ${read.y + FLAG_ROW * read.rowH + read.rowH / 2}C${read.x + read.w + 20} ${read.y + FLAG_ROW * read.rowH + read.rowH / 2} ${bubbles.x - 20} ${bubbles.y + 4 * (bubbles.h + bubbles.gap) + bubbles.h / 2} ${bubbles.x - 4} ${bubbles.y + 4 * (bubbles.h + bubbles.gap) + bubbles.h / 2}`}
      fill="none" stroke={TONE.hot} strokeWidth={1.25} strokeDasharray="3 4" opacity={ease(frame, T.comments[4] + 4, T.comments[4] + 16)}
    /> : null}

    {/* Theme flourish: a slow orbit around the human counter (rocket). */}
    <g className="scene-only-rocket" opacity={.6 * ease(frame, T.read, T.read + 20)}>
      <ellipse cx={R.x + R.w - 40} cy={R.y + 28} rx={16} ry={6} fill="none" style={{ stroke: tint("hot", 60) }} strokeWidth={1} strokeDasharray="2 4" strokeDashoffset={-frame * .5} />
    </g>
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: 250,
  title: { en: "Writing is instant. Reading isn't.", fr: "Écrire est instantané. Relire, non." },
  caption: {
    en: "AI made producing code cheap; it did not make deciding whether the code should ship any cheaper. Reviewer bots clear the first pass, the subtle question stays human, and the whole setup still depends on the API being up.",
    fr: "L'IA a rendu la production de code bon marché, pas la décision de la livrer. Les bots relecteurs font la première passe, la question subtile reste humaine, et tout le dispositif dépend encore de l'API.",
  },
  beats: [
    { at: 0, text: { en: "Writing: the AI drops 500 lines. Done.", fr: "Écrire : l'IA pose 500 lignes. Fini." } },
    { at: T.read, text: { en: "Reviewing: the same 500 lines, line by line. Reading code is harder than writing it.", fr: "Relire : les mêmes 500 lignes, ligne par ligne. Lire du code est plus dur que l'écrire." } },
    { at: T.comments[0], text: { en: "Fight fire with fire: let the bots argue about cyclomatic complexity before you look.", fr: "Soigner le mal par le mal : laisser les bots s'engueuler sur la complexité cyclomatique." } },
    { at: T.comments[3], text: { en: "They catch the crypto library that doesn't exist. The subtle race condition is still yours to find.", fr: "Ils repèrent la librairie crypto qui n'existe pas. La race condition subtile reste à vous." } },
    { at: T.outage, text: { en: "Then the API goes down, and a 150-line migration by hand feels like churning your own butter.", fr: "Puis l'API tombe, et une migration de 150 lignes à la main, c'est baratter son propre beurre." } },
  ],
  Stage,
});
