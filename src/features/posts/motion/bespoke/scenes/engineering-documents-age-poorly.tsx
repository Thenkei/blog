import { Box, Comet, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, Wire, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). The page is drawn once and never changes: its "words" are
// fixed bars. Reality sits next to it, one fact per section, joined by a match
// glyph. Each change in reality flips that glyph from ≡ to ≠ while the page,
// its "active" chip and "last updated Tuesday" stay exactly as they were. Then
// an AI assistant retrieves the page as reliable context and builds on it.
const EVENT_AT = [84, 144, 204] as const;
const FLIP = 12;
const T = {
  ai: 258,
  retrieve: 280,
  read: 312,
  outputs: 326,
  end: 470,
} as const;

const COPY = {
  en: {
    kind: "RUNBOOK",
    active: "ACTIVE ✓",
    updated: "last updated Tuesday",
    reality: "REALITY",
    sections: ["§ code behaviour", "§ provider contract", "§ procedure"],
    events: [["CODE", "the code changes"], ["PROVIDER", "updates its contract"], ["PRODUCTION", "reveals an exception"]],
    before: "as documented",
    ai: "AI assistant",
    context: "reliable context",
    outputs: ["✗ plan", "✗ code"],
    stale: "built on a stale page",
    words: "words changed · 0",
    claims: (n: number) => `claims still true · ${n}/3`,
  },
  fr: {
    kind: "RUNBOOK",
    active: "ACTIF ✓",
    updated: "mis à jour mardi",
    reality: "LA RÉALITÉ",
    sections: ["§ comportement du code", "§ contrat fournisseur", "§ procédure"],
    events: [["CODE", "le code change"], ["FOURNISSEUR", "modifie son contrat"], ["PRODUCTION", "révèle une exception"]],
    before: "comme documenté",
    ai: "Assistant IA",
    context: "contexte fiable",
    outputs: ["✗ plan", "✗ code"],
    stale: "bâtis sur une page périmée",
    words: "mots modifiés · 0",
    claims: (n: number) => `affirmations vraies · ${n}/3`,
  },
} as const;

// Fixed "prose" for each section: bar widths as fractions, never animated.
const BARS = [[.94, .62], [.86, .7], [.9, .54]] as const;

/** Match glyph between a fact in reality and the section that describes it. */
function MatchGlyph({ x, y, frame, flipAt, appear }: { x: number; y: number; frame: number; flipAt: number; appear: number }) {
  if (appear <= 0) return null;
  const flipped = frame >= flipAt;
  const spring = flipped ? pop(frame, flipAt, 190) : 1;
  const tone: Tone = flipped ? "danger" : "ok";
  return <g opacity={appear} transform={`translate(${x} ${y}) scale(${(.6 + .4 * spring) * (.85 + .15 * appear)})`}>
    <circle r={13} style={{ fill: "var(--scene-card)" }} className="scene-card" />
    <circle r={13} style={{ fill: tint(tone, 18) }} stroke={TONE[tone]} strokeOpacity={.55} strokeWidth={1} />
    <Text x={0} y={.5} size={15} font="mono" weight={700} tone={tone} anchor="middle">{flipped ? "≠" : "≡"}</Text>
  </g>;
}

