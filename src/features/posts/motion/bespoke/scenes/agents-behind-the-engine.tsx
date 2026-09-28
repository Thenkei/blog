import { Box, Boundary, Checkpoint, Comet, dim, ease, easeOut, enter, lerp, pop, Pulse, stagger, Tag, Text, Wire, type Tone } from "../primitives";
import { defineScene, type SceneStageProps } from "../types";

// Act 1: three agents each ship a screen, and every request those screens make
// crosses the same three gates (identity, access, audit) before it reaches a
// read replica or a service API. A direct SQL write has no route at all: it
// stops at the engine's edge, then the same change goes through a named action.
// Act 2: the rollout strip walks one process through test → qualify → fix →
// switch; the old tool stays available until the switch.
const T = {
  agents: 0,
  engine: 18,
  targets: 30,
  read: 60,
  write: 130,
  direct: 200,
  blocked: 220,
  action: 250,
  rollout: 330,
  steps: [350, 385, 420, 455] as const,
  end: 540,
} as const;

type Pt = readonly [number, number];
type Target = "replica" | "services";
type Request = { agent: number; start: number; target: Target };

// Loop-relative frames: leave the agent, enter the engine, clear each gate, exit, land.
const HOPS = [0, 16, 28, 42, 56, 66, 80] as const;
const TRAVEL = HOPS[HOPS.length - 1]!;
const REQUESTS: readonly Request[] = [
  { agent: 0, start: T.read, target: "replica" },
  { agent: 1, start: T.write, target: "services" },
  { agent: 2, start: T.action, target: "services" },
];

const COPY = {
  en: {
    agents: [["Claude Code", "contracts list"], ["Codex", "close action"], ["Cursor", "status update"]],
    engine: "core engine",
    gates: [["Identity", "who asks"], ["Access", "sees what"], ["Audit", "traces all"]],
    ok: "ok",
    masked: "1 masked",
    allowed: "allowed",
    logged: "logged",
    replica: ["PostgreSQL", "read replica · read-only"],
    services: ["Service APIs", "writes only"],
    maskedTag: "1 field masked",
    saved: "✓ saved via API",
    direct: "direct SQL",
    noRoute: "✗ no route",
    rollout: "rollout · one process",
    steps: [["Test", "real cohort"], ["Qualify", "report gaps"], ["Fix", "revalidate"], ["Switch", "retire old"]],
    oldTool: "old tool",
    available: "available",
    retired: "retired · this process",
  },
  fr: {
    agents: [["Claude Code", "liste contrats"], ["Codex", "action clôture"], ["Cursor", "maj statut"]],
    engine: "core engine",
    gates: [["Identité", "qui demande"], ["Accès", "voit quoi"], ["Audit", "tout tracé"]],
    ok: "ok",
    masked: "1 masqué",
    allowed: "autorisé",
    logged: "tracé",
    replica: ["PostgreSQL", "replica · lecture seule"],
    services: ["APIs services", "écritures seules"],
    maskedTag: "1 champ masqué",
    saved: "✓ enregistré via API",
    direct: "SQL direct",
    noRoute: "✗ aucun chemin",
    rollout: "déploiement · un processus",
    steps: [["Tester", "cohorte réelle"], ["Qualifier", "écarts remontés"], ["Corriger", "revalider"], ["Basculer", "retrait ancien"]],
    oldTool: "ancien outil",
    available: "disponible",
    retired: "retiré · ce processus",
  },
} as const;

// Piecewise, eased travel through timed waypoints. Returns the polyline
// travelled so far, so the comet's tail follows the route through the gates.
function route(frame: number, start: number, points: readonly Pt[]): Pt[] {
  const local = frame - start;
  const last = HOPS.length - 1;
  if (local <= 0) return [points[0]!];
  if (local >= TRAVEL) return [...points];
  const segment = HOPS.findIndex((hop, index) => index < last && local >= hop && local < HOPS[index + 1]!);
  const k = ease(local, HOPS[segment]!, HOPS[segment + 1]!);
  const from = points[segment]!;
  const to = points[segment + 1]!;
  return [...points.slice(0, segment + 1), [lerp(from[0], to[0], k), lerp(from[1], to[1], k)]];
}

