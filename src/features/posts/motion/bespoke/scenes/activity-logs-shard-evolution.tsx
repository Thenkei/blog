import { Boundary, Box, Comet, ease, easeOut, enter, hash, lerp, pop, Pulse, Tag, Text, tint, TONE, Wire, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Timeline (30 fps). Logs pour into the newest index. First one shard holds
// everything; it is cut into time-based monthly indices; then time runs as a
// conveyor (new month on the right, history slides left) while the monthly
// volume grows until a month needs several shards. Finally the cluster grows
// from one node + replica to dedicated ingest nodes beside the data nodes.
// Volumes are relative to one shard's capacity (1 = full): only growth matters.
const VOLUME = [.28, .3, .33, .36, .4, .44, .5, .56, .64, .74, .86, .97, 1.3, 1.6, 2.1, 2.5] as const;
const FIRST_MONTHS = 8;
const CAPACITY = .97;
const shardsOf = (volume: number) => volume <= CAPACITY ? 1 : Math.ceil(volume / .85);

const T = {
  single: [10, 118],
  split: 126,
  conveyor: 176,
  step: 20,
  saturated: 252,
  multi: 290,
  topology: 384,
  search: 436,
  end: 520,
} as const;
// Months 8–11 arrive every 20 frames; the conveyor then lingers on the month
// that fills its shard before the multi-shard months arrive.
const ENTER = [176, 196, 216, 236, 290, 310, 330, 350] as const;
const enterAt = (month: number) => ENTER[month - FIRST_MONTHS] ?? T.end;
const SLIDE = 16;

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact
    ? { m: 20, eyebrow: 66, ingestY: 96, band: [120, 150], cols: 4, axis: 292, phaseY: 96, cluster: [20, 330, 500, 172] }
    : { m: 40, eyebrow: 72, ingestY: 72, band: [128, 132], cols: 8, axis: 282, phaseY: 72, cluster: [40, 306, 880, 92] };
  const [bandY, bandH] = L.band as [number, number];
  const [kx, ky, kw, kh] = L.cluster as [number, number, number, number];
  const left = L.m;
  const right = compact ? 520 : 920;
  const colW = (right - left) / L.cols;
  const gap = compact ? 10 : 10;

  // ── Conveyor head: number of months created so far (fractional while sliding).
  const head = FIRST_MONTHS + VOLUME.slice(FIRST_MONTHS).reduce((sum, _, index) => sum + ease(frame, enterAt(FIRST_MONTHS + index), enterAt(FIRST_MONTHS + index) + SLIDE), 0);
  const created = VOLUME.filter((_, month) => month < FIRST_MONTHS || frame >= enterAt(month)).length;
  const newest = created - 1;
  const slotOf = (month: number) => head - month - 1; // 0 = newest, grows to the left
  const colX = (month: number) => right - (slotOf(month) + 1) * colW;

  // ── Act 1: one shard.
  const singleFill = .08 + .84 * ease(frame, T.single[0], T.single[1], (t) => t);
  const singleOut = ease(frame, T.split, T.split + 8);
  const cut = pop(frame, T.split + 4, 170);
  const relevel = ease(frame, T.split + 10, T.split + 44);
  const splitDone = frame >= T.split;

  // ── Ingest stream into the newest index.
  const ingestX = splitDone ? colX(newest) + colW / 2 : right - colW / 2;
  const heavy = frame >= T.multi;
  const ingestTop = compact ? L.ingestY + 12 : L.ingestY + 14;

  const monthFill = (month: number) => {
    // The newest month fills during its own month; older ones are complete.
    const volume = VOLUME[month]!;
    if (month < FIRST_MONTHS) return lerp(singleFill, volume, relevel);
    return volume * lerp(.15, 1, ease(frame, enterAt(month), enterAt(month) + T.step - 4, (t) => t));
  };

  const phase = heavy
    ? { text: fr ? "plusieurs shards / mois" : "several shards / month", tone: "ok" as Tone, at: T.multi }
    : splitDone
      ? { text: fr ? "1 index / mois" : "1 index / month", tone: "line" as Tone, at: T.split }
      : { text: fr ? "1 index · 1 shard" : "1 index · 1 shard", tone: singleFill > .8 ? "hot" as Tone : "line" as Tone, at: 0 };
  const phaseIn = easeOut(frame, phase.at + 6, phase.at + 20);

  const shardCard = (x: number, y: number, w: number, h: number, fill: number, tone: Tone, key: string, opacity = 1, radius = 10) => {
    const level = Math.max(0, Math.min(1, fill));
    return <g key={key} opacity={opacity}>
      <rect className="scene-card" x={x} y={y} width={w} height={h} rx={radius} style={{ fill: "var(--scene-card)" }} />
      <rect x={x + 3} y={y + 3 + (h - 6) * (1 - level)} width={w - 6} height={(h - 6) * level} rx={Math.max(2, radius - 3)} style={{ fill: tint(tone, 30) }} />
      <rect x={x + 3} y={y + 3 + (h - 6) * (1 - level)} width={w - 6} height={1.5} style={{ fill: TONE[tone] }} opacity={level > .02 ? .9 : 0} />
      <rect x={x + .5} y={y + .5} width={w - 1} height={h - 1} rx={radius - .5} fill="none" stroke={TONE[tone]} strokeOpacity={.45} />
    </g>;
  };

  // ── Cluster topology.
  const topo = ease(frame, T.topology, T.topology + 22);
  const oldOut = 1 - ease(frame, T.topology - 4, T.topology + 10);
  const nodeW = compact ? 148 : 124;
  const nodeH = compact ? 44 : 48;
  const ingestNodes = compact
    ? [0, 1].map((index) => ({ x: kx + 16 + index * (nodeW + 12), y: ky + 30 }))
    : [0, 1].map((index) => ({ x: kx + 24 + index * (nodeW + 14), y: ky + 24 }));
  const dataNodes = compact
    ? [0, 1, 2].map((index) => ({ x: kx + 16 + index * (nodeW + 12), y: ky + 104 }))
    : [0, 1, 2].map((index) => ({ x: kx + 336 + index * (nodeW + 14), y: ky + 24 }));
  const searchFrom: [number, number] = compact ? [kx + kw - 16, ky + 30 + nodeH / 2] : [kx + kw - 16, ky + 24 + nodeH / 2];

  return <g>
    {/* Header: what the index layout is right now, and the ingest rate */}
    <g {...enter(frame, 0)}>
      <Text x={left} y={L.eyebrow} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "journaux d’activité · index" : "activity logs · indices"}</Text>
    </g>
    <g opacity={phaseIn}>
      <Tag x={compact ? left : left + (fr ? 232 : 206)} y={L.phaseY} anchor="start" size={12} tone={phase.tone} text={phase.text} />
    </g>
    <g {...enter(frame, 6)}>
      <Tag x={right} y={L.ingestY} anchor="end" size={12} tone="hot" text={heavy ? (fr ? "ingestion · 100 M+ logs / mois" : "ingest · 100M+ logs / month") : (fr ? "ingestion" : "ingest")} />
    </g>
    {/* documents falling into the newest index */}
    {Array.from({ length: heavy ? 5 : 3 }, (_, index) => {
      const period = heavy ? 16 : 26;
      const t = ((frame + index * (period / (heavy ? 5 : 3))) % period) / period;
      const fillTop = splitDone ? bandY + bandH * (1 - Math.min(1, monthFill(newest) / shardsOf(VOLUME[newest]!))) : bandY + bandH * (1 - singleFill);
      const x = ingestX + (hash(index + 3) - .5) * colW * .4;
      return frame > 8 ? <Comet key={index} points={[[x, ingestTop], [x, Math.max(bandY + 8, fillTop)]]} t={t} tone="hot" r={3} tail={.35} opacity={Math.sin(Math.PI * t)} /> : null;
    })}

    {/* Act 1: one shard for everything */}
    {singleOut < 1 ? <g opacity={enter(frame, 4).opacity * (1 - singleOut)}>
      {shardCard(left, bandY, right - left, bandH, singleFill, singleFill > .8 ? "hot" : "line", "single", 1, 14)}
      <Text x={left + 18} y={bandY + 24} size={15} weight={600}>{fr ? "1 shard pour tout" : "1 shard for everything"}</Text>
      <Text x={left + 18} y={bandY + 44} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "les premières années" : "the first few years"}</Text>
      {/* the cuts about to happen */}
      {Array.from({ length: L.cols - 1 }, (_, index) => <line key={index} x1={left + (index + 1) * colW} x2={left + (index + 1) * colW} y1={bandY + 6} y2={bandY + bandH - 6} stroke="var(--scene-hairline)" strokeDasharray="3 4" opacity={ease(frame, T.split - 14 + index, T.split - 4 + index)} />)}
    </g> : null}

    {/* Acts 2–3: monthly indices on a conveyor */}
    {splitDone ? VOLUME.map((volume, month) => {
      if (month >= created) return null;
      const slot = slotOf(month);
      const visible = Math.max(0, Math.min(1, slot + 1, (L.cols - slot) * 1.4 - .4));
      if (visible <= 0) return null;
      const opening = month < FIRST_MONTHS ? cut : 1;
      const fullX = colX(month) + gap / 2 * opening;
      const fullW = colW - gap * opening;
      // Leaving on the left, a month is squeezed against the margin into history.
      const squeeze = Math.max(0, left + gap / 2 - fullX);
      const x = fullX + squeeze;
      const w = Math.max(0, fullW - squeeze);
      if (w < 6) return null;
      const n = shardsOf(volume);
      const fill = monthFill(month);
      const isNew = month === newest;
      const tone: Tone = n > 1 ? "ok" : fill > .9 && month >= FIRST_MONTHS ? "hot" : "line";
      const entry = month < FIRST_MONTHS ? 1 : Math.min(1, pop(frame, enterAt(month), 170));
      const subGap = 6;
      const subH = (bandH - subGap * (n - 1)) / n;
      return <g key={month} opacity={visible * entry} transform={`translate(0 ${(1 - entry) * -14})`}>
        {Array.from({ length: n }, (_, shard) => shardCard(x, bandY + shard * (subH + subGap), w, subH, fill / n, tone, `${month}-${shard}`, 1, n > 1 ? 8 : 2 + 8 * opening))}
        {isNew ? <Text x={x + w / 2} y={bandY + bandH + 20} size={11} font="mono" weight={600} tone="hot" anchor="middle" caps>{fr ? "ce mois" : "now"}</Text> : null}
        {n > 1 && !isNew ? <Text x={x + w / 2} y={bandY + bandH + 20} size={11} font="mono" weight={600} tone="ok" anchor="middle" caps>{`${n} shards`}</Text> : null}
        {month === 11 && frame >= T.saturated && frame < T.multi + 20 ? <Pulse x={x + w / 2} y={bandY + 10} frame={frame} at={T.saturated} period={46} r={9} tone="hot" /> : null}
      </g>;
    }) : null}
    {frame >= T.saturated && frame < T.multi + 40 ? <Tag x={colX(11) + colW / 2} y={bandY - 16} size={11} tone="hot" appear={pop(frame, T.saturated) * (1 - ease(frame, T.multi + 20, T.multi + 34))} text={fr ? "shard plein" : "shard full"} /> : null}
    <g opacity={compact ? 0 : ease(frame, T.split + 30, T.split + 50)}>
      <Text x={left} y={L.axis} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "← historique" : "← history"}</Text>
      <line x1={left + (compact ? 104 : 96)} x2={right - colW - 8} y1={L.axis} y2={L.axis} stroke="var(--scene-hairline)" strokeWidth={1} />
    </g>

    {/* Cluster */}
    <g {...enter(frame, 16)}>
      <Boundary x={kx} y={ky} w={kw} h={kh} label="cluster" tone={topo > .5 ? "ok" : "muted"} labelAt="top-start" />
    </g>
    {oldOut > 0 ? <g opacity={enter(frame, 22).opacity * oldOut}>
      <Box x={ingestNodes[0]!.x} y={compact ? ky + 58 : ingestNodes[0]!.y} w={nodeW} h={nodeH} tone="line" label={fr ? "1 nœud" : "1 node"} labelSize={15} radius={11} />
      <Box x={compact ? ingestNodes[1]!.x : ingestNodes[1]!.x + 40} y={compact ? ky + 58 : ingestNodes[0]!.y} w={nodeW} h={nodeH} tone="muted" label={fr ? "réplica" : "replica"} labelSize={15} radius={11} />
      <Wire d={compact ? `M${ingestNodes[0]!.x + nodeW} ${ky + 58 + nodeH / 2}H${ingestNodes[1]!.x}` : `M${ingestNodes[0]!.x + nodeW} ${ingestNodes[0]!.y + nodeH / 2}H${ingestNodes[1]!.x + 40}`} dashed tone="muted" />
    </g> : null}
    {topo > 0 ? <g>
      {ingestNodes.map((node, index) => <g key={`i${index}`} {...enter(frame, T.topology + index * 5)}>
        <Box x={node.x} y={node.y} w={nodeW} h={nodeH} tone="hot" focus={.6 * ease(frame, T.search, T.search + 16)} radius={11}>
          <Text x={node.x + 14} y={node.y + nodeH / 2 - 8} size={13} font="mono" weight={600} tone="hot">{fr ? "ingestion" : "ingest"}</Text>
          <Text x={node.x + 14} y={node.y + nodeH / 2 + 10} size={11} font="mono" weight={500} tone="muted">{fr ? "nœud · écritures" : "node · writes"}</Text>
        </Box>
      </g>)}
      {dataNodes.map((node, index) => <g key={`d${index}`} {...enter(frame, T.topology + 12 + index * 5)}>
        <Box x={node.x} y={node.y} w={nodeW} h={nodeH} tone="ok" radius={11}>
          <Text x={node.x + 14} y={node.y + nodeH / 2 - 8} size={13} font="mono" weight={600} tone="ok">{fr ? "données" : "data"}</Text>
          <Text x={node.x + 14} y={node.y + nodeH / 2 + 10} size={11} font="mono" weight={500} tone="muted">{fr ? "nœud · recherche" : "node · search"}</Text>
        </Box>
      </g>)}
      {/* writes flow from the ingest tier into the data tier */}
      {(() => {
        const from = compact ? [ingestNodes[0]!.x + nodeW / 2, ingestNodes[0]!.y + nodeH] : [ingestNodes[1]!.x + nodeW, ingestNodes[1]!.y + nodeH / 2];
        const to = compact ? [dataNodes[0]!.x + nodeW / 2, dataNodes[0]!.y] : [dataNodes[0]!.x, dataNodes[0]!.y + nodeH / 2];
        const d = compact ? `M${from[0]} ${from[1]}V${to[1]}` : `M${from[0]} ${from[1]}H${to[0]}`;
        return <Wire d={d} tone="hot" width={1.5} draw={ease(frame, T.topology + 20, T.topology + 36)} flow={frame} />;
      })()}
      {/* search requests reach the data nodes unhindered */}
      {frame >= T.search ? <>
        <Tag x={searchFrom[0]} y={searchFrom[1]} anchor="end" size={11} tone="ok" appear={pop(frame, T.search)} text={fr ? "recherche ✓" : "search ✓"} />
        {dataNodes.map((node, index) => {
          const t = ((frame - T.search - index * 9) % 36) / 36;
          // Over the top corridor (wide) or down the middle lane (compact), into each data node.
          const cx = node.x + nodeW / 2;
          const points: [number, number][] = compact
            ? [[searchFrom[0] - 40, searchFrom[1] + 12], [searchFrom[0] - 40, ky + 92], [cx, ky + 92], [cx, node.y]]
            : [[searchFrom[0] - 76, searchFrom[1]], [searchFrom[0] - 76, ky + 12], [cx, ky + 12], [cx, node.y]];
          return frame >= T.search + index * 9 ? <Comet key={index} points={points} t={t} tone="ok" r={3} tail={.2} /> : null;
        })}
      </> : null}
    </g> : null}
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 1,
  title: { en: "How the index layout grew", fr: "Comment les index ont grandi" },
  caption: {
    en: "The layout followed the volume: one shard, then time-based monthly indices, then several shards per month, on a cluster that gained dedicated ingest nodes.",
    fr: "Le découpage a suivi le volume : un shard, puis des index mensuels, puis plusieurs shards par mois, sur un cluster doté de nœuds d’ingestion dédiés.",
  },
  beats: [
    { at: 0, text: { en: "Audit logs pour in. For the first few years, a single shard handles the entire volume.", fr: "Les logs d’audit affluent. Les premières années, un seul shard gère tout le volume." } },
    { at: T.split, text: { en: "Time-based index patterns: one index per month instead of one massive index.", fr: "Index temporels : un index par mois au lieu d’un seul index massif." } },
    { at: T.saturated, text: { en: "The monthly volume keeps growing until a single month no longer fits in one shard.", fr: "Le volume mensuel grimpe jusqu’à ce qu’un seul mois ne tienne plus dans un shard." } },
    { at: T.multi, text: { en: "So each month is split into several shards: 100M+ logs a month, billions in total.", fr: "Chaque mois passe donc à plusieurs shards : 100 M+ de logs par mois, des milliards au total." } },
    { at: T.topology, text: { en: "The cluster evolves too: from one node and a replica to multi-node, with dedicated ingest nodes.", fr: "Le cluster évolue aussi : d’un nœud avec réplica à du multinœud, avec des nœuds d’ingestion dédiés." } },
    { at: T.search, text: { en: "Ingest nodes absorb the heavy write throughput, so search operations are not starved.", fr: "Les nœuds d’ingestion absorbent le lourd débit d’écriture : la recherche n’est pas pénalisée." } },
  ],
  Stage,
});