function Stage({ frame, compact, locale }: SceneStageProps) {
  const c = COPY[locale];
  const L = compact
    ? {
      page: { x: 206, y: 52, w: 314, h: 282 }, rowY: (i: number) => 166 + i * 64,
      real: { x: 20, w: 152, h: 56 }, ai: { x: 20, y: 364, w: 236, h: 70 },
      out: { x: 292, y: 382 }, counters: 492,
    }
    : {
      page: { x: 318, y: 64, w: 292, h: 290 }, rowY: (i: number) => 172 + i * 64,
      real: { x: 40, w: 226, h: 56 }, ai: { x: 668, y: 150, w: 252, h: 78 },
      out: { x: 668, y: 272 }, counters: 386,
    };
  const { page, real, ai } = L;
  const glyphX = (real.x + real.w + page.x) / 2;

  const claims = 3 - EVENT_AT.filter((at) => frame >= at + FLIP).length;
  const aiIn = enter(frame, T.ai + 6, { from: compact ? "up" : "right", distance: 18 });
  const read = ease(frame, T.retrieve, T.read);
  const reading = read > 0 && read < 1 ? 1 : 0;
  const tokenPath: [number, number][] = compact
    ? [[page.x + 22, page.y + page.h], [page.x + 22, ai.y]]
    : [[page.x + page.w, page.y + 44], [ai.x + ai.w / 2, page.y + 44], [ai.x + ai.w / 2, ai.y]];
  const tokenD = `M${tokenPath.map(([x, y]) => `${x} ${y}`).join("L")}`;
  const outFrom: [number, number] = compact ? [ai.x + ai.w, ai.y + ai.h / 2] : [ai.x + ai.w / 2, ai.y + ai.h];
  const outputX = (i: number) => compact ? L.out.x : L.out.x + 16 + i * 116;
  const outputY = (i: number) => compact ? L.out.y + i * 38 : L.out.y;
  const chipW = (text: string) => text.length * 15 * .6 + 15 * 1.5;

  // Wide: the page and reality start centred, then glide left to make room for the AI.
  const shift = compact ? 0 : lerp(140, 0, ease(frame, T.ai - 10, T.ai + 18));

  return <g>
    <g transform={`translate(${shift} 0)`}>
    {/* Reality: one fact per section. */}
    <g {...enter(frame, 10)}>
      <Text x={real.x} y={compact ? 118 : L.rowY(0) - 58} size={11} font="mono" weight={600} tone="muted" caps>{c.reality}</Text>
    </g>
    {c.events.map(([kind, text], i) => {
      const y = L.rowY(i);
      const at = EVENT_AT[i]!;
      const changed = ease(frame, at, at + 10);
      const hit = ease(frame, at, at + 6) * (1 - ease(frame, at + 16, at + 40));
      const top = y - real.h / 2;
      const flipped = frame >= at + FLIP;
      return <g key={kind}>
        {/* The link: ok while page and system agree, broken once they diverge. */}
        <g opacity={easeOut(frame, stagger(i, 30, 6), stagger(i, 48, 6))}>
          <line x1={real.x + real.w} x2={page.x} y1={y} y2={y} stroke={flipped ? TONE.danger : "var(--scene-hairline)"} strokeOpacity={flipped ? .6 : 1} strokeWidth={1} strokeDasharray={flipped ? "3 4" : undefined} />
        </g>
        <g {...enter(frame, stagger(i, 16, 6), { from: "left", distance: 14 })}>
          <Box x={real.x} y={top} w={real.w} h={real.h} tone={frame >= at ? "hot" : "line"} radius={12} focus={hit} fill={hit * .7}>
            <Text x={real.x + 14} y={top + 18} size={11} font="mono" weight={600} tone={frame >= at ? "hot" : "muted"} caps>{kind}</Text>
            <g opacity={1 - changed}>
              <Text x={real.x + 14} y={top + 38} size={compact ? 13.5 : 15} weight={600} tone="muted">{c.before}</Text>
            </g>
            <g opacity={changed} transform={`translate(0 ${(1 - changed) * 6})`}>
              <Text x={real.x + 14} y={top + 38} size={compact ? 13.5 : 15} weight={600}>{text}</Text>
            </g>
          </Box>
          {frame >= at && frame < at + 40 ? <Pulse x={real.x + real.w} y={y} frame={frame} at={at} period={40} r={10} tone="hot" /> : null}
        </g>
        <MatchGlyph x={glyphX} y={y} frame={frame} flipAt={at + FLIP} appear={easeOut(frame, stagger(i, 40, 6), stagger(i, 56, 6))} />
      </g>;
    })}

    {/* The page: identical in every frame once drawn. */}
    <g {...enter(frame, 0)}>
      <Box x={page.x} y={page.y} w={page.w} h={page.h} tone="line" radius={16} focus={reading * .8}>
        <Text x={page.x + 18} y={page.y + 24} size={11} font="mono" weight={600} tone="muted" caps>{c.kind}</Text>
        <Tag x={page.x + page.w - 16} y={page.y + 24} anchor="end" text={c.active} tone="ok" size={12} />
        <Text x={page.x + 18} y={page.y + 52} size={13} font="mono" weight={500} tone="muted">{c.updated}</Text>
        <line x1={page.x + 16} x2={page.x + page.w - 16} y1={page.y + 72} y2={page.y + 72} stroke="var(--scene-hairline)" strokeWidth={1} />
        {c.sections.map((section, i) => {
          const y = L.rowY(i);
          const inner = page.w - 36;
          return <g key={section} {...enter(frame, stagger(i, 8, 5), { distance: 8 })}>
            <Text x={page.x + 18} y={y - 12} size={compact ? 13 : 14} font="mono" weight={600}>{section}</Text>
            {BARS[i]!.map((fraction, row) => <rect key={row} x={page.x + 18} y={y + 4 + row * 12} width={inner * fraction} height={5} rx={2.5} style={{ fill: tint("muted", 38) }} />)}
          </g>;
        })}
      </Box>
    </g>

    {/* Two counters: nothing was edited, yet the claims stopped being true. */}
    <g {...enter(frame, 50)}>
      {(() => {
        const size = 12;
        const wordsW = c.words.length * size * .6 + size * 1.5;
        const claimsW = c.claims(3).length * size * .6 + size * 1.5;
        const centre = compact ? 270 : page.x + page.w / 2;
        const left = centre - (wordsW + claimsW + 12) / 2;
        const tone: Tone = claims < 3 ? "danger" : "ok";
        const bump = EVENT_AT.reduce((best, at) => frame >= at + FLIP ? pop(frame, at + FLIP, 200) : best, 1);
        return <>
          <Tag x={left} y={L.counters} anchor="start" text={c.words} tone="muted" size={size} />
          <g transform={`translate(${left + wordsW + 12 + claimsW / 2} ${L.counters}) scale(${.9 + .1 * bump}) translate(${-(left + wordsW + 12 + claimsW / 2)} ${-L.counters})`}>
            <Tag x={left + wordsW + 12} y={L.counters} anchor="start" text={c.claims(claims)} tone={tone} size={size} />
          </g>
        </>;
      })()}
    </g>
    </g>

    {/* An AI assistant retrieves the page as if it were today's truth. */}
    {frame >= T.ai + 6 ? <g {...aiIn}>
      <Box x={ai.x} y={ai.y} w={ai.w} h={ai.h} tone="line" radius={14} focus={ease(frame, T.read - 4, T.read + 4) * (1 - ease(frame, T.outputs + 10, T.outputs + 30))}>
        <Text x={ai.x + 16} y={ai.y + 24} size={compact ? 16 : 17} weight={600}>{c.ai}</Text>
        <Tag x={ai.x + 16} y={ai.y + ai.h - 22} anchor="start" text={`${c.kind} = ${c.context}`} tone="muted" size={11} appear={pop(frame, T.read)} />
      </Box>
    </g> : null}
    <Wire d={tokenD} tone="line" width={1.25} dashed opacity={.8 * easeOut(frame, T.read, T.read + 12)} />
    <Comet points={tokenPath} t={read} tone="line" r={5.5} tail={.2} />

    {c.outputs.map((output, i) => {
      const at = T.outputs + i * 8;
      const x = outputX(i);
      const w = chipW(output);
      const cx = x + w / 2;
      const to: [number, number] = compact ? [x, outputY(i)] : [cx, L.out.y - 16];
      const grow = easeOut(frame, at - 10, at + 4);
      const d = compact
        ? `M${outFrom[0]} ${outFrom[1]}C${lerp(outFrom[0], to[0], .6)} ${outFrom[1]} ${lerp(outFrom[0], to[0], .4)} ${to[1]} ${to[0]} ${to[1]}`
        : `M${outFrom[0]} ${outFrom[1]}C${outFrom[0]} ${lerp(outFrom[1], to[1], .6)} ${cx} ${lerp(outFrom[1], to[1], .4)} ${cx} ${to[1]}`;
      return <g key={output}>
        <Wire d={d} tone="danger" width={1.25} draw={grow} opacity={.7} />
        <Tag x={x} y={outputY(i)} anchor="start" text={output} tone="danger" size={15} appear={pop(frame, at)} />
      </g>;
    })}
    <g {...enter(frame, T.outputs + 22, { distance: 8 })}>
      <Text x={compact ? L.out.x : L.out.x + 16} y={L.out.y + (compact ? 72 : 38)} size={13} font="mono" weight={600} tone="danger">{c.stale}</Text>
    </g>
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "Wrong without changing a word", fr: "Faux sans changer un mot" },
  caption: {
    en: "The page never changed; the system it describes did. It still looks authoritative, so a reader or an AI assistant takes it for today’s truth.",
    fr: "La page n’a pas changé ; le système qu’elle décrit, si. Elle fait toujours autorité, et un lecteur ou un assistant IA la prend pour la vérité du jour.",
  },
  beats: [
    { at: 0, text: { en: "The runbook is accurate when published: every section matches the system.", fr: "Le runbook est exact le jour de sa publication : chaque section correspond au système." } },
    { at: EVENT_AT[0], text: { en: "The code changes. Not a single word of the page does.", fr: "Le code change. Pas un seul mot de la page." } },
    { at: EVENT_AT[1], text: { en: "A provider updates its contract. The page still describes the old one.", fr: "Un fournisseur modifie son contrat. La page décrit toujours l’ancien." } },
    { at: EVENT_AT[2], text: { en: "Production reveals an exception. Zero words changed, zero claims still true, and the page still says active.", fr: "La production révèle une exception. Zéro mot modifié, zéro affirmation vraie : la page se dit encore active." } },
    { at: T.ai, text: { en: "An AI assistant retrieves it, treats it as reliable context and turns it into a plan and code.", fr: "Un assistant IA la retrouve, la traite comme un contexte fiable et en tire un plan et du code." } },
  ],
  Stage,
});
