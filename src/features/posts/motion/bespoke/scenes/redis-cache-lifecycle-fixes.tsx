import { Box, Checkpoint, ease, easeOut, enter, lerp, Meter, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type Localized, type SceneStageProps } from "../types";

// Timeline (30 fps). The same cached objects under three rules applied one
// after another: a TTL cut sweeps in, a purge sweeps the deleted project, then
// every survivor is compressed. RAM sums what is still resident; the HTTPS lane
// carries one payload the whole time, so its speed-up is the last change.
const T = {
  intro: 0,
  ttl: 96,
  ttlDone: 140,
  purge: 196,
  purgeDone: 232,
  compress: 282,
  compressDone: 318,
  https: 350,
  end: 470,
} as const;

type Project = { key: string; name: Localized; deleted: boolean; sizes: readonly number[] };

// Relative object sizes (illustrative: the article gives no measured values).
const PROJECTS: readonly Project[] = [
  { key: "a", name: { en: "project A", fr: "projet A" }, deleted: false, sizes: [.9, .7, 1, .8, .6] },
  { key: "b", name: { en: "project B", fr: "projet B" }, deleted: false, sizes: [.6, 1, .8, .7, .9] },
  { key: "c", name: { en: "project C", fr: "projet C" }, deleted: true, sizes: [.8, .7, .9, 1, .7] },
];

const KEPT_BY_SHORT_TTL = 2;
const COMPRESSED = .45;

const FIXES: readonly { at: number; done: number; text: Localized }[] = [
  { at: T.ttl, done: T.ttlDone, text: { en: "shorten the TTLs", fr: "raccourcir les TTL" } },
  { at: T.purge, done: T.purgeDone, text: { en: "purge deleted projects", fr: "purger les projets supprimés" } },
  { at: T.compress, done: T.compressDone, text: { en: "compress before storing", fr: "compresser avant stockage" } },
];

