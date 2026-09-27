import type { PostLocale } from "../../../content/types";
import { Box, Camera, Checkpoint, Comet, dim, during, ease, easeOut, enter, hash, lerp, pop, Pulse, stagger, Tag, Text, TONE, type Tone } from "../primitives";
import { defineScene, type Localized, type SceneStageProps } from "../types";

// What the text diagram cannot show: the context bundle itself travelling the loop.
// Pass 1 (no connected loop): the bundle leaves the workshop with a decision and
// its "why"; at every handoff a piece of the why peels off into conversations and
// pages, so review receives a decision without a reason. Pass 2 (Product OS): each
// step drops its artefact into the bundle, the bundle stops at the three human
// gates, and release sends the learning back round to the next decision.
type Key = readonly [frame: number, station: number];

const P1: readonly Key[] = [[36, 1], [48, 1], [66, 2], [78, 2], [96, 3], [108, 3], [126, 4], [138, 4], [156, 5]];
const P2: readonly Key[] = [[224, 0], [250, 0], [268, 1], [300, 1], [318, 2], [350, 2], [368, 3], [390, 3], [408, 4], [430, 4], [448, 5], [480, 5], [498, 6]];
const arrival = (keys: readonly Key[], station: number) => keys.find(([, s]) => s === station)![0];

const T = {
  pass1: 30,
  lost: 160,
  reset: 206,
  pass2: 220,
  loop: 520,
  closed: 558,
  end: 612,
} as const;

// Pass 1 sheds a piece of the why on each arrival after the workshop.
const SHEDS = [2, 3, 4, 5].map((station) => arrival(P1, station));

const GATES: Partial<Record<number, Localized>> = {
  1: { en: "people decide", fr: "décision humaine" },
  2: { en: "people agree", fr: "accord humain" },
  5: { en: "reviewer challenges", fr: "review humaine" },
};
const gateAt = (station: number) => arrival(P2, station) + 22;

const STATIONS: readonly { title: Localized; owner: Localized }[] = [
  { title: { en: "Problem & discovery", fr: "Problème & discovery" }, owner: { en: "product", fr: "produit" } },
  { title: { en: "VE workshop", fr: "Workshop VE" }, owner: { en: "product", fr: "produit" } },
  { title: { en: "DiveIn · DoD", fr: "DiveIn · DoD" }, owner: { en: "product ↔ tech", fr: "produit ↔ tech" } },
  { title: { en: "Slices", fr: "Slices" }, owner: { en: "engineering", fr: "engineering" } },
  { title: { en: "Protected branch", fr: "Branche protégée" }, owner: { en: "engineering", fr: "engineering" } },
  { title: { en: "PR & review", fr: "PR & review" }, owner: { en: "reviewers", fr: "reviewers" } },
  { title: { en: "Release", fr: "Release" }, owner: { en: "→ learning", fr: "→ apprentissage" } },
];

// Owner brackets over the wide track (the text diagram's "each layer has an owner").
const OWNERS: readonly { from: number; to: number; label: Localized }[] = [
  { from: 0, to: 1, label: { en: "product", fr: "produit" } },
  { from: 2, to: 2, label: { en: "product ↔ tech", fr: "produit ↔ tech" } },
  { from: 3, to: 4, label: { en: "engineering", fr: "engineering" } },
  { from: 5, to: 5, label: { en: "reviewers", fr: "reviewers" } },
];

const HANDED_ON: readonly Localized[] = [
  { en: "problem & intended outcome", fr: "problème et résultat visé" },
  { en: "recorded decision", fr: "décision enregistrée" },
  { en: "testable definition of done", fr: "definition of done testable" },
  { en: "independent slices", fr: "slices indépendantes" },
  { en: "protected feature branch", fr: "feature branch protégée" },
  { en: "structured, reviewed PR", fr: "PR structurée et reviewée" },
  { en: "learning → next decision", fr: "apprentissage → décision" },
];

