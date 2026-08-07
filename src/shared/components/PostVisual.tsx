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
    "agent-battle-2026": {
      title: "Comparaison des agents de développement",
      description: "Trois agents sont comparés par leur valeur de workflow, leur contexte d'exécution et leur économie d'infrastructure.",
      caption: "La valeur d'un agent dépend du workflow complet, pas seulement de la vitesse de génération.",
      labels: { a: "Intention", b: "Agent", c: "Workflow", d: "Infrastructure", e: "Valeur" },
    },
    "ai-force-multiplier": {
      title: "De l'exécution à l'orchestration",
      description: "Le rôle de l'ingénieur évolue de l'écriture de code vers l'orchestration de systèmes et de décisions.",
      caption: "L'accélération déplace le travail utile vers la composition, la validation et le jugement.",
      labels: { a: "Exécuter", b: "Composer", c: "Orchestrer", d: "Valider", e: "Impact" },
    },
    "backend-to-data-engineer-rockfi": {
      title: "Orchestration des fondations data",
      description: "Les sources sont transformées en modèles gouvernés puis exposées dans l'entrepôt par une orchestration explicite.",
      caption: "Le changement de rôle relie code applicatif, orchestration et qualité des données.",
      labels: { a: "Sources", b: "Dagster", c: "Modèles", d: "Entrepôt", e: "Décisions" },
    },
    "claude-code-product-os": {
      title: "De l'expérimentation au Product OS",
      description: "Des pratiques individuelles deviennent un système partagé de décision, de livraison et de revue.",
      caption: "Le Product OS rend le chemin vers une release relisible et reproductible.",
      labels: { a: "Challenge", b: "Pratique", c: "Plugin", d: "Revue", e: "Release" },
    },
    "context-engineering-beyond-prompt-engineering": {
      title: "Pile de contexte autorisée",
      description: "Un agent fiable combine état courant, permissions, fraîcheur, provenance et validation avant l'action.",
      caption: "Un prompt ne compense pas un contexte absent, périmé ou non autorisé.",
      labels: { a: "État", b: "Accès", c: "Fraîcheur", d: "Provenance", e: "Validation" },
    },
    "engineering-2026-ai-redefined-our-job": {
      title: "Boucle d'ingénierie multi-outils",
      description: "L'intention traverse plusieurs outils avant une modification revue et intégrée.",
      caption: "Les outils changent, mais la boucle reste centrée sur le raisonnement et la revue.",
      labels: { a: "Intention", b: "Explorer", c: "Construire", d: "Tester", e: "Revoir" },
    },
    "engineering-documents-age-poorly": {
      title: "Cycle de vie d'un document d'ingénierie",
      description: "Une documentation utile expose sa décision, son owner, ses preuves et ses conditions d'expiration.",
      caption: "La durée de vie d'un document dépend de ses preuves et de sa maintenance explicite.",
      labels: { a: "Décision", b: "Owner", c: "Preuves", d: "Expiration", e: "Révision" },
    },
    "forest-admin-activity-logs-elasticsearch": {
      title: "Migration hybride des logs d'activité",
      description: "Les événements passent de PostgreSQL vers Elasticsearch pour conserver l'audit tout en améliorant la recherche à grande échelle.",
      caption: "La migration sépare l'écriture fiable de la recherche performante.",
      labels: { a: "PostgreSQL", b: "Ingestion", c: "Migration", d: "Elasticsearch", e: "Recherche" },
    },
    "idempotency-debounce-jobify-bullmq": {
      title: "Contrat idempotent pour les jobs",
      description: "Une identité déterministe et une fenêtre de debounce contrôlent les reschedules et l'exécution worker.",
      caption: "L'identité du job rend les retries et les déclenchements rapprochés observables et sûrs.",
      labels: { a: "Événement", b: "Job ID", c: "Debounce", d: "Worker", e: "Résultat" },
    },
    "jobify-workers-queues-nestjs": {
      title: "Pipeline typé de jobs et workers",
      description: "Une commande passe par une queue et un runner typé avant un traitement séquentiel et un export contrôlé.",
      caption: "Le contrat du runner rend l'exécution et les opérations de queue explicites.",
      labels: { a: "Commande", b: "Queue", c: "Runner", d: "Worker", e: "Export" },
    },
    "joining-rockfi": {
      title: "Trajectoire vers une plateforme de wealth management",
      description: "Une trajectoire backend converge vers une mission de structuration technique pour la gestion de fortune.",
      caption: "La trajectoire professionnelle relie expérience, responsabilité et mission produit.",
      labels: { a: "Backend", b: "Staff", c: "Fondations", d: "Plateforme", e: "Mission" },
    },
    "nodejs-stream-backpressure-history-export": {
      title: "Export résilient sous contrainte de mémoire",
      description: "Les données traversent des stages de stream avec backpressure, concurrence bornée et multipart S3.",
      caption: "La pression est propagée jusqu'à la destination pour éviter l'explosion mémoire.",
      labels: { a: "Historique", b: "Transform", c: "Backpressure", d: "Multipart", e: "S3" },
    },
    "polymagine-industry-4-eyewear-2017": {
      title: "Chaîne de fitting augmenté",
      description: "Un scan biométrique devient un maillage 3D puis une expérience de fitting AR/VR en temps réel.",
      caption: "La contrainte de latence relie capture, géométrie et expérience utilisateur.",
      labels: { a: "Scan", b: "Mesures", c: "Maillage 3D", d: "AR / VR", e: "Fitting" },
    },
    "postgresql-unique-nulls": {
      title: "Décision d'unicité avec NULL",
      description: "PostgreSQL évalue la collision d'une contrainte unique selon la sémantique choisie pour les valeurs NULL.",
      caption: "NULLS NOT DISTINCT transforme la règle de conflit en contrat explicite.",
      labels: { a: "Clé", b: "NULL", c: "Collision", d: "ON CONFLICT", e: "Mise à jour" },
    },
    "rebuilding-cloud-experience-forest-admin": {
      title: "Chemin d'exécution cloud sous contraintes",
      description: "Le trafic traverse Lambda, les couches VPC et le réseau avant d'atteindre une base dont les pools limitent l'échelle.",
      caption: "Le serverless déplace les contraintes vers le réseau, le démarrage et la capacité base de données.",
      labels: { a: "Client", b: "Lambda", c: "VPC / NAT", d: "Pool", e: "Base" },
    },
    "redis-memory-exhaustion-post-mortem": {
      title: "Convergence des charges dans Redis",
      description: "Cache, queues et sessions partagent la même mémoire jusqu'à provoquer éviction, saturation et panne.",
      caption: "Des cycles de vie différents ne doivent pas être forcés dans une même enveloppe mémoire.",
      labels: { a: "Cache", b: "Queues", c: "Sessions", d: "Mémoire", e: "Isolation" },
    },
    "scaling-ci-github-actions-forest-admin": {
      title: "Pipeline CI partitionné",
      description: "Les tests sont répartis sur plusieurs jobs, puis réunis par une étape d'artefacts et une gate déterministe.",
      caption: "Le parallélisme réduit la durée seulement si la fusion reste fiable et observable.",
      labels: { a: "Tests", b: "Shards", c: "Jobs", d: "Artefacts", e: "Gate" },
    },
    "scim-user-provisioning-forest-admin": {
      title: "Provisioning SCIM à travers les IdP",
      description: "Les événements d'un fournisseur d'identité traversent SCIM, normalisation et synchronisation du cycle de vie.",
      caption: "Le standard définit le contrat, mais chaque IdP impose ses propres écarts opérationnels.",
      labels: { a: "IdP", b: "SCIM", c: "Normaliser", d: "Utilisateur", e: "Cycle de vie" },
    },
    "security-authentication-idp-openid-connect": {
      title: "Carte de fédération des identités",
      description: "Les rôles SP, IdP et agent s'articulent avec OIDC, OAuth et SAML pour propager une identité vérifiée.",
      caption: "La confiance traverse plusieurs protocoles et frontières de responsabilité.",
      labels: { a: "Agent", b: "SP", c: "IdP", d: "SAML / OIDC", e: "Accès" },
    },
    "self-service-analytics-that-doesnt-lie": {
      title: "Chaîne de confiance analytique",
      description: "Les données sources passent par des marts gouvernés et des contrats de métriques avant d'atteindre les consommateurs.",
      caption: "Un dashboard fiable dépend d'un contrat explicite pour chaque chiffre.",
      labels: { a: "Sources", b: "Marts", c: "Contrat", d: "Dashboard", e: "Décision" },
    },
    "the-onboarding-matrix-forest-admin": {
      title: "De la matrice aux factories composables",
      description: "La composition fonctionnelle remplace l'explosion de conditions par des factories et des adaptateurs de backend.",
      caption: "La composition réduit le nombre de chemins implicites à maintenir.",
      labels: { a: "Configuration", b: "Factory", c: "Adaptateur", d: "Flow", e: "Onboarding" },
    },
    "unknown-unknowns-software-architecture": {
      title: "Rendre les hypothèses architecturales visibles",
      description: "Les hypothèses cachées deviennent des checkpoints observables, bornés et récupérables.",
      caption: "L'architecture robuste ne prédit pas tout : elle rend les inconnus contrôlables.",
      labels: { a: "Hypothèse", b: "Signal", c: "Checkpoint", d: "Limite", e: "Récupérer" },
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
    "agent-battle-2026": {
      title: "Developer agent comparison",
      description: "Three agents are compared through workflow value, execution context, and infrastructure economics.",
      caption: "An agent's value comes from the full workflow, not generation speed alone.",
      labels: { a: "Intent", b: "Agent", c: "Workflow", d: "Infrastructure", e: "Value" },
    },
    "ai-force-multiplier": {
      title: "From execution to orchestration",
      description: "Engineering work moves from writing code toward orchestrating systems and decisions.",
      caption: "Acceleration shifts useful work toward composition, validation, and judgment.",
      labels: { a: "Execute", b: "Compose", c: "Orchestrate", d: "Validate", e: "Impact" },
    },
    "backend-to-data-engineer-rockfi": {
      title: "Orchestrating data foundations",
      description: "Sources become governed models and are exposed through the warehouse by explicit orchestration.",
      caption: "The role change connects application code, orchestration, and data quality.",
      labels: { a: "Sources", b: "Dagster", c: "Models", d: "Warehouse", e: "Decisions" },
    },
    "claude-code-product-os": {
      title: "From experimentation to a Product OS",
      description: "Individual practices become a shared system for decisions, delivery, and review.",
      caption: "A Product OS makes the path to a release explicit and repeatable.",
      labels: { a: "Challenge", b: "Practice", c: "Plugin", d: "Review", e: "Release" },
    },
    "context-engineering-beyond-prompt-engineering": {
      title: "Authorized context stack",
      description: "A reliable agent combines current state, permissions, freshness, provenance, and validation before action.",
      caption: "A prompt cannot compensate for missing, stale, or unauthorized context.",
      labels: { a: "State", b: "Access", c: "Freshness", d: "Provenance", e: "Validation" },
    },
    "engineering-2026-ai-redefined-our-job": {
      title: "Multi-tool engineering loop",
      description: "Intent crosses several tools before becoming a reviewed and integrated change.",
      caption: "Tools change, but the loop remains centered on reasoning and review.",
      labels: { a: "Intent", b: "Explore", c: "Build", d: "Test", e: "Review" },
    },
    "engineering-documents-age-poorly": {
      title: "Engineering document lifecycle",
      description: "Useful documentation exposes its decision, owner, evidence, and expiration conditions.",
      caption: "A document's lifetime depends on explicit evidence and maintenance.",
      labels: { a: "Decision", b: "Owner", c: "Evidence", d: "Expiry", e: "Revise" },
    },
    "forest-admin-activity-logs-elasticsearch": {
      title: "Hybrid activity-log migration",
      description: "Events move from PostgreSQL to Elasticsearch to preserve auditability while improving large-scale search.",
      caption: "The migration separates reliable writes from performant search.",
      labels: { a: "PostgreSQL", b: "Ingest", c: "Migrate", d: "Elasticsearch", e: "Search" },
    },
    "idempotency-debounce-jobify-bullmq": {
      title: "Idempotent job contract",
      description: "A deterministic identity and debounce window control reschedules and worker execution.",
      caption: "Job identity makes retries and near-duplicate triggers safe and observable.",
      labels: { a: "Event", b: "Job ID", c: "Debounce", d: "Worker", e: "Result" },
    },
    "jobify-workers-queues-nestjs": {
      title: "Typed jobs and worker pipeline",
      description: "A command moves through a queue and typed runner before sequential processing and controlled export.",
      caption: "The runner contract makes queue execution and operations explicit.",
      labels: { a: "Command", b: "Queue", c: "Runner", d: "Worker", e: "Export" },
    },
    "joining-rockfi": {
      title: "Trajectory toward wealth-management infrastructure",
      description: "A backend career path converges on a mission to structure technology for private wealth management.",
      caption: "The professional trajectory connects experience, responsibility, and product mission.",
      labels: { a: "Backend", b: "Staff", c: "Foundations", d: "Platform", e: "Mission" },
    },
    "nodejs-stream-backpressure-history-export": {
      title: "Resilient export under memory constraints",
      description: "Data crosses stream stages with backpressure, bounded concurrency, and S3 multipart output.",
      caption: "Pressure propagates to the destination to prevent memory exhaustion.",
      labels: { a: "History", b: "Transform", c: "Backpressure", d: "Multipart", e: "S3" },
    },
    "polymagine-industry-4-eyewear-2017": {
      title: "Augmented fitting pipeline",
      description: "A biometric scan becomes a 3D mesh and then a real-time AR/VR fitting experience.",
      caption: "The latency constraint connects capture, geometry, and user experience.",
      labels: { a: "Scan", b: "Measurements", c: "3D mesh", d: "AR / VR", e: "Fitting" },
    },
    "postgresql-unique-nulls": {
      title: "Uniqueness decision with NULL",
      description: "PostgreSQL evaluates a unique conflict according to the chosen semantics for NULL values.",
      caption: "NULLS NOT DISTINCT turns the conflict rule into an explicit contract.",
      labels: { a: "Key", b: "NULL", c: "Collision", d: "ON CONFLICT", e: "Update" },
    },
    "rebuilding-cloud-experience-forest-admin": {
      title: "Cloud execution path under constraints",
      description: "Traffic crosses Lambda, VPC layers, and the network before reaching a database whose pools limit scale.",
      caption: "Serverless moves constraints into networking, startup, and database capacity.",
      labels: { a: "Client", b: "Lambda", c: "VPC / NAT", d: "Pool", e: "Database" },
    },
    "redis-memory-exhaustion-post-mortem": {
      title: "Workload convergence in Redis",
      description: "Cache, queues, and sessions share memory until eviction, saturation, and outage occur.",
      caption: "Different lifecycles should not be forced into one memory envelope.",
      labels: { a: "Cache", b: "Queues", c: "Sessions", d: "Memory", e: "Isolation" },
    },
    "scaling-ci-github-actions-forest-admin": {
      title: "Partitioned CI pipeline",
      description: "Tests are split across jobs, then joined by artifact aggregation and a deterministic gate.",
      caption: "Parallelism reduces duration only when aggregation remains reliable and observable.",
      labels: { a: "Tests", b: "Shards", c: "Jobs", d: "Artifacts", e: "Gate" },
    },
    "scim-user-provisioning-forest-admin": {
      title: "SCIM provisioning across identity providers",
      description: "Identity-provider events cross SCIM, normalization, and lifecycle synchronization.",
      caption: "The standard defines a contract, but each IdP adds operational deviations.",
      labels: { a: "IdP", b: "SCIM", c: "Normalize", d: "User", e: "Lifecycle" },
    },
    "security-authentication-idp-openid-connect": {
      title: "Identity federation map",
      description: "SP, IdP, and agent roles connect through OIDC, OAuth, and SAML to propagate verified identity.",
      caption: "Trust crosses several protocols and responsibility boundaries.",
      labels: { a: "Agent", b: "SP", c: "IdP", d: "SAML / OIDC", e: "Access" },
    },
    "self-service-analytics-that-doesnt-lie": {
      title: "Analytical trust chain",
      description: "Source data passes through governed marts and metric contracts before reaching consumers.",
      caption: "A trustworthy dashboard depends on an explicit contract for every number.",
      labels: { a: "Sources", b: "Marts", c: "Contract", d: "Dashboard", e: "Decision" },
    },
    "the-onboarding-matrix-forest-admin": {
      title: "From matrix to composable factories",
      description: "Functional composition replaces branching explosion with factories and backend adapters.",
      caption: "Composition reduces the number of implicit paths that must be maintained.",
      labels: { a: "Configuration", b: "Factory", c: "Adapter", d: "Flow", e: "Onboarding" },
    },
    "unknown-unknowns-software-architecture": {
      title: "Making architectural assumptions visible",
      description: "Hidden assumptions become observable, bounded, and recoverable checkpoints.",
      caption: "Robust architecture does not predict everything; it makes unknowns controllable.",
      labels: { a: "Assumption", b: "Signal", c: "Checkpoint", d: "Boundary", e: "Recover" },
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

type ConceptLayout = "flow" | "stack" | "timeline" | "branch" | "compare";

const CONCEPT_LAYOUT: Partial<Record<PostVisualId, ConceptLayout>> = {
  "agent-battle-2026": "compare",
  "ai-force-multiplier": "timeline",
  "backend-to-data-engineer-rockfi": "flow",
  "claude-code-product-os": "flow",
  "context-engineering-beyond-prompt-engineering": "stack",
  "engineering-2026-ai-redefined-our-job": "flow",
  "engineering-documents-age-poorly": "timeline",
  "forest-admin-activity-logs-elasticsearch": "flow",
  "idempotency-debounce-jobify-bullmq": "branch",
  "jobify-workers-queues-nestjs": "flow",
  "joining-rockfi": "timeline",
  "nodejs-stream-backpressure-history-export": "flow",
  "polymagine-industry-4-eyewear-2017": "flow",
  "postgresql-unique-nulls": "branch",
  "rebuilding-cloud-experience-forest-admin": "flow",
  "redis-memory-exhaustion-post-mortem": "branch",
  "scaling-ci-github-actions-forest-admin": "branch",
  "scim-user-provisioning-forest-admin": "flow",
  "security-authentication-idp-openid-connect": "flow",
  "self-service-analytics-that-doesnt-lie": "flow",
  "the-onboarding-matrix-forest-admin": "branch",
  "unknown-unknowns-software-architecture": "branch",
};

function ConceptDiagram({
  copy,
  markerId,
  visualId,
  compact,
}: {
  copy: DiagramCopy;
  markerId: string;
  visualId: PostVisualId;
  compact: boolean;
}) {
  const labels = ["a", "b", "c", "d", "e"].map((key) => copy.labels[key] ?? "");
  const layout = CONCEPT_LAYOUT[visualId] ?? "flow";
  const nodeWidth = 142;
  const nodeY = layout === "stack" ? 70 : 194;
  const nodeXs = labels.map((_, index) => 30 + index * 174);

  if (layout === "compare") {
    return (
      <DiagramFrame markerId={markerId}>
        {!compact ? <text x="54" y="58" className="visual-kicker">{labels[0]}</text> : null}
        <DiagramNode x={54} y={126} width={210} label={labels[1] ?? ""} />
        <DiagramNode x={345} y={126} width={210} label={labels[2] ?? ""} tone="hot" />
        <DiagramNode x={636} y={126} width={210} label={labels[3] ?? ""} />
        <path d="M264 162H345" className="visual-flow-line" markerEnd={`url(#${markerId}-arrow)`} />
        <path d="M555 162H636" className="visual-flow-line" markerEnd={`url(#${markerId}-arrow)`} />
        <path d="M160 198V302H450" className="visual-flow-line visual-flow-muted" markerEnd={`url(#${markerId}-arrow)`} />
        <path d="M450 198V302" className="visual-flow-line visual-flow-muted" markerEnd={`url(#${markerId}-arrow)`} />
        <path d="M741 198V302H450" className="visual-flow-line visual-flow-muted" markerEnd={`url(#${markerId}-arrow)`} />
        <g className="visual-node visual-node-success">
          <rect x="342" y="302" width="216" height="72" rx="18" />
          <text x="450" y="344" textAnchor="middle">{labels[4] ?? ""}</text>
        </g>
      </DiagramFrame>
    );
  }

  if (layout === "stack") {
    return (
      <DiagramFrame markerId={markerId}>
        {!compact ? <text x="54" y="48" className="visual-kicker">{copy.labels.a}</text> : null}
        {labels.map((label, index) => {
          const y = 70 + index * 76;
          return (
            <g key={`${label}-${index}`}>
              {index > 0 ? <path d={`M450 ${y - 14}V${y}`} className="visual-flow-line" markerEnd={`url(#${markerId}-arrow)`} /> : null}
              <DiagramNode x={379} y={y} width={nodeWidth} label={label} tone={index === labels.length - 1 ? "success" : "default"} />
            </g>
          );
        })}
      </DiagramFrame>
    );
  }

  if (layout === "branch") {
    return (
      <DiagramFrame markerId={markerId}>
        <DiagramNode x={44} y={nodeY} width={160} label={labels[0] ?? ""} />
        <DiagramNode x={350} y={nodeY} width={160} label={labels[1] ?? ""} tone="hot" />
        <path d="M204 230H350" className="visual-flow-line" markerEnd={`url(#${markerId}-arrow)`} />
        <path d="M510 230C590 150 640 130 728 146" className="visual-flow-line" markerEnd={`url(#${markerId}-arrow)`} />
        <path d="M510 250C590 330 640 350 728 334" className="visual-flow-line visual-flow-danger" markerEnd={`url(#${markerId}-arrow)`} />
        <DiagramNode x={728} y={110} width={140} label={labels[2] ?? ""} tone="success" />
        <g className="visual-stop-node"><rect x="728" y="298" width="140" height="72" rx="18" /><text x="798" y="340" textAnchor="middle">{labels[3] ?? ""}</text></g>
        {!compact ? <text x="548" y="128" className="visual-note">{labels[4] ?? ""}</text> : null}
      </DiagramFrame>
    );
  }

  if (layout === "timeline") {
    return (
      <DiagramFrame markerId={markerId}>
        <line x1="70" y1="230" x2="830" y2="230" className="visual-axis" />
        {labels.map((label, index) => {
          const x = 82 + index * 184;
          return (
            <g key={`${label}-${index}`}>
              <circle cx={x} cy="230" r="18" className={index === labels.length - 1 ? "visual-checkpoint" : "visual-node-hot"} />
              <text x={x} y="170" textAnchor="middle" className="visual-micro-label">{label}</text>
              <text x={x} y="282" textAnchor="middle" className="visual-micro-label">{index + 1}</text>
            </g>
          );
        })}
        {!compact ? <text x="54" y="68" className="visual-kicker">{copy.labels.a}</text> : null}
      </DiagramFrame>
    );
  }

  return (
    <DiagramFrame markerId={markerId}>
      {labels.map((label, index) => (
        <g key={`${label}-${index}`}>
          {index < labels.length - 1 ? <path d={`M${nodeXs[index]! + nodeWidth} 230H${nodeXs[index + 1]! - 14}`} className="visual-flow-line" markerEnd={`url(#${markerId}-arrow)`} /> : null}
          <DiagramNode x={nodeXs[index]!} y={nodeY} width={nodeWidth} label={label} tone={index === labels.length - 1 ? "success" : index === 2 ? "hot" : "default"} />
        </g>
      ))}
      {!compact ? <text x="54" y="68" className="visual-kicker">{copy.labels.a}</text> : null}
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
  } else if (visualId) {
    diagram = (
      <ConceptDiagram
        copy={copy}
        markerId={markerId}
        visualId={visualId}
        compact={compact}
      />
    );
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
