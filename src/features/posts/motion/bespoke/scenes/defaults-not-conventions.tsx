import { Box, CodeBlock, ease, easeOut, enter, pop, Pulse, stagger, Tag, tagWidth, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// A developer declares a collection page; the screen assembles and every
// capability lights up as inherited, not written. One costly column is opted out
// explicitly, in code. Then the ⌘K search runs through the same engine: each
// match is checked against the user's rights before anything is listed.
const T = {
  screen: 44,
  inherit: 104,
  optOut: 188,
  optTyped: 206,
  optApplied: 234,
  palette: 262,
  query: 272,
  candidates: 296,
  check: 324,
  collapse: 350,
  close: 372,
  end: 470,
} as const;
const LIT = [T.inherit + 6, T.inherit + 20, T.inherit + 34, T.inherit + 48] as const; // sort, filter, search, links

const COPY = {
  en: {
    inherited: "inherited, not written",
    chips: ["✓ sort", "✓ filters", "✓ search", "✓ entity links", "✓ ⌘K scoped"],
    search: "search",
    optOut: "opt-out · no index",
    matched: "matched",
    noAccess: "✗ no access",
    hidden: "1 match hidden by permissions",
    results: ["contract · CT-4812", "operation · OP-4812-1", "audit · events/4812"],
  },
  fr: {
    inherited: "hérité, pas écrit",
    chips: ["✓ tri", "✓ filtres", "✓ recherche", "✓ liens d’entité", "✓ ⌘K selon les droits"],
    search: "rechercher",
    optOut: "retrait · pas d’index",
    matched: "trouvé",
    noAccess: "✗ pas d’accès",
    hidden: "1 résultat masqué par les droits",
    results: ["contrat · CT-4812", "opération · OP-4812-1", "audit · events/4812"],
  },
} as const;

const ROWS = [
  ["CT-4812", "Client 2093", "active", "62/38"],
  ["CT-4813", "Client 1187", "active", "80/20"],
  ["CT-4815", "Client 3310", "active", "45/55"],
] as const;
const HEADERS = ["ref", "client", "status", "breakdown"] as const;

/** Small funnel glyph for "filterable". Struck through when the column opts out. */
function Funnel({ x, y, tone, struck }: { x: number; y: number; tone: Tone; struck: number }) {
  return <g>
    <path d={`M${x - 5} ${y - 5}H${x + 5}L${x + 1.2} ${y}V${y + 5}L${x - 1.2} ${y + 3.5}V${y}Z`} fill={TONE[tone]} opacity={.9} />
    {struck > 0 ? <line x1={x - 7} y1={y + 7} x2={x - 7 + 14 * struck} y2={y + 7 - 14 * struck} stroke={TONE.danger} strokeWidth={2} strokeLinecap="round" /> : null}
  </g>;
}

function Stage({ frame, compact, locale }: SceneStageProps) {
  const c = COPY[locale];
  const L = compact
    ? { code: { x: 20, y: 52, w: 500, size: 13 }, chips: { x: 20, y: 272, count: 4 }, table: { x: 20, y: 292, w: 500, h: 118 }, cols: [16, 118, 262, 356], rows: 2, palette: { x: 20, y: 420, w: 500, h: 92 }, results: [0, 2] }
    : { code: { x: 40, y: 60, w: 380, size: 14 }, chips: { x: 40, y: 322, count: 5 }, table: { x: 460, y: 56, w: 460, h: 208 }, cols: [16, 116, 250, 336], rows: 3, palette: { x: 460, y: 280, w: 460, h: 124 }, results: [0, 1, 2] };
  const tb = L.table;
  const pal = L.palette;

  const swapped = frame >= T.optOut;
  const codeBefore = [
    { text: "collectionPage(\"crm.contracts\", {" },
    { text: "  columns: [" },
    { text: "    \"ref\", \"client\", \"status\"," },
    { text: "    \"breakdown\"," },
    { text: "  ]," },
    { text: "})" },
  ];
  const codeAfter = [
    ...codeBefore.slice(0, 3),
    { text: "    { field: \"breakdown\",", tone: "hot" as Tone },
    { text: "      filterable: false },", tone: "hot" as Tone, appearAt: T.optTyped },
    ...codeBefore.slice(4),
  ];

  // Capabilities light one after the other; each has a chip and a visible effect.
  const lit = LIT.map((at) => ease(frame, at, at + 10));
  const litTone = (k: number): Tone => lit[k]! > .5 ? "line" : "muted";
  const optStruck = ease(frame, T.optApplied, T.optApplied + 12);

  // Chips: left column (wide) or a single row above the table (compact).
  const chipSize = 13;
  const chipLayout = c.chips.slice(0, L.chips.count).reduce<{ x: number; y: number; items: { text: string; x: number; y: number }[] }>((acc, text) => {
    const w = tagWidth(text, chipSize);
    const wrap = !compact && acc.x + w > L.code.x + L.code.w;
    const x = wrap ? L.chips.x : acc.x;
    const y = wrap ? acc.y + 34 : acc.y;
    return { x: x + w + 10, y, items: [...acc.items, { text, x, y }] };
  }, { x: L.chips.x, y: L.chips.y, items: [] });

  const headerY = tb.y + (compact ? 52 : 64);
  const rowY = (r: number) => headerY + (compact ? 24 : 30) * (r + 1);
  const searchY = tb.y + (compact ? 22 : 28);
  const cellSize = compact ? 13 : 14;

  const results = L.results.map((index) => ({ index, text: c.results[index]!, allowed: index !== 2 }));
  const resultY = (k: number) => pal.y + (compact ? 50 : 56) + k * 24;
  const typed = Math.floor(Math.max(0, Math.min(4, (frame - T.query) / 4)));

  return <g>
    {/* The declaration: what the developer writes. */}
    <g {...enter(frame, 0)}>
      {!swapped
        ? <CodeBlock x={L.code.x} y={L.code.y} w={L.code.w} frame={frame} title="contracts.page.ts" size={L.code.size} lines={codeBefore} />
        : <CodeBlock x={L.code.x} y={L.code.y} w={L.code.w} frame={frame} title="contracts.page.ts" size={L.code.size} lines={codeAfter} highlight={frame < T.optApplied + 40 ? 4 : undefined} />}
    </g>

    {/* What the screen inherits. */}
    {!compact ? <g {...enter(frame, T.inherit)}>
      <Text x={L.chips.x} y={L.chips.y - 30} size={11} font="mono" weight={600} tone="muted" caps>{c.inherited}</Text>
    </g> : null}
    {chipLayout.items.map((chip, k) => {
      const at = k < 4 ? LIT[k]! : T.palette + 8;
      return <Tag key={k} x={chip.x} y={chip.y} anchor="start" text={chip.text} tone="ok" size={chipSize} appear={frame >= at ? pop(frame, at) : 0} />;
    })}

    {/* The screen assembles from primitives. */}
    <g {...enter(frame, T.screen, { from: "right", distance: 20 })}>
      <Box x={tb.x} y={tb.y} w={tb.w} h={tb.h} tone="line" radius={16}>
        {/* Search box and quick filter. */}
        <rect x={tb.x + 14} y={searchY - 13} width={compact ? 180 : 200} height={26} rx={13} style={{ fill: tint("ink", 5) }} stroke={TONE[litTone(2)]} strokeOpacity={.3 + .6 * lit[2]!} strokeWidth={1 + .5 * lit[2]!} />
        <Text x={tb.x + 28} y={searchY} size={13} font="mono" weight={500} tone={litTone(2)}>{`⌕ ${c.search}`}</Text>
        {compact && frame >= T.optApplied
          ? <Tag x={tb.x + tb.w - 14} y={searchY} anchor="end" text={c.optOut} tone="hot" size={12} appear={pop(frame, T.optApplied)} />
          : <Tag x={tb.x + tb.w - 14} y={searchY} anchor="end" text="status = active" tone="muted" size={12} appear={easeOut(frame, T.screen + 16, T.screen + 30)} />}

        {/* Headers: sort and filter glyphs light when inherited. */}
        {HEADERS.map((header, k) => {
          const x = tb.x + L.cols[k]!;
          const w = header.length * 13 * .6;
          const breakdown = k === 3;
          return <g key={header} {...enter(frame, stagger(k, T.screen + 10, 5), { dur: 12, distance: 6 })}>
            <Text x={x} y={headerY} size={13} font="mono" weight={600} tone="muted">{header}</Text>
            <Text x={x + w + 6} y={headerY} size={13} font="mono" weight={700} tone={litTone(0)} opacity={.4 + .6 * lit[0]!}>↕</Text>
            <g opacity={.4 + .6 * lit[1]!}>
              <Funnel x={x + w + 24} y={headerY} tone={breakdown && optStruck > .5 ? "muted" : litTone(1)} struck={breakdown ? optStruck : 0} />
            </g>
          </g>;
        })}
        <line x1={tb.x + 12} x2={tb.x + tb.w - 12} y1={headerY + 13} y2={headerY + 13} style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1} />

        {/* Rows: the client cell is an entity link, not text. */}
        {ROWS.slice(0, L.rows).map((row, r) => <g key={r} {...enter(frame, stagger(r, T.screen + 26, 6), { dur: 12, distance: 6 })}>
          {row.map((cell, k) => {
            const x = tb.x + L.cols[k]!;
            const link = k === 1;
            return <g key={k}>
              <Text x={x} y={rowY(r)} size={cellSize} font="mono" weight={link ? 600 : 500} tone={link ? litTone(3) : k === 2 ? "ok" : "ink"}>{cell}</Text>
              {link && lit[3]! > 0 ? <line x1={x} x2={x + cell.length * cellSize * .6 * lit[3]!} y1={rowY(r) + 9} y2={rowY(r) + 9} stroke={TONE.line} strokeWidth={1.25} /> : null}
            </g>;
          })}
        </g>)}
        {!compact ? <Tag x={tb.x + tb.w - 14} y={tb.y + tb.h - 22} anchor="end" text={c.optOut} tone="hot" size={12.5} appear={frame >= T.optApplied ? pop(frame, T.optApplied) : 0} /> : null}
      </Box>
      {frame >= T.optApplied ? <Pulse x={tb.x + L.cols[3]! + 9 * 13 * .6 + 24} y={headerY} frame={frame} at={T.optApplied} period={36} r={10} tone="hot" once /> : null}
    </g>

    {/* ⌘K: the same engine, the same rights. */}
    <g {...enter(frame, T.palette)}>
      <Box x={pal.x} y={pal.y} w={pal.w} h={pal.h} tone="line" radius={16} focus={frame >= T.check && frame < T.collapse + 20 ? 1 : 0}>
        <Tag x={pal.x + 16} y={pal.y + 24} anchor="start" text="⌘K" tone="line" size={12} />
        <Text x={pal.x + 66} y={pal.y + 24} size={14} font="mono" weight={600}>{"4812".slice(0, typed)}</Text>
        {results.map((result, k) => {
          const at = T.candidates + k * 6;
          if (frame < at) return null;
          const checked = frame >= T.check;
          const collapse = !result.allowed ? ease(frame, T.collapse, T.collapse + 16) : 0;
          const y = resultY(k);
          const tone: Tone = !checked ? "muted" : result.allowed ? "ink" : "danger";
          return <g key={result.index} {...enter(frame, at, { dur: 10, distance: 6, opacity: 1 - collapse })}>
            <Text x={pal.x + 20} y={y} size={cellSize} font="mono" weight={checked && result.allowed ? 600 : 500} tone={tone}>{result.text}</Text>
            {checked && !result.allowed ? <line x1={pal.x + 18} x2={pal.x + 22 + result.text.length * cellSize * .6} y1={y} y2={y} stroke={TONE.danger} strokeWidth={1.5} /> : null}
            <Tag
              x={pal.x + pal.w - 16} y={y} anchor="end" size={11.5}
              text={!checked ? c.matched : result.allowed ? "✓" : c.noAccess}
              tone={!checked ? "muted" : result.allowed ? "ok" : "danger"}
              appear={checked ? pop(frame, T.check + k * 3) : 1}
            />
          </g>;
        })}
        {frame >= T.collapse + 8
          ? <g {...enter(frame, T.collapse + 8, { dur: 14, distance: 6 })}>
            <Text x={pal.x + 20} y={resultY(results.length - 1)} size={13} font="mono" weight={500} tone="muted">{c.hidden}</Text>
          </g>
          : null}
      </Box>
    </g>
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: 450,
  title: { en: "Inherited, not written", fr: "Hérité, pas écrit" },
  caption: {
    en: "Every capability is on by default: tables sort, filter and search, relations render as links, ⌘K respects permissions. Removing one is explicit, carries a reason, and shows up in review.",
    fr: "Chaque capacité est active par défaut\u00a0: tri, filtres, recherche, liens entre entités, ⌘K selon les droits. En retirer une est explicite, justifié, et visible en revue.",
  },
  beats: [
    { at: 0, text: { en: "A developer declares a collection page: which collection, which columns. Nothing else.", fr: "Un développeur déclare une page de collection\u00a0: quelle collection, quelles colonnes. Rien d’autre." } },
    { at: T.inherit, text: { en: "The screen inherits sorting, filters, search and entity links. None of it was written.", fr: "L’écran hérite du tri, des filtres, de la recherche et des liens d’entité. Rien n’a été écrit." } },
    { at: T.optOut, text: { en: "One column is too costly to filter. Removing it is explicit, in code, with a reason.", fr: "Une colonne coûte trop cher à filtrer. Le retrait est explicite, dans le code, justifié." } },
    { at: T.palette, text: { en: "⌘K search goes through the same engine: each match is checked against the user’s rights.", fr: "La recherche ⌘K passe par le même moteur\u00a0: chaque résultat est confronté aux droits." } },
    { at: T.close, text: { en: "Only permitted results reach the list. Consistency and governance share the same defaults.", fr: "Seuls les résultats autorisés s’affichent. Cohérence et gouvernance partagent les mêmes défauts." } },
  ],
  Stage,
});
