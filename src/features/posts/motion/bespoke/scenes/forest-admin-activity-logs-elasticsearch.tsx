import { Box, Comet, during, ease, easeOut, enter, lerp, Meter, pop, Pulse, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). One request, replayed. Act 1: PostgreSQL alone JOINs users,
// teams and resources onto the 100M+ row activity-log table and blows the query
// budget. Then the log table itself moves into Elasticsearch while the relational
// tables stay normalized in PostgreSQL. Act 2: the same request ping-pongs:
// PostgreSQL filter → Elasticsearch fetch → PostgreSQL enrichment → client.
const T = {
  request: 18,
  joins: 44,
  timeout: 142,
  swap: 196,
  migrate: [206, 242],
  step1: 262,
  ids: 288,
  step2: 318,
  idsFly: [320, 344],
  docs: 350,
  step3: 380,
  docsBack: [382, 408],
  enrich: 412,
  results: [432, 456],
  done: 458,
  end: 530,
} as const;

// Placeholder identifiers: the point is the hand-off, not the values.
const IDS = ["u1", "u2", "u3"] as const;
// Budget share of each hybrid step (relative, not measured).
const STEP = [.08, .14, .08] as const;
const LIMIT = .8;
const MATCH_ROWS = [3, 7, 11] as const;

type Pt = readonly [number, number];
const bezier = (p0: Pt, p1: Pt, p2: Pt, t: number): [number, number] => [
  (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
  (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
];
type Rect = { x: number; y: number; w: number; h: number };

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact
    ? {
      client: { x: 20, y: 54, w: 500, h: 58 },
      pg: { x: 20, y: 126, w: 500, h: 168 },
      es: { x: 20, y: 308, w: 500, h: 150 },
      tables: { x: 36, w: 132, h: 28, ys: [188, 222, 256] },
      logsPg: { x: 356, y: 172, w: 148, h: 110 },
      logsEs: { x: 36, y: 348, w: 148, h: 98 },
      idsY: 196,
      pgRows: [220, 246, 272],
      esRows: [372, 402, 432],
      rowW: 148,
      rowH: 24,
      meter: { x: 36, y: 494, w: 468 },
    }
    : {
      client: { x: 40, y: 88, w: 172, h: 232 },
      pg: { x: 236, y: 64, w: 336, h: 264 },
      es: { x: 596, y: 64, w: 324, h: 264 },
      tables: { x: 256, w: 116, h: 36, ys: [134, 182, 230] },
      logsPg: { x: 412, y: 108, w: 140, h: 166 },
      logsEs: { x: 760, y: 108, w: 140, h: 166 },
      idsY: 132,
      pgRows: [176, 210, 244],
      esRows: [150, 184, 218],
      rowW: 140,
      rowH: 26,
      meter: { x: 236, y: 370, w: 684 },
    };
  const { client: c, pg, es, tables, meter } = L;
  const pgRowX = L.logsPg.x;
  // Wide: documents sit left of the index, so their trip back never crosses it.
  const esRowX = compact ? 356 : 616;
  const esRowW = compact ? 148 : 124;

  const actB = frame >= T.swap;
  const timedOut = frame >= T.timeout && !actB;
  const aOut = ease(frame, T.swap, T.swap + 14);

  // ── The activity-log table: in PostgreSQL, then migrated into Elasticsearch.
  const move = ease(frame, T.migrate[0], T.migrate[1]);
  const logs: Rect = {
    x: lerp(L.logsPg.x, L.logsEs.x, move),
    y: lerp(L.logsPg.y, L.logsEs.y, move),
    w: lerp(L.logsPg.w, L.logsEs.w, move),
    h: lerp(L.logsPg.h, L.logsEs.h, move),
  };
  const scanning = frame >= T.joins + 24 && frame < T.timeout;
  const matched = frame >= T.idsFly[1];

  // ── Query budget. Act 1 crawls past the timeout; act 2 adds three short steps.
  const valueA = LIMIT * ease(frame, T.joins, T.timeout, (t) => t) + .05 * easeOut(frame, T.timeout, T.timeout + 10);
  const valueB = STEP[0] * ease(frame, T.step1, T.ids + 10) + STEP[1] * ease(frame, T.step2, T.docs + 16) + STEP[2] * ease(frame, T.step3, T.results[0]);
  const meterValue = actB ? valueB : valueA * (1 - aOut);

  const tableNames = ["users", "teams", "resources"] as const;
  const tableAt = (index: number): Rect => ({ x: tables.x, y: tables.ys[index]! - tables.h / 2, w: tables.w, h: tables.h });
  const joinAt = (index: number) => T.joins + index * 10;

  // Focus per act-2 step: teams then users answer step 1; enrichment reads all three.
  const tableFocus = (index: number) => {
    if (!actB) return frame >= joinAt(index) && !timedOut ? ease(frame, joinAt(index), joinAt(index) + 8) : 0;
    const step1 = index === 1 ? during(frame, T.step1 + 14, T.ids + 4, 8) : index === 0 ? during(frame, T.ids - 10, T.ids + 16, 8) : 0;
    const step3 = during(frame, T.enrich - 6, T.enrich + 26, 8);
    return Math.max(step1, step3);
  };

  const quote = compact
    ? [fr ? "« Montrez-moi les journaux de l’équipe Marketing »" : "“Show me logs for the Marketing Team”"]
    : fr ? ["« Montrez-moi", "les journaux de", "l’équipe Marketing »"] : ["“Show me logs for", "the Marketing Team”"];
  const dividerY = c.y + 50 + (quote.length - 1) * 20 + 22;
  const quoteEnd: Pt = compact ? [c.x + 24, c.y + c.h] : [c.x + c.w, c.y + 58];

  // Request packet: client → first table it hits (users in act 1, teams in act 2).
  const requestPath = (target: Rect): Pt[] => {
    const to: Pt = [target.x + (compact ? target.w / 2 : 0), target.y + (compact ? 0 : target.h / 2)];
    const control: Pt = compact ? [quoteEnd[0], to[1] - 10] : [lerp(quoteEnd[0], to[0], .5), quoteEnd[1]];
    return Array.from({ length: 13 }, (_, step) => bezier(quoteEnd, control, to, step / 12));
  };
  const requestT = actB ? ease(frame, T.step1, T.step1 + 20) : ease(frame, T.request, T.request + 22);

  const resultSlot = (index: number): Rect => compact
    ? { x: c.x + c.w - 136, y: c.y + 9, w: 120, h: 22 }
    : { x: c.x + 16, y: dividerY + 20 + index * 26 - 11, w: c.w - 32, h: 22 };

  const docCard = (x: number, y: number, w: number, h: number, id: string, enriched: number, tone: Tone, key: string, opacity = 1) => <g key={key} opacity={opacity}>
    <rect className="scene-card" x={x} y={y} width={w} height={h} rx={7} style={{ fill: "var(--scene-card)" }} />
    <rect x={x} y={y} width={w} height={h} rx={7} style={{ fill: tint(tone, 14) }} stroke={TONE[tone]} strokeOpacity={.55} />
    <Text x={x + 10} y={y + h / 2 + .5} size={12.5} font="mono" weight={600} tone={enriched > .5 ? "ok" : "ink"}>
      {enriched > .5 ? `${id} · Marketing` : `log · ${id}`}
    </Text>
  </g>;

  const opLabel = (text: string, tone: Tone, on: number, at: Rect) => on > 0
    ? <Tag x={compact ? at.x + at.w - 16 : at.x + 20} y={compact ? at.y + 24 : at.y + at.h - 26} anchor={compact ? "end" : "start"} size={compact ? 11 : 12} tone={tone} appear={on} text={text} />
    : null;

  return <g>
    {/* Client */}
    <g {...enter(frame, 0)}>
      <Box x={c.x} y={c.y} w={c.w} h={c.h} tone={timedOut ? "danger" : frame >= T.done ? "ok" : "hot"} focus={during(frame, T.request - 8, T.request + 20, 8) + during(frame, T.step1 - 8, T.step1 + 20, 8)} radius={14}>
        <Text x={c.x + 16} y={c.y + (compact ? 18 : 22)} size={11} font="mono" weight={600} tone="hot" caps>client</Text>
        {quote.map((line, index) => <Text key={index} x={c.x + 16} y={c.y + (compact ? 39 : 50 + index * 20)} size={compact ? 14 : 14.5} weight={600}>{line}</Text>)}
        {!compact ? <line x1={c.x + 16} x2={c.x + c.w - 16} y1={dividerY} y2={dividerY} stroke="var(--scene-hairline)" strokeWidth={1} /> : null}
      </Box>
      {(() => {
        const status = timedOut
          ? { text: fr ? "✗ requête expirée" : "✗ query timed out", tone: "danger" as const, on: pop(frame, T.timeout) * (1 - aOut) }
          : !actB && frame >= T.request + 22
            ? { text: fr ? "en attente…" : "waiting…", tone: "muted" as const, on: easeOut(frame, T.request + 22, T.request + 34) }
            : undefined;
        if (!status) return null;
        return compact
          ? <Tag x={c.x + c.w - 16} y={c.y + 20} anchor="end" size={11} tone={status.tone} appear={status.on} text={status.text} />
          : <Tag x={c.x + 16} y={dividerY + 24} anchor="start" size={12} tone={status.tone} appear={status.on} text={status.text} />;
      })()}
    </g>

    {/* PostgreSQL */}
    <g {...enter(frame, 6)}>
      <Box x={pg.x} y={pg.y} w={pg.w} h={pg.h} tone={timedOut ? "danger" : "line"} radius={16}>
        <Text x={pg.x + 20} y={pg.y + 26} size={16} weight={600}>PostgreSQL</Text>
      </Box>
    </g>
    {tableNames.map((name, index) => {
      const r = tableAt(index);
      const on = enter(frame, 12 + index * 5);
      return <g key={name} {...on}>
        <Box x={r.x} y={r.y} w={r.w} h={r.h} tone={actB && tableFocus(index) > 0 ? "hot" : "line"} focus={tableFocus(index)} radius={9}>
          <Text x={r.x + 12} y={r.y + r.h / 2 + .5} size={13} font="mono" weight={600}>{name}</Text>
        </Box>
      </g>;
    })}
    {/* Act 1: the JOINs fan into the big table */}
    {!actB || aOut < 1 ? <g opacity={1 - aOut}>
      {tableNames.map((name, index) => {
        const r = tableAt(index);
        const from: Pt = compact ? [r.x + r.w, r.y + r.h / 2] : [r.x + r.w, r.y + r.h / 2];
        const to: Pt = [L.logsPg.x, L.logsPg.y + L.logsPg.h / 2];
        const draw = ease(frame, joinAt(index), joinAt(index) + 14);
        const mid: Pt = [lerp(from[0], to[0], .5), lerp(from[1], to[1], .5)];
        const d = `M${from[0]} ${from[1]}C${mid[0]} ${from[1]} ${mid[0]} ${to[1]} ${to[0]} ${to[1]}`;
        const tone: Tone = timedOut ? "danger" : "hot";
        return <g key={name}>
          <path d={d} fill="none" stroke={TONE[tone]} strokeWidth={1.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} opacity={.8} />
          <g opacity={ease(frame, joinAt(index) + 8, joinAt(index) + 16)}>
            <circle cx={mid[0]} cy={lerp(from[1], to[1], .5)} r={9} style={{ fill: "var(--scene-card)" }} stroke={TONE[tone]} strokeOpacity={.6} />
            <Text x={mid[0]} y={lerp(from[1], to[1], .5) + .5} size={12} font="mono" weight={700} anchor="middle" tone={tone}>⋈</Text>
          </g>
        </g>;
      })}
      {opLabel(fr ? "JOIN en chaîne" : "chained JOINs", timedOut ? "danger" : "hot", ease(frame, T.joins + 30, T.joins + 44), pg)}
    </g> : null}

    {/* Elasticsearch */}
    {actB ? <g opacity={easeOut(frame, T.swap, T.swap + 18)} transform={`translate(${(1 - easeOut(frame, T.swap, T.swap + 18)) * (compact ? 0 : 24)} ${(1 - easeOut(frame, T.swap, T.swap + 18)) * (compact ? 16 : 0)})`}>
      <Box x={es.x} y={es.y} w={es.w} h={es.h} tone="hot" focus={.7 * during(frame, T.step2, T.docs + 20, 8)} radius={16}>
        <Text x={es.x + 20} y={es.y + 26} size={16} weight={600}>Elasticsearch</Text>
      </Box>
    </g> : null}

    {/* The activity-log table / index */}
    <g {...enter(frame, 26)}>
      <Box x={logs.x} y={logs.y} w={logs.w} h={logs.h} tone={timedOut ? "danger" : actB ? "hot" : "line"} fill={timedOut ? .7 : 0} focus={actB ? during(frame, T.idsFly[1] - 4, T.docs + 18, 8) : 0} radius={12}>
        <Text x={logs.x + 12} y={logs.y + 20} size={13} font="mono" weight={600} tone={timedOut ? "danger" : "ink"}>{actB ? (fr ? "journaux" : "activity logs") : "activity_logs"}</Text>
        <Text x={logs.x + 12} y={logs.y + 38} size={11} font="mono" weight={600} tone="muted" caps>{actB ? (fr ? "100 M+ docs" : "100M+ docs") : (fr ? "100 M+ lignes" : "100M+ rows")}</Text>
        {(() => {
          const top = logs.y + 52;
          const rows = Math.floor((logs.h - 62) / 7);
          const band = ((frame - T.joins) % 30) / 30;
          return <g>
            {Array.from({ length: rows }, (_, row) => {
              const y = top + row * 7;
              const hit = matched && (MATCH_ROWS as readonly number[]).includes(row) && frame < T.step3 + 20;
              return <rect key={row} x={logs.x + 12} y={y} width={logs.w - 24 - (row % 3) * 14} height={2.5} rx={1.25} style={{ fill: hit ? TONE.hot : tint(timedOut ? "danger" : "ink", timedOut ? 40 : 16) }} />;
            })}
            {scanning ? <rect x={logs.x + 6} y={top - 4 + band * (rows * 7 - 8)} width={logs.w - 12} height={14} rx={4} style={{ fill: tint("hot", 26) }} /> : null}
          </g>;
        })()}
      </Box>
    </g>
    {frame >= T.migrate[1] && frame < T.migrate[1] + 40 ? <Pulse x={logs.x + logs.w / 2} y={logs.y + logs.h / 2} frame={frame} at={T.migrate[1]} period={40} r={20} tone="hot" /> : null}
    {actB ? <Tag x={compact ? pg.x + pg.w - 16 : pg.x + 20} y={compact ? pg.y + 24 : pg.y + pg.h - 26} anchor={compact ? "end" : "start"} size={compact ? 11 : 12} tone="line"
      appear={easeOut(frame, T.migrate[1], T.migrate[1] + 16) * (1 - ease(frame, T.step1 + 6, T.step1 + 14))} text={fr ? "reste normalisé" : "stays normalized"} /> : null}

    {/* Step 1: teams → user IDs (PostgreSQL) */}
    {actB ? <>
      {opLabel(fr ? "WHERE team = 'Marketing'" : "WHERE team = 'Marketing'", "hot", ease(frame, T.step1 + 14, T.step1 + 26) * (1 - ease(frame, T.step3 - 6, T.step3 + 4)), pg)}
      {IDS.map((id, index) => {
        const fly = ease(frame, T.idsFly[0] + index * 3, T.idsFly[1] + index * 3 - 6);
        if (fly >= 1) return null;
        const from: Pt = [pgRowX + 8 + index * 46, L.idsY];
        const to: Pt = [L.logsEs.x + 16 + index * 36, L.logsEs.y + L.logsEs.h * .6];
        const control: Pt = compact ? [lerp(from[0], to[0], .5) + 40, lerp(from[1], to[1], .5)] : [lerp(from[0], to[0], .5), lerp(from[1], to[1], .5) + 30];
        const [px, py] = bezier(from, control, to, fly);
        // The ID sinks into the index as it arrives.
        const sink = 1 - ease(frame, T.idsFly[1] + index * 3 - 14, T.idsFly[1] + index * 3 - 6);
        return <Tag key={id} x={px} y={py} anchor="start" size={12} tone="hot" appear={Math.min(1, pop(frame, T.ids + index * 5)) * sink} text={id} />;
      })}
      {/* Step 2 query */}
      {opLabel("terms: { user_id: [u1, u2, u3] }", "hot", ease(frame, T.step2 + 6, T.step2 + 18), es)}
      {/* Documents: out of the index, back to PostgreSQL, enriched, then to the client */}
      {IDS.map((id, index) => {
        const born = T.docs + index * 5;
        if (frame < born) return null;
        const out = easeOut(frame, born, born + 16);
        const esFrom: Pt = [L.logsEs.x + 12, L.logsEs.y + 52 + MATCH_ROWS[index]! * 7];
        const esSlot: Pt = [esRowX, L.esRows[index]! - L.rowH / 2];
        const pgSlot: Pt = [pgRowX, L.pgRows[index]! - L.rowH / 2];
        const back = ease(frame, T.docsBack[0] + index * 4, T.docsBack[1] + index * 4 - 8);
        const toClient = ease(frame, T.results[0] + index * 4, T.results[1] + index * 4 - 8);
        const enriched = ease(frame, T.enrich + index * 5, T.enrich + index * 5 + 8);
        const target = resultSlot(index);
        const [x0, y0] = [lerp(esFrom[0], esSlot[0], out), lerp(esFrom[1], esSlot[1], out)];
        const backControl: Pt = compact ? [lerp(esSlot[0], pgSlot[0], .5), lerp(esSlot[1], pgSlot[1], .5)] : [lerp(esSlot[0], pgSlot[0], .5), Math.min(esSlot[1], pgSlot[1]) - 16];
        const [x1, y1] = back > 0 ? bezier(esSlot, backControl, pgSlot, back) : [x0, y0];
        // Wide: dip under the tables rather than across them.
        const clientControl: Pt = compact ? [lerp(pgSlot[0], target.x, .5), lerp(pgSlot[1], target.y, .5)] : [lerp(pgSlot[0], target.x, .5), 345];
        const [x, y] = toClient > 0 ? bezier(pgSlot, clientControl, [target.x, target.y], toClient) : [x1, y1];
        const w = toClient > 0 ? lerp(L.rowW, target.w, toClient) : back > 0 ? lerp(esRowW, L.rowW, back) : lerp(40, esRowW, out);
        const h = toClient > 0 ? lerp(L.rowH, target.h, toClient) : L.rowH;
        const tone: Tone = enriched > .5 ? "ok" : "hot";
        // In compact the three results collapse into the client's single status slot.
        const fade = compact && toClient > 0 ? 1 - ease(frame, T.results[1] + index * 4 - 14, T.results[1] + index * 4 - 6) : 1;
        return docCard(x, y, w, h, id, enriched, tone, id, Math.min(1, out * 1.4) * fade);
      })}
      {opLabel(fr ? (compact ? "+ données relationnelles" : "+ données relationnelles à jour") : "+ latest relational data", "ok", ease(frame, T.enrich - 4, T.enrich + 8) * (1 - during(frame, T.results[0] - 4, T.results[1] + 16, 8)), pg)}
      {/* Step markers next to each engine: the poster keeps the whole route. */}
      {([
        { n: 1, label: fr ? "filtre" : "filter", at: T.step1, end: T.step2, card: pg, slot: 0 },
        { n: 3, label: fr ? "enrichi" : "enrich", at: T.step3, end: T.results[1], card: pg, slot: 1 },
        { n: 2, label: fr ? "lecture" : "fetch", at: T.step2, end: T.step3, card: es, slot: 0 },
      ] as const).map((step) => {
        const titleW = step.card === pg ? 96 : 108;
        // Chip width as Tag computes it (size 11), so the second chip never touches the first.
        const firstW = `1 · ${fr ? "filtre" : "filter"}`.length * 11 * .6 + 16.5;
        const x = step.card.x + 20 + titleW + 10 + step.slot * (firstW + 8);
        const tone: Tone = frame >= step.end ? "ok" : "hot";
        return <Tag key={step.n} x={x} y={step.card.y + 26} anchor="start" size={11} tone={tone} appear={pop(frame, step.at)} text={`${step.n} · ${step.label}`} />;
      })}
      {frame >= T.done ? <>
        <Tag x={compact ? c.x + c.w - 16 : c.x + 16} y={compact ? c.y + 20 : c.y + c.h - 16} anchor={compact ? "end" : "start"} size={11} tone="ok" appear={pop(frame, T.done)} text={fr ? "✓ piste d’audit" : "✓ audit trail"} />
      </> : null}
    </> : null}

    {/* Request packets */}
    <Comet points={requestPath(tableAt(actB ? 1 : 0))} t={requestT} tone="hot" r={4.5} tail={.3} />

    {/* Query budget */}
    <g {...enter(frame, T.joins - 14)}>
      <Meter x={meter.x} y={meter.y} w={meter.w} h={compact ? 8 : 10} value={meterValue} limit={LIMIT} tone={actB && frame >= T.results[0] ? "ok" : "line"} label={fr ? "durée de la requête" : "query time"} />
      <Text x={meter.x + meter.w * LIMIT + 8} y={meter.y - 16} size={11} font="mono" weight={600} tone="danger" caps>timeout</Text>
      {actB ? <Tag x={meter.x + meter.w * (STEP[0] + STEP[1] + STEP[2]) + 12} y={meter.y + (compact ? 4 : 5)} anchor="start" size={11} tone="ok" appear={pop(frame, T.done + 4)} text={fr ? "✓ bien sous le timeout" : "✓ well under the timeout"} /> : null}
    </g>
  </g>;
}


export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 1,
  title: { en: "One request, two engines", fr: "Une requête, deux moteurs" },
  caption: {
    en: "PostgreSQL keeps the relational context, Elasticsearch does the heavy search: filter IDs in PostgreSQL, fetch documents in Elasticsearch, enrich in PostgreSQL.",
    fr: "PostgreSQL garde le contexte relationnel, Elasticsearch fait la recherche lourde : filtrer les ID dans PostgreSQL, récupérer les documents dans Elasticsearch, enrichir dans PostgreSQL.",
  },
  beats: [
    { at: 0, text: { en: "A user asks: “Show me logs for the Marketing Team”.", fr: "Un utilisateur demande : « Montrez-moi les journaux de l’équipe Marketing »." } },
    { at: T.joins, text: { en: "PostgreSQL alone chains JOINs across users, teams and resources onto 100M+ log rows. It times out.", fr: "PostgreSQL seul enchaîne des JOIN (utilisateurs, équipes, ressources) sur 100 M+ de lignes : timeout." } },
    { at: T.swap, text: { en: "The logs move to Elasticsearch; users, teams and resources stay normalized in PostgreSQL.", fr: "Les journaux passent dans Elasticsearch ; utilisateurs, équipes et ressources restent dans PostgreSQL." } },
    { at: T.step1, text: { en: "Step 1: PostgreSQL resolves the relational context and returns the IDs of the team's users.", fr: "Étape 1 : PostgreSQL résout le contexte relationnel et renvoie les ID des utilisateurs de l’équipe." } },
    { at: T.step2, text: { en: "Step 2: those IDs go into the Elasticsearch query, which fetches the raw log documents fast.", fr: "Étape 2 : ces ID passent dans la requête Elasticsearch, qui récupère les documents bruts très vite." } },
    { at: T.step3, text: { en: "Step 3: PostgreSQL enriches them with the latest relational data. Well under the timeout.", fr: "Étape 3 : PostgreSQL les enrichit avec les données relationnelles à jour. Bien sous le timeout." } },
  ],
  Stage,
});
