import { Box, Comet, Counter, ease, easeOut, enter, hash, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Act 1: one bar of time. The mechanics (syntax, boilerplate, that config flag)
// squeeze into 20%; orchestration opens to 80% (the article's figures). Act 2:
// the bar rises into a header and the 80% is shown at work: intent → AI fans out
// three drafts in seconds → judgment collapses the fan to one choice.
const T = {
  morph: [84, 122] as const,
  lift: 150,
  intent: 168,
  ai: 190,
  drafts: [212, 222, 232] as const,
  question: 268,
  checks: [288, 300, 312] as const,
  fly: 344,
  land: 372,
  end: 470,
} as const;

type Pt = readonly [number, number];

// Before: named mechanics segments + a thin orchestration slice (schematic widths).
const BEFORE = [.26, .24, .22, .28] as const;
const MECHANICS = {
  en: ["syntax", "boilerplate", "config flag"],
  fr: ["syntaxe", "code répétitif", "ce paramètre"],
} as const;
const KEEP = 1;
const DRAFT_LINES = [[.78, .52, .66], [.6, .84, .44], [.7, .4, .74]] as const;

const quad = (a: Pt, c: Pt, b: Pt, t: number): [number, number] => [
  (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];
const curve = (a: Pt, c: Pt, b: Pt, steps = 14): Pt[] => Array.from({ length: steps + 1 }, (_, i) => quad(a, c, b, i / steps));

function Stage({ frame, compact, locale }: SceneStageProps) {
  const fr = locale === "fr";
  const m = ease(frame, T.morph[0], T.morph[1]);
  const lift = ease(frame, T.lift, T.lift + 26);

  // ── Act 1: the time bar ───────────────────────────────────────────────────
  const barX = compact ? 20 : 40;
  const barW = compact ? 500 : 880;
  const barY = lerp(compact ? 204 : 172, compact ? 58 : 56, lift);
  const barH = lerp(54, 24, lift);
  const widths = [...BEFORE.slice(0, 3).map((w) => lerp(w, w * .2 / .72, m)), lerp(BEFORE[3], .8, m)];
  const starts = widths.map((_, index) => widths.slice(0, index).reduce((sum, w) => sum + w, 0));
  const seg = (index: number) => ({ x: barX + starts[index]! * barW, w: widths[index]! * barW });
  const orchestrate = seg(3);
  const executeW = (widths[0]! + widths[1]! + widths[2]!) * barW;
  const gap = 4;
  const labelsOut = 1 - ease(frame, T.morph[0], T.morph[0] + 14);
  const bigNumbers = ease(frame, T.morph[1] - 16, T.morph[1] + 6) * (1 - ease(frame, T.lift, T.lift + 14));
  const inlineLabels = ease(frame, T.lift + 14, T.lift + 28);

  const segmentRect = (x: number, w: number, tone: Tone, key: string, opacity = 1) => <g key={key} opacity={opacity}>
    <rect className="scene-card" x={x + gap / 2} y={barY} width={Math.max(0, w - gap)} height={barH} rx={Math.min(12, barH / 2)} style={{ fill: "var(--scene-card)" }} />
    <rect x={x + gap / 2} y={barY} width={Math.max(0, w - gap)} height={barH} rx={Math.min(12, barH / 2)} style={{ fill: tint(tone, tone === "hot" ? 16 : 9) }} stroke={TONE[tone]} strokeOpacity={.45} strokeWidth={1} />
  </g>;

  // ── Act 2: intent → AI → drafts → one choice ──────────────────────────────
  const G = compact
    ? {
      intent: { x: 20, y: 112, w: 240, h: 84 },
      ai: { x: 280, y: 112, w: 240, h: 84 },
      draft: (i: number) => ({ x: 20 + i * 176, y: 244, w: 148, h: 72 }),
      question: [270, 346] as Pt,
      decision: { x: 130, y: 386, w: 280, h: 96 },
    }
    : {
      intent: { x: 40, y: 206, w: 196, h: 92 },
      ai: { x: 280, y: 206, w: 212, h: 92 },
      draft: (i: number) => ({ x: 548, y: 146 + i * 86, w: 150, h: 70 }),
      question: [623, 118] as Pt,
      decision: { x: 740, y: 202, w: 180, h: 100 },
    };
  const intentOut: Pt = compact ? [G.intent.x + G.intent.w, G.intent.y + G.intent.h / 2] : [G.intent.x + G.intent.w, G.intent.y + G.intent.h / 2];
  const aiIn: Pt = [G.ai.x, G.ai.y + G.ai.h / 2];
  const aiOut: Pt = compact ? [G.ai.x + G.ai.w / 2, G.ai.y + G.ai.h] : [G.ai.x + G.ai.w, G.ai.y + G.ai.h / 2];
  const draftIn = (i: number): Pt => {
    const d = G.draft(i);
    return compact ? [d.x + d.w / 2, d.y] : [d.x, d.y + d.h / 2];
  };
  const fanPath = (i: number) => {
    const to = draftIn(i);
    const c: Pt = compact ? [lerp(aiOut[0], to[0], .5), aiOut[1] + 26] : [aiOut[0] + 30, lerp(aiOut[1], to[1], .9)];
    return curve(aiOut, c, to);
  };
  const judged = (i: number) => frame >= T.checks[i]!;
  const rejected = (i: number) => judged(i) && i !== KEEP;
  const flight = easeOut(frame, T.fly, T.land);
  const flying = frame >= T.fly && frame < T.land;
  const landed = frame >= T.land;

  const draftCard = (i: number) => {
    const d = G.draft(i);
    const at = T.drafts[i]! + 12;
    const appear = pop(frame, at);
    if (frame < at) return null;
    const tone: Tone = !judged(i) ? "line" : i === KEEP ? "ok" : "danger";
    const recede = rejected(i) ? ease(frame, T.checks[i]! + 8, T.checks[i]! + 26) : 0;
    const shift = recede * (compact ? 0 : -10);
    const ghost = i === KEEP && frame >= T.fly;
    const letter = "ABC"[i]!;
    return <g key={i} opacity={lerp(1, .28, recede) * (rejected(i) ? 1 - .4 * ease(frame, T.land, T.land + 20) : 1)} transform={`translate(${shift} ${recede * (compact ? 6 : 0)})`}>
      {ghost
        ? <rect x={d.x + .5} y={d.y + .5} width={d.w - 1} height={d.h - 1} rx={12} fill="none" stroke={TONE.ok} strokeOpacity={.45} strokeWidth={1} strokeDasharray="4 5" />
        : <Box x={d.x} y={d.y} w={d.w} h={d.h} tone={tone} appear={Math.min(1, appear)} radius={12} focus={i === KEEP && judged(i) ? ease(frame, T.checks[i], T.checks[i] + 10) : 0}>
          <Text x={d.x + 14} y={d.y + 18} size={11} font="mono" weight={600} tone={judged(i) ? tone : "muted"} caps>{`${fr ? "ébauche" : "draft"} ${letter}`}</Text>
          {DRAFT_LINES[i]!.map((len, k) => <rect key={k} x={d.x + 14 + (k === 1 ? 12 : 0)} y={d.y + 34 + k * 10} width={(d.w - 40) * len * Math.min(1, easeOut(frame, at + k * 3, at + 14 + k * 3))} height={3.5} rx={1.75} style={{ fill: tint(k === 0 ? "line" : "ink", k === 0 ? 55 : 22 + 8 * hash(i * 7 + k)) }} />)}
          {judged(i) ? <g transform={`translate(${d.x + d.w - 18} ${d.y + 18}) scale(${pop(frame, T.checks[i]!, 200)})`}>
            <circle r={9} fill={TONE[tone]} className="scene-glow" style={{ color: TONE[tone] }} />
            {i === KEEP
              ? <path d="M-3.6 .2L-1 2.9L3.8 -2.8" fill="none" style={{ stroke: "var(--scene-card)" }} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              : <path d="M-3 -3L3 3M3 -3L-3 3" style={{ stroke: "var(--scene-card)" }} strokeWidth={2} strokeLinecap="round" />}
          </g> : null}
        </Box>}
    </g>;
  };

  // The kept draft flies out of the fan and becomes the decision.
  const src = G.draft(KEEP);
  const dst = G.decision;
  const flyCtrl: Pt = compact ? [src.x + src.w / 2 + 70, lerp(src.y, dst.y, .5) + 10] : [lerp(src.x, dst.x, .5) + 20, src.y - 40];
  const [flyCx, flyCy] = quad([src.x + src.w / 2, src.y + src.h / 2], flyCtrl, [dst.x + dst.w / 2, dst.y + dst.h / 2], flight);
  const flyW = lerp(src.w, dst.w, flight);
  const flyH = lerp(src.h, dst.h, flight);

  const act2 = frame >= T.lift;
  const intentIn = enter(frame, T.intent, { from: "left", distance: 18 });
  const aiIn2 = enter(frame, T.ai, { from: "left", distance: 18 });
  const intentComet = ease(frame, T.ai - 12, T.ai + 4);

  return <g>
    {/* Act 1 eyebrow → act 2 header. */}
    <Text x={barX} y={barY - 20} size={11} font="mono" weight={600} tone="muted" caps opacity={enter(frame, 0).opacity * (1 - ease(frame, T.morph[0], T.morph[0] + 12))}>{fr ? "avant · où part le temps" : "before · where the time goes"}</Text>
    <Text x={barX} y={barY - 20} size={11} font="mono" weight={600} tone="muted" caps opacity={ease(frame, T.morph[1] - 12, T.morph[1]) * (1 - lift)}>{fr ? "aujourd'hui · où part le temps" : "now · where the time goes"}</Text>

    {/* The bar. */}
    <g {...enter(frame, 4, { distance: 10 })}>
      {[0, 1, 2].map((index) => {
        const { x, w } = seg(index);
        return <g key={index} {...enter(frame, stagger(index, 6, 6), { from: "none" })}>
          {segmentRect(x, w, "line", `m${index}`, 1 - m)}
          <Text x={x + w / 2} y={barY + barH / 2} size={compact ? 14 : 16} weight={600} anchor="middle" opacity={labelsOut}>{MECHANICS[locale][index]}</Text>
        </g>;
      })}
      {m > 0 ? segmentRect(barX, executeW, "line", "exec", m) : null}
      <g {...enter(frame, 24, { from: "none" })}>
        {segmentRect(orchestrate.x, orchestrate.w, "hot", "orch")}
        <Text x={orchestrate.x + orchestrate.w / 2} y={barY + barH / 2} size={compact ? 14 : 16} weight={600} anchor="middle" tone="hot" opacity={labelsOut}>{fr ? "orchestrer" : "orchestrate"}</Text>
      </g>
      {/* Inline labels once the bar is a header. */}
      <g opacity={inlineLabels}>
        <Text x={barX + executeW / 2} y={barY + barH / 2 + .5} size={12} font="mono" weight={600} anchor="middle" tone="line">{compact ? (fr ? "20\u202f%" : "20%") : fr ? "exécuter 20\u202f%" : "execute 20%"}</Text>
        <Text x={orchestrate.x + orchestrate.w / 2} y={barY + barH / 2 + .5} size={12} font="mono" weight={600} anchor="middle" tone="hot">{fr ? "orchestrer 80\u202f%" : "orchestrate 80%"}</Text>
      </g>
      {/* Mechanics bracket (before). */}
      <g opacity={labelsOut * enter(frame, 30).opacity}>
        <path d={`M${barX + 3} ${barY + barH + 10}v6H${barX + .72 * barW - 3}v-6`} fill="none" style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1} />
        <Text x={barX + .36 * barW} y={barY + barH + 34} size={11} font="mono" weight={600} tone="muted" anchor="middle" caps>{fr ? "mécanique" : "mechanics"}</Text>
      </g>
    </g>

    {/* Act 1 payoff: the two numbers. */}
    {bigNumbers > 0 ? <g opacity={bigNumbers}>
      <Counter frame={frame} from={0} to={20} start={T.morph[0] + 10} end={T.morph[1] + 10} x={barX + 2} y={barY + barH + 50} size={compact ? 30 : 44} weight={700} tone="line" format={(v) => `${Math.round(v)}${fr ? " %" : "%"}`} />
      <Text x={barX + 4} y={barY + barH + 88} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "exécuter" : "execute"}</Text>
      <Counter frame={frame} from={0} to={80} start={T.morph[0] + 10} end={T.morph[1] + 10} x={orchestrate.x + 4} y={barY + barH + 54} size={compact ? 56 : 68} weight={700} tone="hot" format={(v) => `${Math.round(v)}${fr ? " %" : "%"}`} />
      <Text x={orchestrate.x + 8} y={barY + barH + 100} size={11} font="mono" weight={600} tone="muted" caps>{fr ? "orchestrer" : "orchestrate"}</Text>
    </g> : null}

    {/* Act 2: hairline bracket from the 80% down to the stage it opens. */}
    {act2 ? <g opacity={ease(frame, T.lift + 16, T.lift + 32)}>
      <path d={`M${orchestrate.x + 4} ${barY + barH + 8}v6H${orchestrate.x + orchestrate.w - 4}v-6`} fill="none" stroke={TONE.hot} strokeOpacity={.45} strokeWidth={1} />
    </g> : null}

    <g {...intentIn}>
      <Box x={G.intent.x} y={G.intent.y} w={G.intent.w} h={G.intent.h} tone="hot" radius={14} focus={during(frame, T.intent, T.ai + 6) * .6}>
        <Text x={G.intent.x + 16} y={G.intent.y + 22} size={11} font="mono" weight={600} tone="hot" caps>{fr ? "intention" : "intent"}</Text>
        <Text x={G.intent.x + 16} y={G.intent.y + 50} size={17} weight={650}>{fr ? "architecture" : "event-driven"}</Text>
        <Text x={G.intent.x + 16} y={G.intent.y + 72} size={17} weight={650}>{fr ? "événementielle" : "architecture"}</Text>
      </Box>
    </g>
    {act2 ? <Comet points={[intentOut, aiIn]} t={intentComet} tone="hot" r={5} tail={.5} /> : null}

    <g {...aiIn2}>
      <Box x={G.ai.x} y={G.ai.y} w={G.ai.w} h={G.ai.h} tone="line" radius={14} focus={during(frame, T.ai + 4, T.drafts[2] + 20) * .7}>
        <Text x={G.ai.x + 16} y={G.ai.y + 22} size={11} font="mono" weight={600} tone="line" caps>{fr ? "IA · junior fougueux" : "AI · eager junior"}</Text>
        <Text x={G.ai.x + 16} y={G.ai.y + 50} size={13} font="mono" weight={600}>{fr ? "vitesse de l'éclair" : "types at 100× speed"}</Text>
        <Text x={G.ai.x + 16} y={G.ai.y + 70} size={13} font="mono" weight={600} tone="danger">{fr ? "zéro contexte métier" : "zero business context"}</Text>
      </Box>
    </g>

    {/* The fan: three parallel universes, in seconds. */}
    {[0, 1, 2].map((i) => <g key={i}>
      <path d={`M${fanPath(i).map(([x, y]) => `${x} ${y}`).join("L")}`} fill="none" style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1} opacity={ease(frame, T.drafts[i]!, T.drafts[i]! + 10) * (rejected(i) ? .35 : 1)} />
      <Comet points={fanPath(i)} t={ease(frame, T.drafts[i]!, T.drafts[i]! + 14)} tone="line" r={4.5} tail={.4} />
    </g>)}
    {[0, 1, 2].map(draftCard)}

    {/* Judgment. */}
    <Tag x={G.question[0]} y={G.question[1]} text={fr ? "réveil à 3 h dans 18 mois ?" : "3 AM page in 18 months?"} tone="hot" size={12.5} appear={frame >= T.question ? pop(frame, T.question) : 0} />

    {flying ? <g>
      <rect className="scene-card" x={flyCx - flyW / 2} y={flyCy - flyH / 2} width={flyW} height={flyH} rx={13} style={{ fill: "var(--scene-card)" }} />
      <rect className="scene-glow" x={flyCx - flyW / 2} y={flyCy - flyH / 2} width={flyW} height={flyH} rx={13} style={{ fill: tint("ok", 16), color: TONE.ok }} stroke={TONE.ok} strokeOpacity={.7} />
      <Text x={flyCx} y={flyCy} size={13} font="mono" weight={600} tone="ok" anchor="middle">{`${fr ? "ébauche" : "draft"} B`}</Text>
    </g> : null}
    {landed ? <g>
      <Box x={dst.x} y={dst.y} w={dst.w} h={dst.h} tone="ok" radius={14} fill={.55} focus={1 - ease(frame, T.land + 20, T.land + 50) * .6}>
        <Text x={dst.x + 16} y={dst.y + 22} size={11} font="mono" weight={600} tone="ok" caps>{fr ? "un choix" : "one choice"}</Text>
        <Text x={dst.x + 16} y={dst.y + 50} size={17} weight={650}>{fr ? "architecture" : "architecture"}</Text>
        <Text x={dst.x + 16} y={dst.y + 72} size={compact ? 13 : 12.5} font="mono" weight={600} tone="muted">{fr ? "pas collée en prod" : "not pasted into prod"}</Text>
      </Box>
      {frame < T.land + 40 ? <Pulse x={dst.x + dst.w / 2} y={dst.y + dst.h / 2} frame={frame} at={T.land} period={40} r={dst.h / 2} tone="ok" /> : null}
    </g> : null}

    {/* Theme flourish: a trail marker beside the kept path (mountain), a spark (rocket). */}
    <g className="scene-only-mountain" opacity={landed ? ease(frame, T.land + 10, T.land + 26) : 0}>
      <path d={`M${dst.x + dst.w - 30} ${dst.y - 6}l7 -13l7 13z`} style={{ fill: tint("ok", 70) }} />
    </g>
    <g className="scene-only-rocket" opacity={landed ? ease(frame, T.land + 10, T.land + 26) : 0}>
      <path d={`M${dst.x + dst.w + 2} ${dst.y - 10}l2 -6l2 6l6 2l-6 2l-2 6l-2 -6l-6 -2z`} style={{ fill: tint("ok", 80) }} />
    </g>
  </g>;
}