const length = (points: readonly Pt[]) => points.slice(1).reduce((sum, point, i) => sum + Math.hypot(point[0] - points[i]![0], point[1] - points[i]![1]), 0);

function Stage({ frame, compact, locale }: SceneStageProps) {
  const c = COPY[locale];

  // ── Geometry ──────────────────────────────────────────────────────────────
  const G = compact
    ? {
      agents: [0, 1, 2].map((i) => ({ x: 20 + i * 177, y: 54, w: 146, h: 44 })),
      engine: { x: 20, y: 134, w: 500, h: 112 },
      gates: [0, 1, 2].map((i) => ({ x: 34 + i * 164, y: 150, w: 144, h: 84 })),
      track: 192,
      replica: { x: 20, y: 262, w: 240, h: 60 },
      services: { x: 280, y: 262, w: 240, h: 60 },
      rolloutY: 368,
      steps: [0, 1, 2, 3].map((i) => ({ x: 20 + i * 129, y: 386, w: 113, h: 46 })),
      old: { x: 20, y: 446, w: 500, h: 60 },
    }
    : {
      agents: [0, 1, 2].map((i) => ({ x: 40, y: 66 + i * 70, w: 170, h: 50 })),
      engine: { x: 250, y: 58, w: 400, h: 222 },
      gates: [0, 1, 2].map((i) => ({ x: 264 + i * 128, y: 80, w: 116, h: 184 })),
      track: 171,
      replica: { x: 700, y: 70, w: 220, h: 84 },
      services: { x: 700, y: 188, w: 220, h: 84 },
      rolloutY: 308,
      steps: [0, 1, 2, 3].map((i) => ({ x: 40 + i * 150, y: 326, w: 136, h: 56 })),
      old: { x: 700, y: 316, w: 220, h: 72 },
    };
  const { engine, gates, track } = G;
  const gateCentre = gates.map((gate) => gate.x + gate.w / 2);
  const targetBox = (target: Target) => (target === "replica" ? G.replica : G.services);

  const exit = (agent: number): Pt => {
    const a = G.agents[agent]!;
    return compact ? [a.x + a.w / 2, a.y + a.h] : [a.x + a.w, a.y + a.h / 2];
  };
  const pathFor = (request: Request): Pt[] => {
    const box = targetBox(request.target);
    const [ax, ay] = exit(request.agent);
    if (compact) {
      const tx = box.x + box.w / 2;
      return [[ax, ay], [gateCentre[0]!, track], [gateCentre[0]!, track], [gateCentre[1]!, track], [gateCentre[2]!, track], [tx, engine.y + engine.h], [tx, box.y]];
    }
    const ty = box.y + box.h / 2;
    return [[ax, ay], [engine.x, track], [gateCentre[0]!, track], [gateCentre[1]!, track], [gateCentre[2]!, track], [engine.x + engine.w + 22, ty], [box.x, ty]];
  };

  // ── Act 1 state ───────────────────────────────────────────────────────────
  const act2 = ease(frame, T.rollout, T.rollout + 24);
  const act1Opacity = dim(act2, .5);
  // Hop index at which request r clears gate g (gates are hops 2, 3, 4).
  const clearedAt = (request: Request, gate: number) => request.start + HOPS[gate + 2]!;
  const lastThrough = (gate: number) => REQUESTS.filter((request) => frame >= clearedAt(request, gate)).at(-1);
  const gateFocus = (gate: number) => Math.max(0, ...REQUESTS.map((request) => {
    const at = clearedAt(request, gate);
    return ease(frame, at - 8, at) * (1 - ease(frame, at + 6, at + 22));
  }));
  const auditCount = REQUESTS.filter((request) => frame >= clearedAt(request, 2)).length;
  const landed = (target: Target) => REQUESTS.filter((request) => request.target === target && frame >= request.start + TRAVEL).at(-1);
  const status = (gate: number): string | null => {
    const request = lastThrough(gate);
    if (!request) return null;
    if (gate === 0) return c.ok;
    if (gate === 1) return request.target === "replica" ? c.masked : c.allowed;
    return `${c.logged} ×${auditCount}`;
  };
  const agentFocus = (agent: number) => Math.max(0, ...[...REQUESTS, { agent: 2, start: T.direct, target: "services" as const }]
    .filter((request) => request.agent === agent)
    .map((request) => ease(frame, request.start - 10, request.start) * (1 - ease(frame, request.start + 18, request.start + 36))));

  // The direct write: it leaves Cursor and stops dead at the engine's edge.
  const directFrom = exit(2);
  const directTo: Pt = compact ? [directFrom[0], engine.y] : [engine.x, directFrom[1]];
  const directT = ease(frame, T.direct, T.blocked);
  const blocked = frame >= T.blocked ? pop(frame, T.blocked) : 0;
  const blockedFade = 1 - ease(frame, T.action + 40, T.action + 60);

  // ── Act 2 state ───────────────────────────────────────────────────────────
  const stepIndex = T.steps.reduce((index, at, i) => (frame >= at ? i : index), -1);
  const switched = frame >= T.steps[3];
  const retire = ease(frame, T.steps[3], T.steps[3] + 20);

  return <g>
    <g opacity={act1Opacity}>
      {/* Agents */}
      {G.agents.map((a, i) => <g key={i} {...enter(frame, stagger(i, T.agents, 6), { from: compact ? "up" : "left" })}>
        <Box x={a.x} y={a.y} w={a.w} h={a.h} tone="line" focus={agentFocus(i)} label={c.agents[i]![0]} sub={c.agents[i]![1]} labelSize={compact ? 15 : 16} />
      </g>)}

      {/* Engine and its gates */}
      <g {...enter(frame, T.engine)}>
        <Boundary x={engine.x} y={engine.y} w={engine.w} h={engine.h} label={c.engine} tone="hot" labelAt="top-start" />
        <Wire d={`M${engine.x} ${track}H${engine.x + engine.w}`} tone="muted" width={1.25} dashed draw={easeOut(frame, T.engine + 6, T.engine + 30)} />
      </g>
      {gates.map((gate, i) => {
        const text = status(i);
        const focus = gateFocus(i);
        const titleY = gate.y + (compact ? 20 : 30);
        const subY = gate.y + (compact ? 40 : 54);
        const checkY = gate.y + (compact ? 64 : 118);
        return <g key={i} {...enter(frame, stagger(i, T.engine + 6, 5))}>
          <Box x={gate.x} y={gate.y} w={gate.w} h={gate.h} tone="hot" focus={focus} radius={12}>
            <Text x={gate.x + gate.w / 2} y={titleY} size={compact ? 15 : 16} anchor="middle">{c.gates[i]![0]}</Text>
            <Text x={gate.x + gate.w / 2} y={subY} size={13} font="mono" weight={500} tone="muted" anchor="middle">{c.gates[i]![1]}</Text>
            {compact
              ? <>
                <Checkpoint x={gate.x + 22} y={checkY} r={10} state={text ? "pass" : "pending"} />
                {text ? <Text x={gate.x + 40} y={checkY} size={13} font="mono" weight={600} tone="ok">{text}</Text> : null}
              </>
              : <>
                <Checkpoint x={gate.x + gate.w / 2} y={checkY} r={13} state={text ? "pass" : "pending"} />
                {text ? <Text x={gate.x + gate.w / 2} y={checkY + 36} size={13} font="mono" weight={600} tone="ok" anchor="middle">{text}</Text> : null}
              </>}
          </Box>
        </g>;
      })}

      {/* Targets */}
      {(["replica", "services"] as const).map((target, i) => {
        const box = targetBox(target);
        const request = landed(target);
        const arrivedAt = request ? request.start + TRAVEL : Infinity;
        const [title, sub] = target === "replica" ? c.replica : c.services;
        const glow = ease(frame, arrivedAt - 6, arrivedAt) * (1 - ease(frame, arrivedAt + 16, arrivedAt + 40));
        const tagY = compact ? box.y + box.h + 18 : box.y + box.h + 18;
        return <g key={target} {...enter(frame, stagger(i, T.targets, 6), { from: compact ? "up" : "right" })}>
          <Box x={box.x} y={box.y} w={box.w} h={box.h} tone={target === "replica" ? "line" : "ok"} focus={glow} label={title} sub={sub} labelSize={compact ? 15 : 17} />
          {request ? <Tag x={box.x + box.w / 2} y={tagY} text={target === "replica" ? c.maskedTag : c.saved} tone="ok" size={12.5} appear={pop(frame, arrivedAt)} /> : null}
          {request ? <Pulse x={box.x + box.w / 2} y={box.y + box.h / 2} frame={frame} at={arrivedAt} period={36} r={16} tone="ok" once /> : null}
        </g>;
      })}

      {/* Requests travelling through the gates */}
      {REQUESTS.map((request) => {
        const travelled = route(frame, request.start, pathFor(request));
        const active = frame > request.start && frame < request.start + TRAVEL;
        const span = length(travelled);
        return active && span > 1
          ? <Comet key={request.start} points={travelled} t={.999} tone="hot" tail={Math.min(.6, 70 / span)} />
          : null;
      })}

      {/* The direct write: no route through the engine */}
      {frame >= T.direct && blockedFade > 0 ? <g opacity={blockedFade}>
        <Wire d={`M${directFrom[0]} ${directFrom[1]}L${directTo[0]} ${directTo[1]}`} tone="danger" dashed draw={directT} />
        {frame < T.blocked ? <Comet points={[directFrom, directTo]} t={Math.min(.999, directT)} tone="danger" tail={.4} /> : null}
        {blocked > 0 ? <>
          <Checkpoint x={directTo[0]} y={directTo[1]} r={11} state="fail" appear={Math.min(1, blocked)} />
          <Pulse x={directTo[0]} y={directTo[1]} frame={frame} at={T.blocked} period={36} r={12} tone="danger" once />
          <Tag
            x={compact ? 520 : G.agents[2]!.x} y={compact ? engine.y - 18 : G.agents[2]!.y + G.agents[2]!.h + 22}
            anchor={compact ? "end" : "start"} size={12.5} tone="danger" appear={blocked}
            text={`${c.direct} · ${c.noRoute}`}
          />
        </> : null}
      </g> : null}
    </g>

    {/* Act 2: rollout, one process at a time */}
    {act2 > 0 ? <g {...enter(frame, T.rollout, { distance: 18 })}>
      <Text x={G.steps[0]!.x} y={G.rolloutY} size={11} font="mono" weight={600} tone="muted" caps>{c.rollout}</Text>
      {G.steps.map((step, i) => {
        const next = G.steps[i + 1];
        const done = i < stepIndex;
        const current = i === stepIndex;
        const tone: Tone = done ? "ok" : current ? "hot" : "muted";
        return <g key={i}>
          {next ? <Wire d={`M${step.x + step.w} ${step.y + step.h / 2}H${next.x}`} tone={done ? "ok" : "muted"} width={1.5} draw={done ? 1 : easeOut(frame, T.rollout + 10, T.rollout + 30) * .999} dashed={!done} /> : null}
          <g {...enter(frame, stagger(i, T.rollout + 6, 5))}>
            <Box
              x={step.x} y={step.y} w={step.w} h={step.h} tone={tone}
              focus={current ? easeOut(frame, T.steps[i]!, T.steps[i]! + 12) : 0}
              fill={done ? .6 : 0}
              label={c.steps[i]![0]} sub={compact ? undefined : c.steps[i]![1]} labelSize={compact ? 15 : 16}
            />
            {done || (current && i === 3) ? <Checkpoint x={step.x + step.w - 4} y={step.y + 4} r={9} state="pass" appear={pop(frame, done ? T.steps[i + 1] ?? T.steps[i]! : T.steps[i]!)} /> : null}
          </g>
        </g>;
      })}
      <g {...enter(frame, T.rollout + 24, { from: compact ? "up" : "right" })}>
        <g opacity={lerp(1, .55, retire)}>
          <Box x={G.old.x} y={G.old.y} w={G.old.w} h={G.old.h} tone={switched ? "muted" : "line"} />
          <Text x={G.old.x + G.old.w / 2} y={G.old.y + 18} size={compact ? 15 : 16} anchor="middle" tone={switched ? "muted" : "ink"}>{c.oldTool}</Text>
          {retire > 0 ? <line
            x1={G.old.x + G.old.w / 2 - 54} x2={lerp(G.old.x + G.old.w / 2 - 54, G.old.x + G.old.w / 2 + 54, retire)}
            y1={G.old.y + 18} y2={G.old.y + 18}
            style={{ stroke: "var(--scene-ink-soft)" }} strokeWidth={1.5}
          /> : null}
        </g>
        <Tag
          x={G.old.x + G.old.w / 2} y={G.old.y + G.old.h - 18}
          text={switched ? c.retired : c.available}
          tone={switched ? "hot" : "ok"} size={12.5}
          appear={switched ? pop(frame, T.steps[3]) : 1}
        />
      </g>
    </g> : null}
  </g>;
}

