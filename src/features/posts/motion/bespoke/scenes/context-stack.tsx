import type { PostLocale } from "../../../content/types";
import { Box, Camera, Comet, dim, during, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, TONE, type Tone } from "../primitives";
import { defineScene, type Localized, type SceneStageProps } from "../types";

// One ordered stack, packed twice. Each need lifts off the task card and flies
// into its layer; what no task justifies stays empty. On the switch the PR items
// are unpacked while Authority stays. The replay ends on two authoritative
// sources that disagree: the conflict travels to the reader, it is not arbitrated.
const T = {
  rows: 6,
  task: 36,
  pr: 60,
  empty: 118,
  unpack: 190,
  incident: 204,
  sourceA: 262,
  conflict: 320,
  clash: 342,
  surface: 356,
  surfaced: 386,
  end: 500,
} as const;

const LAYERS: readonly { name: Localized; sub: Localized }[] = [
  { name: { en: "Authority", fr: "Autorité" }, sub: { en: "intent · boundaries", fr: "objectif · frontières" } },
  { name: { en: "Current state", fr: "État courant" }, sub: { en: "actually in force", fr: "réellement en vigueur" } },
  { name: { en: "Contracts", fr: "Contrats" }, sub: { en: "invariants · conventions", fr: "invariants · conventions" } },
  { name: { en: "Relevant history", fr: "Historique pertinent" }, sub: { en: "decisions · failures", fr: "décisions · échecs" } },
  { name: { en: "Evidence", fr: "Preuves" }, sub: { en: "tests · logs · metrics", fr: "tests · logs · métriques" } },
];

type Item = { layer: number; title: Localized; meta: Localized; at: number; mono?: boolean };

const PR_SCOPE: Localized = { en: "scope: PR", fr: "périmètre : PR" };
const INC_SCOPE: Localized = { en: "scope: incident", fr: "périmètre : incident" };
const AUTHORITY: Item = { layer: 0, title: { en: "user intent", fr: "intention utilisateur" }, meta: { en: "owner: the user", fr: "resp. : utilisateur" }, at: T.pr };

// The task's needs, in list order: each one flies from its line into its layer.
const TASKS: readonly { name: Localized; items: readonly Item[]; at: number }[] = [
  {
    name: { en: "PR review", fr: "Revue de PR" }, at: T.task,
    items: [
      { layer: 1, title: { en: "diff", fr: "diff" }, meta: PR_SCOPE, at: T.pr + 16, mono: true },
      { layer: 2, title: { en: "review conventions", fr: "conventions de revue" }, meta: PR_SCOPE, at: T.pr + 32 },
    ],
  },
  {
    name: { en: "Incident", fr: "Incident" }, at: T.incident,
    items: [
      { layer: 3, title: { en: "timeline", fr: "chronologie" }, meta: INC_SCOPE, at: T.incident + 18 },
      { layer: 4, title: { en: "logs", fr: "logs" }, meta: INC_SCOPE, at: T.incident + 32 },
      { layer: 1, title: { en: "deployment state", fr: "état du déploiement" }, meta: INC_SCOPE, at: T.incident + 46 },
    ],
  },
];

// Two authoritative sources for the same contract, retrieved from outside.
const SOURCE_A: Item = { layer: 2, title: { en: "domain invariants", fr: "invariants métier" }, meta: { en: "source A", fr: "source A" }, at: T.sourceA };
const SOURCE_B: Item = { layer: 2, title: { en: "domain invariants", fr: "invariants métier" }, meta: { en: "source B", fr: "source B" }, at: T.conflict };

const RECORDS: readonly Localized[] = [
  { en: "owner", fr: "responsable" },
  { en: "provenance", fr: "provenance" },
  { en: "scope", fr: "périmètre" },
  { en: "validity", fr: "validité" },
];

type Rect = { x: number; y: number; w: number; h: number };
type Layout = {
  stack: { x: number; y: number; w: number; rowH: number; gap: number };
  nameSize: number;
  showSub: boolean;
  /** Item column A (every layer) and B (the rival source). */
  colA: { x: number; w: number };
  colB: { x: number; w: number };
  cardH: number;
  task: Rect;
  needs: { x: number; y: number; step: number; inline: boolean };
  side: Rect | null;
  rail: boolean;
  conflictTag: { x: number; y: number };
};

