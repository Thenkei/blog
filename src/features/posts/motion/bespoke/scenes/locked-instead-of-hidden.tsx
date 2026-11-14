import { Box, Checkpoint, Comet, dim, ease, easeOut, enter, lerp, NBSP, pop, Pulse, Tag, tagWidth, Text, textWidth, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// The same back-office page drawn twice at identical positions, for a user who
// lacks a write permission and the right to read one section. Under the current
// rule the button and the section are not rendered. Under the proposed rule they
// keep their place, locked, and a read-only notice names the group. The server
// checks the permission and refuses the call under both rules.
// Permission, group, page and section names are invented, as in the article.
const T = {
  user: 60,
  hideButton: 78,
  hideSection: 132,
  lock: 204,
  lockButton: 222,
  notice: 276,
  restrict: 306,
  server: 366,
  callA: 376,
  refuseA: 400,
  callB: 396,
  refuseB: 420,
  recap: 446,
  end: 540,
} as const;

type Rect = { x: number; y: number; w: number; h: number };
type Rule = "current" | "proposed";

type Copy = {
  rule: Record<Rule, string>;
  user: string;
  page: string;
  save: string;
  details: string;
  billing: string;
  notRendered: string;
  sectionAbsent: string;
  notice: { lead: string; before: string; group: string; after: string };
  restricted: string;
  group: string;
  server: string;
  checks: string;
  everyCall: string;
  callRefused: string;
  refused: string;
};

const COPY: Record<SceneStageProps["locale"], Copy> = {
  fr: {
    rule: { current: "règle actuelle", proposed: "règle proposée" },
    user: "utilisateur sans orders.edit",
    page: "Commande",
    save: "Enregistrer",
    details: "Détails",
    billing: "Facturation",
    notRendered: "non rendu",
    sectionAbsent: "section absente",
    notice: { lead: "Lecture seule.", before: "Les modifications sont réservées au groupe ", group: "Opérations", after: "." },
    restricted: "Accès restreint",
    group: "groupe Opérations",
    server: "serveur",
    checks: "vérifie la permission",
    everyCall: "à chaque appel",
    callRefused: "✗ appel refusé",
    refused: "✗ refusé",
  },
  en: {
    rule: { current: "current rule", proposed: "proposed rule" },
    user: "user without orders.edit",
    page: "Order",
    save: "Save",
    details: "Details",
    billing: "Billing",
    notRendered: "not rendered",
    sectionAbsent: "section absent",
    notice: { lead: "Read-only.", before: "Changes are reserved for the ", group: "Operations", after: " group." },
    restricted: "Restricted access",
    group: "Operations group",
    server: "server",
    checks: "checks the permission",
    everyCall: "on every call",
    callRefused: "✗ call refused",
    refused: "✗ refused",
  },
};

// Offsets inside one page. Both pages share them, so the rule is the only difference.
type PageGeometry = {
  pad: number;
  eyebrowY: number;
  chromeY: number;
  titleY: number;
  buttonY: number;
  /** One line when the page is wide enough, two otherwise. */
  notice: { y: number; h: number; lines: readonly number[] };
  cardsY: number;
  cardH: number;
  detailsW: number;
  gap: number;
  rows: readonly number[];
  /** "Restricted access" block, relative to the section card. */
  block: { y: number; h: number; lines: readonly number[] };
};

const BUTTON = { w: 140, h: 28 } as const;

const WIDE_PAGE: PageGeometry = {
  pad: 18, eyebrowY: 15, chromeY: 28, titleY: 47, buttonY: 33,
  notice: { y: 66, h: 23, lines: [78] },
  cardsY: 96, cardH: 62, detailsW: 200, gap: 16, rows: [36, 50],
  block: { y: 27, h: 27, lines: [41] },
};

const COMPACT_PAGE: PageGeometry = {
  pad: 16, eyebrowY: 14, chromeY: 26, titleY: 44, buttonY: 30,
  notice: { y: 62, h: 42, lines: [75, 92] },
  cardsY: 110, cardH: 72, detailsW: 180, gap: 12, rows: [38, 54],
  block: { y: 26, h: 40, lines: [38, 55] },
};

const WIDE_LAYOUT = {
  pages: [{ x: 40, y: 54, w: 600, h: 168 }, { x: 40, y: 234, w: 600, h: 168 }],
  server: { x: 680, y: 54, w: 240, h: 348 },
} as const satisfies { pages: readonly [Rect, Rect]; server: Rect };

const COMPACT_LAYOUT = {
  pages: [{ x: 20, y: 50, w: 500, h: 190 }, { x: 20, y: 248, w: 500, h: 190 }],
  server: { x: 20, y: 448, w: 500, h: 62 },
} as const satisfies { pages: readonly [Rect, Rect]; server: Rect };

/** Padlock glyph centred on (x, y): the lock is a shape, not only a colour. */
function Lock({ x, y, tone = "hot", scale = 1 }: { x: number; y: number; tone?: Tone; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M-3.2 -1.5V-4a3.2 3.2 0 0 1 6.4 0V-1.5" fill="none" stroke={TONE[tone]} strokeWidth={1.6} strokeLinecap="round" />
    <rect x={-5.5} y={-1.5} width={11} height={8.5} rx={2} fill={TONE[tone]} />
  </g>;
}

/** Placeholder content of a section: two label/value rows, no invented data. */
function Skeleton({ x, y, rows, opacity = 1 }: { x: number; y: number; rows: readonly number[]; opacity?: number }) {
  if (opacity <= 0) return null;
  return <g opacity={opacity}>
    {rows.map((row, index) => <g key={row}>
      <rect x={x} y={y + row - 3} width={42} height={6} rx={3} style={{ fill: tint("ink", 12) }} />
      <rect x={x + 54} y={y + row - 3} width={index === 0 ? 88 : 62} height={6} rx={3} style={{ fill: tint("ink", 20) }} />
    </g>)}
  </g>;
}

/** Where an element used to be: the scene's annotation, the page itself shows nothing. */
function Missing({ rect, label, appear, radius }: { rect: Rect; label: string; appear: number; radius: number }) {
  if (appear <= 0) return null;
  return <g opacity={appear}>
    <rect
      x={rect.x + .5} y={rect.y + .5} width={rect.w - 1} height={rect.h - 1} rx={radius}
      style={{ fill: tint("danger", 5) }} stroke={TONE.danger} strokeOpacity={.7} strokeWidth={1.25} strokeDasharray="4 5"
    />
    <Text x={rect.x + rect.w / 2} y={rect.y + rect.h / 2 + .5} size={13} weight={600} font="mono" tone="danger" anchor="middle">{label}</Text>
  </g>;
}

function Page({ frame, compact, c, rect, rule, index, opacity }: {
  frame: number;
  compact: boolean;
  c: Copy;
  rect: Rect;
  rule: Rule;
  index: number;
  opacity: number;
}) {
  const G = compact ? COMPACT_PAGE : WIDE_PAGE;
  const { x, y, w, h } = rect;
  const proposed = rule === "proposed";
  const start = index * 6;

  const button: Rect = { x: x + w - G.pad - BUTTON.w, y: y + G.buttonY, w: BUTTON.w, h: BUTTON.h };
  const details: Rect = { x: x + G.pad, y: y + G.cardsY, w: G.detailsW, h: G.cardH };
  const billing: Rect = { x: details.x + details.w + G.gap, y: y + G.cardsY, w: w - 2 * G.pad - details.w - G.gap, h: G.cardH };
  const buttonMid = button.y + button.h / 2;

  // Current rule: the two guarded elements leave the page. Proposed rule: they lock in place.
  const userAt = proposed ? T.lock : T.user;
  const buttonGone = proposed ? 0 : ease(frame, T.hideButton, T.hideButton + 14);
  const buttonSlot = proposed ? 0 : easeOut(frame, T.hideButton + 8, T.hideButton + 26);
  const buttonLocked = proposed ? ease(frame, T.lockButton, T.lockButton + 12) : 0;
  const sectionGone = proposed ? 0 : ease(frame, T.hideSection, T.hideSection + 14);
  const sectionSlot = proposed ? 0 : easeOut(frame, T.hideSection + 8, T.hideSection + 26);
  const restricted = proposed ? ease(frame, T.restrict, T.restrict + 12) : 0;
  const enabled = (1 - buttonGone) * (1 - buttonLocked);
  const lockScale = frame >= T.lockButton + 4 ? .6 + .4 * pop(frame, T.lockButton + 4) : .6;

  const noticeLines = G.notice.lines.length === 1
    ? [{ before: `${c.notice.lead} ${c.notice.before}`, group: c.notice.group, after: c.notice.after }]
    : [{ before: c.notice.lead, group: "", after: "" }, { before: c.notice.before, group: c.notice.group, after: c.notice.after }];

  return <g {...enter(frame, start, { opacity })}>
    <Box x={x} y={y} w={w} h={h} tone="muted" radius={16} />
    <Text x={x + G.pad} y={y + G.eyebrowY} size={11} font="mono" weight={600} tone="muted" caps>{c.rule[rule]}</Text>
    {frame >= userAt ? <g {...enter(frame, userAt, { dur: 14, distance: 8, from: "right" })}>
      <Text x={x + w - G.pad} y={y + G.eyebrowY} size={13} font="mono" weight={500} tone="muted" anchor="end">{c.user}</Text>
    </g> : null}
    <line x1={x + 1} x2={x + w - 1} y1={y + G.chromeY} y2={y + G.chromeY} style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1} />

    {/* Page header: title on the left, the write button on the right. */}
    <g {...enter(frame, start + 8, { dur: 14, distance: 8 })}>
      <Text x={x + G.pad} y={y + G.titleY} size={17} weight={650}>{c.page}</Text>
    </g>
    <g {...enter(frame, start + 12, { dur: 14, distance: 8 })}>
      {enabled > 0 ? <g opacity={enabled}>
        <rect x={button.x} y={button.y} width={button.w} height={button.h} rx={8} style={{ fill: tint("line", 14) }} stroke={TONE.line} strokeOpacity={.5} strokeWidth={1} />
        <Text x={button.x + button.w / 2} y={buttonMid + .5} size={14} weight={600} tone="line" anchor="middle">{c.save}</Text>
      </g> : null}
      {buttonLocked > 0 ? <g opacity={buttonLocked}>
        <rect x={button.x} y={button.y} width={button.w} height={button.h} rx={8} style={{ fill: tint("ink", 5) }} stroke={TONE.hot} strokeOpacity={.6} strokeWidth={1} />
        <Lock x={button.x + 15} y={buttonMid} scale={lockScale} />
        <Text x={button.x + button.w / 2} y={buttonMid + .5} size={14} weight={600} tone="muted" anchor="middle">{c.save}</Text>
      </g> : null}
    </g>
    <Missing rect={button} label={c.notRendered} appear={buttonSlot} radius={8} />
    {!proposed ? <Pulse x={button.x + button.w / 2} y={buttonMid} frame={frame} at={T.hideButton + 8} period={32} r={12} tone="danger" once /> : null}
    {proposed ? <Pulse x={button.x + 15} y={buttonMid} frame={frame} at={T.lockButton + 4} period={32} r={9} tone="hot" once /> : null}

    {/* Read-only notice: the reason, once, as text under the header. */}
    {proposed && frame >= T.notice + 6 ? <g {...enter(frame, T.notice + 6, { dur: 16, distance: 8, from: "down" })}>
      <rect
        x={x + G.pad} y={y + G.notice.y} width={w - 2 * G.pad} height={G.notice.h} rx={7}
        style={{ fill: tint("hot", 10) }} stroke={TONE.hot} strokeOpacity={.35} strokeWidth={1}
      />
      {noticeLines.map((line, k) => <Text key={k} x={x + G.pad + 12} y={y + G.notice.lines[k]!} size={14} weight={550} font="main">
        {line.before}
        {line.group ? <tspan style={{ fill: TONE.hot, fontWeight: 750 }}>{line.group}</tspan> : null}
        {line.after}
      </Text>)}
    </g> : null}

    {/* The section the user can read. */}
    <g {...enter(frame, start + 16, { dur: 14, distance: 8 })}>
      <Box x={details.x} y={details.y} w={details.w} h={details.h} tone="muted" radius={10} variant="ghost" />
      <Text x={details.x + 12} y={details.y + 16} size={13.5} weight={600}>{c.details}</Text>
      <Skeleton x={details.x + 12} y={details.y} rows={G.rows} />
    </g>

    {/* The section the user cannot read: gone, or kept with its title and a block. */}
    {sectionGone < 1 ? <g {...enter(frame, start + 20, { dur: 14, distance: 8, opacity: 1 - sectionGone })}>
      <Box x={billing.x} y={billing.y} w={billing.w} h={billing.h} tone="muted" radius={10} variant="ghost" />
      <Text x={billing.x + 12} y={billing.y + 16} size={13.5} weight={600}>{c.billing}</Text>
      <Skeleton x={billing.x + 12} y={billing.y} rows={G.rows} opacity={1 - restricted} />
      {proposed && frame >= T.restrict + 6 ? <g {...enter(frame, T.restrict + 6, { dur: 16, distance: 6 })}>
        <rect
          x={billing.x + 10} y={billing.y + G.block.y} width={billing.w - 20} height={G.block.h} rx={7}
          style={{ fill: tint("hot", 10) }} stroke={TONE.hot} strokeOpacity={.35} strokeWidth={1}
        />
        <Lock x={billing.x + 25} y={billing.y + G.block.lines[0]! - .5} />
        <Text x={billing.x + 40} y={billing.y + G.block.lines[0]!} size={13.5} weight={650} tone="hot">{c.restricted}</Text>
        {G.block.lines.length === 1
          ? <Text x={billing.x + billing.w - 22} y={billing.y + G.block.lines[0]!} size={13} weight={550} font="main" anchor="end">{c.group}</Text>
          : <Text x={billing.x + 40} y={billing.y + G.block.lines[1]!} size={13} weight={550} font="main">{c.group}</Text>}
      </g> : null}
    </g> : null}
    <Missing rect={billing} label={c.sectionAbsent} appear={sectionSlot} radius={10} />
    {!proposed ? <Pulse x={billing.x + billing.w / 2} y={billing.y + billing.h / 2} frame={frame} at={T.hideSection + 8} period={32} r={14} tone="danger" once /> : null}
    {proposed ? <Pulse x={billing.x + 25} y={billing.y + G.block.lines[0]!} frame={frame} at={T.restrict + 8} period={32} r={9} tone="hot" once /> : null}
  </g>;
}

function Stage({ frame, compact, locale }: SceneStageProps) {
  const c = COPY[locale];
  const L = compact ? COMPACT_LAYOUT : WIDE_LAYOUT;
  const S = L.server;

  // One page holds the stage at a time; the server takes over for the last act,
  // then everything comes back for the recap.
  const serverAct = ease(frame, T.server, T.server + 16) - ease(frame, T.recap, T.recap + 20);
  const pageOpacity = [
    dim(ease(frame, T.lock, T.lock + 16) - ease(frame, T.recap, T.recap + 20), .5),
    dim(ease(frame, T.user, T.user + 16) - ease(frame, T.lock - 6, T.lock + 10) + serverAct, .5),
  ] as const;
  const serverOpacity = lerp(.55, 1, ease(frame, T.server - 6, T.server + 10));
  const calls = [
    { rule: "current", at: T.callA, refused: T.refuseA, y: L.pages[0].y + L.pages[0].h / 2 },
    { rule: "proposed", at: T.callB, refused: T.refuseB, y: L.pages[1].y + L.pages[1].h / 2 },
  ] as const;
  const checkY = S.y + S.h / 2;
  const eyebrowW = textWidth(c.server, 11) + c.server.length * 1.3;

  return <g>
    <Page frame={frame} compact={compact} c={c} rect={L.pages[0]} rule="current" index={0} opacity={pageOpacity[0]} />
    <Page frame={frame} compact={compact} c={c} rect={L.pages[1]} rule="proposed" index={1} opacity={pageOpacity[1]} />

    {/* The server: the same check under both rules. */}
    <g {...enter(frame, 14, { opacity: serverOpacity })}>
      <Box x={S.x} y={S.y} w={S.w} h={S.h} tone="hot" radius={16} focus={serverAct} />
      <Text x={S.x + (compact ? 16 : 18)} y={S.y + (compact ? 17 : 20)} size={11} font="mono" weight={600} tone="hot" caps>{c.server}</Text>

      {compact
        ? <>
          <Text x={S.x + 16 + eyebrowW + 12} y={S.y + 17.5} size={13.5} weight={600}>{`${c.checks} ${c.everyCall}`}</Text>
          {calls.map((call, k) => {
            const labelX = k === 0 ? S.x + 16 : S.x + S.w / 2 + 6;
            const tagX = labelX + textWidth(c.rule[call.rule], 13) + 8;
            return <g key={call.rule}>
              <Text x={labelX} y={S.y + 43} size={13} font="mono" weight={500} tone="muted">{c.rule[call.rule]}</Text>
              <Tag x={tagX} y={S.y + 43} anchor="start" text={c.refused} tone="hot" size={12.5} appear={frame >= call.refused ? pop(frame, call.refused) : 0} />
              <Pulse x={tagX + tagWidth(c.refused, 12.5) / 2} y={S.y + 43} frame={frame} at={call.refused} period={32} r={14} tone="hot" once />
            </g>;
          })}
        </>
        : <>
          <Checkpoint x={S.x + S.w / 2} y={checkY - 30} state="pending" r={11} />
          <Text x={S.x + S.w / 2} y={checkY} size={15.5} weight={600} anchor="middle">{c.checks}</Text>
          <Text x={S.x + S.w / 2} y={checkY + 22} size={13} font="mono" weight={500} tone="muted" anchor="middle">{c.everyCall}</Text>
          {calls.map((call) => <g key={call.rule}>
            <Tag x={S.x + S.w / 2} y={call.y} text={c.callRefused} tone="hot" size={13} appear={frame >= call.refused ? pop(frame, call.refused) : 0} />
            <Pulse x={S.x + S.w / 2} y={call.y} frame={frame} at={call.refused} period={32} r={18} tone="hot" once />
          </g>)}
        </>}
    </g>

    {/* Wide only: each page's call travels to the server. */}
    {!compact ? calls.map((call, k) => {
      const from = L.pages[k]!.x + L.pages[k]!.w;
      return <g key={call.rule}>
        <line x1={from + 4} x2={S.x - 4} y1={call.y} y2={call.y} style={{ stroke: "var(--scene-hairline)" }} strokeWidth={1.25} opacity={enter(frame, 18).opacity} />
        <Comet points={[[from + 2, call.y], [S.x + 20, call.y]]} t={ease(frame, call.at, call.refused)} tone="hot" r={5} tail={.4} />
      </g>;
    }) : null}
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.recap + 44,
  title: { fr: "La même page sous deux règles", en: "The same page under two rules" },
  caption: {
    fr: "Un utilisateur sans la permission, la même page aux mêmes positions. La pull request propose de garder le bouton et la section à leur place, verrouillés, avec le nom du groupe qui détient la permission. Le serveur vérifie la permission dans les deux cas. Les noms sont inventés pour l'article.",
    en: "One user without the permission, the same page at the same positions. The pull request proposes keeping the button and the section in place, locked, with the name of the group that holds the permission. The server checks the permission either way. The names are made up for the article.",
  },
  beats: [
    { at: 0, text: { fr: `La même page du back office, deux fois${NBSP}: un bouton d'écriture et deux sections.`, en: "The same back-office page, twice: one write button and two sections." } },
    { at: T.user, text: { fr: `Un utilisateur sans orders.edit ouvre la page. Règle actuelle${NBSP}: le bouton d'écriture n'est pas rendu.`, en: "A user without orders.edit opens the page. Current rule: the write button is not rendered." } },
    { at: T.hideSection - 6, text: { fr: "La section qu'il n'a pas le droit de lire disparaît aussi. La page a des morceaux en moins, sans explication.", en: "The section they are not allowed to read disappears too. The page has pieces missing and no explanation." } },
    { at: T.lock, text: { fr: `Règle proposée, même page${NBSP}: le bouton reste à sa place, désactivé, avec un cadenas.`, en: "Proposed rule, same page: the button stays in place, disabled, with a lock." } },
    { at: T.notice, text: { fr: `Une notice de lecture seule nomme le groupe Opérations. La section garde sa place, en accès restreint.`, en: "A read-only notice names the Operations group. The section keeps its place, with restricted access." } },
    { at: T.server, text: { fr: "Le verrouillage est de l'affichage. Dans les deux cas, le serveur vérifie la permission et refuse l'appel.", en: "Locking is display. Either way, the server checks the permission and refuses the call." } },
  ],
  Stage,
});