/** Payload lane speed: one trip per SLOW frames, then per FAST once compressed. */
const SLOW = 84;
const FAST = 40;
function lanePhase(frame: number) {
  // Integral of a speed that ramps linearly from 1/SLOW to 1/FAST during compression.
  const a = T.compress;
  const b = T.compressDone;
  const k = 1 / FAST - 1 / SLOW;
  if (frame <= a) return frame / SLOW;
  if (frame <= b) return frame / SLOW + k * (frame - a) ** 2 / (2 * (b - a));
  return frame / SLOW + k * (b - a) / 2 + k * (frame - b);
}

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const slots = compact ? 4 : 5;
  const L = compact
    ? { labelX: 20, colX: (i: number) => 128 + i * 98, colW: 80, rowY: (i: number) => 110 + i * 50, rowH: 34, axisY: 72, ttlFrom: 528, ttlTo: 316, ram: { x: 128, y: 302, w: 392 }, fixes: { x: 20, y: 328, w: 500, h: 90 }, lane: { x: 20, y: 430, w: 500, h: 74 } }
    : { labelX: 40, colX: (i: number) => 176 + i * 92, colW: 80, rowY: (i: number) => 124 + i * 58, rowH: 38, axisY: 78, ttlFrom: 650, ttlTo: 350, ram: { x: 176, y: 332, w: 444 }, fixes: { x: 672, y: 72, w: 248, h: 184 }, lane: { x: 672, y: 272, w: 248, h: 108 } };
  const top = L.rowY(0) - L.rowH / 2;
  const bottom = L.rowY(PROJECTS.length - 1) + L.rowH / 2;

  const ttlT = ease(frame, T.ttl, T.ttlDone);
  const ttlX = lerp(L.ttlFrom, L.ttlTo, ttlT);
  const purgeT = ease(frame, T.purge, T.purgeDone, (t) => t);
  const purgeX = lerp(L.colX(0) - 20, L.colX(slots - 1) + L.colW + 20, purgeT);
  const deletedRow = PROJECTS.findIndex((project) => project.deleted);

  const blocks = PROJECTS.flatMap((project, row) => project.sizes.slice(0, slots).map((size, slot) => {
    const x = L.colX(slot);
    const w = size * L.colW;
    // An object expires as the TTL line sweeps past it; stale ones go as the purge passes.
    const expired = slot >= KEPT_BY_SHORT_TTL ? Math.max(0, Math.min(1, (x + w - ttlX) / 36)) : 0;
    const purged = project.deleted ? Math.max(0, Math.min(1, (purgeX - x) / 40)) : 0;
    const squeeze = lerp(1, COMPRESSED, pop(frame, stagger(row * slots + slot, T.compress, 2), 170));
    return { key: `${project.key}${slot}`, row, slot, x, y: L.rowY(row), w, expired, purged, squeeze, stale: project.deleted };
  }));
  const initial = blocks.reduce((sum, block) => sum + block.w, 0);
  const resident = blocks.reduce((sum, block) => sum + block.w * (1 - block.expired) * (1 - block.purged) * block.squeeze, 0) / initial;
  const ramTone: Tone = resident > .75 ? "danger" : resident > .4 ? "hot" : "ok";

  const activeFix = FIXES.findIndex((fix, index) => frame >= fix.at - 12 && frame < (FIXES[index + 1]?.at ?? Infinity) - 12);

  return <g>
    {/* Age axis: fresh writes on the left, older objects to the right. */}
    <g {...enter(frame, 0, { from: "none" })}>
      <line x1={L.colX(0)} x2={L.colX(slots - 1) + L.colW} y1={L.axisY} y2={L.axisY} stroke="var(--scene-hairline)" strokeWidth={1} />
      {Array.from({ length: slots }, (_, slot) => <line key={slot} x1={L.colX(slot)} x2={L.colX(slot)} y1={L.axisY - 3} y2={L.axisY + 3} stroke="var(--scene-hairline)" strokeWidth={1} />)}
      <Text x={L.colX(0)} y={L.axisY - 14} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "écrit à l’instant" : "just written"}</Text>
      <Text x={L.colX(slots - 1) + L.colW} y={L.axisY - 14} size={11} font="mono" weight={600} tone="muted" anchor="end" caps>{fr ? "plus ancien →" : "older →"}</Text>
    </g>

    {/* Projects: one of them was deleted, its objects never were. */}
    {PROJECTS.map((project, row) => {
      const y = L.rowY(row);
      const purgedDone = project.deleted && frame >= T.purgeDone;
      return <g key={project.key} {...enter(frame, stagger(row, 4, 6), { from: "left", distance: 12 })}>
        <Text x={L.labelX} y={project.deleted ? y - 9 : y} size={compact ? 15 : 16} weight={600} tone={project.deleted ? "muted" : "ink"}>{project.name[locale]}</Text>
        {project.deleted ? <Tag x={L.labelX} y={y + 12} anchor="start" size={11} tone={purgedDone ? "ok" : "danger"} text={purgedDone ? (fr ? "✓ purgé" : "✓ purged") : (fr ? "✗ supprimé" : "✗ deleted")} appear={purgedDone ? pop(frame, T.purgeDone) : 1} /> : null}
      </g>;
    })}

    {/* Cached objects: width is the payload size. */}
    {blocks.map((block) => {
      const alive = (1 - block.expired) * (1 - block.purged);
      const tone: Tone = block.stale ? "danger" : "line";
      const appearAt = stagger(block.row * slots + block.slot, 10, 2);
      const inT = easeOut(frame, appearAt, appearAt + 16);
      const w = block.w * block.squeeze;
      return <g key={block.key} opacity={inT}>
        <rect x={block.x} y={block.y - L.rowH / 2} width={block.w} height={L.rowH} rx={9} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="3 4"
          opacity={Math.max(1 - alive, (1 - block.squeeze) / (1 - COMPRESSED)) * .9} />
        {alive > 0 ? <g opacity={alive} transform={`translate(0 ${(1 - inT) * 8 - block.expired * 10 + block.purged * 12})`}>
          <Box x={block.x} y={block.y - L.rowH / 2} w={w} h={L.rowH} tone={tone} radius={9} fill={block.stale ? .5 : 0} />
        </g> : null}
      </g>;
    })}

    {/* The purge: a sweep through the deleted project only. */}
    {purgeT > 0 && purgeT < 1 ? <g>
      <line x1={purgeX} x2={purgeX} y1={L.rowY(deletedRow) - L.rowH / 2 - 8} y2={L.rowY(deletedRow) + L.rowH / 2 + 8} stroke={TONE.danger} strokeWidth={2} strokeLinecap="round" className="scene-glow" style={{ color: TONE.danger }} />
      <rect x={L.colX(0) - 20} y={L.rowY(deletedRow) - 1} width={purgeX - L.colX(0) + 20} height={2} rx={1} style={{ fill: tint("danger", 40) }} />
    </g> : null}

    {/* The TTL cut: objects older than it expire. */}
    <g {...enter(frame, 24, { from: "none" })}>
      <line x1={ttlX} x2={ttlX} y1={top - 12} y2={bottom + 12} stroke={TONE.hot} strokeWidth={ttlT > 0 && ttlT < 1 ? 2 : 1.5} strokeDasharray={ttlT >= 1 ? undefined : "4 4"} strokeLinecap="round" />
      <Tag x={ttlX} y={bottom + 28} text={ttlT < .5 ? (fr ? "TTL trop long" : "TTL too long") : (fr ? "TTL raccourci" : "shorter TTL")} tone="hot" size={12} anchor={ttlT < .5 ? "end" : "middle"} />
    </g>

    {/* Resident memory of the cache. */}
    <g {...enter(frame, 14)}>
      <Meter x={L.ram.x} y={L.ram.y} w={L.ram.w} h={10} value={resident} tone={ramTone} label={fr ? "ram du cache" : "cache ram"}
        valueLabel={frame < T.ttl + 24 ? (fr ? "gonflée" : "bloated") : frame < T.compressDone ? (fr ? "libérée plus tôt" : "freed sooner") : (fr ? "bien plus légère" : "much lighter")} />
    </g>

    <Fixes frame={frame} compact={compact} fr={fr} rect={L.fixes} active={activeFix} />
    <Lane frame={frame} compact={compact} fr={fr} rect={L.lane} />
  </g>;
}

