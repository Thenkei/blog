import { Box, dim, during, ease, easeOut, enter, lerp, NBSP, pop, Pulse, stagger, Tag, Text, textWidth, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// The same refactor cut twice, read in order by a reviewer. Every number comes
// from the article's table; PRs are named by their position in the stack.
const FIRST = { prs: 29, read: 32_381, final: 22_051, churnFiles: 24 } as const;
const SECOND = { prs: 11, read: 24_120, final: 24_118, churnFiles: 0 } as const;
// Both pairs of bars share one scale: the largest sum of PR diffs.
const SCALE = FIRST.read;

// First stack: files created by an early PR and deleted by a later range of PRs.
// The article gives the creating positions (4, 6, 8, 14) and the deleting ranges
// (17 to 20 for the old path with the files of 4 and 6; 28 and 29 for the import,
// written in 8 and rewritten in 14), not a per-file mapping: one lane per creating PR.
const CHURN = [
  { from: 4, by: [17, 20] },
  { from: 6, by: [17, 20] },
  { from: 8, by: [28, 29] },
  { from: 14, by: [28, 29] },
] as const;
const DELETERS: ReadonlySet<number> = new Set([17, 18, 19, 20, 28, 29]);
// Positions labelled above the unnumbered chips of the compact canvas.
const MARKS = [
  { at: 4, text: "4" }, { at: 6, text: "6" }, { at: 8, text: "8" }, { at: 14, text: "14" },
  { at: 18.5, text: "17–20" }, { at: 28.5, text: "28–29" },
] as const;

// Second stack: what the article says about positions 3, 4 to 7 and 9.
const ROLES = [
  { id: "dead", from: 3, to: 3, tone: "line", line: 0 },
  { id: "unwired", from: 4, to: 7, tone: "line", line: 1 },
  { id: "switch", from: 9, to: 9, tone: "hot", line: 0 },
] as const satisfies readonly { id: string; from: number; to: number; tone: Tone; line: 0 | 1 }[];

type Sweep = readonly [number, number];

// Timeline (30 fps). Act A reads the 29 PRs, act B replays the read on the 11.
const T = {
  sweepA: [66, 196],
  finalA: 214,
  gapA: 250,
  stackB: 300,
  sweepB: [322, 421],
  finalB: 474,
  gapB: 508,
  end: 596,
} as const;

const linear = (t: number) => t;
const ROLE_TAG = 12;
/** Frame at which the reading cursor is over the centre of a position. */
const reach = (sweep: Sweep, count: number, position: number) => lerp(sweep[0], sweep[1], (position - .5) / count);
const FILES_A_AT = T.sweepA[1] + 4;
const FILES_B_AT = T.sweepB[1] + 6;
const SWITCH_AT = Math.round(reach(T.sweepB, SECOND.prs, 9));

/** Thousands separator of each locale, as the article writes its numbers. */
const group = (value: number, fr: boolean) => String(Math.round(value)).replace(/\B(?=(\d{3})+$)/g, fr ? NBSP : ",");

type Layout = {
  m: number;
  inset: number;
  a: { y: number; h: number };
  b: { y: number; h: number };
  titleY: number;
  /** Row of position labels above the first stack's chips (compact only). */
  marksY: number | undefined;
  chipsA: number;
  chipsB: number;
  chipH: number;
  chipGapA: number;
  lanesY: number;
  lanePitch: number;
  /** Y of the role chips under the second stack, per line. */
  rolesY: readonly [number, number];
  rowsA: readonly [number, number];
  rowsB: readonly [number, number];
  /** Columns of a bar row, from the inner left edge. */
  valueX: number;
  barX: number;
  barW: number;
  /** Row of verdict chips under the bars (compact only). */
  verdictA: number | undefined;
  verdictB: number | undefined;
  tag: number;
};

const WIDE_LAYOUT: Layout = {
  m: 40, inset: 20,
  a: { y: 52, h: 182 }, b: { y: 244, h: 158 },
  titleY: 21, marksY: undefined,
  chipsA: 38, chipsB: 38, chipH: 26, chipGapA: 4,
  lanesY: 79, lanePitch: 13,
  rolesY: [86, 86],
  rowsA: [142, 164], rowsB: [118, 140],
  valueX: 176, barX: 190, barW: 360,
  verdictA: undefined, verdictB: undefined, tag: 13,
};

const COMPACT_LAYOUT: Layout = {
  m: 20, inset: 16,
  a: { y: 52, h: 224 }, b: { y: 286, h: 210 },
  titleY: 21, marksY: 43,
  chipsA: 54, chipsB: 38, chipH: 24, chipGapA: 3,
  lanesY: 91, lanePitch: 12,
  rolesY: [83, 110],
  rowsA: [148, 169], rowsB: [135, 156],
  valueX: 158, barX: 170, barW: 298,
  verdictA: 197, verdictB: 184, tag: 12,
};

function Chip({ x, y, w, h, read, tone, label, appear }: {
  x: number;
  y: number;
  w: number;
  h: number;
  /** 0→1 once the reading cursor has passed. */
  read: number;
  tone: Tone;
  label?: string | undefined;
  appear: number;
}) {
  if (appear <= 0) return null;
  const rx = Math.min(6, w / 3);
  return <g opacity={appear} transform={`translate(0 ${(1 - appear) * 6})`}>
    <rect x={x} y={y} width={w} height={h} rx={rx} style={{ fill: "var(--scene-card)" }} stroke="var(--scene-hairline)" strokeWidth={1} />
    {read > 0 ? <rect x={x} y={y} width={w} height={h} rx={rx} style={{ fill: tint(tone, 22 * read) }} stroke={TONE[tone]} strokeOpacity={.75 * read} strokeWidth={1} /> : null}
    {label ? <Text x={x + w / 2} y={y + h / 2 + .5} size={13} weight={600} font="mono" anchor="middle" tone={read > .5 ? (tone === "line" ? "ink" : tone) : "muted"}>{label}</Text> : null}
  </g>;
}

/** End of a file lane: a disc carrying "+" (created) or "✗" (deleted). */
function Node({ x, y, glyph, tone, scale, opacity = 1 }: { x: number; y: number; glyph: "plus" | "cross"; tone: Tone; scale: number; opacity?: number | undefined }) {
  if (scale <= 0 || opacity <= 0) return null;
  const mark = glyph === "plus" ? "M-2.8 0H2.8M0 -2.8V2.8" : "M-2.1 -2.1L2.1 2.1M2.1 -2.1L-2.1 2.1";
  return <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <circle r={5.5} fill={TONE[tone]} />
    <path d={mark} fill="none" style={{ stroke: "var(--scene-card)" }} strokeWidth={1.6} strokeLinecap="round" />
  </g>;
}

/** A file across the stack: it starts under the PR that creates it and ends under the PRs that delete it. */
function Lane({ frame, x1, x2, y, head, bornAt, goneAt }: { frame: number; x1: number; x2: number; y: number; head: number; bornAt: number; goneAt: number }) {
  if (frame < bornAt) return null;
  const gone = ease(frame, goneAt, goneAt + 10);
  const w = Math.max(0, Math.min(head, x2) - x1);
  const born = pop(frame, bornAt, 200);
  return <g>
    <rect x={x1} y={y - 2.5} width={w} height={5} rx={2.5} fill={TONE.line} opacity={.5 * (1 - gone)} />
    <rect x={x1} y={y - 2.5} width={w} height={5} rx={2.5} fill={TONE.danger} opacity={.5 * gone} />
    <Node x={x1} y={y} glyph="plus" tone="line" scale={born} opacity={1 - gone} />
    <Node x={x1} y={y} glyph="plus" tone="danger" scale={born} opacity={gone} />
    {frame >= goneAt ? <Node x={x2} y={y} glyph="cross" tone="danger" scale={pop(frame, goneAt, 200)} /> : null}
    <Pulse x={x2} y={y} frame={frame} at={goneAt} period={30} r={6} tone="danger" once />
  </g>;
}

/** The reviewer's position in the stack. */
function Cursor({ x, top, bottom, opacity, pointer = true }: { x: number; top: number; bottom: number; opacity: number; pointer?: boolean | undefined }) {
  if (opacity <= 0) return null;
  return <g opacity={opacity}>
    <line x1={x} x2={x} y1={top} y2={bottom} stroke="var(--scene-ink)" strokeOpacity={.5} strokeWidth={1.25} strokeDasharray="3 3" />
    {pointer ? <path d={`M${x - 4.5} ${top - 6}h9l-4.5 6z`} style={{ fill: "var(--scene-ink)" }} opacity={.75} /> : null}
  </g>;
}

function Stage({ frame, compact, locale, width }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT_LAYOUT : WIDE_LAYOUT;
  const cardW = width - 2 * L.m;
  const left = L.m + L.inset;
  const innerW = cardW - 2 * L.inset;
  const right = left + innerW;
  const barX = left + L.barX;
  const barH = 8;
  const share = (lines: number) => L.barW * lines / SCALE;

  const copy = {
    a: { title: fr ? "Premier empilement" : "First stack", detail: compact ? (fr ? `29${NBSP}PR` : "29 PRs") : (fr ? `29${NBSP}PR, dans l'ordre du travail` : "29 PRs, in the order of the work") },
    b: { title: fr ? "Second empilement" : "Second stack", detail: compact ? (fr ? `11${NBSP}PR` : "11 PRs") : (fr ? `11${NBSP}PR, le même travail redécoupé` : "11 PRs, the same work sliced again") },
    read: fr ? "lignes à lire" : "lines to read",
    final: fr ? "diff final" : "final diff",
    filesA: fr ? `${FIRST.churnFiles} fichiers créés puis supprimés` : `${FIRST.churnFiles} files created then deleted`,
    filesB: fr ? `${SECOND.churnFiles} fichier créé puis supprimé` : `${SECOND.churnFiles} files created then deleted`,
    gap: (lines: number) => (fr ? `écart${NBSP}: ${group(lines, fr)} ligne${lines > 1 ? "s" : ""}` : `gap: ${group(lines, fr)} line${lines > 1 ? "s" : ""}`),
    roles: {
      dead: fr ? "code mort supprimé" : "dead code removed",
      unwired: fr ? "nouveau code, pas branché" : "new code, not wired",
      switch: fr ? "bascule" : "switch",
    },
  };

  // ── Act A: the cursor reads the 29 PRs in order.
  const pitchA = innerW / FIRST.prs;
  const cxA = (position: number) => left + (position - .5) * pitchA;
  const progressA = ease(frame, T.sweepA[0], T.sweepA[1], linear);
  const headA = left + progressA * innerW;
  const finalA = easeOut(frame, T.finalA + 4, T.finalA + 34);
  const gapInA = easeOut(frame, T.gapA - 10, T.gapA + 8);

  // ── Act B: the same read on the 11 PRs.
  const pitchB = innerW / SECOND.prs;
  const cxB = (position: number) => left + (position - .5) * pitchB;
  const progressB = ease(frame, T.sweepB[0], T.sweepB[1], linear);
  const headB = left + progressB * innerW;
  const finalB = easeOut(frame, T.finalB + 4, T.finalB + 30);
  const alignedB = easeOut(frame, T.gapB - 6, T.gapB + 10);

  // One stack holds the stage at a time; both come back for the comparison.
  const onB = ease(frame, T.stackB - 4, T.stackB + 16);
  const compare = ease(frame, T.gapB, T.gapB + 20);
  const opacityA = dim(onB - compare, .46);
  const opacityB = lerp(.46, 1, onB);

  const row = (y: number, label: string, lines: number, fill: string, valueOpacity = 1) => <>
    <Text x={left} y={y + .5} size={13} weight={500} font="mono" tone="muted">{label}</Text>
    <Text x={left + L.valueX} y={y + .5} size={13} weight={600} font="mono" anchor="end" opacity={valueOpacity}>{group(lines, fr)}</Text>
    <rect x={barX} y={y - barH / 2} width={L.barW} height={barH} rx={barH / 2} style={{ fill: tint("ink", 9) }} />
    {lines > 0 ? <rect x={barX} y={y - barH / 2} width={Math.max(barH, share(lines))} height={barH} rx={barH / 2} style={{ fill }} /> : null}
  </>;
  const readFill = TONE.line;
  const finalFill = tint("ink", 62);

  // One detail column for both cards, set by the longer of the two titles.
  const detailX = left + Math.max(textWidth(copy.a.title, 16, "display"), textWidth(copy.b.title, 16, "display")) + 16;
  const aY = L.a.y;
  const bY = L.b.y;
  const chipsAY = aY + L.chipsA;
  const marksY = L.marksY === undefined ? undefined : aY + L.marksY;
  const chipsBY = bY + L.chipsB;
  const lanesBottom = aY + L.lanesY + (CHURN.length - 1) * L.lanePitch + 8;
  const sideTagX = barX + L.barW + 14;

  return <>
    {/* First stack: 29 PRs in the order the work was done */}
    <g {...enter(frame, 0, { opacity: opacityA })}>
      <Box x={L.m} y={aY} w={cardW} h={L.a.h} tone="line" radius={16} focus={during(frame, T.sweepA[0] - 10, T.gapA + 36, 14)} />
      <Text x={left} y={aY + L.titleY} size={16} weight={600}>{copy.a.title}</Text>
      <Text x={detailX} y={aY + L.titleY + .5} size={13} weight={500} font="mono" tone="muted">{copy.a.detail}</Text>

      {marksY !== undefined ? <>
        <Text x={left} y={marksY} size={13} weight={500} font="mono" tone="muted">PR</Text>
        {MARKS.map((mark) => {
          const read = frame >= reach(T.sweepA, FIRST.prs, mark.at);
          return <Text key={mark.text} x={cxA(mark.at)} y={marksY} size={13} weight={600} font="mono" anchor="middle" tone={read ? (mark.at > 14 ? "danger" : "ink") : "muted"}>{mark.text}</Text>;
        })}
      </> : null}

      {Array.from({ length: FIRST.prs }, (_, index) => {
        const position = index + 1;
        const at = reach(T.sweepA, FIRST.prs, position);
        return <Chip
          key={position}
          x={left + index * pitchA + L.chipGapA / 2} y={chipsAY} w={pitchA - L.chipGapA} h={L.chipH}
          read={easeOut(frame, at, at + 8)} tone={DELETERS.has(position) ? "danger" : "line"}
          label={compact ? undefined : String(position)}
          appear={easeOut(frame, stagger(index, 8, 1.5), stagger(index, 8, 1.5) + 12)}
        />;
      })}

      {CHURN.map((file, index) => <Lane
        key={file.from} frame={frame}
        x1={cxA(file.from)} x2={cxA((file.by[0] + file.by[1]) / 2)} y={aY + L.lanesY + index * L.lanePitch}
        head={headA}
        bornAt={reach(T.sweepA, FIRST.prs, file.from)} goneAt={reach(T.sweepA, FIRST.prs, (file.by[0] + file.by[1]) / 2)}
      />)}
      <Cursor x={headA} top={chipsAY - (compact ? 2 : 4)} bottom={lanesBottom} opacity={during(frame, T.sweepA[0] - 8, T.sweepA[1] + 14, 8)} pointer={!compact} />

      {row(aY + L.rowsA[0], copy.read, FIRST.read * progressA, readFill)}
      {row(aY + L.rowsA[1], copy.final, FIRST.final * finalA, finalFill, ease(frame, T.finalA, T.finalA + 8))}
      {/* The part of the read that is not in the final diff */}
      {gapInA > 0 ? <rect
        x={barX + share(FIRST.final) + 2} y={aY + L.rowsA[1] - barH / 2 + .5}
        width={Math.max(0, (share(FIRST.read) - share(FIRST.final) - 2) * gapInA)} height={barH - 1} rx={3}
        style={{ fill: tint("danger", 24) }} stroke={TONE.danger} strokeWidth={1} strokeDasharray="3 3" opacity={gapInA}
      /> : null}

      <Tag
        x={L.verdictA === undefined ? right : left} y={aY + (L.verdictA ?? L.titleY)} anchor={L.verdictA === undefined ? "end" : "start"}
        text={copy.filesA} tone="danger" size={L.tag} appear={pop(frame, FILES_A_AT)}
      />
      <Tag
        x={L.verdictA === undefined ? sideTagX : right} y={aY + (L.verdictA ?? L.rowsA[1])} anchor={L.verdictA === undefined ? "start" : "end"}
        text={copy.gap(FIRST.read - FIRST.final)} tone="danger" size={L.tag} appear={pop(frame, T.gapA)}
      />
    </g>

    {/* Second stack: the same work in 11 PRs */}
    <g {...enter(frame, 6, { opacity: opacityB })}>
      <Box x={L.m} y={bY} w={cardW} h={L.b.h} tone="line" radius={16} focus={during(frame, T.stackB, T.gapB + 36, 14)} />
      <Text x={left} y={bY + L.titleY} size={16} weight={600}>{copy.b.title}</Text>
      <Text x={detailX} y={bY + L.titleY + .5} size={13} weight={500} font="mono" tone="muted">{copy.b.detail}</Text>

      {Array.from({ length: SECOND.prs }, (_, index) => {
        const position = index + 1;
        const at = reach(T.sweepB, SECOND.prs, position);
        return <Chip
          key={position}
          x={left + index * pitchB + 2} y={chipsBY} w={pitchB - 4} h={L.chipH}
          read={easeOut(frame, at, at + 8)} tone={position === 9 ? "hot" : "line"}
          label={String(position)}
          appear={easeOut(frame, stagger(index, 14, 3), stagger(index, 14, 3) + 12)}
        />;
      })}

      {ROLES.map((role) => {
        const at = reach(T.sweepB, SECOND.prs, role.from);
        const shown = easeOut(frame, at, at + 12);
        if (shown <= 0) return null;
        const x1 = cxB(role.from) - pitchB / 2 + 4;
        const x2 = cxB(role.to) + pitchB / 2 - 4;
        const centre = (x1 + x2) / 2;
        const underline = chipsBY + L.chipH + 5;
        const tagY = bY + L.rolesY[role.line];
        return <g key={role.id}>
          <path
            d={`M${x1} ${underline}H${x2}M${centre} ${underline}V${tagY - ROLE_TAG}`}
            fill="none" stroke={TONE[role.tone]} strokeOpacity={.6 * shown} strokeWidth={1.25} strokeLinecap="round"
          />
          <Tag x={centre} y={tagY} text={copy.roles[role.id]} tone={role.tone} size={ROLE_TAG} appear={pop(frame, at)} />
        </g>;
      })}
      <Cursor x={headB} top={chipsBY - 4} bottom={chipsBY + L.chipH + 4} opacity={during(frame, T.sweepB[0] - 8, T.sweepB[1] + 14, 8)} />

      {row(bY + L.rowsB[0], copy.read, SECOND.read * progressB, readFill)}
      {row(bY + L.rowsB[1], copy.final, SECOND.final * finalB, finalFill, ease(frame, T.finalB, T.finalB + 8))}
      {/* Both bars end on the same line */}
      {alignedB > 0 ? <line
        x1={barX + share(SECOND.read) + 3} x2={barX + share(SECOND.read) + 3}
        y1={bY + L.rowsB[0] - barH / 2 - 3} y2={bY + L.rowsB[0] - barH / 2 - 3 + (L.rowsB[1] - L.rowsB[0] + barH + 6) * alignedB}
        stroke={TONE.ok} strokeWidth={1.5} strokeLinecap="round"
      /> : null}

      <Tag
        x={L.verdictB === undefined ? right : left} y={bY + (L.verdictB ?? L.titleY)} anchor={L.verdictB === undefined ? "end" : "start"}
        text={copy.filesB} tone="ok" size={L.tag} appear={pop(frame, FILES_B_AT)}
      />
      <Tag
        x={L.verdictB === undefined ? sideTagX : right} y={bY + (L.verdictB ?? L.rowsB[1])} anchor={L.verdictB === undefined ? "start" : "end"}
        text={copy.gap(SECOND.read - SECOND.final)} tone="ok" size={L.tag} appear={pop(frame, T.gapB)}
      />
    </g>
  </>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { fr: "Le même refactoring découpé deux fois", en: "The same refactor sliced twice" },
  caption: {
    fr: "Le premier empilement suit l'ordre du travail\u00a0: 24 fichiers y sont créés par une PR puis supprimés par une autre, et il faut lire 32 381 lignes de diff pour un changement de 22 051. Le second, redécoupé en 11 PR, n'en a aucun\u00a0: 24 120 lignes à lire pour un diff final de 24 118.",
    en: "The first stack follows the order of the work: 24 files are created by one PR then deleted by another, and there are 32,381 lines of diff to read for a change of 22,051. The second, sliced again into 11 PRs, has none: 24,120 lines to read for a final diff of 24,118.",
  },
  beats: [
    { at: 0, text: { fr: "Le même refactoring, découpé deux fois\u00a0: 29 PR dans l'ordre du travail, puis 11 PR.", en: "The same refactor, sliced twice: 29 PRs in the order of the work, then 11 PRs." } },
    { at: T.sweepA[0], text: { fr: "Relues dans l'ordre\u00a0: les PR 4, 6, 8 et 14 créent des fichiers que des PR suivantes suppriment.", en: "Read in order: PRs 4, 6, 8 and 14 create files that later PRs delete." } },
    { at: T.finalA, text: { fr: "32 381 lignes à lire pour un changement de 22 051. L'écart, 10 330 lignes, est du travail fait puis défait.", en: "32,381 lines to read for a change of 22,051. The gap, 10,330 lines, is work done then undone." } },
    { at: T.stackB, text: { fr: "Second empilement\u00a0: le code mort part en premier, le nouveau code arrive sans être branché.", en: "Second stack: dead code goes first, new code arrives without being wired." } },
    { at: SWITCH_AT, text: { fr: "La bascule tient dans une seule PR. Aucun fichier n'est créé par une PR puis supprimé par une autre.", en: "The switch fits in a single PR. No file is created by one PR then deleted by another." } },
    { at: T.finalB, text: { fr: "24 120 lignes à lire pour un diff final de 24 118. L'écart est de deux lignes.", en: "24,120 lines to read for a final diff of 24,118. The gap is two lines." } },
  ],
  Stage,
});
