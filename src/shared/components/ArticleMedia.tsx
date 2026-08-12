import { useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { PostLocale } from "../../features/posts/content";
import { normalizeLocale } from "../routing";

export const articleMediaIds = [
  "sse-polling-vs-stream",
  "sse-reconnect-storm",
  "redis-memory-pressure",
  "backpressure-propagation",
  "debounce-trigger-storm",
  "ci-reconciliation-meme",
  "ai-review-meme",
  "product-os-loop",
  "document-lifecycle-motion",
] as const;

export type ArticleMediaId = (typeof articleMediaIds)[number];

type MediaCopy = {
  title: string;
  description: string;
  caption: string;
  eyebrow: string;
  labels: Record<string, string>;
};

const MEDIA_COPY: Record<PostLocale, Record<ArticleMediaId, MediaCopy>> = {
  en: {
    "sse-polling-vs-stream": {
      title: "Polling repeats requests while SSE keeps one outbound connection open",
      description:
        "A static comparison of an agent polling repeatedly for updates versus an agent opening one HTTPS connection that receives SSE events from the control plane.",
      caption:
        "Polling repeats agent requests and receives no change. SSE opens one outbound connection; the control plane sends an event only when something changes.",
      eyebrow: "TWO WAYS TO MOVE AN UPDATE",
      labels: {
        polling: "POLLING",
        sse: "SSE",
        agent: "AGENT",
        server: "CONTROL PLANE",
        request: "REQUEST",
        response: "NO CHANGE",
        open: "OPEN HTTPS GET",
        event: "EVENT ONLY",
        cadence: "EVERY 5 s",
        repeat: "REPEATS WHEN QUIET",
        connection: "ONE OPEN CONNECTION",
        send: "SEND ONLY ON EVENT",
      },
    },
    "sse-reconnect-storm": {
      title: "Long-lived SSE connections can turn a deploy into a reconnect storm",
      description:
        "Open SSE connections consume server capacity continuously; a deploy can release them at once, while jittered backoff spreads reconnects across a window the control plane can absorb.",
      caption:
        "The connection stays open until a deploy drains it. Without jitter, reconnections spike together; with jitter, the same work stays below the server capacity line.",
      eyebrow: "LONG-LIVED CONNECTIONS · RECONNECT LOAD",
      labels: {
        open: "OPEN SSE",
        agents: "AGENTS",
        control: "CONTROL PLANE",
        heartbeat: "HEARTBEAT",
        deploy: "DEPLOY / DRAIN",
        spike: "LOAD SPIKE",
        burst: "ALL RECONNECT NOW",
        jitter: "JITTERED BACKOFF",
        window: "WINDOW · 1–10 s",
        capacity: "SERVER CAPACITY",
        absorbed: "LOAD ABSORBED",
        now: "NOW",
        later: "LATER",
      },
    },
    "redis-memory-pressure": {
      title: "One Redis memory pool can take unrelated workloads down together",
      description:
        "A memory gauge fills as cache, queues, authentication, and security share one Redis instance, then the shared limit breaks every workload.",
      caption:
        "The outage was not four independent failures. It was one exhausted memory boundary shared by four unrelated responsibilities.",
      eyebrow: "ONE MEMORY POOL · FOUR BLAST RADII",
      labels: {
        cache: "CACHE",
        queues: "QUEUES",
        auth: "AUTH",
        security: "SECURITY",
        memory: "MEMORY",
        limit: "LIMIT",
        isolate: "ISOLATE",
      },
    },
    "backpressure-propagation": {
      title: "Backpressure travels from the slow upload back to the producer",
      description:
        "Records move through bounded stream stages toward S3 while a pressure signal travels in the opposite direction when the destination slows.",
      caption:
        "The pipeline stays memory-bounded because a slow destination reduces the capacity available to every upstream stage.",
      eyebrow: "DATA RIGHT · PRESSURE LEFT",
      labels: {
        source: "ELASTICSEARCH",
        buffer: "BOUNDED BUFFER",
        transform: "TRANSFORM",
        upload: "S3 MULTIPART",
        data: "DATA",
        pressure: "BACKPRESSURE",
      },
    },
    "debounce-trigger-storm": {
      title: "Debounce collapses a trigger storm into predictable work",
      description:
        "Repeated events enter a debounce boundary and become one execution, while rescheduling moves the execution after the quiet period.",
      caption:
        "Time-frame groups a burst into one unit. Reschedule keeps moving the same unit until the system becomes quiet.",
      eyebrow: "TRIGGER STORM · TWO SEMANTICS",
      labels: {
        triggers: "TRIGGERS",
        timeFrame: "TIME-FRAME",
        reschedule: "RESCHEDULE",
        oneJob: "1 JOB",
        quiet: "QUIET PERIOD",
        collapse: "COLLAPSE",
      },
    },
    "ci-reconciliation-meme": {
      title: "A CI meme about parallel jobs and artifact reconciliation",
      description:
        "A two-panel engineering meme: parallel test jobs finish quickly, then one reconciliation gate waits for every artifact.",
      caption:
        "Parallelism made the tests faster. Artifact reconciliation became the new system that had to be made reliable.",
      eyebrow: "THE CI PLOT TWIST",
      labels: {
        before: "ME: FASTER CI",
        after: "ALSO ME: RECONCILIATION",
        jobs: "10 TEST JOBS",
        gate: "ONE ARTIFACT GATE",
        fast: "FAST",
        waiting: "STILL WAITING",
      },
    },
    "ai-review-meme": {
      title: "An engineering meme about AI-generated code and human review",
      description:
        "A two-panel illustration contrasts instant AI-generated code with the slower human work of checking context, risk, and correctness.",
      caption:
        "AI reduced the cost of producing code. It did not remove the cost of deciding whether the code should ship.",
      eyebrow: "THE NEW BOTTLENECK",
      labels: {
        ai: "AI",
        generated: "500 LINES · 3 SECONDS",
        human: "HUMAN REVIEW",
        context: "CONTEXT",
        risk: "RACE CONDITION?",
        ship: "SHIP",
      },
    },
    "product-os-loop": {
      title: "The Product OS carries context in a continuous loop",
      description:
        "A product decision moves through discovery, design, implementation, review, release, and learning before informing the next decision.",
      caption:
        "The loop is valuable when every stage leaves the next stage with usable, reviewable context.",
      eyebrow: "CONTEXT THAT SURVIVES THE HANDOFF",
      labels: {
        discover: "DISCOVER",
        decide: "DECIDE",
        design: "DESIGN",
        build: "BUILD",
        review: "REVIEW",
        release: "RELEASE",
        learn: "LEARN",
      },
    },
    "document-lifecycle-motion": {
      title: "A document lifecycle makes drift visible",
      description:
        "A document moves from decision to active reference, then a change triggers review before it is renewed, superseded, or archived.",
      caption:
        "A document becomes trustworthy when the event that can make it false also triggers its review.",
      eyebrow: "DOCUMENTS NEED A LIFECYCLE",
      labels: {
        decision: "DECISION",
        active: "ACTIVE",
        trigger: "CHANGE",
        review: "REVIEW",
        supersede: "SUPERSEDE",
        archive: "ARCHIVE",
      },
    },
  },
  fr: {
    "sse-polling-vs-stream": {
      title: "Le polling répète les requêtes tandis que le SSE garde une connexion sortante ouverte",
      description:
        "Comparaison statique entre un agent qui interroge sans cesse le serveur et un agent qui ouvre une connexion HTTPS recevant les événements SSE du plan de contrôle.",
      caption:
        "Le polling répète les requêtes de l'agent et reçoit « aucun changement ». Le SSE ouvre une connexion sortante ; le plan de contrôle n'envoie un événement qu'en cas de changement.",
      eyebrow: "DEUX FAÇONS DE TRANSPORTER UNE MISE À JOUR",
      labels: {
        polling: "POLLING",
        sse: "SSE",
        agent: "AGENT",
        server: "CONTROL PLANE",
        request: "REQUÊTE",
        response: "AUCUN CHANGEMENT",
        open: "OUVERTURE HTTPS GET",
        event: "ÉVÉNEMENT UNIQUEMENT",
        cadence: "TOUTES LES 5 s",
        repeat: "RÉPÈTE SANS CHANGEMENT",
        connection: "UNE CONNEXION OUVERTE",
        send: "ENVOIE SI ÉVÉNEMENT",
      },
    },
    "sse-reconnect-storm": {
      title: "Des connexions SSE longues peuvent transformer un déploiement en tempête de reconnexions",
      description:
        "Les connexions SSE ouvertes consomment en continu de la capacité serveur ; un déploiement peut les libérer d'un coup, tandis que le jitter étale les reconnexions sur une fenêtre absorbable par le plan de contrôle.",
      caption:
        "La connexion reste ouverte jusqu'au drain du déploiement. Sans jitter, les reconnexions forment un pic ; avec jitter, la charge reste sous la capacité serveur.",
      eyebrow: "CONNEXIONS LONGUES · CHARGE DE RECONNEXION",
      labels: {
        open: "SSE OUVERT",
        agents: "AGENTS",
        control: "PLAN DE CONTRÔLE",
        heartbeat: "HEARTBEAT",
        deploy: "DÉPLOIEMENT / DRAIN",
        spike: "PIC DE CHARGE",
        burst: "TOUS RECONNECTENT",
        jitter: "BACKOFF + JITTER",
        window: "FENÊTRE · 1–10 s",
        capacity: "CAPACITÉ SERVEUR",
        absorbed: "CHARGE ABSORBÉE",
        now: "MAINTENANT",
        later: "PLUS TARD",
      },
    },
    "redis-memory-pressure": {
      title: "Un seul pool mémoire Redis peut faire tomber plusieurs usages ensemble",
      description:
        "Une jauge mémoire se remplit tandis que le cache, les queues, l'authentification et la sécurité partagent une instance Redis, puis la limite commune casse chaque usage.",
      caption:
        "La panne n'était pas composée de quatre défaillances indépendantes. C'était une seule frontière mémoire épuisée et partagée par quatre responsabilités.",
      eyebrow: "UN POOL MÉMOIRE · QUATRE BLAST RADII",
      labels: {
        cache: "CACHE",
        queues: "QUEUES",
        auth: "AUTH",
        security: "SÉCURITÉ",
        memory: "MÉMOIRE",
        limit: "LIMITE",
        isolate: "ISOLER",
      },
    },
    "backpressure-propagation": {
      title: "La backpressure remonte de l'upload lent jusqu'au producteur",
      description:
        "Les enregistrements avancent dans des étapes bornées vers S3 tandis qu'un signal de pression repart en sens inverse lorsque la destination ralentit.",
      caption:
        "Le pipeline garde une mémoire bornée parce qu'une destination lente réduit la capacité disponible pour chaque étape en amont.",
      eyebrow: "DONNÉES À DROITE · PRESSION À GAUCHE",
      labels: {
        source: "ELASTICSEARCH",
        buffer: "BUFFER BORNÉ",
        transform: "TRANSFORM",
        upload: "S3 MULTIPART",
        data: "DONNÉES",
        pressure: "BACKPRESSURE",
      },
    },
    "debounce-trigger-storm": {
      title: "Le debounce transforme une tempête de triggers en travail prévisible",
      description:
        "Des événements répétés traversent une frontière de debounce et deviennent une seule exécution, tandis que le reschedule repousse l'exécution après le calme.",
      caption:
        "Le time-frame regroupe une rafale en une unité. Le reschedule déplace cette même unité jusqu'à ce que le système redevienne calme.",
      eyebrow: "TEMPÊTE DE TRIGGERS · DEUX SÉMANTIQUES",
      labels: {
        triggers: "TRIGGERS",
        timeFrame: "TIME-FRAME",
        reschedule: "RESCHEDULE",
        oneJob: "1 JOB",
        quiet: "PÉRIODE CALME",
        collapse: "REGROUPER",
      },
    },
    "ci-reconciliation-meme": {
      title: "Un meme d'ingénierie sur les jobs parallèles et la réconciliation des artefacts",
      description:
        "Un meme en deux panneaux : les jobs de test parallèles terminent rapidement, puis une gate de réconciliation attend chaque artefact.",
      caption:
        "Le parallélisme a accéléré les tests. La réconciliation des artefacts est devenue le nouveau système à rendre fiable.",
      eyebrow: "LE TWIST DU PIPELINE CI",
      labels: {
        before: "MOI : CI PLUS RAPIDE",
        after: "MOI AUSSI : RÉCONCILIATION",
        jobs: "10 JOBS DE TEST",
        gate: "UNE GATE D'ARTEFACTS",
        fast: "RAPIDE",
        waiting: "TOUJOURS EN ATTENTE",
      },
    },
    "ai-review-meme": {
      title: "Un meme d'ingénierie sur le code généré par IA et la revue humaine",
      description:
        "Une illustration en deux panneaux oppose le code généré instantanément par l'IA au travail humain plus lent de vérification du contexte, du risque et de la correction.",
      caption:
        "L'IA a réduit le coût de production du code. Elle n'a pas supprimé le coût de décider si ce code doit partir en production.",
      eyebrow: "LE NOUVEAU GOULOT D'ÉTRANGLEMENT",
      labels: {
        ai: "IA",
        generated: "500 LIGNES · 3 SECONDES",
        human: "REVUE HUMAINE",
        context: "CONTEXTE",
        risk: "RACE CONDITION ?",
        ship: "LIVRER",
      },
    },
    "product-os-loop": {
      title: "Le Product OS transporte le contexte dans une boucle continue",
      description:
        "Une décision produit traverse découverte, conception, implémentation, revue, livraison et apprentissage avant d'alimenter la décision suivante.",
      caption:
        "La boucle crée du levier lorsque chaque étape laisse à la suivante un contexte utilisable et vérifiable.",
      eyebrow: "UN CONTEXTE QUI SURVIT AUX PASSAGES DE RELAIS",
      labels: {
        discover: "DÉCOUVRIR",
        decide: "DÉCIDER",
        design: "CONCEVOIR",
        build: "CONSTRUIRE",
        review: "REVOIR",
        release: "LIVRER",
        learn: "APPRENDRE",
      },
    },
    "document-lifecycle-motion": {
      title: "Un cycle de vie rend la dérive documentaire visible",
      description:
        "Un document passe de la décision à la référence active, puis un changement déclenche une revue avant son renouvellement, son remplacement ou son archivage.",
      caption:
        "Un document devient fiable lorsque l'événement qui peut le rendre faux déclenche aussi sa revue.",
      eyebrow: "LES DOCUMENTS ONT BESOIN D'UN CYCLE DE VIE",
      labels: {
        decision: "DÉCISION",
        active: "ACTIVE",
        trigger: "CHANGEMENT",
        review: "REVUE",
        supersede: "REMPLACER",
        archive: "ARCHIVER",
      },
    },
  },
};

type MediaSceneProps = {
  copy: MediaCopy;
  markerId: string;
};

function MediaFrame({ copy, markerId, children }: MediaSceneProps & { children: ReactNode }) {
  return (
    <>
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0 0L8 4L0 8Z" className="article-media-arrow" />
        </marker>
        <marker id={`${markerId}-hot`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0 0L8 4L0 8Z" className="article-media-arrow-hot" />
        </marker>
      </defs>
      <rect width="900" height="360" rx="20" className="article-media-surface" />
      <path d="M0 72H900M0 144H900M0 216H900M0 288H900M90 0V360M180 0V360M270 0V360M360 0V360M450 0V360M540 0V360M630 0V360M720 0V360M810 0V360" className="article-media-grid" />
      <text x="34" y="38" className="article-media-eyebrow">{copy.eyebrow}</text>
      {children}
    </>
  );
}

function MediaNode({
  label,
  tone = "default",
  width = 146,
  x,
  y,
}: {
  label: string;
  tone?: "default" | "hot" | "success" | "danger";
  width?: number;
  x: number;
  y: number;
}) {
  return (
    <g className={`article-media-node article-media-node-${tone}`}>
      <rect x={x} y={y} width={width} height="52" rx="14" />
      <text x={x + width / 2} y={y + 32} textAnchor="middle">{label}</text>
    </g>
  );
}

function PollingVsStream({ copy, markerId }: MediaSceneProps) {
  const label = (key: string) => copy.labels[key] ?? "";
  return (
    <MediaFrame copy={copy} markerId={markerId}>
      <rect x="34" y="58" width="392" height="244" rx="8" className="article-media-boundary" />
      <rect x="474" y="58" width="392" height="244" rx="8" className="article-media-boundary" />
      <rect x="50" y="66" width="140" height="24" rx="4" className="article-media-label-mask" />
      <rect x="490" y="66" width="100" height="24" rx="4" className="article-media-label-mask" />
      <text x="58" y="84" className="article-media-label">{label("polling")}</text>
      <text x="498" y="84" className="article-media-label">{label("sse")}</text>

      <MediaNode x={62} y={132} label={label("agent")} width={132} />
      <MediaNode x={274} y={132} label={label("server")} width={144} tone="hot" />
      <MediaNode x={502} y={132} label={label("agent")} width={132} />
      <MediaNode x={714} y={132} label={label("server")} width={144} tone="success" />

      <path d="M194 148H274" className="article-media-route" markerEnd={`url(#${markerId})`} />
      <path d="M274 188H194" className="article-media-route article-media-route-muted" markerEnd={`url(#${markerId})`} />
      <path d="M634 148H714" className="article-media-route article-media-route-hot" markerEnd={`url(#${markerId})`} />
      <path d="M714 188H634" className="article-media-route article-media-route-success" markerEnd={`url(#${markerId})`} />

      <rect x="194" y="100" width="96" height="24" rx="4" className="article-media-label-mask" />
      <text x="242" y="118" textAnchor="middle" className="article-media-micro">{label("request")}</text>
      <rect x="194" y="204" width="112" height="24" rx="4" className="article-media-label-mask" />
      <text x="250" y="222" textAnchor="middle" className="article-media-micro">{label("response")}</text>

      <rect x="610" y="100" width="144" height="24" rx="4" className="article-media-label-mask" />
      <text x="682" y="118" textAnchor="middle" className="article-media-micro">{label("open")}</text>
      <rect x="630" y="204" width="132" height="24" rx="4" className="article-media-label-mask" />
      <text x="696" y="222" textAnchor="middle" className="article-media-micro">{label("event")}</text>

      <text x="230" y="258" textAnchor="middle" className="article-media-note article-media-note-danger">{label("cadence")}</text>
      <text x="230" y="282" textAnchor="middle" className="article-media-micro">{label("repeat")}</text>
      <text x="670" y="258" textAnchor="middle" className="article-media-note article-media-note-success">{label("connection")}</text>
      <text x="670" y="282" textAnchor="middle" className="article-media-micro">{label("send")}</text>
    </MediaFrame>
  );
}

function ReconnectStorm({ copy, markerId }: MediaSceneProps) {
  const label = (key: string) => copy.labels[key] ?? "";
  const openLanes = [126, 144, 162, 180];
  const jitterBars = [538, 588, 642, 698, 754, 808];
  const jitterHeights = [14, 22, 12, 20, 16, 18];
  const burstPulseY = [244, 252, 260];
  return (
    <MediaFrame copy={copy} markerId={markerId}>
      <rect x="34" y="58" width="392" height="244" rx="8" className="article-media-boundary" />
      <rect x="474" y="58" width="392" height="244" rx="8" className="article-media-boundary" />
      <rect x="50" y="66" width="150" height="24" rx="4" className="article-media-label-mask" />
      <rect x="490" y="66" width="164" height="24" rx="4" className="article-media-label-mask" />
      <text x="58" y="84" className="article-media-label">{label("open")}</text>
      <text x="498" y="84" className="article-media-label">{label("jitter")}</text>

      <MediaNode x={54} y={100} label={label("agents")} width={118} />
      <MediaNode x={270} y={100} label={label("control")} width={128} tone="success" />
      <text x="220" y="94" textAnchor="middle" className="article-media-micro">{label("heartbeat")}</text>
      {openLanes.map((y, index) => (
        <g key={y} className="article-media-live-connection">
          <path d={`M172 ${y}H270`} className="article-media-route article-media-route-open" />
          <circle cx="184" cy={y} r="5" className={`article-media-heartbeat article-media-delay-${index % 3}`} />
        </g>
      ))}

      <MediaNode x={54} y={226} label={label("deploy")} width={134} tone="hot" />
      <path d="M188 252H270" className="article-media-route article-media-route-hot" markerEnd={`url(#${markerId}-hot)`} />
      <MediaNode x={270} y={226} label={label("spike")} width={128} tone="danger" />
      {burstPulseY.map((y, index) => (
        <circle key={y} cx={198} cy={y} r="6" className={`article-media-burst-pulse article-media-delay-${index}`} />
      ))}
      <text x="230" y="298" textAnchor="middle" className="article-media-note article-media-note-danger">{label("burst")}</text>

      <MediaNode x={606} y={100} label={label("control")} width={150} tone="success" />
      <text x="680" y="176" textAnchor="middle" className="article-media-micro">{label("capacity")}</text>
      <path d="M526 184H834" className="article-media-capacity-track" />
      <path d="M526 184H770" className="article-media-capacity-limit" />
      <text x="526" y="216" className="article-media-micro">{label("window")}</text>
      <path d="M526 246H834" className="article-media-timeline" />
      {jitterBars.map((x, index) => (
        <g key={x} className={`article-media-jitter-bar article-media-jitter-bar-${index}`}>
          <rect x={x} y={246 - (jitterHeights[index] ?? 0)} width="14" height={jitterHeights[index] ?? 0} rx="4" />
          <circle cx={x + 7} cy="246" r="6" className="article-media-agent-dot-success" />
        </g>
      ))}
      <text x="526" y="274" className="article-media-micro">{label("now")}</text>
      <text x="834" y="274" textAnchor="end" className="article-media-micro">{label("later")}</text>
      <text x="680" y="298" textAnchor="middle" className="article-media-note article-media-note-success">{label("absorbed")}</text>
    </MediaFrame>
  );
}

function RedisMemoryPressure({ copy, markerId }: MediaSceneProps) {
  const label = (key: string) => copy.labels[key] ?? "";
  const workloads = [
    { key: "cache", x: 72, y: 122 },
    { key: "queues", x: 72, y: 208 },
    { key: "auth", x: 286, y: 122 },
    { key: "security", x: 286, y: 208 },
  ];
  return (
    <MediaFrame copy={copy} markerId={markerId}>
      <rect x="48" y="92" width="468" height="210" rx="26" className="article-media-boundary" />
      <text x="282" y="116" textAnchor="middle" className="article-media-label">REDIS</text>
      {workloads.map(({ key, x, y }) => (
        <g key={key}>
          <MediaNode x={x} y={y} label={label(key)} width={160} />
          <rect x={x + 18} y={y + 39} width="124" height="5" rx="3" className="article-media-memory-track" />
          <rect x={x + 18} y={y + 39} width="124" height="5" rx="3" className="article-media-memory-fill" />
        </g>
      ))}
      <path d="M516 196H612" className="article-media-route article-media-route-danger" markerEnd={`url(#${markerId})`} />
      <g className="article-media-gauge">
        <rect x="612" y="104" width="214" height="184" rx="26" className="article-media-boundary article-media-boundary-danger" />
        <text x="719" y="138" textAnchor="middle" className="article-media-label">{label("memory")}</text>
        <rect x="690" y="156" width="58" height="102" rx="12" className="article-media-gauge-track" />
        <rect x="698" y="164" width="42" height="86" rx="8" className="article-media-gauge-fill" />
        <path d="M674 250H764" className="article-media-gauge-limit" />
        <text x="719" y="278" textAnchor="middle" className="article-media-micro">{label("limit")}</text>
      </g>
      <text x="430" y="330" textAnchor="middle" className="article-media-note article-media-note-danger">{label("isolate")}</text>
    </MediaFrame>
  );
}

function BackpressurePropagation({ copy, markerId }: MediaSceneProps) {
  const label = (key: string) => copy.labels[key] ?? "";
  const nodes = [
    { key: "source", x: 52, width: 150 },
    { key: "buffer", x: 256, width: 150 },
    { key: "transform", x: 460, width: 150 },
    { key: "upload", x: 664, width: 166 },
  ];
  return (
    <MediaFrame copy={copy} markerId={markerId}>
      {nodes.map(({ key, x, width }, index) => (
        <g key={key}>
          <MediaNode x={x} y={142} label={label(key)} width={width} tone={index === 3 ? "hot" : "default"} />
          {index > 0 ? <rect x={x + 22} y={205} width={width - 44} height="25" rx="8" className="article-media-buffer-track" /> : null}
          {index > 0 ? <rect x={x + 22} y={205} width={index === 3 ? width - 44 : 38} height="25" rx="8" className={`article-media-buffer-fill ${index === 3 ? "article-media-buffer-fill-hot" : ""}`} /> : null}
          {index < nodes.length - 1 ? <path d={`M${x + width} 168H${nodes[index + 1]!.x}`} className="article-media-route" markerEnd={`url(#${markerId})`} /> : null}
        </g>
      ))}
      <circle cx="218" cy="168" r="9" className="article-media-packet article-media-data-packet" />
      <circle cx="422" cy="168" r="9" className="article-media-packet article-media-data-packet article-media-delay-1" />
      <circle cx="626" cy="168" r="9" className="article-media-packet article-media-data-packet article-media-delay-2" />
      <path d="M790 256C650 326 280 326 110 256" className="article-media-pressure-line" markerEnd={`url(#${markerId})`} />
      <text x="450" y="314" textAnchor="middle" className="article-media-note article-media-note-danger">{label("pressure")}</text>
      <text x="450" y="108" textAnchor="middle" className="article-media-note">{label("data")}</text>
    </MediaFrame>
  );
}

function DebounceTriggerStorm({ copy, markerId }: MediaSceneProps) {
  const label = (key: string) => copy.labels[key] ?? "";
  return (
    <MediaFrame copy={copy} markerId={markerId}>
      <text x="104" y="88" textAnchor="middle" className="article-media-label">{label("triggers")}</text>
      {[118, 148, 178, 208, 238, 268].map((y, index) => (
        <circle key={y} cx={104} cy={y} r="10" className={`article-media-trigger article-media-trigger-${index % 3}`} />
      ))}
      <path d="M120 196H250" className="article-media-route" markerEnd={`url(#${markerId})`} />
      <rect x="250" y="116" width="188" height="160" rx="24" className="article-media-boundary article-media-boundary-hot" />
      <text x="344" y="148" textAnchor="middle" className="article-media-label">{label("timeFrame")}</text>
      <circle cx="344" cy="202" r="30" className="article-media-gate" />
      <path d="M326 202L340 216L365 184" className="article-media-check" />
      <path d="M438 196H542" className="article-media-route" markerEnd={`url(#${markerId})`} />
      <MediaNode x={542} y={170} label={label("oneJob")} width={142} tone="success" />
      <text x="344" y="310" textAnchor="middle" className="article-media-note">{label("collapse")}</text>
      <path d="M536 292H786" className="article-media-timeline" />
      <circle cx="574" cy="292" r="9" className="article-media-trigger article-media-trigger-reschedule" />
      <circle cx="638" cy="292" r="9" className="article-media-trigger article-media-trigger-reschedule article-media-delay-1" />
      <circle cx="702" cy="292" r="9" className="article-media-trigger article-media-trigger-reschedule article-media-delay-2" />
      <text x="660" y="252" textAnchor="middle" className="article-media-micro">{label("reschedule")} · {label("quiet")}</text>
    </MediaFrame>
  );
}

function CiReconciliationMeme({ copy, markerId }: MediaSceneProps) {
  const label = (key: string) => copy.labels[key] ?? "";
  return (
    <MediaFrame copy={copy} markerId={markerId}>
      <rect x="44" y="68" width="390" height="246" rx="22" className="article-media-panel" />
      <rect x="466" y="68" width="390" height="246" rx="22" className="article-media-panel article-media-panel-hot" />
      <text x="72" y="110" className="article-media-meme-title">{label("before")}</text>
      {[132, 168, 204, 240].map((y, index) => (
        <g key={y} className={`article-media-ci-job article-media-ci-job-${index}`}>
          <rect x="76" y={y} width="270" height="24" rx="8" className="article-media-chip" />
          <circle cx="94" cy={y + 12} r="5" className="article-media-dot-success" />
          <text x="112" y={y + 17} className="article-media-micro">{label("jobs")}</text>
        </g>
      ))}
      <text x="72" y="284" className="article-media-note article-media-note-success">{label("fast")}</text>
      <text x="494" y="110" className="article-media-meme-title">{label("after")}</text>
      <path d="M532 146H798M532 184H798M532 222H798M532 260H798" className="article-media-reconcile-line" />
      <circle cx="548" cy="146" r="7" className="article-media-dot-success" />
      <circle cx="548" cy="184" r="7" className="article-media-dot-success" />
      <circle cx="548" cy="222" r="7" className="article-media-dot-success" />
      <circle cx="548" cy="260" r="7" className="article-media-dot-success" />
      <MediaNode x={658} y={160} label={label("gate")} width={164} tone="hot" />
      <path d="M604 202H658" className="article-media-route article-media-route-hot" markerEnd={`url(#${markerId})`} />
      <text x="661" y="284" textAnchor="middle" className="article-media-note article-media-note-danger">{label("waiting")}</text>
    </MediaFrame>
  );
}

function AiReviewMeme({ copy, markerId }: MediaSceneProps) {
  const label = (key: string) => copy.labels[key] ?? "";
  return (
    <MediaFrame copy={copy} markerId={markerId}>
      <rect x="44" y="68" width="390" height="246" rx="22" className="article-media-panel" />
      <rect x="466" y="68" width="390" height="246" rx="22" className="article-media-panel article-media-panel-hot" />
      <text x="72" y="112" className="article-media-meme-title">{label("ai")}</text>
      <text x="72" y="138" className="article-media-micro">{label("generated")}</text>
      {[166, 190, 214, 238, 262].map((y, index) => (
        <rect key={y} x="76" y={y} width={236 + (index % 2) * 38} height="12" rx="6" className="article-media-code-line article-media-code-line-ai" />
      ))}
      <path d="M350 156L392 198L350 240" className="article-media-arrow article-media-arrow-large" />
      <text x="494" y="112" className="article-media-meme-title">{label("human")}</text>
      <text x="494" y="138" className="article-media-micro">{label("context")}</text>
      <rect x="498" y="166" width="278" height="90" rx="16" className="article-media-chip" />
      <circle cx="532" cy="210" r="22" className="article-media-review-lens" />
      <path d="M548 226L570 248" className="article-media-review-handle" />
      <path d="M596 192H742M596 218H704M596 244H728" className="article-media-review-lines" />
      <text x="636" y="292" textAnchor="middle" className="article-media-note article-media-note-danger">{label("risk")}</text>
      <MediaNode x={746} y={274} label={label("ship")} width={82} tone="success" />
    </MediaFrame>
  );
}

function ProductOsLoop({ copy, markerId }: MediaSceneProps) {
  const label = (key: string) => copy.labels[key] ?? "";
  const points = [
    { key: "discover", x: 450, y: 84 },
    { key: "decide", x: 664, y: 132 },
    { key: "design", x: 756, y: 250 },
    { key: "build", x: 616, y: 310 },
    { key: "review", x: 284, y: 310 },
    { key: "release", x: 144, y: 250 },
    { key: "learn", x: 236, y: 132 },
  ];
  return (
    <MediaFrame copy={copy} markerId={markerId}>
      <circle cx="450" cy="210" r="72" className="article-media-loop-core" />
      <text x="450" y="204" textAnchor="middle" className="article-media-label">PRODUCT</text>
      <text x="450" y="228" textAnchor="middle" className="article-media-micro">OS</text>
      {points.map((point, index) => {
        const next = points[(index + 1) % points.length]!;
        return (
          <g key={point.key}>
            <path d={`M${point.x} ${point.y}Q450 210 ${next.x} ${next.y}`} className="article-media-loop-route" markerEnd={`url(#${markerId})`} />
            <circle cx={point.x} cy={point.y} r="25" className="article-media-loop-node" />
            <text x={point.x} y={point.y + (point.y < 150 ? -34 : 48)} textAnchor="middle" className="article-media-micro">{label(point.key)}</text>
          </g>
        );
      })}
      <circle cx="450" cy="84" r="9" className="article-media-loop-pulse" />
    </MediaFrame>
  );
}

function DocumentLifecycleMotion({ copy, markerId }: MediaSceneProps) {
  const label = (key: string) => copy.labels[key] ?? "";
  return (
    <MediaFrame copy={copy} markerId={markerId}>
      <MediaNode x={52} y={152} label={label("decision")} width={134} />
      <path d="M186 178H278" className="article-media-route" markerEnd={`url(#${markerId})`} />
      <g className="article-media-document-card article-media-document-active">
        <rect x="278" y="112" width="178" height="132" rx="18" />
        <path d="M306 154H420M306 178H402M306 202H428" className="article-media-document-lines" />
        <text x="367" y="224" textAnchor="middle" className="article-media-micro">{label("active")}</text>
      </g>
      <path d="M456 178H548" className="article-media-route" markerEnd={`url(#${markerId})`} />
      <circle cx="548" cy="178" r="28" className="article-media-trigger article-media-trigger-reschedule article-media-pulse" />
      <text x="548" y="236" textAnchor="middle" className="article-media-micro">{label("trigger")}</text>
      <path d="M576 178H650" className="article-media-route article-media-route-hot" markerEnd={`url(#${markerId})`} />
      <MediaNode x={650} y={112} label={label("review")} width={166} tone="hot" />
      <path d="M734 164V92" className="article-media-route article-media-route-success" markerEnd={`url(#${markerId})`} />
      <MediaNode x={650} y={228} label={label("supersede")} width={166} />
      <path d="M734 228V300" className="article-media-route article-media-route-muted" markerEnd={`url(#${markerId})`} />
      <text x="734" y="342" textAnchor="middle" className="article-media-micro">{label("archive")}</text>
    </MediaFrame>
  );
}

const SCENES: Record<ArticleMediaId, (props: MediaSceneProps) => ReactNode> = {
  "sse-polling-vs-stream": PollingVsStream,
  "sse-reconnect-storm": ReconnectStorm,
  "redis-memory-pressure": RedisMemoryPressure,
  "backpressure-propagation": BackpressurePropagation,
  "debounce-trigger-storm": DebounceTriggerStorm,
  "ci-reconciliation-meme": CiReconciliationMeme,
  "ai-review-meme": AiReviewMeme,
  "product-os-loop": ProductOsLoop,
  "document-lifecycle-motion": DocumentLifecycleMotion,
};

export function ArticleMedia({ mediaId }: { mediaId: ArticleMediaId }) {
  const { i18n } = useTranslation();
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language);
  const copy = MEDIA_COPY[locale][mediaId];
  const instanceId = useId().replaceAll(":", "");
  const markerId = `article-media-${instanceId}-arrow`;
  const titleId = `${instanceId}-title`;
  const descriptionId = `${instanceId}-description`;
  const Scene = SCENES[mediaId];

  return (
    <figure className={`post-visual article-media article-media-${mediaId}`} data-article-media={mediaId}>
      <svg
        viewBox="0 0 900 360"
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
        className="article-media-svg"
      >
        <title id={titleId}>{copy.title}</title>
        <desc id={descriptionId}>{copy.description}</desc>
        <Scene copy={copy} markerId={markerId} />
      </svg>
      <figcaption>{copy.caption}</figcaption>
    </figure>
  );
}
