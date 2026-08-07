import { useId, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type {
  PostLocale,
  PostVisualId,
} from "../../features/posts/content";
import { normalizeLocale } from "../routing";

export type PostVisualVariant = "card" | "header" | "inline";

type PostVisualProps = {
  locale?: PostLocale;
  slug: string;
  variant: PostVisualVariant;
  visualId?: PostVisualId | undefined;
};

type ArticleDiagramProps = {
  visualId: PostVisualId;
};

type DiagramCopy = {
  title: string;
  description: string;
  caption: string;
  labels: Record<string, string>;
};

type LocaleCopy = Record<PostVisualId, DiagramCopy> & {
  fallback: DiagramCopy;
};

const VISUAL_COPY: Record<PostLocale, LocaleCopy> = {
  fr: {
    "bounded-ai-loop": {
      title: "Boucle IA bornée avec validation humaine",
      description:
        "Une intention traverse une exécution IA à moindre privilège, produit une preuve, puis nécessite une validation humaine avant toute action. Un contrôle échoué arrête la boucle et déclenche une escalade.",
      caption:
        "Une boucle agentique sûre produit une preuve et s'arrête avant l'action tant qu'une personne n'a pas validé le résultat.",
      labels: {
        intent: "Intention",
        agent: "Exécution IA",
        evidence: "Preuve",
        human: "Gate humain",
        action: "Action",
        boundary: "Runtime borné · moindre privilège",
        failure: "Contrôle échoué",
        stop: "STOP / ESCALADE",
      },
    },
    "sse-outbound-channel": {
      title: "Canal SSE sortant à travers un pare-feu",
      description:
        "L'agent client ouvre une connexion HTTPS sortante vers la control plane. Le serveur conserve le canal SSE, envoie des événements et des heartbeats, puis l'agent se reconnecte avec backoff et jitter après une coupure.",
      caption:
        "Le canal est initié depuis le réseau client ; heartbeat, backoff et jitter rendent la connexion longue durée opérable.",
      labels: {
        agent: "Agent client",
        network: "Réseau client",
        firewall: "PARE-FEU",
        control: "Control plane",
        outbound: "1 · HTTPS GET sortant",
        stream: "2 · Flux SSE + événements",
        heartbeat: "heartbeat",
        disconnected: "Déconnecté",
        backoff: "Backoff + jitter",
        reconnect: "Reconnexion",
      },
    },
    "trail-endurance-profile": {
      title: "Profil d'endurance pour un objectif de 100 km",
      description:
        "Un profil de trail de 100 kilomètres met en regard un horizon de course de 13 à 15 heures, une montre généraliste limitée autour de quatre heures de GPS dans l'expérience décrite, et une montre sport couvrant la fenêtre cible.",
      caption:
        "Le besoin n'est pas une fonction supplémentaire : c'est une autonomie qui couvre l'intégralité de la fenêtre de course.",
      labels: {
        objective: "OBJECTIF · 100 KM",
        horizon: "Fenêtre cible · 13–15 h",
        smart: "Montre généraliste · ~4 h GPS",
        sport: "Montre sport · fenêtre couverte",
        start: "0 h",
        four: "4 h",
        thirteen: "13 h",
        fifteen: "15 h",
        checkpoint: "CHECKPOINT",
      },
    },
    fallback: {
      title: "Cartographie technique de l'article",
      description:
        "Un motif topographique déterministe combine courbes de niveau, chemin et points de contrôle pour identifier cet article.",
      caption: "Cartographie du système décrit dans l'article.",
      labels: { map: "CARTE DU SYSTÈME", checkpoint: "CHECKPOINT" },
    },
  },
  en: {
    "bounded-ai-loop": {
      title: "Bounded AI loop with human validation",
      description:
        "An intent enters a least-privilege AI runtime, produces evidence, and requires human validation before any action. A failed check stops the loop and triggers escalation.",
      caption:
        "A safe agent loop produces evidence and stops before action until a person validates the result.",
      labels: {
        intent: "Intent",
        agent: "AI execution",
        evidence: "Evidence",
        human: "Human gate",
        action: "Action",
        boundary: "Bounded runtime · least privilege",
        failure: "Failed check",
        stop: "STOP / ESCALATE",
      },
    },
    "sse-outbound-channel": {
      title: "Outbound SSE channel through a firewall",
      description:
        "The customer agent opens an outbound HTTPS connection to the control plane. The server keeps the SSE channel open, sends events and heartbeats, and the agent reconnects with backoff and jitter after a disconnect.",
      caption:
        "The customer network initiates the channel; heartbeat, backoff, and jitter make the long-lived connection operable.",
      labels: {
        agent: "Customer agent",
        network: "Customer network",
        firewall: "FIREWALL",
        control: "Control plane",
        outbound: "1 · Outbound HTTPS GET",
        stream: "2 · SSE stream + events",
        heartbeat: "heartbeat",
        disconnected: "Disconnected",
        backoff: "Backoff + jitter",
        reconnect: "Reconnect",
      },
    },
    "trail-endurance-profile": {
      title: "Endurance profile for a 100 km objective",
      description:
        "A 100-kilometre trail profile compares a 13-to-15-hour race horizon, a general-purpose watch limited to roughly four GPS hours in the described experience, and a sport watch covering the target window.",
      caption:
        "The requirement is not another feature: it is enough battery to cover the complete race window.",
      labels: {
        objective: "OBJECTIVE · 100 KM",
        horizon: "Target window · 13–15 h",
        smart: "General watch · ~4 h GPS",
        sport: "Sport watch · window covered",
        start: "0 h",
        four: "4 h",
        thirteen: "13 h",
        fifteen: "15 h",
        checkpoint: "CHECKPOINT",
      },
    },
    fallback: {
      title: "Technical map for this article",
      description:
        "A deterministic topographic motif combines contour lines, a route, and checkpoints to identify this article.",
      caption: "Map of the system described in the article.",
      labels: { map: "SYSTEM MAP", checkpoint: "CHECKPOINT" },
    },
  },
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildContourPath(seed: number, lineIndex: number): string {
  const points = Array.from({ length: 11 }, (_, pointIndex) => {
    const x = pointIndex * 90;
    const wave = Math.sin((pointIndex + (seed % 9)) * 0.72 + lineIndex * 0.64);
    const secondary = Math.cos((pointIndex + lineIndex) * 1.19 + (seed % 13));
    const y = 82 + lineIndex * 48 + wave * 19 + secondary * 8;
    return `${pointIndex === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return points.join(" ");
}

function DiagramNode({
  x,
  y,
  label,
  tone = "default",
  width = 128,
}: {
  x: number;
  y: number;
  label: string;
  tone?: "default" | "hot" | "success";
  width?: number;
}) {
  return (
    <g className={`visual-node visual-node-${tone}`}>
      <rect x={x} y={y} width={width} height="72" rx="18" />
      <text x={x + width / 2} y={y + 42} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

function DiagramFrame({
  markerId,
  children,
}: {
  markerId: string;
  children: ReactNode;
}) {
  return (
    <>
      <defs>
        <linearGradient id={`${markerId}-wash`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--visual-surface-strong)" />
          <stop offset="1" stopColor="var(--visual-surface)" />
        </linearGradient>
        <pattern id={`${markerId}-grid`} width="42" height="42" patternUnits="userSpaceOnUse">
          <path d="M42 0H0V42" className="visual-grid-line" />
        </pattern>
        <marker
          id={`${markerId}-arrow`}
          markerWidth="12"
          markerHeight="10"
          refX="10"
          refY="5"
          orient="auto"
        >
          <path d="M0 0L12 5L0 10Z" className="visual-arrow-head" />
        </marker>
      </defs>
      <rect width="900" height="480" rx="28" fill={`url(#${markerId}-wash)`} />
      <rect width="900" height="480" rx="28" fill={`url(#${markerId}-grid)`} />
      {children}
    </>
  );
}

function BoundedAiLoop({
  copy,
  markerId,
  compact,
}: {
  copy: DiagramCopy;
  markerId: string;
  compact: boolean;
}) {
  const labels = copy.labels;
  const nodes = [
    { x: 32, label: labels.intent ?? "" },
    { x: 210, label: labels.agent ?? "" },
    { x: 388, label: labels.evidence ?? "" },
    { x: 566, label: labels.human ?? "", tone: "hot" as const },
    { x: 744, label: labels.action ?? "", tone: "success" as const },
  ];

  return (
    <DiagramFrame markerId={markerId}>
      <rect x="184" y="76" width="520" height="208" rx="28" className="visual-boundary" />
      {!compact ? (
        <text x="210" y="112" className="visual-kicker">
          {labels.boundary}
        </text>
      ) : null}
      {nodes.map((node, index) => (
        <g key={node.label}>
          {index < nodes.length - 1 ? (
            <path
              d={`M${node.x + 128} 201H${nodes[index + 1]!.x - 14}`}
              className="visual-flow-line"
              markerEnd={`url(#${markerId}-arrow)`}
            />
          ) : null}
          <DiagramNode
            x={node.x}
            y={165}
            label={node.label}
            {...(node.tone ? { tone: node.tone } : {})}
          />
        </g>
      ))}
      {!compact ? (
        <>
          <path
            d="M452 237V330H594"
            className="visual-flow-line visual-flow-danger"
            markerEnd={`url(#${markerId}-arrow)`}
          />
          <text x="476" y="316" className="visual-note">
            {labels.failure}
          </text>
          <g className="visual-stop-node">
            <rect x="608" y="300" width="218" height="72" rx="18" />
            <text x="717" y="343" textAnchor="middle">
              {labels.stop}
            </text>
          </g>
        </>
      ) : null}
    </DiagramFrame>
  );
}

function SseOutboundChannel({
  copy,
  markerId,
  compact,
}: {
  copy: DiagramCopy;
  markerId: string;
  compact: boolean;
}) {
  const labels = copy.labels;
  return (
    <DiagramFrame markerId={markerId}>
      <rect x="42" y="84" width="294" height="230" rx="28" className="visual-boundary" />
      {!compact ? (
        <text x="68" y="120" className="visual-kicker">
          {labels.network}
        </text>
      ) : null}
      <DiagramNode x={84} y={164} width={196} label={labels.agent ?? ""} />
      <rect x="392" y="72" width="38" height="260" rx="19" className="visual-firewall" />
      <text
        x="411"
        y="202"
        textAnchor="middle"
        transform="rotate(-90 411 202)"
        className="visual-firewall-label"
      >
        {labels.firewall}
      </text>
      <DiagramNode x={612} y={164} width={220} label={labels.control ?? ""} tone="success" />
      <path
        d="M280 182C340 134 520 134 612 182"
        className="visual-flow-line"
        markerEnd={`url(#${markerId}-arrow)`}
      />
      <path
        d="M612 224C520 274 344 274 280 224"
        className="visual-flow-line visual-flow-hot"
        markerEnd={`url(#${markerId}-arrow)`}
      />
      {!compact ? (
        <>
          <text x="360" y="122" className="visual-note">
            {labels.outbound}
          </text>
          <text x="406" y="296" className="visual-note visual-note-hot">
            {labels.stream}
          </text>
          <circle cx="516" cy="244" r="8" className="visual-checkpoint" />
          <text x="530" y="250" className="visual-micro-label">
            {labels.heartbeat}
          </text>
          <path
            d="M182 314V376H326"
            className="visual-flow-line visual-flow-muted"
            markerEnd={`url(#${markerId}-arrow)`}
          />
          <text x="72" y="402" className="visual-micro-label">
            {labels.disconnected}
          </text>
          <text x="350" y="402" className="visual-micro-label visual-micro-label-hot">
            {labels.backoff}
          </text>
          <path
            d="M494 376H676V252"
            className="visual-flow-line visual-flow-muted"
            markerEnd={`url(#${markerId}-arrow)`}
          />
          <text x="560" y="402" className="visual-micro-label">
            {labels.reconnect}
          </text>
        </>
      ) : null}
    </DiagramFrame>
  );
}

function TrailEnduranceProfile({
  copy,
  markerId,
  compact,
}: {
  copy: DiagramCopy;
  markerId: string;
  compact: boolean;
}) {
  const labels = copy.labels;
  return (
    <DiagramFrame markerId={markerId}>
      <text x="48" y="62" className="visual-kicker">
        {labels.objective}
      </text>
      <path
        d="M42 246L112 220L176 238L246 166L306 202L382 112L456 190L526 146L602 214L674 172L742 232L812 198L864 236L864 260L42 260Z"
        className="visual-elevation-fill"
      />
      <path
        d="M42 246L112 220L176 238L246 166L306 202L382 112L456 190L526 146L602 214L674 172L742 232L812 198L864 236"
        className="visual-elevation-line"
      />
      {[42, 262, 756, 864].map((x) => (
        <line key={x} x1={x} y1="258" x2={x} y2="430" className="visual-axis-tick" />
      ))}
      <line x1="42" y1="274" x2="864" y2="274" className="visual-axis" />
      {!compact ? (
        <>
          <text x="42" y="298" className="visual-micro-label">
            {labels.start}
          </text>
          <text x="250" y="298" className="visual-micro-label">
            {labels.four}
          </text>
          <text x="742" y="298" className="visual-micro-label">
            {labels.thirteen}
          </text>
          <text x="836" y="298" className="visual-micro-label">
            {labels.fifteen}
          </text>
          <text x="48" y="342" className="visual-note">
            {labels.smart}
          </text>
          <rect x="262" y="324" width="196" height="22" rx="11" className="visual-duration-short" />
          <text x="48" y="396" className="visual-note visual-note-hot">
            {labels.sport}
          </text>
          <rect x="262" y="378" width="602" height="22" rx="11" className="visual-duration-long" />
          <path d="M756 308V414" className="visual-target-line" />
          <text x="756" y="442" textAnchor="middle" className="visual-micro-label visual-micro-label-hot">
            {labels.horizon}
          </text>
        </>
      ) : null}
      <circle cx="382" cy="112" r="10" className="visual-checkpoint" />
    </DiagramFrame>
  );
}

function FallbackMap({
  copy,
  markerId,
  slug,
  compact,
}: {
  copy: DiagramCopy;
  markerId: string;
  slug: string;
  compact: boolean;
}) {
  const seed = hashString(slug);
  const contours = useMemo(
    () => Array.from({ length: 7 }, (_, index) => buildContourPath(seed, index)),
    [seed],
  );
  const label = slug.replaceAll("-", " ").toUpperCase().slice(0, 42);

  return (
    <DiagramFrame markerId={markerId}>
      {contours.map((path, index) => (
        <path key={path} d={path} className={`visual-contour visual-contour-${index % 3}`} />
      ))}
      <path
        d="M54 340C170 264 246 330 354 238S554 180 648 218S782 168 858 118"
        className="visual-route"
      />
      {[{ x: 54, y: 340 }, { x: 354, y: 238 }, { x: 648, y: 218 }, { x: 858, y: 118 }].map(
        (point, index) => (
          <circle
            key={`${point.x}-${point.y}`}
            cx={point.x}
            cy={point.y}
            r={index === 3 ? 10 : 7}
            className="visual-checkpoint"
          />
        ),
      )}
      <text x="54" y="66" className="visual-kicker">
        {copy.labels.map}
      </text>
      {!compact ? (
        <text x="54" y="102" className="visual-fallback-title">
          {label}
        </text>
      ) : null}
    </DiagramFrame>
  );
}

export function PostVisual({
  locale,
  slug,
  variant,
  visualId,
}: PostVisualProps) {
  const { i18n } = useTranslation();
  const resolvedLocale = locale ?? normalizeLocale(i18n.resolvedLanguage ?? i18n.language);
  const copy = VISUAL_COPY[resolvedLocale][visualId ?? "fallback"];
  const instanceId = useId().replaceAll(":", "");
  const markerId = `post-visual-${instanceId}`;
  const compact = variant === "card";
  const titleId = `${markerId}-title`;
  const descriptionId = `${markerId}-description`;

  let diagram: ReactNode;
  if (visualId === "bounded-ai-loop") {
    diagram = <BoundedAiLoop copy={copy} markerId={markerId} compact={compact} />;
  } else if (visualId === "sse-outbound-channel") {
    diagram = <SseOutboundChannel copy={copy} markerId={markerId} compact={compact} />;
  } else if (visualId === "trail-endurance-profile") {
    diagram = <TrailEnduranceProfile copy={copy} markerId={markerId} compact={compact} />;
  } else {
    diagram = (
      <FallbackMap
        copy={copy}
        markerId={markerId}
        slug={slug}
        compact={compact}
      />
    );
  }

  const svg = (
    <svg
      className="post-system-visual-svg"
      viewBox="0 0 900 480"
      role={variant === "inline" ? "img" : undefined}
      aria-hidden={variant === "inline" ? undefined : true}
      aria-labelledby={variant === "inline" ? `${titleId} ${descriptionId}` : undefined}
      preserveAspectRatio={variant === "card" ? "xMidYMid slice" : "xMidYMid meet"}
    >
      {variant === "inline" ? <title id={titleId}>{copy.title}</title> : null}
      {variant === "inline" ? <desc id={descriptionId}>{copy.description}</desc> : null}
      {diagram}
    </svg>
  );

  if (variant === "inline") {
    return (
      <figure
        className="post-visual post-system-visual post-system-visual-inline"
        data-visual-id={visualId}
      >
        {svg}
        <figcaption>{copy.caption}</figcaption>
      </figure>
    );
  }

  return (
    <div
      className={`post-system-visual post-system-visual-${variant}`}
      data-visual-id={visualId ?? "fallback"}
    >
      {svg}
    </div>
  );
}

export function ArticleDiagram({ visualId }: ArticleDiagramProps) {
  return <PostVisual slug={visualId} variant="inline" visualId={visualId} />;
}
