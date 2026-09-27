import { Box, Camera, Comet, during, ease, easeOut, enter, lerp, pop, Pulse, Tag, Text, TONE, tint } from "../primitives";
import { defineScene, type Localized, type SceneStageProps } from "../types";

// Rebound effect, in illustrative units (the article gives no per-task figures):
// a tile's area is the energy of one use, and every use sends its energy into the
// total, stacked one segment per use. Efficiency shrinks every tile and every
// segment at once; more uses and heavier uses still stack the total higher.
const T = {
  first: 14,
  efficient: 92,
  more: 172,
  heavy: 272,
  verdict: 356,
  end: 480,
} as const;
const FLIGHT = 16;

const EFFICIENCY = .6;
const perTask = (frame: number) => 1 - (1 - EFFICIENCY) * ease(frame, T.efficient, T.efficient + 30);

type Kind = "text" | "video" | "agent";
type Tile = { kind: Kind; col: number; row: number; w: number; h: number; at: number };

// 18 text queries (6 first, 12 later), 2 video generations (4 cells), 3 agent runs (2 cells).
const TILES: readonly Tile[] = [
  ...Array.from({ length: 18 }, (_, i): Tile => ({
    kind: "text", col: i % 10, row: Math.floor(i / 10), w: 1, h: 1,
    at: i < 6 ? T.first + i * 6 : T.more + (i - 6) * 5,
  })),
  { kind: "video", col: 8, row: 1, w: 2, h: 2, at: T.heavy },
  { kind: "video", col: 0, row: 2, w: 2, h: 2, at: T.heavy + 10 },
  { kind: "agent", col: 2, row: 2, w: 2, h: 1, at: T.heavy + 20 },
  { kind: "agent", col: 4, row: 2, w: 2, h: 1, at: T.heavy + 28 },
  { kind: "agent", col: 6, row: 2, w: 2, h: 1, at: T.heavy + 36 },
];
const START_TOTAL = 6;
const MAX_TOTAL = TILES.reduce((sum, tile) => sum + tile.w * tile.h, 0) * EFFICIENCY;

const GLYPH: Record<Kind, string> = { text: "", video: "▶", agent: "⟳" };
const LEGEND: readonly { kind: Kind; label: Localized }[] = [
  { kind: "text", label: { en: "text query", fr: "requête texte" } },
  { kind: "video", label: { en: "video generation", fr: "génération de vidéo" } },
  { kind: "agent", label: { en: "agent run", fr: "agent" } },
];

type Rect = { x: number; y: number; w: number; h: number };
type Layout = {
  grid: { x: number; y: number; cell: number };
  headerY: number;
  legendY: number;
  unitsY: number;
  perTask: Rect;
  total: Rect;
  barW: number;
  barMaxH: number;
  stackedTags: boolean;
};

const WIDE: Layout = {
  grid: { x: 40, y: 94, cell: 52 },
  headerY: 72,
  legendY: 356,
  unitsY: 384,
  perTask: { x: 590, y: 64, w: 330, h: 110 },
  total: { x: 590, y: 188, w: 330, h: 216 },
  barW: 84,
  barMaxH: 156,
  stackedTags: false,
};

const COMPACT: Layout = {
  grid: { x: 20, y: 78, cell: 44 },
  headerY: 60,
  legendY: 272,
  unitsY: 292,
  perTask: { x: 20, y: 310, w: 240, h: 198 },
  total: { x: 272, y: 310, w: 248, h: 198 },
  barW: 64,
  barMaxH: 124,
  stackedTags: true,
};