/** The three data-side fixes, ticked as each rule lands. */
function Fixes({ frame, compact, fr, rect, active }: { frame: number; compact: boolean; fr: boolean; rect: { x: number; y: number; w: number; h: number }; active: number }) {
  const { x, y, w, h } = rect;
  const rowY = (index: number) => compact ? y + 19 + index * 26 : y + 64 + index * 42;
  return <g {...enter(frame, 30)}>
    <Box x={x} y={y} w={w} h={h} tone="line" radius={16}>
      {!compact ? <Text x={x + 18} y={y + 26} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "côté données" : "data side"}</Text> : null}
      {FIXES.map((fix, index) => {
        const done = frame >= fix.done;
        const isActive = active === index;
        const cy = rowY(index);
        const reached = frame >= fix.at - 12;
        return <g key={index} opacity={reached ? 1 : .5}>
          {isActive ? <rect x={x + 8} y={cy - (compact ? 12 : 16)} width={w - 16} height={compact ? 24 : 32} rx={10} style={{ fill: tint(done ? "ok" : "hot", 10 * ease(frame, fix.at - 12, fix.at)) }} /> : null}
          <g transform={`translate(${x + 30} ${cy}) scale(${done ? .75 + .25 * pop(frame, fix.done) : 1}) translate(${-(x + 30)} ${-cy})`}>
            <Checkpoint x={x + 30} y={cy} r={10} state={done ? "pass" : "pending"} />
          </g>
          <Text x={x + 52} y={cy} size={compact ? 14 : 14.5} weight={600} tone={done ? "ink" : "muted"}>{fix.text[fr ? "fr" : "en"]}</Text>
          {done && frame < fix.done + 40 ? <Pulse x={x + 30} y={cy} frame={frame} at={fix.done} period={40} r={10} tone="ok" /> : null}
        </g>;
      })}
    </Box>
  </g>;
}