export default defineScene({
  durationInFrames: T.end,
  posterFrame: 500,
  title: { en: "Any agent, the same engine", fr: "N'importe quel agent, un seul moteur" },
  caption: {
    en: "Screens written by any agent reach data only through the engine's identity, access, and audit gates. Rollout then switches one process at a time, once a cohort has validated it.",
    fr: "Les écrans écrits par n'importe quel agent n'atteignent la donnée qu'à travers les portes identité, accès et audit du moteur. Le déploiement bascule ensuite un processus à la fois, après validation par une cohorte.",
  },
  beats: [
    { at: 0, text: { en: "Three agents write three screens. None contains a permission check or an audit call.", fr: "Trois agents écrivent trois écrans. Aucun ne contient de contrôle d'accès ni d'appel d'audit." } },
    { at: T.read, text: { en: "Every request crosses the same gates: identity, field-level access, audit. Reads hit a replica.", fr: "Chaque requête franchit les mêmes portes : identité, accès au champ, audit. Les lectures vont sur une replica." } },
    { at: T.write, text: { en: "Writes go through named actions and service APIs, whoever wrote the screen.", fr: "Les écritures passent par des actions nommées et les APIs des services, quel que soit l'auteur de l'écran." } },
    { at: T.direct, text: { en: "A direct SQL write has no route: the engine is the only path, so nobody can forget it.", fr: "Une écriture SQL directe n'a aucun chemin : le moteur est le seul passage, impossible de l'oublier." } },
    { at: T.rollout, text: { en: "Rollout runs one process at a time: a cohort tests, reports gaps, the team fixes them.", fr: "Le déploiement avance processus par processus : une cohorte teste, remonte les écarts, l'équipe corrige." } },
    { at: T.steps[3], text: { en: "Only after validation does the old tool retire, and only for that process.", fr: "L'ancien outil n'est retiré qu'après validation, et uniquement pour ce processus." } },
  ],
  Stage,
});
