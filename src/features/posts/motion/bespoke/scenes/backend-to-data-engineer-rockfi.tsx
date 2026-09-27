import { Boundary, Box, Camera, Comet, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, TONE, Wire, type Tone } from "../primitives";
import { defineScene, type Localized, type SceneStageProps } from "../types";

// Timeline (30 fps). Act A: one product writes one schema, fully under control.
// Act B: that product becomes one source among many partners; their mixed
// formats flow through Dagster's Bronze → Silver → Gold and come out as one
// governed shape the teams can trust. Then the next step: a data warehouse.
const T = {
  before: 0,
  swap: 110,
  partners: 122,
  flow: 190,
  layers: [196, 216, 236] as const,
  semantic: 284,
  trust: 304,
  next: 356,
  end: 480,
} as const;

type ShapeKind = "circle" | "square" | "triangle" | "diamond";
type Pt = readonly [number, number];
type Rect = { x: number; y: number; w: number; h: number };

type Source = { key: string; name: Localized<readonly [string, string?]>; shape: ShapeKind; internal?: boolean };

const SOURCES: readonly Source[] = [
  { key: "insurers", name: { en: ["Insurers"], fr: ["Assureurs"] }, shape: "square" },
  { key: "am", name: { en: ["Asset", "managers"], fr: ["Sociétés", "de gestion"] }, shape: "triangle" },
  { key: "prices", name: { en: ["Price", "providers"], fr: ["Fournisseurs", "de prix"] }, shape: "circle" },
  { key: "internal", name: { en: ["RockFi", "internal"], fr: ["Interne", "RockFi"] }, shape: "diamond", internal: true },
];

const LAYERS = ["Bronze", "Silver", "Gold"] as const;

function Shape({ kind, x, y, r, tone, opacity = 1 }: { kind: ShapeKind; x: number; y: number; r: number; tone: Tone; opacity?: number }) {
  const fill = TONE[tone];
  if (kind === "circle") return <circle cx={x} cy={y} r={r} fill={fill} opacity={opacity} />;
  if (kind === "square") return <rect x={x - r * .9} y={y - r * .9} width={r * 1.8} height={r * 1.8} rx={1.5} fill={fill} opacity={opacity} />;
  if (kind === "triangle") return <path d={`M${x} ${y - r * 1.1}L${x + r * 1.05} ${y + r * .8}L${x - r * 1.05} ${y + r * .8}Z`} fill={fill} opacity={opacity} />;
  return <path d={`M${x} ${y - r * 1.15}L${x + r * 1.15} ${y}L${x} ${y + r * 1.15}L${x - r * 1.15} ${y}Z`} fill={fill} opacity={opacity} />;
}

const segLength = (points: readonly Pt[]) => points.slice(1).reduce((sum, point, index) => sum + Math.hypot(point[0] - points[index]![0], point[1] - points[index]![1]), 0);

