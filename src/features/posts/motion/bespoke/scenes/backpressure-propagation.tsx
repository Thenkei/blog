import { Box, Camera, Comet, Dot, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, Wire, type Tone } from "../primitives";
import { defineScene, type Localized, type SceneStageProps } from "../types";

// Timeline (30 fps). Steady flow, S3 slows, each bounded buffer fills from the
// sink back to the source (pressure travels upstream), then one part commits and
// 'drain' releases the stages in the same upstream order.
const T = {
  slow: 84,
  full: [196, 172, 148, 126] as const, // per stage 0..3 (ES → S3)
  fillSpan: 24,
  commit: 270,
  resume: [318, 302, 288, 274] as const,
  end: 460,
} as const;

type StageDef = { key: string; label: string; sub: Localized };

const STAGES: readonly StageDef[] = [
  { key: "es", label: "Readable.from(ES)", sub: { en: "highWaterMark: 64", fr: "highWaterMark: 64" } },
  { key: "enrich", label: "Transform", sub: { en: "enrich · objectMode", fr: "enrichissement" } },
  { key: "csv", label: "csvStringify", sub: { en: "bounded buffer", fr: "buffer borné" } },
  { key: "s3", label: "S3 multipart", sub: { en: "queueSize 4 · 50 MB", fr: "queueSize 4 · 50 Mo" } },
];

const CELLS = 8;
const PARTS = 4;
const BASE = .3;

function level(index: number, frame: number) {
  const fill = ease(frame, T.full[index]! - T.fillSpan, T.full[index]!);
  const release = ease(frame, T.resume[index]!, T.resume[index]! + 20);
  return lerp(lerp(BASE, 1, fill), .5, release);
}

const isFull = (index: number, frame: number) => frame >= T.full[index]! && frame < T.resume[index]!;
const resumed = (index: number, frame: number) => frame >= T.resume[index]!;

type Rect = { x: number; y: number; w: number; h: number };

/** Bounded buffer as discrete cells: the reader sees it fill, not a percentage. */
function Cells({ x, y, w, h, value, tone }: { x: number; y: number; w: number; h: number; value: number; tone: Tone }) {
  const gap = 4;
  const cellW = (w - gap * (CELLS - 1)) / CELLS;
  const filled = value * CELLS;
  return <g>
    {Array.from({ length: CELLS }, (_, index) => {
      const share = Math.max(0, Math.min(1, filled - index));
      const cx = x + index * (cellW + gap);
      return <g key={index}>
        <rect x={cx} y={y} width={cellW} height={h} rx={3} style={{ fill: tint("ink", 8) }} />
        {share > 0 ? <rect x={cx} y={y} width={cellW} height={h} rx={3} fill={TONE[tone]} opacity={.25 + .55 * share} /> : null}
      </g>;
    })}
  </g>;
}