function positionAt(frame: number, keys: readonly Key[]) {
  const next = keys.findIndex(([f]) => frame < f);
  if (next === 0) return keys[0]![1];
  if (next < 0) return keys.at(-1)![1];
  const [f0, s0] = keys[next - 1]!;
  const [f1, s1] = keys[next]!;
  return lerp(s0, s1, ease(frame, f0, f1));
}

type Pt = readonly [number, number];
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

type Layout = {
  node: (i: number) => Pt;
  bundle: { w: number; header: number; rowH: number; fixed: number; min: number; max: number; maxPass1: number };
  piles: readonly [{ x: number; y: number; w: number; h: number }, { x: number; y: number; w: number; h: number }];
  loop: readonly Pt[];
  vertical: boolean;
};

const WIDE_X = (i: number) => 110 + i * (740 / 6);
const WIDE: Layout = {
  node: (i) => [WIDE_X(i), 104],
  bundle: { w: 356, header: 34, rowH: 24, fixed: 136, min: 80, max: 880 - 356, maxPass1: 0 },
  piles: [{ x: 96, y: 282, w: 250, h: 98 }, { x: 614, y: 282, w: 250, h: 98 }],
  loop: [[850, 104], [890, 104], [900, 114], [900, 390], [890, 400], [70, 400], [60, 390], [60, 114], [70, 104], [110, 104]],
  vertical: false,
};

const COMPACT_Y = (i: number) => 80 + i * 60;
const COMPACT: Layout = {
  node: (i) => [48, COMPACT_Y(i)],
  bundle: { w: 284, header: 30, rowH: 22, fixed: 236, min: 58, max: 508, maxPass1: 250 },
  piles: [{ x: 236, y: 382, w: 136, h: 124 }, { x: 384, y: 382, w: 136, h: 124 }],
  loop: [[48, COMPACT_Y(6)], [34, COMPACT_Y(6)], [26, COMPACT_Y(6) - 8], [26, COMPACT_Y(0) + 8], [34, COMPACT_Y(0)], [48, COMPACT_Y(0)]],
  vertical: true,
};