/** Point at distance d along a polyline. */
function at(points: readonly Pt[], d: number): [number, number] {
  const legs = points.slice(1).map((point, index) => ({ from: points[index]!, to: point, len: Math.hypot(point[0] - points[index]![0], point[1] - points[index]![1]) }));
  const hit = legs.reduce<{ rest: number; point: [number, number] | null }>((state, leg) => {
    if (state.point) return state;
    if (state.rest <= leg.len) {
      const k = leg.len === 0 ? 1 : state.rest / leg.len;
      return { rest: 0, point: [lerp(leg.from[0], leg.to[0], k), lerp(leg.from[1], leg.to[1], k)] };
    }
    return { rest: state.rest - leg.len, point: null };
  }, { rest: Math.max(0, d), point: null });
  const last = points.at(-1)!;
  return hit.point ?? [last[0], last[1]];
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const swap = ease(frame, T.swap, T.swap + 30);
  const actA = 1 - ease(frame, T.swap, T.swap + 16);

  const G = compact
    ? {
      source: (i: number): Rect => i === 3 ? { x: 404, y: 68, w: 116, h: 48 } : { x: 30 + i * 120, y: 68, w: 112, h: 48 },
      outside: { x: 20, y: 58, w: 372, h: 68 },
      previous: { x: 20, y: 100, w: 500, h: 300 },
      productA: { x: 150, y: 136, w: 240, h: 64 },
      dbA: { x: 150, y: 284, w: 240, h: 64 },
      controlTag: [270, 372] as Pt,
      dag: { x: 20, y: 176, w: 500, h: 190 },
      layer: (i: number): Rect => ({ x: 36 + i * 160, y: 206, w: 148, h: 60 }),
      semantic: { x: 36, y: 284, w: 468, h: 64 },
      teams: { x: 280, y: 390, w: 240, h: 74 },
      next: { x: 20, y: 390, w: 240, h: 110 },
    }
    : {
      source: (i: number): Rect => i === 3 ? { x: 40, y: 286, w: 190, h: 46 } : { x: 40, y: 94 + i * 56, w: 190, h: 44 },
      outside: { x: 28, y: 80, w: 214, h: 184 },
      previous: { x: 40, y: 104, w: 620, h: 212 },
      productA: { x: 72, y: 170, w: 210, h: 76 },
      dbA: { x: 418, y: 170, w: 210, h: 76 },
      controlTag: [523, 280] as Pt,
      dag: { x: 268, y: 80, w: 448, h: 252 },
      layer: (i: number): Rect => ({ x: 288 + i * 146, y: 126, w: 112, h: 76 }),
      semantic: { x: 288, y: 230, w: 404, h: 64 },
      teams: { x: 748, y: 126, w: 172, h: 76 },
      next: { x: 748, y: 230, w: 172, h: 102 },
    };
  const layerC = (i: number): Pt => [G.layer(i).x + G.layer(i).w / 2, G.layer(i).y + G.layer(i).h / 2];

  // Every source's route: into Bronze, through Silver and Gold, out to the teams.
  const route = (i: number): Pt[] => {
    const s = G.source(i);
    const bronze = G.layer(0);
    if (compact) {
      const cx = s.x + s.w / 2;
      return [[cx, s.y + s.h], [cx, 148], [bronze.x + bronze.w / 2, 184], [bronze.x + bronze.w / 2, bronze.y], layerC(0), layerC(1), layerC(2), [layerC(2)[0], G.teams.y + 8]];
    }
    const cy = s.y + s.h / 2;
    const entry: Pt = [bronze.x, layerC(0)[1] + (i - 1.5) * 8];
    return [[s.x + s.w, cy], [s.x + s.w + 18, cy], [entry[0] - 16, lerp(cy, entry[1], .85)], entry, layerC(0), layerC(1), layerC(2), [G.teams.x + 10, layerC(2)[1]]];
  };
  // How far along the route data gets right now: nowhere to go until Bronze exists.
  const reachIndex = frame < T.layers[0] ? 3 : frame < T.layers[1] ? 4 : frame < T.layers[2] ? 5 : frame < T.trust ? 6 : 7;

  const packets = frame >= T.partners + 20 ? SOURCES.flatMap((source, i) => {
    const points = route(i);
    const reach = segLength(points.slice(0, reachIndex + 1));
    const silverD = segLength(points.slice(0, 6));
    const goldD = segLength(points.slice(0, 7));
    const cycle = 56 + reach * .1;
    return [0, 1, 2, 3].map((k) => {
      const t = (((frame - T.partners) / cycle) + k / 4 + i * .13) % 1;
      const d = t * reach;
      const [x, y] = at(points, d);
      const governed = d >= silverD;
      const trusted = governed && d >= goldD && frame >= T.semantic;
      const tone: Tone = trusted ? "ok" : governed ? "line" : source.internal ? "line" : "hot";
      const fade = Math.min(1, t * 8, (1 - t) * 8) * easeOut(frame, T.partners + 20 + i * 6, T.partners + 40 + i * 6);
      return { key: `${source.key}${k}`, x, y, kind: governed ? "diamond" as const : source.shape, tone, opacity: fade };
    });
  }) : [];

  const lean = (point: Pt): Pt => [lerp(width / 2, point[0], .2), lerp(height / 2, point[1], .2)];
  const camera = compact ? [{ at: 0 }] : [
    { at: 0 },
    { at: T.flow, dur: 60, zoom: 1.02, focus: lean([G.dag.x + G.dag.w / 2, G.dag.y + G.dag.h / 2]) },
    { at: T.next - 10, dur: 50, zoom: 1 },
  ];

  // The product card is the only actor that survives the change of act: it becomes "RockFi internal".
  const product = G.productA;
  const internal = G.source(3);
  const self: Rect = { x: lerp(product.x, internal.x, swap), y: lerp(product.y, internal.y, swap), w: lerp(product.w, internal.w, swap), h: lerp(product.h, internal.h, swap) };
  const flowA: Pt[] = compact
    ? [[product.x + product.w / 2, product.y + product.h], [G.dbA.x + G.dbA.w / 2, G.dbA.y]]
    : [[product.x + product.w, product.y + product.h / 2], [G.dbA.x, G.dbA.y + G.dbA.h / 2]];

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* ACT A — previous jobs: we produced the data. */}
    {actA > 0 ? <g opacity={actA}>
      <Boundary {...G.previous} label={fr ? "expériences passées" : "previous jobs"} tone="ok" appear={ease(frame, 4, 20)} />
      <Wire d={`M${flowA[0]![0]} ${flowA[0]![1]}L${flowA[1]![0]} ${flowA[1]![1]}`} draw={easeOut(frame, 20, 40)} tone="ok" width={1.5} />
      {frame > 40 ? [0, 1, 2].map((k) => {
        const t = ((frame - 40) / 42 + k / 3) % 1;
        const [x, y] = [lerp(flowA[0]![0], flowA[1]![0], t), lerp(flowA[0]![1], flowA[1]![1], t)];
        return <Shape key={k} kind="diamond" x={x} y={y} r={5.5} tone="ok" opacity={Math.min(1, t * 8, (1 - t) * 8)} />;
      }) : null}
      <g {...enter(frame, 12, { from: "right" })}>
        <Box {...G.dbA} tone="ok" label={fr ? "Notre base" : "Our database"} sub={fr ? "notre schéma" : "our schema"} />
      </g>
      <Tag x={G.controlTag[0]} y={G.controlTag[1]} text={fr ? "✓ 100 % sous contrôle" : "✓ 100% in control"} tone="ok" appear={pop(frame, 50)} size={13} />
    </g> : null}

    {/* ACT B — partners we do not control. */}
    <Boundary {...G.outside} label={fr ? "hors de notre contrôle" : "outside our control"} tone="hot" labelAt={compact ? "top-start" : "bottom-start"} appear={ease(frame, T.partners + 26, T.partners + 42)} />
    <Boundary {...G.dag} label="Dagster · orchestration" tone="line" labelAt={compact ? "bottom-start" : "top-start"} appear={ease(frame, T.flow - 14, T.flow + 4)} />
    <Tag x={G.dag.x + G.dag.w - 18} y={G.dag.y} anchor="end" size={11} tone="ok" text={fr ? "✓ fondation posée" : "✓ foundation done"} appear={pop(frame, T.next)} />

    {/* Data in flight: drawn under the cards, so it disappears into each stage and re-emerges. */}
    {packets.map((packet) => packet.opacity > 0 ? <Shape key={packet.key} kind={packet.kind} x={packet.x} y={packet.y} r={5} tone={packet.tone} opacity={packet.opacity} /> : null)}

    {SOURCES.slice(0, 3).map((source, i) => {
      const s = G.source(i);
      return <g key={source.key} {...enter(frame, stagger(i, T.partners, 6), { from: compact ? "up" : "left", distance: 16 })}>
        <SourceCard rect={s} source={source} locale={locale} compact={compact} tone="hot" />
      </g>;
    })}

    {/* Our product → RockFi internal. */}
    <g {...enter(frame, 0)}>
      <Box {...self} tone="line" radius={lerp(14, 12, swap)} focus={frame < T.swap ? ease(frame, 20, 40) * .6 : 0}>
        <g opacity={1 - ease(frame, T.swap, T.swap + 12)}>
          <Text x={self.x + self.w / 2} y={self.y + self.h / 2 - 10} size={19} weight={600} anchor="middle">{fr ? "Notre produit" : "Our product"}</Text>
          <Text x={self.x + self.w / 2} y={self.y + self.h / 2 + 14} size={12.5} font="mono" weight={500} tone="muted" anchor="middle">{fr ? "écrit la donnée" : "writes the data"}</Text>
        </g>
        {frame >= T.swap + 10 ? <g opacity={ease(frame, T.swap + 12, T.swap + 26)}>
          <SourceCard rect={self} source={SOURCES[3]!} locale={locale} compact={compact} tone="line" bare />
        </g> : null}
      </Box>
    </g>

    {/* Medallion stages. */}
    {LAYERS.map((name, i) => {
      const l = G.layer(i);
      const start = T.layers[i]!;
      const lit = ease(frame, start, start + 10) * (1 - ease(frame, start + 26, start + 50));
      return <g key={name} {...enter(frame, start - 6, { distance: 12 })}>
        <Box x={l.x} y={l.y} w={l.w} h={l.h} tone={i === 2 ? "ok" : "line"} focus={lit} label={name} labelSize={compact ? 17 : 18}
          {...(i === 0 ? { sub: fr ? "flux bruts" : "raw feeds" } : {})} />
      </g>;
    })}

    <g {...enter(frame, T.semantic)}>
      <Box {...G.semantic} tone="ok" radius={14} focus={ease(frame, T.semantic, T.semantic + 12) * (1 - ease(frame, T.semantic + 40, T.semantic + 70))}>
        <Text x={G.semantic.x + 18} y={G.semantic.y + 22} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "gouvernance de la donnée" : "data governance"}</Text>
        <Text x={G.semantic.x + 18} y={G.semantic.y + 45} size={compact ? 15.5 : 16} weight={600}>{fr ? "Modèles sémantiques" : "Semantic models"}</Text>
      </Box>
    </g>

    <g {...enter(frame, T.trust - 4, { from: compact ? "up" : "right" })}>
      <Box {...G.teams} tone="ok" radius={14} focus={ease(frame, T.trust, T.trust + 10) * (1 - ease(frame, T.trust + 36, T.trust + 70))}>
        <Text x={G.teams.x + G.teams.w / 2} y={G.teams.y + G.teams.h / 2 - 12} size={17} weight={600} anchor="middle">{fr ? "Équipes" : "Teams"}</Text>
        <Tag x={G.teams.x + G.teams.w / 2} y={G.teams.y + G.teams.h / 2 + 14} size={11.5} tone="ok" text={fr ? "✓ chiffres fiables" : "✓ numbers they trust"} appear={pop(frame, T.trust + 10)} />
      </Box>
      {frame < T.trust + 50 ? <Pulse x={compact ? G.teams.x + G.teams.w * .625 : G.teams.x} y={compact ? G.teams.y : G.teams.y + G.teams.h / 2} frame={frame} at={T.trust + 8} period={42} r={8} tone="ok" /> : null}
    </g>

    {/* Next level: a proper data warehouse. */}
    <Boundary {...G.next} label={fr ? "étape suivante" : "next step"} tone="hot" appear={ease(frame, T.next, T.next + 16)} />
    <g {...enter(frame, T.next + 8)}>
      <Text x={G.next.x + 18} y={G.next.y + 32} size={15} weight={600}>{fr ? "Entrepôt de données" : "Data warehouse"}</Text>
      <Tag x={G.next.x + 18} y={G.next.y + 62} anchor="start" size={12} tone="hot" text="Snowflake" appear={pop(frame, T.next + 14)} />
      <Text x={G.next.x + 18 + 9 * 7.2 + 18 + 10} y={G.next.y + 62} size={12.5} font="mono" weight={500} tone="muted">{fr ? "ou" : "or"}</Text>
      <Tag x={G.next.x + 18} y={G.next.y + 90} anchor="start" size={12} tone="hot" text="ClickHouse" appear={pop(frame, T.next + 20)} />
    </g>
    <NextLink frame={frame} compact={compact} from={compact ? [G.semantic.x + 200, G.semantic.y + G.semantic.h] : [G.semantic.x + G.semantic.w, G.semantic.y + G.semantic.h / 2]} to={compact ? [G.semantic.x + 200, G.next.y] : [G.next.x, G.semantic.y + G.semantic.h / 2]} />
  </Camera>;
}