/** The four multipart parts in flight at the sink. */
function Parts({ x, y, w, h, frame }: { x: number; y: number; w: number; h: number; frame: number }) {
  const gap = 6;
  const partW = (w - gap * (PARTS - 1)) / PARTS;
  const occupied = frame < T.slow ? 2 : Math.min(PARTS, 2 + Math.floor(ease(frame, T.slow, T.full[3]) * 2.99));
  const committing = frame >= T.commit && frame < T.commit + 14;
  const full = isFull(3, frame);
  return <g>
    {Array.from({ length: PARTS }, (_, slot) => {
      const px = x + slot * (partW + gap);
      const on = slot < occupied;
      // Before the slowdown parts upload briskly; afterwards they crawl.
      const crawl = frame < T.slow ? ((frame / 40 + slot * .37) % 1) : Math.min(.96, .55 + slot * .1 + (frame - T.slow) * .0012);
      const progress = slot === 0 && frame >= T.commit ? ease(frame, T.commit + 14, T.commit + 50) * .5 : crawl;
      const tone: Tone = slot === 0 && committing ? "ok" : full ? "hot" : "line";
      return <g key={slot}>
        <rect x={px} y={y} width={partW} height={h} rx={3} style={{ fill: tint("ink", 8) }} />
        {on ? <rect x={px} y={y} width={partW * progress} height={h} rx={3} fill={TONE[tone]} opacity={.75} /> : null}
        {slot === 0 && committing ? <rect className="scene-glow" x={px} y={y} width={partW} height={h} rx={3} fill={TONE.ok} style={{ color: TONE.ok }} opacity={1 - ease(frame, T.commit + 4, T.commit + 14)} /> : null}
      </g>;
    })}
  </g>;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const wide = !compact;
  const card = (i: number): Rect => wide ? { x: 40 + i * 233.3, y: 70, w: 180, h: 96 } : { x: 20, y: 60 + i * 86, w: 460, h: 64 };
  const meter = (i: number): Rect => {
    const b = card(i);
    return wide ? { x: b.x + 14, y: b.y + 66, w: b.w - 28, h: 12 } : { x: b.x + b.w - 216, y: b.y + 16, w: 200, h: 12 };
  };
  const chipAt = (i: number) => {
    const b = card(i);
    return wide ? { x: i === 0 ? b.x : b.x + b.w / 2, y: b.y + b.h + 20, anchor: i === 0 ? "start" as const : "middle" as const } : { x: b.x + b.w - 16, y: b.y + 46, anchor: "end" as const };
  };
  const link = (i: number) => {
    const a = card(i);
    const b = card(i + 1);
    return wide ? `M${a.x + a.w + 6} ${a.y + 34}H${b.x - 6}` : `M${a.x + 44} ${a.y + a.h + 4}V${b.y - 4}`;
  };
  // Pressure rail: runs against the data, from the S3 stage back to ES.
  const rail = wide
    ? { from: [card(3).x + card(3).w / 2, 236] as const, to: [card(0).x + card(0).w / 2, 236] as const }
    : { from: [506, card(3).y + card(3).h / 2] as const, to: [506, card(0).y + card(0).h / 2] as const };
  const chart: Rect = wide ? { x: 40, y: 272, w: 880, h: 104 } : { x: 36, y: 424, w: 468, h: 72 };

  const pressureT = ease(frame, T.full[3], T.full[0], (x) => x);
  const drainT = ease(frame, T.resume[3], T.resume[0], (x) => x);
  const pressureOn = frame >= T.full[3] - 2 && frame < T.resume[3] + 14;
  const drainOn = frame >= T.resume[3] - 2 && frame < T.resume[0] + 40;

  const chipFor = (i: number): { text: string; tone: Tone; at: number } | null => {
    if (i === 3 && frame >= T.slow && frame < T.full[3]) return { text: fr ? "S3 ralentit" : "S3 slows down", tone: "hot", at: T.slow };
    if (i === 3 && frame >= T.commit && frame < T.resume[3] + 30) return { text: fr ? "✓ part commitée" : "✓ part committed", tone: "ok", at: T.commit };
    if (isFull(i, frame)) {
      if (i === 0) return { text: fr ? "⏸ page suivante non demandée" : "⏸ next page not requested", tone: "hot", at: T.full[0] };
      return { text: wide ? "full · write() → false" : (fr ? "plein · write() → false" : "full · write() → false"), tone: "hot", at: T.full[i]! };
    }
    if (resumed(i, frame)) {
      if (i === 0) return { text: fr ? "▶ reprise au débit aval" : "▶ resumes at downstream pace", tone: "ok", at: T.resume[0] };
      return { text: "'drain'", tone: "ok", at: T.resume[i]! };
    }
    return null;
  };

  const camera = [
    { at: 0 },
    { at: T.full[3] - 10, dur: 90, zoom: 1.03, focus: [lerp(width / 2, card(0).x + 120, .25), height / 2 - 10] as const },
    { at: T.commit - 6, dur: 60, zoom: 1.02, focus: [lerp(width / 2, card(3).x + 60, .2), height / 2 - 10] as const },
    { at: T.resume[0] + 20, dur: 60, zoom: 1 },
  ];

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {STAGES.map((stage, i) => {
      const b = card(i);
      const m = meter(i);
      const full = isFull(i, frame);
      const tone: Tone = full ? "hot" : "line";
      const chip = chipFor(i);
      return <g key={stage.key} {...enter(frame, stagger(i, 0, 6))}>
        <Box x={b.x} y={b.y} w={b.w} h={b.h} tone={tone} focus={ease(frame, T.full[i]! - 6, T.full[i]!) * (1 - ease(frame, i > 0 ? T.full[i - 1]! : T.resume[i]!, (i > 0 ? T.full[i - 1]! : T.resume[i]!) + 14))} radius={12}>
          <Text x={b.x + (wide ? 14 : 16)} y={b.y + 22} size={wide ? 15 : 15} font="mono" weight={600}>{stage.label}</Text>
          <Text x={b.x + (wide ? 14 : 16)} y={b.y + (wide ? 42 : 44)} size={12} font="mono" weight={500} tone="muted">{stage.sub[locale]}</Text>
          {i < 3 ? <Cells {...m} value={level(i, frame)} tone={tone} /> : <Parts {...m} frame={frame} />}
        </Box>
        {chip ? <Tag key={chip.text} x={chipAt(i).x} y={chipAt(i).y} anchor={chipAt(i).anchor} size={11} text={chip.text} tone={chip.tone} appear={pop(frame, chip.at)} /> : null}
      </g>;
    })}

    {/* Data links: dots flow while the next stage accepts, freeze when it refuses. */}
    {[0, 1, 2].map((i) => {
      const moving = !isFull(i + 1, frame);
      return <g key={i} opacity={easeOut(frame, stagger(i, 10, 6), stagger(i, 24, 6))}>
        <Wire d={link(i)} tone={moving ? "line" : "hot"} width={1.5} flow={moving ? frame : undefined} opacity={moving ? 1 : .6} />
      </g>;
    })}

    {/* Backpressure travels upstream; later 'drain' travels the same way. */}
    <g opacity={easeOut(frame, T.full[3] - 8, T.full[3] + 4) * (1 - ease(frame, T.resume[0] + 30, T.resume[0] + 50))}>
      <Wire d={`M${rail.from[0]} ${rail.from[1]}L${rail.to[0]} ${rail.to[1]}`} tone="muted" width={1} opacity={.5} />
      {pressureOn ? <g opacity={1 - ease(frame, T.resume[3], T.resume[3] + 14)}>
        <path d={`M${rail.from[0]} ${rail.from[1]}L${lerp(rail.from[0], rail.to[0], pressureT)} ${lerp(rail.from[1], rail.to[1], pressureT)}`} stroke={TONE.hot} strokeWidth={2} strokeLinecap="round" />
        <Comet points={[rail.from, rail.to]} t={Math.max(.001, pressureT)} tone="hot" r={5} tail={.12} />
        {pressureT >= 1 ? <Dot x={rail.to[0]} y={rail.to[1]} r={5} tone="hot" /> : null}
      </g> : null}
      {drainOn ? <g>
        <path d={`M${rail.from[0]} ${rail.from[1]}L${lerp(rail.from[0], rail.to[0], drainT)} ${lerp(rail.from[1], rail.to[1], drainT)}`} stroke={TONE.ok} strokeWidth={2} strokeLinecap="round" />
        {drainT < 1 ? <Comet points={[rail.from, rail.to]} t={Math.max(.001, drainT)} tone="ok" r={5} tail={.12} /> : null}
      </g> : null}
      {(() => {
        const draining = frame >= T.resume[3] - 2;
        const t = draining ? drainT : pressureT;
        const [hx, hy] = [lerp(rail.from[0], rail.to[0], t), lerp(rail.from[1], rail.to[1], t)];
        const text = draining ? "'drain'" : "backpressure";
        const tone: Tone = draining ? "ok" : "hot";
        return wide
          ? <Text x={Math.max(rail.to[0], Math.min(rail.from[0], hx))} y={hy - 16} size={11} font="mono" weight={600} tone={tone} anchor="middle" caps>{text}</Text>
          : <g transform={`translate(${hx + 16} ${Math.max(rail.to[1] + 40, Math.min(rail.from[1] - 40, hy))}) rotate(-90)`}>
            <Text x={0} y={0} size={11} font="mono" weight={600} tone={tone} anchor="middle" caps>{text}</Text>
          </g>;
      })()}
      {frame >= T.full[0] && frame < T.resume[0] ? <Pulse x={rail.to[0]} y={rail.to[1]} frame={frame} at={T.full[0]} period={36} r={6} tone="hot" /> : null}
    </g>

    <MemoryChart frame={frame} c={chart} wide={wide} fr={fr} />
  </Camera>;
}