const quad = (p0: Pt, p1: Pt, p2: Pt, t: number): [number, number] => [
  (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
  (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
];

function StationLabel({ i, L, locale, active, gate, frame }: { i: number; L: Layout; locale: PostLocale; active: number; gate: Localized | undefined; frame: number }) {
  const [x, y] = L.node(i);
  const station = STATIONS[i]!;
  const chip = gate ? pop(frame, gateAt(i), 170) : 0;
  if (!L.vertical) {
    return <g>
      <Text x={x} y={y - 24} size={13.5} weight={650} anchor="middle" tone={active > .5 ? "ink" : "muted"}>{station.title[locale]}</Text>
      {i === 6 ? <Text x={x} y={50} size={10.5} weight={600} font="mono" tone="muted" anchor="middle" caps>{station.owner[locale]}</Text> : null}
    </g>;
  }
  return <g>
    <Text x={x + 18} y={y - 8} size={13.5} weight={650} tone={active > .5 ? "ink" : "muted"}>{station.title[locale]}</Text>
    <g opacity={1 - Math.min(1, chip)}>
      <Text x={x + 18} y={y + 11} size={10.5} weight={600} font="mono" tone="muted" caps>{station.owner[locale]}</Text>
    </g>
    {gate ? <Tag x={x + 18} y={y + 12} anchor="start" text={`✓ ${gate[locale]}`} tone="hot" size={10.5} appear={chip} /> : null}
  </g>;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT : WIDE;
  const B = L.bundle;

  const pass2 = frame >= T.pass2;
  const pos = pass2 ? positionAt(frame, P2) : positionAt(frame, P1);
  const [cx, cy] = L.node(pos);

  // Bundle visibility across the two passes.
  const pass1In = easeOut(frame, T.pass1, T.pass1 + 18) * (1 - ease(frame, T.reset, T.reset + 14));
  const pass2In = easeOut(frame, T.pass2, T.pass2 + 18);
  const bundleIn = pass2 ? pass2In : pass1In;

  // Pass 2 rows land one by one; the bundle grows with them.
  const rowLand = HANDED_ON.map((_, k) => arrival(P2, k) + 4);
  const rowsGrown = rowLand.reduce((sum, at) => sum + easeOut(frame, at, at + 18), 0);
  const rowsLanded = rowLand.filter((at) => frame >= at + 18).length;
  const rows = pass2 ? Math.max(1, rowsGrown) : 2;
  const bundleH = B.header + rows * B.rowH + 12;

  const bx = L.vertical ? B.fixed : clamp(cx - B.w / 2, B.min, B.max);
  const by = L.vertical ? clamp(cy - 26, B.min, (pass2 ? B.max : B.maxPass1 + bundleH) - bundleH) : B.fixed;

  const lost = frame >= T.lost;
  const lostIn = pop(frame, T.lost, 170);
  const closed = ease(frame, T.loop, T.closed);

  // Tether from the station the bundle is at.
  const [nx, ny] = L.node(pos);
  const tether = L.vertical
    ? { x1: nx + 9, y1: ny, x2: bx, y2: clamp(ny, by + 18, by + bundleH - 18) }
    : { x1: nx, y1: ny + 9, x2: clamp(nx, bx + 24, bx + B.w - 24), y2: by };
  const tetherD = L.vertical
    ? `M${tether.x1} ${tether.y1}C${tether.x1 + 60} ${tether.y1} ${tether.x2 - 60} ${tether.y2} ${tether.x2} ${tether.y2}`
    : `M${tether.x1} ${tether.y1}C${tether.x1} ${tether.y1 + 18} ${tether.x2} ${tether.y2 - 18} ${tether.x2} ${tether.y2}`;
  const tone: Tone = pass2 ? (rowsLanded >= 7 ? "ok" : "line") : lost ? "danger" : "line";

  const gatePending = (i: number) => pass2 && GATES[i] !== undefined && frame >= arrival(P2, i) && frame < gateAt(i);

  const camera = [
    { at: 0 },
    { at: SHEDS[1]! - 10, dur: 60, zoom: compact ? 1.01 : 1.025 },
    { at: T.reset, dur: 30, zoom: 1 },
    { at: T.loop - 10, dur: 50, zoom: compact ? 1.01 : 1.02 },
  ];

  const loopD = L.loop.map((p, k) => `${k === 0 ? "M" : "L"}${p[0]} ${p[1]}`).join("");
  const [first, last] = [L.node(0), L.node(6)];

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* Return path: dashed until release actually feeds the next decision. */}
    <g {...enter(frame, 16, { from: "none" })}>
      <path d={loopD} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="3 6" />
      {closed > 0 ? <path d={loopD} fill="none" stroke={TONE.ok} strokeWidth={1.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - closed} opacity={.8} /> : null}
      {!L.vertical
        ? <Text x={480} y={386} size={11} weight={600} font="mono" tone={closed >= 1 ? "ok" : "muted"} anchor="middle" caps>
          {fr ? "↺ décision suivante" : "↺ next decision"}
        </Text>
        : null}
    </g>

    {/* The forward track and its stations. */}
    <g {...enter(frame, 0, { from: "none" })}>
      <line x1={first[0]} x2={last[0]} y1={first[1]} y2={last[1]} stroke="var(--scene-hairline)" strokeWidth={1.25} />
      {/* Travelled part of the track, in the pass's tone. */}
      {bundleIn > 0 ? (() => {
        const start = L.node(pass2 ? 0 : 1);
        return <line x1={start[0]} y1={start[1]} x2={nx} y2={ny} stroke={TONE[pass2 ? "ok" : "danger"]} strokeWidth={2} strokeOpacity={.55 * bundleIn} strokeLinecap="round" />;
      })() : null}
    </g>

    {!L.vertical ? OWNERS.map((owner, index) => {
      const x1 = WIDE_X(owner.from) - 46;
      const x2 = WIDE_X(owner.to) + 46;
      return <g key={index} {...enter(frame, stagger(index, 14, 4))}>
        <path d={`M${x1} 64V60H${x2}V64`} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} />
        <Text x={(x1 + x2) / 2} y={50} size={10.5} weight={600} font="mono" tone="muted" anchor="middle" caps>{owner.label[locale]}</Text>
      </g>;
    }) : null}

    {STATIONS.map((_, i) => {
      const [x, y] = L.node(i);
      const active = bundleIn > 0 ? Math.max(0, 1 - Math.abs(pos - i) * 2) : 0;
      const gate = GATES[i];
      const passed = pass2 && gate !== undefined && frame >= gateAt(i);
      const reviewFail = !pass2 && i === 5 && lost;
      const nodeTone: Tone = reviewFail ? "danger" : pass2 && frame >= arrival(P2, i) ? "ok" : active > .5 ? "line" : "muted";
      return <g key={i} {...enter(frame, stagger(i, 4, 4))}>
        <StationLabel i={i} L={L} locale={locale} active={active} gate={gate} frame={frame} />
        {passed
          ? <g transform={`translate(${x} ${y}) scale(${.6 + .4 * pop(frame, gateAt(i), 220)}) translate(${-x} ${-y})`}><Checkpoint x={x} y={y} r={10} state="pass" /></g>
          : gatePending(i)
            ? <Checkpoint x={x} y={y} r={10} state="pending" />
            : <>
              <circle cx={x} cy={y} r={active > .5 ? 7.5 : 6} style={{ fill: nodeTone === "muted" ? "var(--scene-card)" : TONE[nodeTone] }} stroke={nodeTone === "muted" ? "var(--scene-hairline)" : TONE[nodeTone]} strokeWidth={1.25} className={active > .5 ? "scene-glow" : undefined} />
              {reviewFail ? <Text x={x} y={y + 1} size={10} weight={700} font="mono" tone="ink" anchor="middle">✗</Text> : null}
            </>}
        {reviewFail && frame < T.lost + 90 ? <Pulse x={x} y={y} frame={frame} at={T.lost} period={45} r={9} tone="danger" /> : null}
        {gate && frame >= gateAt(i) && frame < gateAt(i) + 40 ? <Pulse x={x} y={y} frame={frame} at={gateAt(i)} period={40} r={10} tone="ok" /> : null}
      </g>;
    })}

    {/* Mountain: a summit flag on Release, once the loop closes. */}
    <g className="scene-only-mountain" opacity={closed}>
      <line x1={last[0] + (L.vertical ? -14 : 12)} x2={last[0] + (L.vertical ? -14 : 12)} y1={last[1] - 4} y2={last[1] - 24} stroke={TONE.ok} strokeWidth={1.25} />
      <path d={`M${last[0] + (L.vertical ? -14 : 12)} ${last[1] - 24}l11 4l-11 4z`} fill={TONE.ok} />
    </g>

    {/* Pass 1: piles where the why ends up. */}
    {!pass2 || frame < T.reset + 14 ? L.piles.map((pile, index) => {
      const appear = easeOut(frame, SHEDS[index]! + 8, SHEDS[index]! + 26) * (1 - ease(frame, T.reset, T.reset + 14));
      if (appear <= 0) return null;
      return <g key={index} opacity={appear}>
        <Box x={pile.x} y={pile.y} w={pile.w} h={pile.h} tone="muted" variant="ghost" radius={14}>
          <Text x={pile.x + 14} y={pile.y + 20} size={11} weight={600} font="mono" tone="muted" caps>{index === 0 ? (fr ? "conversations" : "conversations") : "pages"}</Text>
        </Box>
      </g>;
    }) : null}

    {/* The tether: the bundle is at that station. */}
    {bundleIn > 0 ? <path d={tetherD} fill="none" stroke={TONE[tone]} strokeOpacity={.5 * bundleIn} strokeWidth={1.25} /> : null}

    {/* The context bundle. */}
    {bundleIn > 0 ? <g opacity={bundleIn} transform={`translate(0 ${8 * (1 - bundleIn)})`}>
      <Box x={bx} y={by} w={B.w} h={bundleH} tone={tone} focus={pass2 ? during(frame, T.closed - 20, T.end + 30, 14) : lost ? .7 * lostIn : 0} radius={14}>
        <Text x={bx + 16} y={by + (compact ? 17 : 20)} size={11} weight={600} font="mono" tone={tone === "line" ? "muted" : tone} caps>{fr ? "contexte transmis" : "context handed on"}</Text>
        {pass2 ? <Text x={bx + B.w - 16} y={by + (compact ? 17 : 20)} size={11.5} weight={600} font="mono" tone={rowsLanded >= 7 ? "ok" : "muted"} anchor="end">{`${rowsLanded}/7`}</Text> : null}

        {!pass2 ? <>
          {/* The decision survives the trip… */}
          <Text x={bx + 16} y={by + B.header + B.rowH * .5 + 2} size={compact ? 12.5 : 13.5} weight={600}>{fr ? "✓ décision" : "✓ decision"}</Text>
          {/* …its why does not. */}
          <Text x={bx + 16} y={by + B.header + B.rowH * 1.5 + 4} size={compact ? 12.5 : 13.5} weight={600} tone={lost ? "danger" : "ink"}>{lost ? (fr ? "pourquoi ? ✗" : "why? ✗") : (fr ? "pourquoi" : "why")}</Text>
          {[0, 1, 2, 3].map((seg) => {
            const gone = frame >= SHEDS[seg]!;
            const sx = bx + (compact ? 150 : 170) + seg * (compact ? 30 : 38);
            const sy = by + B.header + B.rowH * 1.5 - 1;
            return <rect key={seg} x={sx} y={sy} width={compact ? 24 : 30} height={10} rx={3}
              style={{ fill: gone ? "none" : TONE.hot }} stroke={gone ? "var(--scene-hairline)" : "none"} strokeDasharray={gone ? "2 3" : undefined} opacity={gone ? .9 : .85} />;
          })}
        </> : HANDED_ON.map((row, k) => {
          const at = rowLand[k]!;
          const t = easeOut(frame, at + 6, at + 20);
          if (t <= 0) return null;
          const ry = by + B.header + k * B.rowH + B.rowH / 2;
          const gate = GATES[k];
          return <g key={k} opacity={t} transform={`translate(${-8 * (1 - t)} 0)`}>
            <Text x={bx + 16} y={ry} size={compact ? 12 : 13} weight={700} font="mono" tone="ok">✓</Text>
            <Text x={bx + 32} y={ry} size={compact ? 12.5 : 13.5} weight={600}>{row[locale]}</Text>
            {gate && !compact ? <Tag x={bx + B.w - 12} y={ry} anchor="end" text={gate[locale]} tone="hot" size={10.5} appear={pop(frame, gateAt(k), 170)} /> : null}
          </g>;
        })}
      </Box>
    </g> : null}

    {/* Pass 1: each handoff peels a piece of the why off into a pile. */}
    {!pass2 ? SHEDS.map((at, seg) => {
      const t = ease(frame, at, at + 26, (x) => x * x * (3 - 2 * x));
      if (frame < at) return null;
      const pile = L.piles[seg % 2]!;
      const from: Pt = [bx + (compact ? 162 : 185) + seg * (compact ? 30 : 38), by + B.header + B.rowH * 1.5 + 4];
      const slot = seg >> 1;
      const to: Pt = compact
        ? [pile.x + 48 + slot * 40, pile.y + 52 + slot * 34]
        : [pile.x + 56 + slot * 110, pile.y + 50 + slot * 26];
      const ctrl: Pt = [lerp(from[0], to[0], .5), Math.min(from[1], to[1]) - 30];
      const [x, y] = t < 1 ? quad(from, ctrl, to, t) : to;
      const tilt = lerp(0, (hash(seg + 21) - .5) * 24, t);
      const fade = 1 - ease(frame, T.reset, T.reset + 14);
      return <g key={seg} opacity={fade * dim(t >= 1 ? 1 : 0, .7)} transform={`translate(${x} ${y}) rotate(${tilt})`}>
        <Tag x={0} y={0} text={fr ? "pourquoi" : "why"} tone={t >= 1 ? "muted" : "hot"} size={11} />
      </g>;
    }) : null}

    {/* Pass 2: each step's artefact drops from its station into the bundle. */}
    {pass2 ? HANDED_ON.map((_, k) => {
      const at = rowLand[k]!;
      const t = ease(frame, at - 8, at + 10);
      if (t <= 0 || t >= 1) return null;
      const [sx, sy] = L.node(k);
      const target: Pt = [bx + 40, by + B.header + k * B.rowH + B.rowH / 2];
      const [x, y] = quad([sx, sy], [L.vertical ? target[0] - 40 : sx, L.vertical ? sy : target[1] - 20], target, t);
      return <circle key={k} cx={x} cy={y} r={5} fill={TONE.ok} className="scene-glow" style={{ color: TONE.ok }} opacity={1 - t * .3} />;
    }) : null}

    {/* Release feeds the next decision: a packet runs the return path. */}
    <Comet points={L.loop} t={closed} tone="ok" r={6} tail={.14} />
    {frame >= T.closed && frame < T.closed + 50 ? <Pulse x={first[0]} y={first[1]} frame={frame} at={T.closed} period={50} r={10} tone="ok" /> : null}
    {L.vertical ? <Tag x={first[0] + (fr ? 196 : 184)} y={first[1] - 8} anchor="start" text={fr ? "↺ décision suivante" : "↺ next decision"} tone="ok" size={10.5} appear={pop(frame, T.closed, 170)} /> : null}
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 24,
  title: { en: "Context that survives the handoff", fr: "Un contexte qui survit au handoff" },
  caption: {
    en: "The loop is valuable when every step leaves the next one usable, reviewable context. AI moves that context between layers; decisions, the definition of done and the review stay with people.",
    fr: "La boucle a de la valeur quand chaque étape laisse à la suivante un contexte exploitable et reviewable. L’IA fait circuler ce contexte ; décisions, definition of done et review restent humaines.",
  },
  beats: [
    { at: 0, text: { en: "Without a connected loop, context drifts: decision, then document, then issues, then implementation.", fr: "Sans boucle connectée, le contexte dérive : décision, document, issues, puis implémentation." } },
    { at: T.lost - 4, text: { en: "By review time, the why behind the choice is scattered across conversations and pages.", fr: "Au moment de la review, le pourquoi du choix est dispersé entre conversations et pages." } },
    { at: T.pass2, text: { en: "As a Product OS, each step leaves the next one usable context. People still make the VE decision.", fr: "En Product OS, chaque étape laisse un contexte exploitable. La décision VE reste prise par des personnes." } },
    { at: arrival(P2, 2) - 18, text: { en: "People agree to a testable definition of done; slices and a protected branch carry it forward.", fr: "Des personnes valident une definition of done testable ; slices et branche protégée la portent." } },
    { at: arrival(P2, 5) - 18, text: { en: "Reviewers own the scrutiny: they challenge the design and the code, with the decision attached.", fr: "Les reviewers portent la rigueur : ils challengent design et code, la décision toujours attachée." } },
    { at: arrival(P2, 6) - 18, text: { en: "Release and learning feed the next decision. AI moves context; people keep the accountability.", fr: "Release et apprentissage relancent la boucle. L’IA transmet le contexte ; la responsabilité reste humaine." } },
  ],
  Stage,
});