const WIDE: Layout = {
  stack: { x: 300, y: 70, w: 620, rowH: 56, gap: 8 },
  nameSize: 16,
  showSub: true,
  colA: { x: 532, w: 180 },
  colB: { x: 728, w: 180 },
  cardH: 44,
  task: { x: 40, y: 70, w: 224, h: 196 },
  needs: { x: 56, y: 194, step: 24, inline: false },
  side: { x: 40, y: 282, w: 224, h: 106 },
  rail: true,
  conflictTag: { x: 0, y: 0 },
};

const COMPACT: Layout = {
  stack: { x: 20, y: 164, w: 500, rowH: 60, gap: 7 },
  nameSize: 13.5,
  showSub: false,
  colA: { x: 212, w: 152 },
  colB: { x: 374, w: 138 },
  cardH: 46,
  task: { x: 20, y: 58, w: 500, h: 92 },
  needs: { x: 36, y: 130, step: 0, inline: true },
  side: null,
  rail: false,
  conflictTag: { x: 504, y: 80 },
};

function ItemCard({ rect, item, locale, tone, focus, compact }: { rect: Rect; item: Item; locale: PostLocale; tone: Tone; focus: number; compact: boolean }) {
  const { x, y, w, h } = rect;
  return <Box x={x} y={y} w={w} h={h} tone={tone} focus={focus} radius={10}>
    <Text x={x + 12} y={y + h / 2 - 8} size={compact ? 13.5 : 14.5} weight={650} font={item.mono ? "mono" : "display"}>{item.title[locale]}</Text>
    <Text x={x + 12} y={y + h / 2 + 10} size={compact ? 11 : 11.5} weight={600} font="mono" tone={tone === "hot" ? "hot" : "muted"}>{item.meta[locale]}</Text>
  </Box>;
}

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const L = compact ? COMPACT : WIDE;
  const { stack, task } = L;
  const rowY = (layer: number) => stack.y + layer * (stack.rowH + stack.gap);
  const slot = (layer: number, col: "A" | "B" = "A"): Rect => {
    const c = col === "A" ? L.colA : L.colB;
    return { x: c.x, y: rowY(layer) + (stack.rowH - L.cardH) / 2, w: c.w, h: L.cardH };
  };

  const taskIndex = frame >= T.incident ? 1 : 0;
  const current = TASKS[taskIndex]!;
  const nameIn = taskIndex === 0 ? easeOut(frame, T.task, T.task + 18) * (1 - ease(frame, T.unpack, T.unpack + 12)) : easeOut(frame, T.incident, T.incident + 18);

  const conflict = ease(frame, T.conflict, T.conflict + 20);
  const clash = pop(frame, T.clash, 190);
  const surfaced = ease(frame, T.surfaced, T.surfaced + 16);
  const rowFocus = frame >= T.clash ? during(frame, T.clash, T.end + 30, 12) : 0;

  // Where a need sits on the task card: the card it becomes starts right there.
  const needPos = (index: number): [number, number] => L.needs.inline
    ? [L.needs.x + index * 148, L.needs.y]
    : [L.needs.x, L.needs.y + index * L.needs.step];

  const fly = (item: Item, from: Rect, to: Rect, exitAt?: number) => {
    if (frame < item.at) return null;
    const t = ease(frame, item.at, item.at + 22);
    const exit = exitAt === undefined ? 0 : ease(frame, exitAt, exitAt + 16);
    if (exit >= 1) return null;
    const arc = Math.sin(Math.PI * t) * (compact ? 10 : 22);
    const rect: Rect = {
      x: lerp(from.x, to.x, t) + exit * 28,
      y: lerp(from.y, to.y, t) - arc,
      w: lerp(from.w, to.w, t),
      h: lerp(from.h, to.h, t),
    };
    const landed = frame >= item.at + 22;
    return <g opacity={Math.min(1, t * 4) * (1 - exit)}>
      <ItemCard rect={rect} item={item} locale={locale} tone={landed ? "ok" : "line"} focus={landed ? during(frame, item.at + 20, item.at + 44, 8) : .5} compact={compact} />
      {landed && frame < item.at + 60 ? <Pulse x={to.x + to.w - 14} y={to.y + to.h / 2} frame={frame} at={item.at + 22} period={38} r={7} tone="ok" /> : null}
    </g>;
  };

  // Camera: a slow lean on the contracts row when the sources collide.
  const contractsY = rowY(2) + stack.rowH / 2;
  const camera = [
    { at: 0 },
    { at: T.conflict - 6, dur: 44, zoom: 1.035, focus: [lerp(width / 2, compact ? width / 2 : L.colB.x, .22), lerp(height / 2, contractsY, .22)] as const },
    { at: T.surface + 8, dur: 50, zoom: 1.015 },
  ];

  const clashX = (L.colA.x + L.colA.w + L.colB.x) / 2;
  const surfacePath: [number, number][] = compact
    ? [[clashX, contractsY - 14], [clashX, rowY(0) - 6], [clashX + 30, task.y + task.h - 10], [L.conflictTag.x - 60, L.conflictTag.y + 12]]
    : [[clashX, contractsY + 14], [clashX, stack.y + 5 * stack.rowH + 4 * stack.gap + 14], [L.side!.x + L.side!.w + 30, 402], [L.side!.x + L.side!.w - 10, L.side!.y + L.side!.h - 20]];

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    {/* Priority rail: order is priority. */}
    {L.rail ? <g {...enter(frame, 4, { from: "none" })}>
      <line x1={stack.x - 14} x2={stack.x - 14} y1={stack.y + 8} y2={rowY(4) + stack.rowH - 8} stroke="var(--scene-hairline)" strokeWidth={1} />
      <path d={`M${stack.x - 18} ${rowY(4) + stack.rowH - 14}L${stack.x - 14} ${rowY(4) + stack.rowH - 7}L${stack.x - 10} ${rowY(4) + stack.rowH - 14}`} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} strokeLinecap="round" />
      <Text x={stack.x + stack.w} y={stack.y - 16} size={11} weight={600} font="mono" tone="muted" anchor="end" caps>{fr ? "1 → 5 : ordre de priorité" : "1 → 5: priority order"}</Text>
    </g> : null}

    {/* The stack itself. */}
    {LAYERS.map((layer, index) => {
      const y = rowY(index);
      const focused = index === 2 ? rowFocus : 0;
      const recede = index === 2 ? 1 : dim(conflict * (1 - surfaced * .4), .5);
      return <g key={index} {...enter(frame, stagger(index, T.rows, 5))}>
        <g opacity={recede}>
          <Box x={stack.x} y={y} w={stack.w} h={stack.rowH} tone={focused > 0 ? "hot" : "line"} focus={focused} radius={12}>
            <Text x={stack.x + (compact ? 14 : 18)} y={y + stack.rowH / 2} size={12} weight={600} font="mono" tone="line">{String(index + 1).padStart(2, "0")}</Text>
            <Text x={stack.x + (compact ? 42 : 48)} y={y + stack.rowH / 2 - (L.showSub ? 9 : 0)} size={L.nameSize} weight={650}>{layer.name[locale]}</Text>
            {L.showSub ? <Text x={stack.x + 48} y={y + stack.rowH / 2 + 12} size={12} weight={500} font="mono" tone="muted">{layer.sub[locale]}</Text> : null}
          </Box>
          {/* The tray each item docks into. */}
          <rect x={L.colA.x} y={slot(index).y} width={L.colA.w} height={L.cardH} rx={10} fill="none" stroke="var(--scene-hairline)" strokeWidth={1} strokeDasharray="3 5" opacity={.8} />
        </g>
      </g>;
    })}

    {/* Empty layers say so while the PR is packed. */}
    {[3, 4].map((layer, index) => {
      const appear = easeOut(frame, stagger(index, T.empty, 6), stagger(index, T.empty, 6) + 16) * (1 - ease(frame, T.unpack, T.unpack + 12));
      if (appear <= 0) return null;
      const s = slot(layer);
      return <g key={layer} opacity={appear}>
        <Text x={s.x + 14} y={s.y + s.h / 2} size={12} weight={600} font="mono" tone="muted">{fr ? "— non chargé" : "— not loaded"}</Text>
      </g>;
    })}

    {/* The task decides what is packed. */}
    <g {...enter(frame, T.task - 12)}>
      <Box x={task.x} y={task.y} w={task.w} h={task.h} tone="line" radius={14}>
        <Text x={task.x + 16} y={task.y + 22} size={11} weight={600} font="mono" tone="muted" caps>{fr ? "tâche" : "task"}</Text>
        <g opacity={nameIn} transform={`translate(0 ${6 * (1 - nameIn)})`}>
          <Text x={task.x + 16} y={task.y + (compact ? 45 : 54)} size={compact ? 19 : 22} weight={700}>{current.name[locale]}</Text>
        </g>
        {!compact ? <>
          <line x1={task.x + 16} x2={task.x + task.w - 16} y1={task.y + 78} y2={task.y + 78} stroke="var(--scene-hairline)" strokeWidth={1} />
          <Text x={task.x + 16} y={task.y + 98} size={11} weight={600} font="mono" tone="muted" caps>{fr ? "a besoin de" : "needs"}</Text>
        </> : <Text x={task.x + task.w - 16} y={task.y + 22} size={11} weight={600} font="mono" tone="muted" caps anchor="end" opacity={1 - Math.min(1, clash)}>{fr ? "a besoin de ↓" : "needs ↓"}</Text>}
        {current.items.map((item, index) => {
          const [nx, ny] = needPos(index);
          const listed = easeOut(frame, stagger(index, current.at + 8, 5), stagger(index, current.at + 8, 5) + 16) * (taskIndex === 0 ? 1 - ease(frame, T.unpack, T.unpack + 12) : 1);
          const packed = frame >= item.at;
          return <g key={`${taskIndex}-${index}`} opacity={listed * (packed ? .55 : 1)}>
            <Text x={nx} y={ny} size={13} weight={600} font="mono" tone={packed ? "ok" : "line"}>{`${packed ? "✓" : "+"} ${item.title[locale]}`}</Text>
          </g>;
        })}
      </Box>
    </g>

    {/* Every source records… then the surfaced conflict. */}
    {L.side ? (() => {
      const side = L.side;
      const legend = easeOut(frame, T.pr + 40, T.pr + 58) * (1 - ease(frame, T.surfaced - 4, T.surfaced + 8));
      return <g {...enter(frame, T.pr + 36)}>
        <Box x={side.x} y={side.y} w={side.w} h={side.h} tone={surfaced > 0 ? "hot" : "line"} focus={surfaced * during(frame, T.surfaced, T.end + 30)} radius={14}>
          <g opacity={legend}>
            <Text x={side.x + 16} y={side.y + 22} size={11} weight={600} font="mono" tone="muted" caps>{fr ? "chaque source indique" : "every source records"}</Text>
            {RECORDS.map((field, index) => {
              const col = index % 2;
              const row = Math.floor(index / 2);
              return <Tag key={index} x={side.x + 16 + col * 102} y={side.y + 52 + row * 32} anchor="start" text={field[locale]} tone="line" size={11.5} appear={pop(frame, stagger(index, T.pr + 46, 4))} />;
            })}
          </g>
          <g opacity={surfaced} transform={`translate(0 ${6 * (1 - surfaced)})`}>
            <Text x={side.x + 16} y={side.y + 22} size={11} weight={600} font="mono" tone="hot" caps>{fr ? "⚠ conflit signalé" : "⚠ conflict surfaced"}</Text>
            <Text x={side.x + 16} y={side.y + 47} size={15.5} weight={650}>{fr ? "Deux sources d’autorité" : "Two authoritative"}</Text>
            <Text x={side.x + 16} y={side.y + 67} size={15.5} weight={650}>{fr ? "se contredisent" : "sources disagree"}</Text>
            <Text x={side.x + 16} y={side.y + 90} size={12.5} weight={600} font="mono" tone="hot">{fr ? "→ signaler, pas trancher" : "→ surface it, don’t pick"}</Text>
          </g>
        </Box>
      </g>;
    })() : <Tag x={L.conflictTag.x} y={L.conflictTag.y} anchor="end" text={fr ? "⚠ conflit → signalé" : "⚠ conflict → surfaced"} tone="hot" size={12} appear={pop(frame, T.surfaced, 170)} />}

    {/* Authority stays for both tasks. */}
    {fly(AUTHORITY, { x: task.x + 16, y: task.y + (compact ? 30 : 38), w: 120, h: 30 }, slot(0))}
    {frame >= T.unpack && frame < T.unpack + 50 ? <Pulse x={slot(0).x + slot(0).w - 14} y={slot(0).y + slot(0).h / 2} frame={frame} at={T.unpack + 4} period={40} r={7} tone="ok" /> : null}

    {TASKS.map((spec, taskI) => spec.items.map((item, index) => {
      const [nx, ny] = needPos(index);
      const from: Rect = { x: nx - 8, y: ny - 15, w: compact ? 140 : 170, h: 30 };
      return <g key={`${taskI}-${index}`}>{fly(item, from, slot(item.layer), taskI === 0 ? T.unpack : undefined)}</g>;
    }))}

    {/* Two authoritative sources for the same contract. */}
    {(() => {
      const target = slot(2);
      const rivalIn = easeOut(frame, SOURCE_B.at, SOURCE_B.at + 22);
      const hot = frame >= T.clash;
      const aT = ease(frame, SOURCE_A.at, SOURCE_A.at + 24);
      const aFrom: Rect = { ...target, x: width + 20 };
      const bTarget = slot(2, "B");
      return <>
        {frame >= SOURCE_A.at ? <g opacity={Math.min(1, aT * 3)}>
          <ItemCard rect={{ ...target, x: lerp(aFrom.x, target.x, aT) }} item={SOURCE_A} locale={locale} tone={hot ? "hot" : aT >= 1 ? "ok" : "line"} focus={hot ? .6 : aT >= 1 ? during(frame, SOURCE_A.at + 22, SOURCE_A.at + 44, 8) : .5} compact={compact} />
        </g> : null}
        {rivalIn > 0 ? <g opacity={rivalIn}>
          <ItemCard rect={{ ...bTarget, x: lerp(width + 20, bTarget.x, rivalIn) }} item={SOURCE_B} locale={locale} tone={hot ? "hot" : "line"} focus={hot ? .6 : .3} compact={compact} />
        </g> : null}
        {hot ? <g transform={`translate(${clashX} ${contractsY}) scale(${.5 + .5 * clash})`}>
          <circle r={12} style={{ fill: "var(--scene-card)" }} stroke={TONE.hot} strokeWidth={1.5} className="scene-glow" />
          <Text x={0} y={1} size={15} weight={700} font="mono" tone="hot" anchor="middle">≠</Text>
        </g> : null}
        {hot && frame < T.clash + 90 ? <Pulse x={clashX} y={contractsY} frame={frame} at={T.clash} period={45} r={12} tone="hot" /> : null}
      </>;
    })()}
    <Comet points={surfacePath} t={ease(frame, T.surface, T.surfaced)} tone="hot" r={6} tail={.25} />
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 30,
  title: { en: "One stack, packed per task", fr: "Une pile, remplie selon la tâche" },
  caption: {
    en: "Every item must justify its presence, authority and validity period. The order is the priority; the task decides what is packed; conflicts between authoritative sources are surfaced.",
    fr: "Chaque élément doit justifier sa présence, son autorité et sa durée de validité. L’ordre fixe la priorité, la tâche décide du contenu, et les conflits entre sources d’autorité sont signalés.",
  },
  beats: [
    { at: 0, text: { en: "The working context is a stack in priority order: authority, state, contracts, history, evidence.", fr: "Le contexte est une pile ordonnée par priorité : autorité, état, contrats, historique, preuves." } },
    { at: T.pr, text: { en: "A PR review needs the diff and review conventions. Nothing else earns a place: those layers stay empty.", fr: "Une revue de PR demande le diff et les conventions de revue. Rien d’autre ne justifie sa place." } },
    { at: T.unpack, text: { en: "Same stack, other task: an incident needs a timeline, logs and deployment state.", fr: "Même pile, autre tâche : un incident demande chronologie, logs et état du déploiement." } },
    { at: T.conflict, text: { en: "Two authoritative sources disagree. The agent surfaces the conflict instead of picking one.", fr: "Deux sources faisant autorité se contredisent : l’agent signale le conflit au lieu de trancher." } },
  ],
  Stage,
});