function during(frame: number, start: number, end: number) {
  return Math.min(ease(frame, start, start + 10), 1 - ease(frame, end - 10, end));
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: 430,
  title: { en: "From execution to orchestration", fr: "De l'exécution à l'orchestration" },
  caption: {
    en: "The mechanics shrink to about 20% of the time. The other 80% is orchestration: stating the intent, letting AI draft several universes in seconds, and using judgment to keep the one that will still hold in 18 months.",
    fr: "La mécanique tombe à environ 20 % du temps. Les 80 % restants sont de l'orchestration : formuler l'intention, laisser l'IA ébaucher plusieurs univers en quelques secondes, et garder par le jugement celui qui tiendra encore dans 18 mois.",
  },
  beats: [
    { at: 0, text: { en: "Before: a big chunk of mental energy burned on mechanics: syntax, boilerplate, that one config flag.", fr: "Avant : une part absurde de l'énergie partait dans la mécanique : syntaxe, code répétitif, ce paramètre." } },
    { at: T.morph[0], text: { en: "Now: about 20% of the time executing, 80% orchestrating.", fr: "Aujourd'hui : environ 20 % du temps à exécuter, 80 % à orchestrer." } },
    { at: T.lift + 10, text: { en: "Orchestrating starts with intent: scaffold three totally different approaches.", fr: "Orchestrer commence par l'intention : ébaucher trois approches radicalement différentes." } },
    { at: T.drafts[0], text: { en: "An eager junior typing at 100× speed, with zero business context: three parallel universes in seconds.", fr: "Un junior fougueux, rapide comme l'éclair, sans contexte métier : trois univers parallèles en secondes." } },
    { at: T.question, text: { en: "Judgment collapses the search space: which one won't wake me up at 3 AM in 18 months?", fr: "Le jugement réduit l'espace des possibles : laquelle ne me réveillera pas à 3 h dans 18 mois ?" } },
    { at: T.fly, text: { en: "The output is a choice, not production code. AI writes the bricks; the engineer stays the architect.", fr: "Le résultat est un choix, pas du code de prod. L'IA pose les briques ; l'ingénieur reste l'architecte." } },
  ],
  Stage,
});