function TileShape({ x, y, w, h, kind, scale, appear, tone }: { x: number; y: number; w: number; h: number; kind: Kind; scale: number; appear: number; tone: "line" | "ok" }) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const s = scale * (.6 + .4 * Math.min(1, appear));
  const deep = kind === "text" ? 20 : 34;
  return <g opacity={Math.min(1, appear)} transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
    <rect x={x} y={y} width={w} height={h} rx={9} style={{ fill: tint(tone, deep) }} stroke={TONE[tone]} strokeOpacity={.45} strokeWidth={1 / Math.max(.5, s)} />
    {GLYPH[kind] ? <Text x={cx} y={cy + 1} size={kind === "video" ? 24 : 17} weight={700} tone={tone} anchor="middle">{GLYPH[kind]}</Text> : null}
  </g>;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT : WIDE;
  const { grid, perTask: pt, total: tt } = L;
  const factor = perTask(frame);
  // Area ∝ energy, so a tile's side scales with the square root of the per-task factor.
  const side = Math.sqrt(factor);
  const verdict = pop(frame, T.verdict, 160);

  // The total: one segment per use that has landed, in arrival order.
  const unit = L.barMaxH / MAX_TOTAL;
  const segments = TILES.map((tile) => ({ tile, h: tile.w * tile.h * factor * unit * easeOut(frame, tile.at + FLIGHT - 2, tile.at + FLIGHT + 8) }));
  const tops = segments.map((_, i) => segments.slice(0, i + 1).reduce((sum, seg) => sum + seg.h, 0));
  const barH = tops.at(-1)!;
  const barX = tt.x + (compact ? 28 : 34);
  const base = tt.y + tt.h - 18;
  const startY = base - START_TOTAL * unit;
  const over = barH > START_TOTAL * unit + .5;
  const landed = TILES.filter((tile) => frame >= tile.at + FLIGHT).length;

  const tilePos = (tile: Tile) => {
    const pad = 5;
    return { x: grid.x + tile.col * grid.cell + pad, y: grid.y + tile.row * grid.cell + pad, w: tile.w * grid.cell - pad * 2, h: tile.h * grid.cell - pad * 2 };
  };

  const camera = [
    { at: 0 },
    { at: T.heavy - 10, dur: 50, zoom: compact ? 1.01 : 1.02 },
    { at: T.verdict, dur: 50, zoom: 1 },
  ];

  const labelX = barX + L.barW + 14;

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* The field of uses. */}
    <g {...enter(frame, 0)}>
      <Text x={grid.x} y={L.headerY} size={11} weight={600} font="mono" tone="muted" caps>{fr ? "usages" : "uses"}</Text>
      <Text x={grid.x + (fr ? 62 : 44)} y={L.headerY} size={13} weight={700} font="mono" tone="line">{String(landed)}</Text>
    </g>
    {TILES.map((tile, i) => {
      if (frame < tile.at) return null;
      const r = tilePos(tile);
      return <TileShape key={i} kind={tile.kind} {...r} scale={side} appear={pop(frame, tile.at, 170)} tone="line" />;
    })}

    <g {...enter(frame, 24)}>
      {(() => {
        const widths = LEGEND.map((item) => item.label[locale].length * 7.4 + 44);
        return LEGEND.map((item, i) => {
          const x = grid.x + widths.slice(0, i).reduce((sum, w) => sum + w, 0);
          const swatch = item.kind === "text" ? [13, 13] : item.kind === "video" ? [20, 20] : [24, 12];
          return <g key={item.kind} opacity={item.kind === "text" || frame >= T.heavy ? 1 : .35}>
            <rect x={x} y={L.legendY - swatch[1]! / 2} width={swatch[0]} height={swatch[1]} rx={4} style={{ fill: tint("line", item.kind === "text" ? 20 : 34) }} stroke={TONE.line} strokeOpacity={.45} strokeWidth={1} />
            <Text x={x + swatch[0]! + 8} y={L.legendY} size={12.5} weight={600} font="mono" tone="ink">{item.label[locale]}</Text>
          </g>;
        });
      })()}
      <Text x={grid.x} y={L.unitsY} size={11.5} weight={500} font="mono" tone="muted">{fr ? "surface = énergie d’un usage · unités illustratives" : "area = energy of one use · illustrative units"}</Text>
    </g>

    {/* Per text query: the efficiency win is real. */}
    <g {...enter(frame, 8, { from: compact ? "up" : "right" })}>
      <Box x={pt.x} y={pt.y} w={pt.w} h={pt.h} tone={frame >= T.efficient ? "ok" : "line"} focus={during(frame, T.efficient, T.efficient + 44, 10)} radius={16}>
        <Text x={pt.x + 18} y={pt.y + 24} size={11} weight={600} font="mono" tone="muted" caps>{fr ? "par requête texte" : "per text query"}</Text>
        {(() => {
          const size = compact ? 52 : 46;
          const x = pt.x + 20;
          const y = compact ? pt.y + 44 : pt.y + 44;
          const ghost = ease(frame, T.efficient, T.efficient + 10);
          return <>
            <rect x={x} y={y} width={size} height={size} rx={9} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="3 4" opacity={ghost} />
            <TileShape x={x} y={y} w={size} h={size} kind="text" scale={side} appear={1} tone={frame >= T.efficient ? "ok" : "line"} />
          </>;
        })()}
        <Tag x={compact ? pt.x + 18 : pt.x + 88} y={compact ? pt.y + 130 : pt.y + 58} anchor="start" size={12}
          text={fr ? "matériel + logiciel ↓" : "hardware + software ↓"} tone="ok" appear={pop(frame, T.efficient + 8)} />
        <Tag x={compact ? pt.x + 18 : pt.x + 88} y={compact ? pt.y + 166 : pt.y + 88} anchor="start" size={12}
          text={fr ? "✓ moins par usage" : "✓ each use is cheaper"} tone="ok" appear={verdict} />
      </Box>
    </g>

    {/* In total: every use stacked. */}
    <g {...enter(frame, 12, { from: compact ? "up" : "right" })}>
      <Box x={tt.x} y={tt.y} w={tt.w} h={tt.h} tone={frame >= T.verdict ? "danger" : "line"} focus={during(frame, T.verdict, T.end + 30, 12) * .8} radius={16}>
        <Text x={tt.x + 18} y={tt.y + 24} size={11} weight={600} font="mono" tone="muted" caps>{fr ? "au total" : "in total"}</Text>
        <Tag x={tt.x + tt.w - 14} y={tt.y + 24} anchor="end" text={fr ? "✗ en hausse" : "✗ higher"} tone="danger" size={12} appear={verdict} />
        <line x1={barX - 10} x2={barX + L.barW + 10} y1={base} y2={base} stroke="var(--scene-hairline)" strokeWidth={1} />
      </Box>
    </g>
    {segments.map((seg, i) => {
      if (seg.h <= .2) return null;
      const top = base - tops[i]!;
      const heavy = seg.tile.kind !== "text";
      return <rect key={i} x={barX} y={top} width={L.barW} height={Math.max(.5, seg.h - 1)} rx={Math.min(3, seg.h / 2)}
        style={{ fill: tint(over ? "danger" : "line", heavy ? 62 : 38) }} />;
    })}
    {/* Where the total started, before efficiency and growth. */}
    <g opacity={easeOut(frame, T.first + 50, T.first + 66)}>
      <line x1={barX - 10} x2={barX + L.barW + 8} y1={startY} y2={startY} stroke={TONE.ink} strokeOpacity={.6} strokeWidth={1} strokeDasharray="4 4" />
      <Text x={labelX} y={startY} size={12} weight={600} font="mono" tone="muted">{fr ? "départ" : "start"}</Text>
    </g>
    {(() => {
      const top = base - barH;
      const flat = during(frame, T.efficient + 24, T.more + 16, 10);
      const up = easeOut(frame, T.more + 40, T.more + 56);
      return <>
        {flat > 0 ? <g opacity={flat}><Text x={labelX} y={Math.max(top, startY + 18)} size={12} weight={600} font="mono" tone="ok">{fr ? "↓ à usage constant" : "↓ if use stayed flat"}</Text></g> : null}
        {up > 0 ? <g opacity={up}><Text x={labelX} y={Math.min(top + 6, startY - 20)} size={12} weight={600} font="mono" tone={over ? "danger" : "ink"}>{fr ? "↑ plus d’usages" : "↑ more use"}</Text></g> : null}
      </>;
    })()}
    {frame >= T.verdict && frame < T.verdict + 60 ? <Pulse x={barX + L.barW / 2} y={base - barH} frame={frame} at={T.verdict} period={60} r={10} tone="danger" /> : null}

    {/* Each use sends its energy into the total. */}
    {TILES.map((tile, i) => {
      const t = ease(frame, tile.at + 2, tile.at + FLIGHT, (x) => x * x * (3 - 2 * x));
      if (t <= 0 || t >= 1) return null;
      const r = tilePos(tile);
      const from: [number, number] = [r.x + r.w / 2, r.y + r.h / 2];
      const to: [number, number] = [barX + L.barW / 2, base - (tops[i - 1] ?? 0) - 4];
      const mid: [number, number] = [lerp(from[0], to[0], .55), Math.min(from[1], to[1]) - (compact ? 20 : 34)];
      const path = Array.from({ length: 13 }, (_, k): [number, number] => {
        const u = k / 12;
        return [(1 - u) ** 2 * from[0] + 2 * (1 - u) * u * mid[0] + u * u * to[0], (1 - u) ** 2 * from[1] + 2 * (1 - u) * u * mid[1] + u * u * to[1]];
      });
      return <Comet key={i} points={path} t={t} tone="line" r={tile.kind === "text" ? 3.5 : 5.5} tail={.25} opacity={.9} />;
    })}
    {TILES.map((tile, i) => frame >= tile.at + FLIGHT && frame < tile.at + FLIGHT + 18
      ? <circle key={i} cx={barX + L.barW / 2} cy={base - tops[i]!} r={3 + 6 * ease(frame, tile.at + FLIGHT, tile.at + FLIGHT + 18)} fill="none" stroke={TONE.line} strokeWidth={1} opacity={.6 * (1 - ease(frame, tile.at + FLIGHT, tile.at + FLIGHT + 18))} />
      : null)}
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "Less per task, more in total", fr: "Moins par usage, plus au total" },
  caption: {
    en: "Efficiency lowers the energy of each use; more and heavier uses can still raise total consumption. Units are illustrative, not measurements.",
    fr: "L’efficacité réduit l’énergie de chaque usage ; des usages plus nombreux et plus lourds peuvent quand même faire monter le total. Unités illustratives.",
  },
  beats: [
    { at: 0, text: { en: "Illustrative units: each text query uses some energy; the total adds up every use.", fr: "Unités illustratives : chaque requête texte consomme de l’énergie ; le total additionne tous les usages." } },
    { at: T.efficient, text: { en: "Hardware and software cut the energy per task. With flat usage, the total would fall.", fr: "Le matériel et les logiciels réduisent l’énergie par tâche. À usage constant, le total baisserait." } },
    { at: T.more, text: { en: "But usage keeps rising: many more queries, each cheaper than before.", fr: "Mais les usages augmentent : bien plus de requêtes, chacune moins coûteuse." } },
    { at: T.heavy, text: { en: "Video generation and agents need more than a simple text query.", fr: "La génération de vidéo et les agents consomment davantage qu’une simple requête texte." } },
    { at: T.verdict, text: { en: "Each use became cheaper, and total consumption still grew.", fr: "Chaque usage coûte moins, et la consommation totale augmente quand même." } },
  ],
  Stage,
});
