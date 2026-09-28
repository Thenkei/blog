import { Box, CodeBlock, Comet, Counter, ease, easeOut, enter, pop, Tag, Text, textWidth, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// A virtual relation across two databases. The developer types one query; the
// naive loop costs 1 + N queries. The engine instead runs the local query,
// collects unique keys (one duplicate struck), sends ONE `IN` query to the
// other database and merges in memory. Then the page grows to 500 rows and the
// batched count does not move: the cost follows hops, not rows.
const T = {
  code: 10,
  naive: 44,
  steps: [100, 140, 180, 220] as const,
  dedupe: 158,
  batched: 240,
  strike: 250,
  grow: [286, 336] as const,
  end: 430,
} as const;

type Runner = "local" | "engine" | "remote";
type Step = { runner: Runner; title: string; lines: readonly string[]; foot: string };

const COPY = {
  en: {
    naive: "naive loop", batched: "engine", queries: "queries", rows: "rows on the page",
    steps: [
      { runner: "local", title: "① crm · local", lines: ["SELECT asset_value,", "  product_id", "FROM contract_lines", "WHERE contract_id = $1"], foot: "→ 12 rows" },
      { runner: "engine", title: "② unique keys", lines: ["p-07", "p-12", "~p-07", "p-31 …"], foot: "12 rows → 9 ids" },
      { runner: "remote", title: "③ market_data · remote", lines: ["SELECT id, isin, name", "FROM products", "WHERE id IN ($1 … $9)"], foot: "→ 9 rows" },
      { runner: "engine", title: "④ merge", lines: ["by product_id,", "in memory"], foot: "12 complete rows" },
    ],
    comment: "// product: virtual relation crm → market_data",
  },
  fr: {
    naive: "boucle naïve", batched: "moteur", queries: "requêtes", rows: "lignes sur la page",
    steps: [
      { runner: "local", title: "① crm · locale", lines: ["SELECT asset_value,", "  product_id", "FROM contract_lines", "WHERE contract_id = $1"], foot: "→ 12 lignes" },
      { runner: "engine", title: "② clés uniques", lines: ["p-07", "p-12", "~p-07", "p-31 …"], foot: "12 lignes → 9 ids" },
      { runner: "remote", title: "③ market_data · distante", lines: ["SELECT id, isin, name", "FROM products", "WHERE id IN ($1 … $9)"], foot: "→ 9 lignes" },
      { runner: "engine", title: "④ fusion", lines: ["par product_id,", "en mémoire"], foot: "12 lignes complètes" },
    ],
    comment: "// product : relation virtuelle crm → market_data",
  },
} as const;

const RUNNER_TONE: Record<Runner, Tone> = { local: "line", engine: "hot", remote: "line" };

function StepCard({ step, x, y, w, h, frame, at, compact }: { step: Step; x: number; y: number; w: number; h: number; frame: number; at: number; compact: boolean }) {
  const tone = RUNNER_TONE[step.runner];
  const appear = easeOut(frame, at, at + 16);
  const glow = appear * (1 - ease(frame, at + 10, at + 44));
  const size = compact ? 12 : 12.5;
  const step0 = compact ? 14 : 18;
  const top = compact ? 35 : 44;
  if (appear <= 0) return null;
  return <g {...enter(frame, at, { distance: 12 })}>
    <Box x={x} y={y} w={w} h={h} tone={tone} focus={glow} radius={14} fill={step.runner === "engine" ? .25 : 0}>
      <Text x={x + 14} y={y + (compact ? 18 : 22)} size={compact ? 12 : 13} font="mono" weight={600} tone={tone}>{step.title}</Text>
      {step.lines.map((raw, i) => {
        const struck = raw.startsWith("~");
        const text = struck ? raw.slice(1) : raw;
        const ly = y + top + i * step0;
        const strike = struck ? ease(frame, T.dedupe, T.dedupe + 12) : 0;
        return <g key={i} opacity={struck ? 1 - .55 * strike : 1}>
          <Text x={x + 14} y={ly} size={size} font="mono" weight={500}>{text}</Text>
          {strike > 0 ? <line x1={x + 12} x2={x + 16 + textWidth(text, size) * strike} y1={ly} y2={ly} stroke={TONE.danger} strokeWidth={1.5} /> : null}
          {struck && strike > .5 ? <Text x={x + 22 + textWidth(text, size)} y={ly} size={11} font="mono" weight={600} tone="danger" opacity={strike}>dup</Text> : null}
        </g>;
      })}
      <Text x={x + 14} y={y + h - (compact ? 11 : 16)} size={compact ? 12 : 13} font="mono" weight={600} tone={step.runner === "engine" ? "hot" : "muted"}>{step.foot}</Text>
    </Box>
  </g>;
}

function Stage({ frame, compact, locale }: SceneStageProps) {
  const c = COPY[locale];
  const steps = c.steps as readonly Step[];

  const L = compact
    ? {
      code: { x: 20, y: 50, w: 500, size: 12 },
      box: { x: 20, y: 202, w: 500, h: 82 },
      cards: [
        { x: 20, y: 294, w: 244, h: 106 }, { x: 276, y: 294, w: 244, h: 106 },
        { x: 20, y: 410, w: 244, h: 106 }, { x: 276, y: 410, w: 244, h: 106 },
      ],
    }
    : {
      code: { x: 40, y: 58, w: 560, size: 13.5 },
      box: { x: 624, y: 58, w: 296, h: 154 },
      cards: [
        { x: 40, y: 236, w: 230, h: 164 }, { x: 283, y: 236, w: 170, h: 164 },
        { x: 466, y: 236, w: 250, h: 164 }, { x: 729, y: 236, w: 191, h: 164 },
      ],
    };
  const { code, box, cards } = L;

  // Hops between steps: a packet leaves one card's edge for the next.
  const hops = [0, 1, 2].map((k) => {
    const a = cards[k]!;
    const b = cards[k + 1]!;
    const sameRow = Math.abs(a.y - b.y) < 1;
    const from: [number, number] = sameRow ? [a.x + a.w, a.y + a.h / 2] : [a.x + a.w / 2, a.y + a.h];
    const to: [number, number] = sameRow ? [b.x, b.y + b.h / 2] : [b.x + b.w / 2, b.y];
    const at = T.steps[k + 1]!;
    return { from, to, at, draw: easeOut(frame, at - 16, at), t: ease(frame, at - 16, at) };
  });

  // Counters: the naive loop grows with rows, the engine does not.
  const grow = easeOut(frame, T.grow[0], T.grow[1]);
  const rows = Math.round(12 + (500 - 12) * grow);
  const naiveOn = easeOut(frame, T.naive, T.naive + 14);
  const strike = ease(frame, T.strike, T.strike + 14);
  const batchedOn = frame >= T.batched ? pop(frame, T.batched) : 0;

  const naivePos = compact ? { x: box.x + 16, y: box.y + 58 } : { x: box.x + 18, y: box.y + 78 };
  const batchedPos = compact ? { x: box.x + 262, y: box.y + 58 } : { x: box.x + 18, y: box.y + 128 };
  const naiveLabel = `1 + ${rows} ${c.queries}`;
  const naiveSize = compact ? 15 : 16;
  const naiveTextX = naivePos.x + (compact ? 0 : 100);
  const naiveTextY = naivePos.y;

  return <g>
    <g {...enter(frame, 0)}>
      <CodeBlock
        x={code.x} y={code.y} w={code.w} frame={frame} title="contract-products.ts" size={code.size} typeRate={.5}
        highlight={frame >= T.steps[2] && frame < T.batched + 30 ? 3 : undefined}
        lines={[
          { text: c.comment },
          { text: "db.collection('crm.contract_lines').list({", appearAt: T.code },
          { text: "  where: eq('contract_id', id),", appearAt: T.code + 24 },
          { text: "  select: ['asset_value', 'product.isin', 'product.name'],", appearAt: T.code + 42, tone: frame >= T.steps[2] && frame < T.batched + 30 ? "hot" : undefined },
          { text: "})", appearAt: T.code + 72 },
        ]}
      />
    </g>

    <g {...enter(frame, 20, { from: compact ? "up" : "right", distance: 16 })}>
      <Box x={box.x} y={box.y} w={box.w} h={box.h} tone="muted" radius={14}>
        <Text x={box.x + (compact ? 16 : 18)} y={box.y + (compact ? 18 : 24)} size={11} font="mono" weight={600} tone="muted" caps>{c.rows}</Text>
        <Counter
          x={box.x + box.w - (compact ? 16 : 18)} y={box.y + (compact ? 18 : 24)} anchor="end" size={compact ? 13 : 15} font="mono" weight={700}
          tone={grow > 0 && grow < 1 ? "hot" : "ink"} frame={frame} from={12} to={500} start={T.grow[0]} end={T.grow[1]}
        />
        {naiveOn > 0 ? <g opacity={naiveOn}>
          {!compact ? <Tag x={naivePos.x} y={naivePos.y} anchor="start" text="N+1" tone="danger" size={12} /> : null}
          <Text x={naiveTextX} y={naiveTextY - (compact ? 16 : 22)} size={11} font="mono" weight={600} tone="danger" caps>{compact ? `N+1 · ${c.naive}` : c.naive}</Text>
          <Text x={naiveTextX} y={naiveTextY + (compact ? 4 : 0)} size={naiveSize} font="mono" weight={600} tone="danger" opacity={1 - .45 * strike}>{naiveLabel}</Text>
          {strike > 0 ? <line x1={naiveTextX - 2} x2={naiveTextX + 2 + textWidth(naiveLabel, naiveSize) * strike} y1={naiveTextY + (compact ? 4 : 0)} y2={naiveTextY + (compact ? 4 : 0)} stroke={TONE.danger} strokeWidth={2} /> : null}
        </g> : null}
        {batchedOn > 0 ? <g opacity={Math.min(1, batchedOn)}>
          {!compact ? <Tag x={batchedPos.x} y={batchedPos.y} anchor="start" text="IN (…)" tone="ok" size={12} /> : null}
          <Text x={batchedPos.x + (compact ? 0 : 100)} y={batchedPos.y - (compact ? 16 : 22)} size={11} font="mono" weight={600} tone="ok" caps>{compact ? `IN (…) · ${c.batched}` : c.batched}</Text>
          <Text x={batchedPos.x + (compact ? 0 : 100)} y={batchedPos.y + (compact ? 4 : 0)} size={naiveSize} font="mono" weight={700} tone="ok">{`2 ${c.queries}`}</Text>
        </g> : null}
      </Box>
    </g>

    {hops.map((hop, k) => hop.draw > 0 ? <g key={k}>
      <line x1={hop.from[0]} y1={hop.from[1]} x2={hop.from[0] + (hop.to[0] - hop.from[0]) * hop.draw} y2={hop.from[1] + (hop.to[1] - hop.from[1]) * hop.draw} stroke="var(--scene-hairline)" strokeWidth={1.5} />
      <Comet points={[hop.from, hop.to]} t={hop.t} tone="hot" r={5} tail={.3} />
    </g> : null)}

    {steps.map((step, k) => <StepCard key={k} step={step} {...cards[k]!} frame={frame} at={T.steps[k]!} compact={compact} />)}
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.grow[1] + 20,
  title: { en: "A virtual relation, no N+1", fr: "Une relation virtuelle, sans N+1" },
  caption: {
    en: "The engine resolves a relation across databases with one local query and one IN query on the other side, whatever the number of rows. The naive loop costs one query per row.",
    fr: "Le moteur résout une relation entre bases avec une requête locale et une seule requête IN de l'autre côté, quel que soit le nombre de lignes. La boucle naïve coûte une requête par ligne.",
  },
  beats: [
    { at: 0, text: { en: "The developer writes one query. product lives in another database: a virtual relation.", fr: "Le développeur écrit une requête. product vit dans une autre base : une relation virtuelle." } },
    { at: T.naive, text: { en: "The naive way loops over rows: one query, then one per product. Twelve rows, thirteen queries.", fr: "L'approche naïve boucle : une requête, puis une par produit. Douze lignes, treize requêtes." } },
    { at: T.steps[0], text: { en: "The engine runs the local query, then keeps unique keys: 12 rows, 9 distinct products.", fr: "Le moteur lance la requête locale, puis garde les clés uniques : 12 lignes, 9 produits." } },
    { at: T.steps[2], text: { en: "One query on the other database, WHERE id IN (…), then a merge in memory by product_id.", fr: "Une seule requête sur l'autre base, WHERE id IN (…), puis une fusion en mémoire par product_id." } },
    { at: T.grow[0] - 6, text: { en: "500 rows or 12, still 2 queries. The cost follows the hops, never the rows.", fr: "500 lignes ou 12, toujours 2 requêtes. Le coût suit les sauts, jamais les lignes." } },
  ],
  Stage,
});