/** One payload on the wire, the whole time: smaller after compression, so faster over HTTPS. */
function Lane({ frame, compact, fr, rect }: { frame: number; compact: boolean; fr: boolean; rect: { x: number; y: number; w: number; h: number } }) {
  const { x, y, w, h } = rect;
  const c = ease(frame, T.compress, T.compressDone);
  const laneY = compact ? y + h / 2 + 10 : y + h / 2 + 12;
  const x0 = x + 22;
  const x1 = x + w - 22;
  const size = lerp(compact ? 64 : 58, compact ? 26 : 24, c);
  const phase = lanePhase(frame) % 1;
  const travel = x1 - x0 - size;
  const px = x0 + travel * phase;
  const fade = Math.min(1, phase * 10, (1 - phase) * 10);
  const faster = frame >= T.https;
  return <g {...enter(frame, 36)}>
    <Box x={x} y={y} w={w} h={h} tone={faster ? "ok" : "line"} focus={faster ? 1 - .6 * ease(frame, T.https + 20, T.https + 60) : 0} radius={16}>
      <Text x={x + 18} y={y + 22} size={11} font="mono" weight={600} tone="muted" caps>https</Text>
      <Tag x={x + w - 14} y={y + 22} anchor="end" size={11} tone="ok" text={fr ? "plus petit · plus rapide" : "smaller · faster"} appear={pop(frame, T.https)} />
      <line x1={x0} x2={x1} y1={laneY} y2={laneY} stroke="var(--scene-hairline)" strokeWidth={1} />
      <circle cx={x0} cy={laneY} r={3} style={{ fill: "var(--scene-hairline)" }} />
      <circle cx={x1} cy={laneY} r={3} style={{ fill: "var(--scene-hairline)" }} />
      <g opacity={fade}>
        <rect x={px - 26} y={laneY - 1} width={26} height={2} rx={1} style={{ fill: tint(c > .5 ? "ok" : "line", 45) }} />
        <rect className="scene-glow" x={px} y={laneY - 8} width={size} height={16} rx={8} fill={TONE[c > .5 ? "ok" : "line"]} style={{ color: TONE[c > .5 ? "ok" : "line"] }} />
      </g>
    </Box>
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "Three data-side fixes", fr: "Trois corrections côté données" },
  caption: {
    en: "Splitting instances contains the blast radius; the data fixes shrink the cache itself: shorter TTLs, immediate purge of deleted projects, compression before storing.",
    fr: "Séparer les instances limite l’impact ; les corrections côté données réduisent le cache lui-même : TTL plus courts, purge immédiate des projets supprimés, compression avant stockage.",
  },
  beats: [
    { at: 0, text: { en: "Before: the TTL is not aggressive enough and deleted projects' objects stay in RAM.", fr: "Avant : le TTL n’est pas assez agressif et les objets des projets supprimés restent en RAM." } },
    { at: T.ttl, text: { en: "Shorter TTLs: older objects expire and their memory is freed sooner.", fr: "TTL raccourcis : les objets plus anciens expirent et libèrent la mémoire plus tôt." } },
    { at: T.purge, text: { en: "Cached items belonging to a deleted project are removed immediately.", fr: "Les éléments en cache d’un projet supprimé sont retirés immédiatement." } },
    { at: T.compress, text: { en: "Payloads are compressed before they reach Redis: every surviving object shrinks.", fr: "Les payloads sont compressés avant d’arriver dans Redis : chaque objet restant rétrécit." } },
    { at: T.https, text: { en: "Smaller payloads also travel faster over HTTPS.", fr: "Des payloads plus petits voyagent aussi plus vite en HTTPS." } },
  ],
  Stage,
});