function NextLink({ frame, from, to }: { frame: number; compact: boolean; from: Pt; to: Pt }) {
  const d = `M${from[0]} ${from[1]}L${to[0]} ${to[1]}`;
  return <g>
    <Wire d={d} draw={ease(frame, T.next + 4, T.next + 20)} tone="hot" width={1.5} dashed />
    <Comet points={[from, to]} t={ease(frame, T.next + 16, T.next + 40)} tone="hot" r={4.5} tail={.5} />
  </g>;
}

function SourceCard({ rect, source, locale, compact, tone, bare = false }: { rect: Rect; source: Source; locale: "en" | "fr"; compact: boolean; tone: Tone; bare?: boolean }) {
  const { x, y, w, h } = rect;
  const lines = source.name[locale].filter((line): line is string => Boolean(line));
  const content = <>
    <Shape kind={source.shape} x={x + (compact ? 14 : 18)} y={y + h / 2} r={compact ? 4.5 : 5.5} tone={tone} />
    {compact
      ? lines.map((line, index) => <Text key={index} x={x + 26} y={y + h / 2 + (lines.length === 1 ? 0 : index === 0 ? -8 : 9)} size={13.5} weight={600}>{line}</Text>)
      : <Text x={x + 34} y={y + h / 2} size={15} weight={600}>{lines.join(" ")}</Text>}
  </>;
  if (bare) return content;
  return <Box x={x} y={y} w={w} h={h} tone={tone} radius={12}>{content}</Box>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "From data we own to data we govern", fr: "De la donnée produite à gouvernée" },
  caption: {
    en: "The hat changes when most of the data comes from partners you do not control: it must be orchestrated through Bronze, Silver and Gold and governed before anyone can trust the numbers.",
    fr: "La casquette change quand l’essentiel de la donnée vient de partenaires que l’on ne contrôle pas : il faut l’orchestrer en Bronze, Silver et Gold et la gouverner avant de pouvoir se fier aux chiffres.",
  },
  beats: [
    { at: 0, text: { en: "Before: we produced the data ourselves, so we were 100% in control of it.", fr: "Avant : nous produisions nous-mêmes la donnée, nous la contrôlions entièrement." } },
    { at: T.swap, text: { en: "At RockFi, we still produce data, but the main hurdle is a multitude of external partners.", fr: "Chez RockFi, on produit aussi de la donnée, mais l’enjeu, c’est une multitude de partenaires externes." } },
    { at: T.flow, text: { en: "Dagster orchestrates the pipelines through the medallion architecture: Bronze, Silver, Gold.", fr: "Dagster orchestre les pipelines selon l’architecture medallion : Bronze, Silver, Gold." } },
    { at: T.semantic, text: { en: "Semantic models add governance: teams can trust the numbers they use every day.", fr: "Les modèles sémantiques assurent la gouvernance : les équipes peuvent se fier à leurs chiffres." } },
    { at: T.next, text: { en: "The foundation is done. Next level: a proper data warehouse, Snowflake or ClickHouse.", fr: "La fondation est posée. Étape suivante : un véritable entrepôt, Snowflake ou ClickHouse." } },
  ],
  Stage,
});
