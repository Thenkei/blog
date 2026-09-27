import { Box, Camera, CodeBlock, Comet, ease, easeOut, enter, lerp, pop, Pulse, Tag, Text, tint, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). Act 1 shows the silent duplicate, act 2 replays the same
// upsert once the index says NULLS NOT DISTINCT.
const T = {
  upsertIn: 18,
  compareA: 70,
  nullA: 108,
  insert: 150,
  landA: 178,
  fix: 214,
  typed: 228,
  compareB: 300,
  nullB: 330,
  update: 360,
  landB: 386,
  end: 450,
} as const;

type Pt = readonly [number, number];
const bezier = (p0: Pt, p1: Pt, p2: Pt, t: number): [number, number] => [
  (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
  (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
];

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact
    ? { code: [20, 50, 500], upsert: [20, 176, 500, 52], compare: [20, 238, 500, 136], table: [20, 386, 500, 128] }
    : { code: [40, 64, 420], upsert: [510, 64, 410, 70], compare: [510, 162, 410, 112], table: [40, 208, 420, 172] };
  const [codeX, codeY, codeW] = L.code as [number, number, number];
  const [upX, upY, upW, upH] = L.upsert as [number, number, number, number];
  const [cmpX, cmpY, cmpW, cmpH] = L.compare as [number, number, number, number];
  const [tabX, tabY, tabW, tabH] = L.table as [number, number, number, number];

  const actB = frame >= T.fix;
  const compareStart = actB ? T.compareB : T.compareA;
  const nullAt = actB ? T.nullB : T.nullA;
  const verdictAt = actB ? T.update : T.insert;
  const landAt = actB ? T.landB : T.landA;
  const verdictTone: Tone = actB ? "ok" : "danger";
  const evaluated = frame >= nullAt;

  // The comparator resets between the two acts so the replay reads as a new run.
  const cmpVisible = actB ? easeOut(frame, T.compareB - 18, T.compareB) : easeOut(frame, T.compareA - 20, T.compareA) * (1 - ease(frame, T.fix, T.fix + 14));
  const operator = pop(frame, nullAt, 180);

  const rowH = compact ? 32 : 36;
  const headerY = tabY + (compact ? 42 : 48);
  const row1Y = headerY + rowH + 2;
  const row2Y = row1Y + rowH + 4;
  const duplicate = pop(frame, T.landA) * (1 - ease(frame, T.fix, T.fix + 18));
  const updated = actB ? pop(frame, T.landB) : 0;
  const rows = duplicate > .5 ? 2 : 1;

  // The upsert travels to the comparator; its verdict then flies into the table.
  const packetT = ease(frame, compareStart - 28, compareStart);
  const packetPath: Pt[] = [[upX + upW * .5, upY + upH], [upX + upW * .5, cmpY - 6]];
  const flight = ease(frame, verdictAt + 4, landAt, (t) => 1 - (1 - t) ** 3);
  const flying = frame >= verdictAt + 4 && frame < landAt;
  const from: Pt = [cmpX + cmpW * .5, cmpY + cmpH];
  const target: Pt = [tabX + tabW / 2, actB ? row1Y : row2Y];
  const control: Pt = compact ? [from[0] + 90, (from[1] + target[1]) / 2] : [lerp(from[0], target[0], .5), from[1] + 70];
  const [ghostX, ghostY] = bezier(from, control, target, flight);
  const ghostW = lerp(compact ? 260 : 220, tabW - 20, flight);

  // Camera: a slow drift toward whatever decides. Emphasis comes from focus, not cropping.
  // Lean, don't pan: move a third of the way toward the subject so context stays in frame.
  const lean = (point: Pt): Pt => [lerp(width / 2, point[0], .2), lerp(height / 2, point[1], .2)];
  const cmpFocus = lean([cmpX + cmpW / 2, cmpY + cmpH / 2]);
  const codeFocus = lean([codeX + codeW / 2, codeY + 60]);
  const zoomIn = 1.04;
  const camera = [
    { at: 0 },
    { at: T.compareA - 14, zoom: zoomIn, focus: cmpFocus },
    { at: T.insert - 8, zoom: 1 },
    { at: T.fix + 4, zoom: 1.05, focus: codeFocus },
    { at: T.compareB - 24, zoom: zoomIn, focus: cmpFocus },
    { at: T.update - 8, zoom: 1 },
  ];

  const col = [tabX + 20, tabX + tabW * .46];
  const cell = (y: number, tone: "ink" | "danger" | "ok", extra?: string) => <>
    <Text x={col[0]!} y={y} size={15.5} font="mono" weight={600} tone={tone}>FR0011</Text>
    <Text x={col[1]!} y={y} size={15.5} font="mono" weight={600} tone={tone === "ink" ? "muted" : tone}>NULL</Text>
    {extra ? <Tag x={tabX + tabW - 14} y={y} text={extra} tone={tone === "ink" ? "line" : tone} anchor="end" size={11} /> : null}
  </>;

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    <g {...enter(frame, 0)}>
      <CodeBlock
        x={codeX} y={codeY} w={codeW} frame={frame} title="schema.sql" size={compact ? 14.5 : 15}
        highlight={frame >= T.typed ? 2 : undefined}
        lines={[
          { text: "CREATE UNIQUE INDEX idx_product_unique" },
          { text: "  ON products (isin, provider_ref)" },
          { text: "  NULLS NOT DISTINCT;", tone: "ok", appearAt: T.typed },
        ]}
      />
    </g>

    <g {...enter(frame, 8)}>
      <Box x={tabX} y={tabY} w={tabW} h={tabH} tone="line" radius={16}>
        <Text x={tabX + 20} y={tabY + 22} size={11} font="mono" weight={600} tone="muted" caps>products</Text>
        <Tag x={tabX + tabW - 14} y={tabY + 22} text={fr ? `${rows} ligne${rows > 1 ? "s" : ""}` : `${rows} row${rows > 1 ? "s" : ""}`} tone={rows > 1 ? "danger" : "muted"} anchor="end" size={11} />
        <Text x={col[0]!} y={headerY} size={12} font="mono" weight={500} tone="muted">isin</Text>
        <Text x={col[1]!} y={headerY} size={12} font="mono" weight={500} tone="muted">provider_ref</Text>
        <line x1={tabX + 14} x2={tabX + tabW - 14} y1={headerY + 16} y2={headerY + 16} stroke="var(--scene-hairline)" strokeWidth={1} />
        <rect x={tabX + 10} y={row1Y - rowH / 2} width={tabW - 20} height={rowH} rx={9} style={{ fill: tint("ok", 18 * updated) }} />
        {cell(row1Y, updated > .5 ? "ok" : "ink", updated > .5 ? (fr ? "mis à jour" : "updated") : undefined)}
        {duplicate > 0 ? <g opacity={Math.min(1, duplicate)}>
          <rect x={tabX + 10} y={row2Y - rowH / 2} width={tabW - 20} height={rowH} rx={9} style={{ fill: tint("danger", 16) }} />
          {cell(row2Y, "danger", fr ? "doublon" : "duplicate")}
        </g> : null}
      </Box>
      {!actB ? <Pulse x={tabX + 10} y={row2Y} frame={frame} at={T.landA} period={40} r={8} tone="danger" /> : null}
      {actB ? <Pulse x={tabX + 10} y={row1Y} frame={frame} at={T.landB} period={40} r={8} tone="ok" /> : null}
    </g>

    <g {...enter(frame, T.upsertIn, { from: "right", distance: 26 })}>
      <Box x={upX} y={upY} w={upW} h={upH} tone="hot" focus={packetT > 0 && packetT < 1 ? 1 : 0} radius={16}>
        <Text x={upX + 20} y={upY + upH / 2 - 12} size={11} font="mono" weight={600} tone="hot" caps>upsert</Text>
        <Text x={upX + 20} y={upY + upH / 2 + 12} size={compact ? 14.5 : 15} font="mono" weight={500}>('FR0011', NULL) ON CONFLICT DO UPDATE</Text>
      </Box>
    </g>
    <Comet points={packetPath} t={packetT} tone="hot" tail={.35} />

    {cmpVisible > 0 ? <g opacity={cmpVisible}>
      <Box x={cmpX} y={cmpY} w={cmpW} h={cmpH} tone={evaluated ? verdictTone : "line"} focus={evaluated ? ease(frame, nullAt, nullAt + 10) * (1 - ease(frame, landAt, landAt + 20)) : 0} radius={16}>
        <Text x={cmpX + 20} y={cmpY + 24} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "la clé existe-t-elle déjà ?" : "does the key already exist?"}</Text>
        <g {...enter(frame, compareStart, { dur: 12, distance: 8 })}>
          <Text x={cmpX + 20} y={cmpY + 56} size={15} font="mono" tone="muted">isin</Text>
          <Text x={cmpX + cmpW * .32} y={cmpY + 56} size={15.5} font="mono" weight={600}>FR0011 = FR0011</Text>
          <Tag x={cmpX + cmpW - 16} y={cmpY + 56} text="true" tone="ok" anchor="end" appear={pop(frame, compareStart + 10)} />
        </g>
        <g {...enter(frame, compareStart + 16, { dur: 12, distance: 8 })}>
          <Text x={cmpX + 20} y={cmpY + 88} size={15} font="mono" tone="muted">ref</Text>
          <Text x={cmpX + cmpW * .32} y={cmpY + 88} size={15.5} font="mono" weight={600} tone={evaluated ? verdictTone : "ink"}>NULL</Text>
          <g transform={`translate(${cmpX + cmpW * .32 + 58} ${cmpY + 88}) scale(${evaluated ? .6 + .4 * operator : 1})`}>
            <Text x={0} y={0} size={17} font="mono" weight={700} anchor="middle" tone={evaluated ? verdictTone : "muted"}>{evaluated ? (actB ? "≡" : "≠") : "?"}</Text>
          </g>
          <Text x={cmpX + cmpW * .32 + 78} y={cmpY + 88} size={15.5} font="mono" weight={600} tone={evaluated ? verdictTone : "ink"}>NULL</Text>
          <Tag x={cmpX + cmpW - 16} y={cmpY + 88} text={actB ? "same" : "distinct"} tone={verdictTone} anchor="end" appear={pop(frame, nullAt + 4)} />
        </g>
      </Box>
      <Tag
        x={compact ? cmpX + 20 : cmpX + cmpW * .5} y={compact ? cmpY + cmpH - 22 : cmpY + cmpH + 24} anchor={compact ? "start" : "middle"}
        text={actB ? "conflict → DO UPDATE" : "no conflict → INSERT"}
        tone={verdictTone}
        appear={pop(frame, verdictAt)}
      />
    </g> : null}

    {flying ? <g transform={`translate(${ghostX} ${ghostY})`} opacity={.3 + .7 * Math.min(1, flight * 3)}>
      <rect className="scene-card" x={-ghostW / 2} y={-rowH / 2} width={ghostW} height={rowH} rx={9} style={{ fill: "var(--scene-card)" }} />
      <rect className="scene-glow" x={-ghostW / 2} y={-rowH / 2} width={ghostW} height={rowH} rx={9} style={{ fill: tint(verdictTone, 20), color: `var(--visual-${actB ? "ok" : "danger"})` }} stroke={`var(--visual-${actB ? "ok" : "danger"})`} strokeOpacity={.6} />
      <Text x={0} y={.5} size={14} font="mono" weight={600} tone={verdictTone} anchor="middle">{actB ? "DO UPDATE → FR0011" : "INSERT ('FR0011', NULL)"}</Text>
    </g> : null}
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.landA + 20,
  title: { en: "Why the upsert inserted twice", fr: "Pourquoi l’upsert insère deux fois" },
  caption: {
    en: "By default a unique index treats every NULL as distinct, so ON CONFLICT never fires on nullable keys. NULLS NOT DISTINCT (PostgreSQL 15+) makes the conflict detectable.",
    fr: "Par défaut, un index unique considère chaque NULL comme distinct : ON CONFLICT ne se déclenche jamais sur une clé nullable. NULLS NOT DISTINCT (PostgreSQL 15+) rend le conflit détectable.",
  },
  beats: [
    { at: 0, text: { en: "An upsert arrives for a key that already exists: ('FR0011', NULL).", fr: "Un upsert arrive pour une clé qui existe déjà : ('FR0011', NULL)." } },
    { at: T.nullA, text: { en: "Postgres compares keys. NULL = NULL is not true, so the keys are \"distinct\".", fr: "Postgres compare les clés. NULL = NULL n’est pas vrai : les clés sont « distinctes »." } },
    { at: T.insert, text: { en: "No conflict is detected. ON CONFLICT is skipped and a duplicate row is inserted.", fr: "Aucun conflit détecté. ON CONFLICT est ignoré et un doublon est inséré." } },
    { at: T.fix, text: { en: "Fix the index, not the query: add NULLS NOT DISTINCT.", fr: "Corriger l’index, pas la requête : ajouter NULLS NOT DISTINCT." } },
    { at: T.nullB, text: { en: "Same upsert: the NULLs now match, the conflict fires and DO UPDATE runs.", fr: "Même upsert : les NULL correspondent, le conflit se déclenche et DO UPDATE s’exécute." } },
  ],
  Stage,
});
