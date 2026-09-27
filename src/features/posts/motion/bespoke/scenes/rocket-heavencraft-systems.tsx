import { useId } from "react";
import { Boundary, Box, Camera, Comet, Counter, dim, ease, easeOut, enter, hash, lerp, pop, Pulse, stagger, Tag, Text, tint, TONE, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// The audience of the code widens like orbits: my computer (Dofus bots, one
// user) → friends (a handful) → HeavenCraft (thousands). Then, inside that
// shared environment, one new feature ripples through minigames, worlds and the
// land economy, and players react on the outer orbit. Figures are the article's
// orders of magnitude, quoted from memory, and the stage says so.

const T = {
  friends: 64,
  heaven: 136,
  stats: [156, 172, 188] as const,
  reflow: 244,
  games: 256,
  worlds: 266,
  plots: 276,
  feature: 326,
  pulse: 346,
  reactions: 384,
  end: 540,
} as const;

type Pt = readonly [number, number];
type Rect = { x: number; y: number; w: number; h: number };

type Layout = {
  centre: Pt; r2: number; r3: number; card: { w: number; h: number };
  statBig: (index: number) => Pt; statSmall: (index: number) => Pt; bigSize: number; smallSize: number;
  panel: Rect; minigames: Rect; worlds: Rect; plots: Rect; feature: Rect;
  reactionAngles: readonly number[]; note: Pt; subLines: boolean;
};

const WIDE_L: Layout = {
  centre: [236, 232], r2: 112, r3: 168, card: { w: 180, h: 56 },
  statBig: (index) => [512, 150 + index * 74], statSmall: (index) => [512 + index * 140, 80], bigSize: 30, smallSize: 20,
  panel: { x: 490, y: 132, w: 430, h: 262 },
  minigames: { x: 512, y: 160, w: 386, h: 78 },
  feature: { x: 600, y: 254, w: 210, h: 44 },
  worlds: { x: 512, y: 316, w: 184, h: 56 },
  plots: { x: 714, y: 316, w: 184, h: 56 },
  reactionAngles: [-40, 34, 146, -146], note: [920, 40], subLines: true,
};

const COMPACT_L: Layout = {
  centre: [270, 166], r2: 80, r3: 118, card: { w: 156, h: 48 },
  statBig: (index) => [30 + index * 166, 316], statSmall: (index) => [30 + index * 166, 316], bigSize: 20, smallSize: 20,
  panel: { x: 16, y: 358, w: 508, h: 156 },
  minigames: { x: 30, y: 380, w: 252, h: 76 },
  feature: { x: 30, y: 466, w: 480, h: 36 },
  worlds: { x: 294, y: 380, w: 216, h: 34 },
  plots: { x: 294, y: 422, w: 216, h: 34 },
  reactionAngles: [-30, 38, 142, -150], note: [520, 40], subLines: false,
};

function copy(fr: boolean) {
  return {
    local: fr ? "Mon ordi" : "My computer",
    bots: fr ? "bots Dofus · 14–15 ans" : "Dofus bots · age 14–15",
    botsShort: fr ? "bots Dofus" : "Dofus bots",
    me: fr ? "1 utilisateur : moi" : "1 user: me",
    friends: fr ? "amis · une poignée" : "friends · a handful",
    love: fr ? "applis « je t’aime »" : "“I love you” apps",
    games: fr ? "petits jeux" : "small games",
    heaven: "HeavenCraft",
    env: fr ? "HeavenCraft · environnement partagé" : "HeavenCraft · shared environment",
    note: fr ? "chiffres de mémoire" : "figures from memory",
    minigames: fr ? "Mini-jeux" : "Minigames",
    minigamesA: "Dé à Coudre · Battle Royale",
    minigamesB: "PvP 4v4 · 6v6 · 8v8",
    worlds: fr ? "Plusieurs mondes" : "Several worlds",
    plots: fr ? "Terres & parcelles" : "Land & plots",
    plotsSub: fr ? "via l’économie" : "via the economy",
    feature: fr ? "+ Nouvelle fonctionnalité" : "+ New feature",
    reactions: fr ? ["utilisée", "contournée", "comprise de travers", "adoptée"] : ["used", "worked around", "misunderstood", "adopted"],
    statLabels: fr ? ["en même temps", "actifs, certaines sem.", "accueillis au total"] : ["online at once", "active, some weeks", "welcomed in total"],
    thousands: (value: number) => fr ? value.toLocaleString("fr-FR").replace(/\s/g, " ") : value.toLocaleString("en-US"),
  };
}

const REACTION_TONES: readonly Tone[] = ["line", "hot", "danger", "ok"];
const PLAYERS = 76;

function Stage({ frame, compact, locale, width, height }: SceneStageProps) {
  const fr = locale === "fr";
  const c = copy(fr);
  const uid = useId().replaceAll(":", "");
  const L = compact ? COMPACT_L : WIDE_L;
  // Wide: the orbits start centre stage and slide left when the scale changes.
  const slide = compact ? 1 : ease(frame, T.heaven - 26, T.heaven + 22);
  const cx = lerp(compact ? L.centre[0] : width / 2, L.centre[0], slide);
  const cy = L.centre[1];
  const polar = (radius: number, degrees: number): [number, number] => [cx + radius * Math.cos(degrees * Math.PI / 180), cy + radius * Math.sin(degrees * Math.PI / 180)];

  const ring2 = easeOut(frame, T.friends - 6, T.friends + 30);
  const ring3 = easeOut(frame, T.heaven - 6, T.heaven + 36);
  const localRecede = dim(ease(frame, T.friends + 10, T.friends + 40), .55);
  const friendsRecede = dim(ease(frame, T.heaven + 10, T.heaven + 40), .5);
  const orbitRecede = lerp(1, .6, ease(frame, T.reflow, T.reflow + 30)) + .4 * ease(frame, T.reactions - 10, T.reactions + 20);
  const reflow = ease(frame, T.reflow - 10, T.reflow + 24);

  // The code leaves each circle as a comet, outward.
  const legA: [Pt, Pt] = [polar(L.card.w / 2 - 4, -28), polar(L.r2, -28)];
  const legB: [Pt, Pt] = [polar(L.r2, -28), polar(L.r3, -28)];

  // Feature wave inside the environment.
  const f = L.feature;
  const fc: Pt = [f.x + f.w / 2, f.y + f.h / 2];
  const featureIn = easeOut(frame, T.feature, T.feature + 20);
  const targets = [L.minigames, L.worlds, L.plots].map((rect, index) => {
    const anchor: Pt = compact
      ? index === 0 ? [rect.x + rect.w / 2, rect.y + rect.h] : [rect.x + rect.w / 2, rect.y + rect.h]
      : index === 0 ? [rect.x + rect.w / 2, rect.y + rect.h] : [rect.x + rect.w / 2, rect.y];
    const from: Pt = compact ? [index === 0 ? fc[0] - 120 : fc[0] + 130, f.y] : index === 0 ? [fc[0], f.y] : [index === 1 ? f.x + 30 : f.x + f.w - 30, f.y + f.h];
    return { rect, from, anchor, hit: T.pulse + 12 + index * 6 };
  });

  const reactionPoints = L.reactionAngles.map((angle) => polar(L.r3, angle));
  const reactionLaunch = (index: number) => T.reactions + index * 10;

  const camera = compact ? [{ at: 0 }] : [
    { at: 0, zoom: 1.05 },
    { at: T.heaven - 20, dur: 60, zoom: 1 },
    { at: T.reflow, dur: 50, zoom: 1.04, focus: [lerp(width / 2, fc[0], .35), lerp(height / 2, fc[1], .3)] as Pt },
    { at: T.reactions, dur: 60, zoom: 1 },
  ];

  const sysCard = (rect: Rect, title: string, lines: readonly string[], appearAt: number, hitAt: number) => {
    const hit = frame >= hitAt ? pop(frame, hitAt, 170) : 0;
    const glow = hit > 0 ? Math.min(1, hit) * (1 - ease(frame, hitAt + 24, hitAt + 60)) : 0;
    const appear = easeOut(frame, appearAt, appearAt + 18);
    if (appear <= 0) return null;
    const single = lines.length === 0;
    return <g {...enter(frame, appearAt, { distance: 10 })}>
      <Box x={rect.x} y={rect.y} w={rect.w} h={rect.h} tone={glow > .05 ? "hot" : "line"} focus={glow} fill={glow * .6} radius={12} />
      <Text x={rect.x + 16} y={single ? rect.y + rect.h / 2 : rect.y + 20} size={compact ? 15 : 17} weight={600}>{title}</Text>
      {lines.map((line, index) => <Text key={line} x={rect.x + 16} y={rect.y + (compact ? 40 : 44) + index * (compact ? 18 : 19)} size={13} weight={500} font="mono" tone="muted">{line}</Text>)}
    </g>;
  };

  return <Camera frame={frame} keys={camera} width={width} height={height}>
    <defs>
      <radialGradient id={`${uid}-core`} cx=".5" cy=".5" r=".5">
        <stop offset="0" style={{ stopColor: TONE.line, stopOpacity: .22 }} />
        <stop offset="1" style={{ stopColor: TONE.line, stopOpacity: 0 }} />
      </radialGradient>
      <clipPath id={`${uid}-panel`}><rect x={L.panel.x} y={L.panel.y} width={L.panel.w} height={L.panel.h} rx={22} /></clipPath>
    </defs>

    {/* ── Orbits of audience ─────────────────────────────────────────────── */}
    <g opacity={orbitRecede}>
      <g className="scene-only-rocket">
        <circle cx={cx} cy={cy} r={L.r2 * .9} fill={`url(#${uid}-core)`} />
        {ring3 > 0 ? (() => {
          const [sx, sy] = polar(L.r3 + 12, frame * .5 - 90);
          return <circle cx={sx} cy={sy} r={2} style={{ fill: "var(--scene-ink)" }} opacity={.6 * ring3} />;
        })() : null}
      </g>
      <circle cx={cx} cy={cy} r={L.r2} fill="none" stroke="var(--scene-hairline)" strokeWidth={1.25} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ring2} transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={L.r3} fill="none" stroke={TONE.hot} strokeOpacity={.55} strokeWidth={1.25} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ring3} transform={`rotate(-90 ${cx} ${cy})`} />
      {ring3 > 0 ? <circle cx={cx} cy={cy} r={L.r3} style={{ fill: tint("hot", 3 * ring3) }} /> : null}

      {/* Players: a handful on the friends' orbit, then thousands on HeavenCraft's. */}
      {Array.from({ length: 5 }, (_, index) => {
        const born = easeOut(frame, stagger(index, T.friends + 8, 5), stagger(index, T.friends + 8, 5) + 14);
        if (born <= 0) return null;
        const [x, y] = polar(L.r2, index * 72 + 20 + frame * .35);
        return <circle key={index} cx={x} cy={y} r={3.4} fill={TONE.line} opacity={born * friendsRecede} />;
      })}
      {Array.from({ length: PLAYERS }, (_, index) => {
        const start = T.heaven + 12 + index * 1.1;
        const born = easeOut(frame, start, start + 16);
        if (born <= 0) return null;
        const radius = L.r3 + (hash(index + 50) - .5) * (compact ? 22 : 30);
        const angle = hash(index) * 360 + frame * (.12 + hash(index + 9) * .14);
        const [x, y] = polar(lerp(L.r2 + 10, radius, born), angle);
        return <circle key={index} cx={x} cy={y} r={1.8 + hash(index + 77) * 1.6} fill={TONE.line} opacity={born * (.4 + .45 * hash(index + 31))} />;
      })}

      {/* Circle labels ride on their orbits. */}
      <g opacity={ring2 * friendsRecede}>
        <Tag x={cx} y={cy - L.r2} text={c.friends} tone="line" size={compact ? 11 : 12} />
        <g opacity={1 - ease(frame, T.heaven + 20, T.heaven + 50)}>
        <Tag x={polar(L.r2, compact ? 215 : 205)[0]} y={polar(L.r2, compact ? 215 : 205)[1]} text={c.love} tone="muted" size={compact ? 11 : 12} appear={pop(frame, T.friends + 20)} />
        <Tag x={polar(L.r2, compact ? -35 : -25)[0]} y={polar(L.r2, compact ? -35 : -25)[1]} text={c.games} tone="muted" size={compact ? 11 : 12} appear={pop(frame, T.friends + 28)} />
        </g>
      </g>
      <Tag x={cx} y={cy - L.r3} text={c.heaven} tone="hot" size={compact ? 12 : 13} appear={pop(frame, T.heaven + 18)} />

      {/* My computer: where it starts. */}
      <g opacity={localRecede}><g {...enter(frame, 0, { distance: 10 })}>
        <Box x={cx - L.card.w / 2} y={cy - L.card.h / 2} w={L.card.w} h={L.card.h} tone="line" label={c.local} sub={compact ? c.botsShort : c.bots} labelSize={compact ? 15 : 16} focus={1 - ease(frame, T.friends - 10, T.friends + 10)} radius={14} />
      </g></g>
      <g opacity={localRecede}>
        <Tag x={cx} y={cy + L.card.h / 2 + (compact ? 14 : 18)} text={c.me} tone="line" size={compact ? 11 : 12} appear={pop(frame, 20)} />
      </g>
    </g>
    <Comet points={legA} t={ease(frame, T.friends - 22, T.friends + 2)} tone="line" tail={.4} />
    <Comet points={legB} t={ease(frame, T.heaven - 22, T.heaven + 2)} tone="hot" tail={.4} />
    {frame >= T.friends && frame < T.friends + 40 ? <Pulse x={legA[1][0]} y={legA[1][1]} frame={frame} at={T.friends} period={40} r={8} tone="line" /> : null}
    {frame >= T.heaven && frame < T.heaven + 40 ? <Pulse x={legB[1][0]} y={legB[1][1]} frame={frame} at={T.heaven} period={40} r={8} tone="hot" /> : null}

    {/* ── Scale: three orders of magnitude, then they re-flow into a row ─── */}
    {c.statLabels.map((label, index) => {
      const at = T.stats[index]!;
      const [bx, by] = L.statBig(index);
      const [sx, sy] = L.statSmall(index);
      const x = lerp(bx, sx, reflow);
      const y = lerp(by, sy, reflow);
      const size = lerp(L.bigSize, L.smallSize, reflow);
      const value = index === 0
        ? <Text x={x} y={y} size={size} weight={600} font="mono" tone="ok">100–200</Text>
        : <Counter x={x} y={y} size={size} weight={600} font="mono" tone="ok" frame={frame} from={0} to={index === 1 ? 1000 : 35000} start={at} end={at + 34} format={(v) => `${c.thousands(Math.round(v / (index === 1 ? 10 : 100)) * (index === 1 ? 10 : 100))}+`} />;
      return <g key={label} {...enter(frame, at, { distance: 10 })}>
        {value}
        <Text x={x} y={y + size * .55 + 12} size={13} weight={500} font="main" tone="muted">{label}</Text>
      </g>;
    })}
    <g opacity={easeOut(frame, T.stats[2] + 20, T.stats[2] + 40)}>
      <Text x={L.note[0]} y={L.note[1]} size={11} weight={600} font="mono" tone="muted" anchor="end" caps>{c.note}</Text>
    </g>

    {/* ── Inside: systems that must coexist in one living environment ───── */}
    <Boundary {...L.panel} label={c.env} tone="hot" appear={easeOut(frame, T.reflow + 4, T.reflow + 24)} />
    {/* Links: rules, spaces and the economy touch each other. */}
    {targets.map(({ from, anchor }, index) => {
      const draw = easeOut(frame, T.feature + 6 + index * 4, T.feature + 26 + index * 4);
      return draw > 0 ? <path key={index} d={`M${from[0]} ${from[1]}L${anchor[0]} ${anchor[1]}`} fill="none" stroke={frame >= T.pulse && frame < T.reactions + 30 ? TONE.hot : "var(--scene-hairline)"} strokeOpacity={frame >= T.pulse ? .7 : 1} strokeWidth={1.25} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} /> : null;
    })}
    {sysCard(L.minigames, c.minigames, L.subLines ? [c.minigamesA, c.minigamesB] : [c.minigamesA, c.minigamesB], T.games, targets[0]!.hit)}
    {sysCard(L.worlds, c.worlds, [], T.worlds, targets[1]!.hit)}
    {sysCard(L.plots, c.plots, L.subLines ? [c.plotsSub] : [], T.plots, targets[2]!.hit)}

    {/* Ripple: the new feature changes the shared environment. */}
    <g clipPath={`url(#${uid}-panel)`}>
      {[0, 1, 2].map((ring) => {
        const t = ease(frame, T.pulse + ring * 8, T.pulse + ring * 8 + 44, (v) => 1 - (1 - v) ** 2);
        return t > 0 && t < 1 ? <ellipse key={ring} cx={fc[0]} cy={fc[1]} rx={f.w / 2 + t * 240} ry={f.h / 2 + t * 150} fill="none" stroke={TONE.hot} strokeWidth={1.25} opacity={(1 - t) * .6} /> : null;
      })}
    </g>
    {targets.map(({ from, anchor, hit }, index) => <Comet key={index} points={[from, anchor]} t={ease(frame, T.pulse, hit)} tone="hot" r={4.5} tail={.5} />)}
    <g {...enter(frame, T.feature, { from: "left", distance: 26 })}>
      <Box x={f.x} y={f.y} w={f.w} h={f.h} tone="hot" focus={featureIn * (1 - ease(frame, T.reactions + 40, T.reactions + 70))} radius={12}>
        <Text x={fc[0]} y={fc[1]} size={compact ? 15 : 16} weight={600} anchor="middle">{c.feature}</Text>
      </Box>
    </g>

    {/* Players react, out on the orbit. */}
    {reactionPoints.map((point, index) => {
      const launch = reactionLaunch(index);
      const text = c.reactions[index]!;
      const w = text.length * (compact ? 12 : 13) * .6 + 20;
      const x = Math.max((compact ? 20 : 40) + w / 2, Math.min(width - (compact ? 20 : 40) - w / 2, point[0]));
      const flightFrom: Pt = [fc[0], f.y];
      return <g key={text}>
        <Comet points={[flightFrom, [lerp(flightFrom[0], x, .5), Math.min(flightFrom[1], point[1]) - 30], [x, point[1]]]} t={ease(frame, launch, launch + 22)} tone={REACTION_TONES[index]} r={4} tail={.3} />
        {frame >= launch + 22 && frame < launch + 62 ? <Pulse x={x} y={point[1]} frame={frame} at={launch + 22} period={40} r={10} tone={REACTION_TONES[index]} /> : null}
        <Tag x={x} y={point[1]} text={text} tone={REACTION_TONES[index]} appear={pop(frame, launch + 20)} size={compact ? 12 : 13} />
      </g>;
    })}
  </Camera>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: T.end - 1,
  title: { en: "Code that left my computer", fr: "Du code qui quitte mon ordi" },
  caption: {
    en: "Code became a product when real players adopted its rules, worlds and economy.",
    fr: "Le code est devenu un produit quand de vrais joueurs se sont emparés des règles, des mondes et de l’économie.",
  },
  beats: [
    { at: 0, text: { en: "At 14 or 15, the first code is Dofus bots. Its only user is me, on my own computer.", fr: "À 14 ou 15 ans, le premier code, ce sont des bots Dofus. Son seul utilisateur : moi, sur mon ordinateur." } },
    { at: T.friends, text: { en: "Then small projects: silly “I love you” apps, little games with friends. Still a handful of people.", fr: "Puis des petits projets : applis « je t’aime », petits jeux entre amis. Encore une poignée de personnes." } },
    { at: T.heaven, text: { en: "In high school, HeavenCraft changes the scale: 100–200 at once, 1,000+ some weeks, 35,000+ in total.", fr: "Au lycée, HeavenCraft change l’échelle : 100–200 connectés, 1 000+ certaines semaines, 35 000+ au total." } },
    { at: T.reflow, text: { en: "Inside, systems share one living environment: minigames, several worlds, land bought through the economy.", fr: "Dedans, des systèmes partagent un monde vivant : mini-jeux, plusieurs mondes, terres achetées via l’économie." } },
    { at: T.feature, text: { en: "A feature never lands alone. Players use it, work around it, misunderstand it, adopt it.", fr: "Une fonctionnalité ne vit pas seule : on l’utilise, la contourne, la comprend de travers, se l’approprie." } },
  ],
  Stage,
});