// Resident memory over time: bounded with backpressure vs what a producer that
// ignores it would keep buffering (illustrative shape, not a measurement).
function MemoryChart({ frame, c, wide, fr }: { frame: number; c: Rect; wide: boolean; fr: boolean }) {
  const toX = (f: number) => c.x + (f / T.end) * c.w;
  const bounded = (f: number) => .22 + .14 * ease(f, T.slow, T.full[0]) - .06 * ease(f, T.resume[3], T.resume[0]);
  const ghost = (f: number) => Math.min(1, .22 + .78 * ease(f, T.slow, T.commit + 60, (x) => x ** 1.2));
  const toY = (v: number) => c.y + c.h - v * c.h;
  const upTo = Math.max(1, Math.min(frame, T.end - 1));
  const samples = Array.from({ length: Math.floor(upTo / 4) + 1 }, (_, i) => i * 4).concat(upTo);
  const path = (fn: (f: number) => number) => samples.map((f, i) => `${i === 0 ? "M" : "L"}${toX(f).toFixed(1)} ${toY(fn(f)).toFixed(1)}`).join("");
  const area = (fn: (f: number) => number) => `${path(fn)}L${toX(upTo).toFixed(1)} ${c.y + c.h}L${c.x} ${c.y + c.h}Z`;
  const ghostOn = easeOut(frame, T.slow + 6, T.slow + 26);
  const headG: [number, number] = [toX(upTo), toY(ghost(upTo))];
  const headB: [number, number] = [toX(upTo), toY(bounded(upTo))];
  return <g {...enter(frame, 20)}>
    <Text x={c.x} y={c.y - 10} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "mémoire du worker · RSS" : "worker memory · RSS"}</Text>
    {[0, .5, 1].map((v) => <line key={v} x1={c.x} x2={c.x + c.w} y1={toY(v)} y2={toY(v)} stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray={v === 0 ? undefined : "2 5"} opacity={v === 0 ? 1 : .6} />)}
    {ghostOn > 0 ? <g opacity={ghostOn}>
      <path d={path(ghost)} fill="none" stroke={TONE.danger} strokeWidth={1.5} strokeDasharray="5 5" opacity={.8} />
      <Dot x={headG[0]} y={headG[1]} r={3.5} tone="danger" halo={false} />
      <Text x={wide ? c.x + c.w * .52 : c.x + c.w} y={wide ? toY(.93) : c.y - 10} size={12} font="mono" weight={600} tone="danger" anchor={wide ? "end" : "end"} opacity={ease(frame, T.full[3], T.full[3] + 16)}>
        {fr ? "sans backpressure\u00a0: tout s’empile" : "without backpressure: it all piles up"}
      </Text>
    </g> : null}
    <path d={area(bounded)} style={{ fill: tint("ok", 12) }} />
    <path d={path(bounded)} fill="none" stroke={TONE.ok} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Dot x={headB[0]} y={headB[1]} r={4} tone="ok" />
    <Tag x={c.x + c.w} y={toY(.5) + (wide ? 2 : 4)} anchor="end" size={11} text={fr ? "avec\u00a0: mémoire bornée" : "with it: memory stays bounded"} tone="ok" appear={pop(frame, T.full[0] + 6)} />
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.full[0] + 30,
  title: { en: "Pressure travels upstream", fr: "La pression remonte" },
  caption: {
    en: "Every stage can refuse more data when full, so a slow S3 upload throttles the Elasticsearch reads. Memory is capped by the buffers, and by partSize × queueSize at the sink.",
    fr: "Chaque étape peut refuser des données lorsqu’elle est pleine\u00a0: un upload S3 lent ralentit la lecture Elasticsearch. La mémoire est bornée par les buffers et, côté sink, par partSize × queueSize.",
  },
  beats: [
    { at: 0, text: { en: "Records flow toward S3 through stages that each hold a bounded buffer.", fr: "Les enregistrements avancent vers S3 à travers des étapes qui ont chacune un buffer borné." } },
    { at: T.slow, text: { en: "S3 slows down: 4 parts of 50 MB are in flight and the writable stops accepting.", fr: "S3 ralentit\u00a0: 4 parts de 50 Mo sont en vol et le writable n’accepte plus rien." } },
    { at: T.full[2], text: { en: "write() returns false: the CSV stage fills up, then the Transform behind it.", fr: "write() renvoie false\u00a0: l’étape CSV se remplit, puis le Transform derrière elle." } },
    { at: T.full[0], text: { en: "The pressure reaches the ES iterator: at highWaterMark 64, the next page is not requested.", fr: "La pression atteint l’itérateur ES\u00a0: à highWaterMark 64, la page suivante n’est pas demandée." } },
    { at: T.commit, text: { en: "A part commits, 'drain' fires and reads resume at downstream pace. Memory stayed bounded.", fr: "Une part est commitée, 'drain' se déclenche, la lecture reprend au rythme aval. Mémoire restée bornée." } },
  ],
  Stage,
});
