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
    "rocket-curiosity": {
      title: "Une curiosité tournée vers les étoiles et les volcans",
      description: "Des constellations au-dessus de l'horizon répondent aux forces volcaniques sous la surface terrestre, reliées par une même curiosité.",
      caption: "Lever les yeux et regarder sous nos pieds sont deux directions d'une même envie de comprendre.",
      labels: { a: "Constellations", b: "Observer", c: "Curiosité", d: "Terre", e: "Volcans" },
    },
    "rocket-earthbound-engineering": {
      title: "Exploration spatiale et responsabilité terrestre",
      description: "Une trajectoire de fusée traverse l'orbite terrestre tandis que les satellites, les débris et une limite de responsabilité restent visibles autour de la planète.",
      caption: "L'admiration pour l'exploration n'efface ni la responsabilité orbitale ni notre attachement à la Terre.",
      labels: { a: "Terre", b: "Orbite", c: "Explorer", d: "Responsabilité", e: "Ingénierie" },
    },
    "rocket-heavencraft-systems": {
      title: "HeavenCraft comme premier système vivant",
      description: "Une communauté de joueurs entre dans un système central qui relie mini-jeux, mondes, parcelles et économie partagée.",
      caption: "Le code est devenu un produit quand de vrais joueurs se sont emparés des règles, des mondes et de l'économie.",
      labels: { a: "Joueurs", b: "HeavenCraft", c: "Mini-jeux", d: "Mondes", e: "Économie" },
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
    "rocket-curiosity": {
      title: "A curiosity aimed at stars and volcanoes",
      description: "Constellations above the horizon mirror volcanic forces beneath Earth's surface, connected by the same curiosity.",
      caption: "Looking up and looking beneath our feet are two directions of the same desire to understand.",
      labels: { a: "Constellations", b: "Observe", c: "Curiosity", d: "Earth", e: "Volcanoes" },
    },
    "rocket-earthbound-engineering": {
      title: "Space exploration and responsibility on Earth",
      description: "A rocket trajectory crosses Earth orbit while satellites, debris, and a responsibility boundary remain visible around the planet.",
      caption: "Admiration for exploration does not erase orbital responsibility or our attachment to Earth.",
      labels: { a: "Earth", b: "Orbit", c: "Explore", d: "Responsibility", e: "Engineering" },
    },
    "rocket-heavencraft-systems": {
      title: "HeavenCraft as a first living system",
      description: "A player community enters a central system connecting minigames, worlds, land ownership, and a shared economy.",
      caption: "Code became a product when real players adopted its rules, worlds, and economy.",
      labels: { a: "Players", b: "HeavenCraft", c: "Minigames", d: "Worlds", e: "Economy" },
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

type EditorialVisualProps = {
  copy: DiagramCopy;
  markerId: string;
  variant: PostVisualVariant;
};

function EditorialFrame({
  markerId,
  variant,
  children,
}: {
  markerId: string;
  variant: PostVisualVariant;
  children: ReactNode;
}) {
  return (
    <>
      <defs>
        <linearGradient id={`${markerId}-editorial-wash`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--visual-surface-strong)" />
          <stop offset="0.62" stopColor="var(--visual-surface)" />
          <stop offset="1" stopColor="var(--visual-surface-strong)" />
        </linearGradient>
        <radialGradient id={`${markerId}-editorial-glow`} cx="50%" cy="46%" r="58%">
          <stop offset="0" stopColor="var(--visual-line)" stopOpacity="0.16" />
          <stop offset="1" stopColor="var(--visual-line)" stopOpacity="0" />
        </radialGradient>
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
      <rect width="900" height="480" rx="28" fill={`url(#${markerId}-editorial-wash)`} />
      <ellipse
        cx="450"
        cy="224"
        rx="430"
        ry="264"
        fill={`url(#${markerId}-editorial-glow)`}
      />
      <g
        className={`visual-editorial-composition visual-editorial-composition-${variant}`}
        data-composition={variant}
      >
        {children}
      </g>
    </>
  );
}

function EngineeringDocumentsVisual({
  copy,
  markerId,
  variant,
}: EditorialVisualProps) {
  const labels = copy.labels;
  const arrow = `url(#${markerId}-arrow)`;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <path d="M238 84H486L610 208V390H238Z" className="visual-editorial-panel" />
        <path d="M486 84V208H610" className="visual-editorial-fold" />
        <path d="M300 250H474M300 302H430" className="visual-editorial-detail" />
        <path
          d="M628 126C732 150 770 252 716 332C688 374 644 396 596 396"
          className="visual-editorial-line-hot"
        />
        <circle cx="700" cy="172" r="18" className="visual-editorial-checkpoint" />
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <path d="M146 86H438L568 216V386H146Z" className="visual-editorial-panel" />
        <path d="M438 86V216H568" className="visual-editorial-fold" />
        <path d="M220 260H418M220 316H368" className="visual-editorial-detail" />
        <path
          d="M582 124C718 136 792 238 742 334C718 380 668 404 606 398"
          className="visual-editorial-line-hot"
        />
        <circle cx="704" cy="170" r="22" className="visual-editorial-checkpoint" />
        <rect x="638" y="292" width="150" height="92" rx="30" className="visual-editorial-success" />
        <path d="M678 338L704 360L750 314" className="visual-editorial-check" />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <path
        d="M222 224H350C382 224 396 240 420 240H642"
        className="visual-editorial-line"
        markerEnd={arrow}
      />
      <g>
        <path d="M76 112H202L248 158V294H76Z" className="visual-editorial-panel" />
        <path d="M202 112V158H248" className="visual-editorial-fold" />
        <path d="M112 210H206M112 244H184" className="visual-editorial-detail" />
        <text x="162" y="354" textAnchor="middle" className="visual-editorial-label">
          {labels.a}
        </text>
      </g>
      <g>
        <circle cx="450" cy="224" r="82" className="visual-editorial-ring" />
        <path d="M450 178V228L486 250" className="visual-editorial-clock" />
        <circle cx="450" cy="224" r="12" className="visual-editorial-checkpoint" />
        <text x="450" y="354" textAnchor="middle" className="visual-editorial-label">
          {labels.d}
        </text>
      </g>
      <g>
        <rect x="652" y="136" width="172" height="176" rx="38" className="visual-editorial-success" />
        <path d="M696 224L728 252L784 190" className="visual-editorial-check" />
        <path d="M684 288H790" className="visual-editorial-detail" />
        <text x="738" y="354" textAnchor="middle" className="visual-editorial-label">
          {labels.e}
        </text>
      </g>
    </EditorialFrame>
  );
}

function ContextEngineeringVisual({
  copy,
  markerId,
  variant,
}: EditorialVisualProps) {
  const labels = copy.labels;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <rect x="190" y="82" width="520" height="316" rx="70" className="visual-editorial-layer-outer" />
        <rect x="260" y="132" width="380" height="216" rx="58" className="visual-editorial-layer-middle" />
        <rect x="340" y="180" width="220" height="120" rx="44" className="visual-editorial-panel-hot" />
        <path d="M414 240L442 268L494 212" className="visual-editorial-check" />
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <rect x="116" y="74" width="566" height="332" rx="72" className="visual-editorial-layer-outer" />
        <rect x="184" y="126" width="430" height="228" rx="58" className="visual-editorial-layer-middle" />
        <rect x="270" y="178" width="258" height="124" rx="44" className="visual-editorial-panel-hot" />
        <circle cx="399" cy="240" r="22" className="visual-editorial-checkpoint" />
        <path d="M420 240H688" className="visual-editorial-line" />
        <rect x="688" y="150" width="78" height="180" rx="36" className="visual-editorial-success" />
        <path d="M708 240L728 260L752 218" className="visual-editorial-check" />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <rect x="82" y="70" width="736" height="338" rx="72" className="visual-editorial-layer-outer" />
      <text x="122" y="118" className="visual-editorial-label">
        {labels.a} + {labels.d}
      </text>
      <rect x="164" y="136" width="572" height="232" rx="58" className="visual-editorial-layer-middle" />
      <text x="206" y="184" className="visual-editorial-label">
        {labels.b} + {labels.c}
      </text>
      <rect x="282" y="202" width="336" height="116" rx="44" className="visual-editorial-panel-hot" />
      <circle cx="346" cy="260" r="18" className="visual-editorial-checkpoint" />
      <path d="M338 260L346 268L360 250" className="visual-editorial-check visual-editorial-check-small" />
      <text x="390" y="270" className="visual-editorial-label">
        {labels.e}
      </text>
    </EditorialFrame>
  );
}

function SelfServiceAnalyticsVisual({
  copy,
  markerId,
  variant,
}: EditorialVisualProps) {
  const labels = copy.labels;
  const arrow = `url(#${markerId}-arrow)`;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        {[160, 240, 320].map((y) => (
          <circle key={y} cx="176" cy={y} r="18" className="visual-editorial-source" />
        ))}
        <path d="M194 160C286 160 282 240 356 240M194 240H356M194 320C286 320 282 240 356 240" className="visual-editorial-line-muted" />
        <rect x="356" y="128" width="188" height="224" rx="54" className="visual-editorial-panel-hot" />
        <path d="M404 240L438 274L500 200" className="visual-editorial-check" />
        <path d="M544 240H682" className="visual-editorial-line" />
        <circle cx="724" cy="240" r="58" className="visual-editorial-success" />
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        {[144, 240, 336].map((y) => (
          <circle key={y} cx="126" cy={y} r="20" className="visual-editorial-source" />
        ))}
        <path d="M146 144C278 144 270 240 342 240M146 240H342M146 336C278 336 270 240 342 240" className="visual-editorial-line-muted" />
        <rect x="342" y="108" width="218" height="264" rx="58" className="visual-editorial-panel-hot" />
        <path d="M398 240L434 278L506 194" className="visual-editorial-check" />
        <path d="M560 240H696" className="visual-editorial-line" />
        <circle cx="760" cy="240" r="66" className="visual-editorial-success" />
        <path d="M730 240H790M760 210V270" className="visual-editorial-detail" />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <path
        d="M238 224H338C376 224 386 240 424 240H660"
        className="visual-editorial-line"
        markerEnd={arrow}
      />
      <g>
        {[170, 224, 278].map((y) => (
          <circle key={y} cx="142" cy={y} r="17" className="visual-editorial-source" />
        ))}
        <path d="M159 170C218 170 208 224 252 224M159 224H252M159 278C218 278 208 224 252 224" className="visual-editorial-line-muted" />
        <text x="142" y="354" textAnchor="middle" className="visual-editorial-label">
          {labels.a}
        </text>
      </g>
      <g>
        <rect x="356" y="132" width="188" height="184" rx="48" className="visual-editorial-panel-hot" />
        <path d="M404 224L436 256L496 190" className="visual-editorial-check" />
        <text x="450" y="354" textAnchor="middle" className="visual-editorial-label">
          {labels.c}
        </text>
      </g>
      <g>
        <circle cx="738" cy="224" r="78" className="visual-editorial-success" />
        <path d="M702 224H774M738 188V260" className="visual-editorial-detail" />
        <text x="738" y="354" textAnchor="middle" className="visual-editorial-label">
          {labels.e}
        </text>
      </g>
      <path d="M159 292C312 420 520 420 640 310" className="visual-editorial-rejected" />
      <path d="M626 294L654 322M654 294L626 322" className="visual-editorial-cross" />
    </EditorialFrame>
  );
}

function UnknownUnknownsVisual({
  copy,
  markerId,
  variant,
}: EditorialVisualProps) {
  const labels = copy.labels;
  const arrow = `url(#${markerId}-arrow)`;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <circle cx="316" cy="240" r="154" className="visual-editorial-radar" />
        <path d="M316 240L196 138A154 154 0 0 1 462 176Z" className="visual-editorial-sweep" />
        <circle cx="408" cy="184" r="18" className="visual-editorial-checkpoint" />
        <path d="M422 198C500 276 568 278 642 238" className="visual-editorial-line-hot" />
        <rect x="642" y="174" width="130" height="130" rx="48" className="visual-editorial-success" />
        <path d="M680 240L704 264L742 216" className="visual-editorial-check" />
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <circle cx="274" cy="240" r="168" className="visual-editorial-radar" />
        <circle cx="274" cy="240" r="108" className="visual-editorial-radar-inner" />
        <path d="M274 240L142 132A170 170 0 0 1 430 172Z" className="visual-editorial-sweep" />
        <circle cx="382" cy="174" r="20" className="visual-editorial-checkpoint" />
        <path d="M398 190C486 286 550 286 632 240" className="visual-editorial-line-hot" />
        <rect x="632" y="156" width="168" height="168" rx="54" className="visual-editorial-success" />
        <path d="M678 240L714 274L766 202" className="visual-editorial-check" />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <path
        d="M242 224H348C382 224 392 240 426 240H654"
        className="visual-editorial-line"
        markerEnd={arrow}
      />
      <g>
        <circle cx="148" cy="224" r="88" className="visual-editorial-radar" />
        <path d="M148 224L88 166A88 88 0 0 1 218 182Z" className="visual-editorial-sweep" />
        <circle cx="194" cy="186" r="13" className="visual-editorial-checkpoint" />
        <text x="148" y="354" textAnchor="middle" className="visual-editorial-label">
          {labels.b}
        </text>
      </g>
      <g>
        <rect x="356" y="134" width="188" height="180" rx="46" className="visual-editorial-layer-middle" />
        <rect x="394" y="172" width="112" height="104" rx="34" className="visual-editorial-panel-hot" />
        <circle cx="450" cy="224" r="14" className="visual-editorial-checkpoint" />
        <text x="450" y="354" textAnchor="middle" className="visual-editorial-label">
          {labels.c}
        </text>
      </g>
      <g>
        <rect x="654" y="140" width="170" height="168" rx="54" className="visual-editorial-success" />
        <path d="M698 224L730 256L782 192" className="visual-editorial-check" />
        <text x="739" y="354" textAnchor="middle" className="visual-editorial-label">
          {labels.e}
        </text>
      </g>
    </EditorialFrame>
  );
}

function ArticleEssenceDiagram({
  copy,
  markerId,
  visualId,
  compact,
  variant,
}: {
  copy: DiagramCopy;
  markerId: string;
  visualId: PostVisualId;
  compact: boolean;
  variant: PostVisualVariant;
}) {
  const label = (key: string) => copy.labels[key] ?? "";
  const arrow = `url(#${markerId}-arrow)`;

  if (visualId === "agent-battle-2026") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">AGENT ARENA · 2026</text>
        {[{ x: 58, name: "ANTIGRAVITY", y: 138 }, { x: 338, name: "CURSOR", y: 174 }, { x: 618, name: "CLAUDE CODE", y: 116 }].map((agent) => (
          <g key={agent.name}>
            <path d={`M${agent.x + 104} 362V${agent.y + 72}`} className="visual-flow-line visual-flow-muted" />
            <g className="visual-node"><rect x={agent.x} y={agent.y} width="208" height="72" rx="18" /><text x={agent.x + 104} y={agent.y + 42} textAnchor="middle">{agent.name}</text></g>
            <circle cx={agent.x + 104} cy={agent.y - 24} r="8" className="visual-checkpoint" />
          </g>
        ))}
        <rect x="42" y="362" width="816" height="62" rx="18" className="visual-boundary" />
        <text x="450" y="399" textAnchor="middle" className="visual-note">{label("d")} · TPU / GPU / COST</text>
        {!compact ? <text x="450" y="92" textAnchor="middle" className="visual-note visual-note-hot">{label("e")} = {label("c")} × CONTEXT × ECONOMICS</text> : null}
      </DiagramFrame>
    );
  }

  if (visualId === "ai-force-multiplier") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">ENGINEERING LEVERAGE</text>
        {[86, 154, 222, 290].map((y, index) => (
          <g key={y}>
            <rect x="54" y={y} width="118" height="42" rx="12" className="visual-boundary" />
            {!compact ? <text x="113" y={y + 26} textAnchor="middle" className="visual-micro-label">TASK {index + 1}</text> : null}
            <path d={`M172 ${y + 21}C270 ${y + 21} 270 240 360 240`} className="visual-flow-line visual-flow-muted" />
          </g>
        ))}
        <DiagramNode x={360} y={196} width={190} label={label("c")} tone="hot" />
        <path d="M550 232H690" className="visual-flow-line" markerEnd={arrow} />
        <DiagramNode x={690} y={196} width={160} label={label("e")} tone="success" />
        <path d="M455 196V108H770V196" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
        {!compact ? <text x="610" y="94" textAnchor="middle" className="visual-note visual-note-hot">{label("d")} · HUMAN JUDGMENT</text> : null}
        <path d="M74 390H826" className="visual-axis" />
        <text x="74" y="420" className="visual-micro-label">{label("a")}</text>
        <text x="826" y="420" textAnchor="end" className="visual-micro-label">{label("c")}</text>
      </DiagramFrame>
    );
  }

  if (visualId === "backend-to-data-engineer-rockfi") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">MODERN DATA FOUNDATION</text>
        {[108, 194, 280].map((y, index) => <circle key={y} cx="78" cy={y} r={18 - index * 3} className="visual-checkpoint" />)}
        <text x="52" y="342" className="visual-micro-label">{label("a")}</text>
        <rect x="160" y="76" width="260" height="316" rx="28" className="visual-boundary" />
        {!compact ? <text x="186" y="112" className="visual-kicker">{label("b")} · ASSET GRAPH</text> : null}
        {[{ x: 210, y: 158 }, { x: 328, y: 140 }, { x: 270, y: 246 }, { x: 354, y: 318 }].map((node, index) => <circle key={`${node.x}-${node.y}`} cx={node.x} cy={node.y} r={index === 3 ? 15 : 10} className="visual-checkpoint" />)}
        <path d="M90 108L210 158L328 140M210 158L270 246M328 140L270 246L354 318" className="visual-flow-line" markerEnd={arrow} />
        {[{ x: 500, y: 278, w: 106, h: 90 }, { x: 624, y: 212, w: 106, h: 156 }, { x: 748, y: 128, w: 106, h: 240 }].map((layer, index) => (
          <g key={layer.x} className={`visual-node ${index === 2 ? "visual-node-success" : index === 1 ? "visual-node-hot" : ""}`}>
            <rect x={layer.x} y={layer.y} width={layer.w} height={layer.h} rx="18" />
            <text x={layer.x + layer.w / 2} y={layer.y + 38} textAnchor="middle">{["BRONZE", "SILVER", "GOLD"][index]}</text>
          </g>
        ))}
        {!compact ? <text x="676" y="410" textAnchor="middle" className="visual-note">{label("c")} → {label("d")} → {label("e")}</text> : null}
      </DiagramFrame>
    );
  }

  if (visualId === "claude-code-product-os") {
    const points = [{ x: 450, y: 86 }, { x: 696, y: 196 }, { x: 606, y: 366 }, { x: 294, y: 366 }, { x: 204, y: 196 }];
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">HUMAN-LED DELIVERY FLYWHEEL</text>
        <circle cx="450" cy="238" r="82" className="visual-boundary" />
        <text x="450" y="230" textAnchor="middle" className="visual-fallback-title">PRODUCT</text>
        <text x="450" y="258" textAnchor="middle" className="visual-fallback-title">OS</text>
        {points.map((point, index) => {
          const next = points[(index + 1) % points.length]!;
          return <g key={`${point.x}-${point.y}`}><path d={`M${point.x} ${point.y}Q450 238 ${next.x} ${next.y}`} className="visual-flow-line" markerEnd={arrow} /><circle cx={point.x} cy={point.y} r="28" className="visual-checkpoint" /><text x={point.x} y={point.y + (point.y < 150 ? -42 : 52)} textAnchor="middle" className="visual-micro-label">{label(["a", "b", "c", "d", "e"][index]!)}</text></g>;
        })}
      </DiagramFrame>
    );
  }

  if (visualId === "context-engineering-beyond-prompt-engineering") {
    return <ContextEngineeringVisual copy={copy} markerId={markerId} variant={variant} />;
  }

  if (visualId === "engineering-2026-ai-redefined-our-job") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">MULTI-AGENT ENGINEERING RHYTHM</text>
        <DiagramNode x={54} y={204} width={142} label={label("a")} />
        <path d="M196 230C260 230 260 142 326 142" className="visual-flow-line" markerEnd={arrow} />
        <path d="M196 250C260 250 260 338 326 338" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
        <DiagramNode x={326} y={106} width={180} label="CLAUDE CODE" />
        <DiagramNode x={326} y={302} width={180} label="CODEX" tone="hot" />
        <path d="M506 142C610 142 610 230 674 230" className="visual-flow-line" markerEnd={arrow} />
        <path d="M506 338C610 338 610 250 674 250" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
        <DiagramNode x={674} y={204} width={172} label={label("e")} tone="success" />
        {!compact ? <><text x="416" y="88" textAnchor="middle" className="visual-micro-label">{label("b")} · {label("c")}</text><text x="416" y="402" textAnchor="middle" className="visual-micro-label">{label("d")} · EVIDENCE</text></> : null}
      </DiagramFrame>
    );
  }

  if (visualId === "engineering-documents-age-poorly") {
    return <EngineeringDocumentsVisual copy={copy} markerId={markerId} variant={variant} />;
  }

  if (visualId === "forest-admin-activity-logs-elasticsearch") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">100M+ AUDIT EVENTS</text>
        <g className="visual-node"><ellipse cx="154" cy="142" rx="92" ry="30" className="visual-symbol" /><rect x="62" y="142" width="184" height="190" /><ellipse cx="154" cy="332" rx="92" ry="30" className="visual-symbol" /><text x="154" y="244" textAnchor="middle">{label("a")}</text></g>
        {[180, 230, 280].map((y) => <path key={y} d={`M86 ${y}H222`} className="visual-axis" />)}
        <path d="M246 236H394" className="visual-flow-line" markerEnd={arrow} />
        <rect x="394" y="154" width="122" height="164" rx="20" className="visual-firewall" />
        <text x="455" y="230" textAnchor="middle" className="visual-firewall-label">{label("c")}</text>
        <text x="455" y="254" textAnchor="middle" className="visual-firewall-label">REINDEX</text>
        {[{ x: 602, y: 116 }, { x: 716, y: 116 }, { x: 602, y: 234 }, { x: 716, y: 234 }].map((shard, index) => <g key={`${shard.x}-${shard.y}`} className="visual-node visual-node-success"><rect x={shard.x} y={shard.y} width="92" height="86" rx="18" /><text x={shard.x + 46} y={shard.y + 50} textAnchor="middle">S{index + 1}</text></g>)}
        <path d="M516 236H580" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
        {!compact ? <text x="708" y="364" textAnchor="middle" className="visual-note">{label("d")} · {label("e")}</text> : null}
      </DiagramFrame>
    );
  }

  if (visualId === "idempotency-debounce-jobify-bullmq") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">DETERMINISTIC DEBOUNCE WINDOW</text>
        <rect x="170" y="98" width="360" height="286" rx="30" className="visual-boundary" />
        {!compact ? <text x="194" y="132" className="visual-micro-label">{label("c")} · Δt</text> : null}
        {[{ x: 74, y: 146 }, { x: 74, y: 236 }, { x: 74, y: 326 }].map((event, index) => <g key={event.y}><circle cx={event.x} cy={event.y} r="18" className="visual-checkpoint" /><text x={event.x} y={event.y + 48} textAnchor="middle" className="visual-micro-label">E{index + 1}</text><path d={`M92 ${event.y}C150 ${event.y} 188 240 246 240`} className="visual-flow-line visual-flow-muted" /></g>)}
        <DiagramNode x={246} y={204} width={190} label={label("b")} tone="hot" />
        <path d="M436 240H620" className="visual-flow-line" markerEnd={arrow} />
        <DiagramNode x={620} y={204} width={156} label={label("d")} tone="success" />
        <text x="698" y="168" textAnchor="middle" className="visual-note visual-note-hot">1 × EXECUTION</text>
        <path d="M698 276V360H824" className="visual-flow-line" markerEnd={arrow} />
        <text x="824" y="390" textAnchor="middle" className="visual-micro-label">{label("e")}</text>
      </DiagramFrame>
    );
  }

  if (visualId === "jobify-workers-queues-nestjs") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">TYPED QUEUE CONTRACT</text>
        <DiagramNode x={46} y={204} width={138} label={label("a")} />
        <path d="M184 240H266" className="visual-flow-line" markerEnd={arrow} />
        {[166, 206, 246, 286].map((y, index) => <g key={y} className="visual-node"><rect x="266" y={y} width="126" height="32" rx="10" /><text x="329" y={y + 21} textAnchor="middle">JOB {index + 1}</text></g>)}
        <rect x="448" y="102" width="228" height="276" rx="28" className="visual-boundary" />
        <text x="472" y="138" className="visual-kicker">{label("c")} · TYPE BOUNDARY</text>
        <DiagramNode x={486} y={204} width={152} label={label("d")} tone="hot" />
        <path d="M392 240H486" className="visual-flow-line" markerEnd={arrow} />
        <path d="M638 240H730" className="visual-flow-line" markerEnd={arrow} />
        <DiagramNode x={730} y={204} width={130} label={label("e")} tone="success" />
        {!compact ? <text x="562" y="344" textAnchor="middle" className="visual-micro-label">SEQUENTIAL · OBSERVABLE · RETRYABLE</text> : null}
      </DiagramFrame>
    );
  }

  if (visualId === "joining-rockfi") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">CAREER RIDGELINE</text>
        <path d="M46 372L160 316L270 338L388 244L504 280L632 166L758 202L858 98L858 408L46 408Z" className="visual-elevation-fill" />
        <path d="M46 372L160 316L270 338L388 244L504 280L632 166L758 202L858 98" className="visual-elevation-line" />
        {[{ x: 160, y: 316, key: "a" }, { x: 388, y: 244, key: "b" }, { x: 632, y: 166, key: "d" }, { x: 858, y: 98, key: "e" }].map((point, index) => <g key={point.key}><circle cx={point.x} cy={point.y} r={index === 3 ? 13 : 9} className="visual-checkpoint" /><text x={point.x} y={point.y - 26} textAnchor="middle" className="visual-micro-label">{label(point.key)}</text></g>)}
        {!compact ? <text x="630" y="414" textAnchor="middle" className="visual-note">{label("c")} · WEALTH MANAGEMENT</text> : null}
      </DiagramFrame>
    );
  }

  if (visualId === "nodejs-stream-backpressure-history-export") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">PRESSURE PROPAGATION</text>
        <g className="visual-node"><rect x="46" y="188" width="146" height="104" rx="20" /><text x="119" y="246" textAnchor="middle">{label("a")}</text></g>
        <path d="M192 218H340V196H474V214H622V190H780" className="visual-flow-line" markerEnd={arrow} />
        <path d="M192 262H340V284H474V266H622V290H780" className="visual-flow-line" />
        {[{ x: 340, key: "b" }, { x: 474, key: "c" }, { x: 622, key: "d" }].map((buffer, index) => <g key={buffer.x}><rect x={buffer.x - 34} y={196 + index * 8} width="68" height={88 - index * 16} rx="12" className={index === 1 ? "visual-firewall" : "visual-boundary"} /><text x={buffer.x} y="334" textAnchor="middle" className="visual-micro-label">{label(buffer.key)}</text></g>)}
        <g className="visual-node visual-node-success"><path d="M780 178H850V302H780Z" className="visual-symbol-success" /><text x="815" y="246" textAnchor="middle">{label("e")}</text></g>
        <path d="M780 360C620 420 314 420 192 326" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
        {!compact ? <text x="486" y="414" textAnchor="middle" className="visual-note visual-note-hot">BACKPRESSURE ← DESTINATION CAPACITY</text> : null}
      </DiagramFrame>
    );
  }

  if (visualId === "polymagine-industry-4-eyewear-2017") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">SCAN → FIT · &lt; 1 SECOND</text>
        <path d="M128 106C72 134 62 222 94 292S180 378 238 328C280 292 278 236 244 206C210 176 206 112 128 106Z" className="visual-elevation-line" />
        {[126, 154, 182, 210].map((x) => <path key={x} d={`M${x} 126L${x - 52} 326M${x} 126L${x + 88} 326`} className="visual-flow-line visual-flow-muted" />)}
        <path d="M270 236H394" className="visual-flow-line" markerEnd={arrow} />
        <g transform="translate(424 108)">{[0, 1, 2, 3].map((row) => <path key={row} d={`M0 ${row * 64}L90 ${row * 32}L180 ${row * 64}M${row * 54} 0L${row * 42} 224`} className="visual-elevation-line" />)}</g>
        <path d="M620 236H710" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
        <g className="visual-node visual-node-success"><circle cx="754" cy="226" r="44" className="visual-symbol-success" /><circle cx="836" cy="226" r="44" className="visual-symbol-success" /><path d="M798 218H792M710 214L684 198M880 214L894 198" className="visual-flow-line" /><text x="795" y="310" textAnchor="middle">{label("e")}</text></g>
        {!compact ? <><text x="154" y="406" textAnchor="middle" className="visual-micro-label">{label("a")}</text><text x="514" y="406" textAnchor="middle" className="visual-micro-label">{label("c")}</text></> : null}
      </DiagramFrame>
    );
  }

  if (visualId === "postgresql-unique-nulls") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">UNIQUE INDEX SEMANTICS</text>
        {[{ y: 124, id: "42", value: "NULL" }, { y: 204, id: "42", value: "NULL" }].map((row, index) => <g key={row.y} className="visual-node"><rect x="54" y={row.y} width="250" height="58" rx="14" /><text x="100" y={row.y + 36}>{row.id}</text><text x="202" y={row.y + 36}>{row.value}</text><text x="270" y={row.y + 36}>R{index + 1}</text></g>)}
        <path d="M304 188H420" className="visual-flow-line" markerEnd={arrow} />
        <rect x="420" y="98" width="218" height="224" rx="26" className="visual-firewall" />
        <text x="529" y="162" textAnchor="middle" className="visual-firewall-label">NULLS</text>
        <text x="529" y="194" textAnchor="middle" className="visual-firewall-label">NOT DISTINCT</text>
        <text x="529" y="250" textAnchor="middle" className="visual-note">NULL = NULL</text>
        <path d="M638 210H734" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
        <DiagramNode x={734} y={174} width={132} label={label("d")} tone="success" />
        {!compact ? <text x="800" y="292" textAnchor="middle" className="visual-micro-label">{label("e")}</text> : null}
      </DiagramFrame>
    );
  }

  if (visualId === "rebuilding-cloud-experience-forest-admin") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">SERVERLESS BLAST RADIUS</text>
        <DiagramNode x={42} y={204} width={126} label={label("a")} />
        <rect x="210" y="78" width="468" height="326" rx="32" className="visual-boundary" />
        <text x="234" y="112" className="visual-kicker">VPC</text>
        {[{ x: 262, y: 146 }, { x: 262, y: 236 }, { x: 262, y: 326 }].map((fn, index) => <g key={fn.y} className="visual-node"><rect x={fn.x} y={fn.y} width="132" height="58" rx="16" /><text x={fn.x + 66} y={fn.y + 36} textAnchor="middle">λ {index + 1}</text><path d={`M168 240C210 ${fn.y + 29} 228 ${fn.y + 29} ${fn.x} ${fn.y + 29}`} className="visual-flow-line visual-flow-muted" /></g>)}
        <rect x="448" y="134" width="52" height="220" rx="22" className="visual-firewall" />
        <text x="474" y="244" textAnchor="middle" transform="rotate(-90 474 244)" className="visual-firewall-label">{label("c")}</text>
        {[174, 236, 298].map((y) => <path key={y} d={`M500 ${y}H606`} className="visual-flow-line" markerEnd={arrow} />)}
        <rect x="606" y="128" width="42" height="232" rx="18" className="visual-duration-short" />
        <text x="627" y="388" textAnchor="middle" className="visual-micro-label">{label("d")}</text>
        <g className="visual-node visual-node-success"><ellipse cx="790" cy="160" rx="74" ry="26" className="visual-symbol-success" /><rect x="716" y="160" width="148" height="154" /><ellipse cx="790" cy="314" rx="74" ry="26" className="visual-symbol-success" /><text x="790" y="244" textAnchor="middle">{label("e")}</text></g>
        <path d="M648 244H716" className="visual-flow-line visual-flow-danger" markerEnd={arrow} />
      </DiagramFrame>
    );
  }

  if (visualId === "redis-memory-exhaustion-post-mortem") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">SHARED MEMORY · SINGLE FAILURE DOMAIN</text>
        {[{ y: 126, key: "a" }, { y: 216, key: "b" }, { y: 306, key: "c" }].map((workload, index) => <g key={workload.key}><DiagramNode x={48} y={workload.y} width={150} label={label(workload.key)} /><path d={`M198 ${workload.y + 36}C280 ${workload.y + 36} 298 240 358 240`} className={`visual-flow-line ${index === 2 ? "visual-flow-hot" : ""}`} markerEnd={arrow} /></g>)}
        <rect x="358" y="90" width="210" height="300" rx="30" className="visual-boundary" />
        <rect x="382" y="122" width="162" height="232" rx="18" className="visual-duration-short" />
        <path d="M382 164H544" className="visual-target-line" />
        <text x="463" y="244" textAnchor="middle" className="visual-fallback-title">REDIS</text>
        <text x="463" y="278" textAnchor="middle" className="visual-note visual-note-hot">OOM</text>
        <path d="M568 240H666" className="visual-flow-line visual-flow-danger" markerEnd={arrow} />
        {[{ x: 682, y: 104 }, { x: 682, y: 206 }, { x: 682, y: 308 }].map((cell, index) => <g key={cell.y} className="visual-node visual-node-success"><rect x={cell.x} y={cell.y} width="168" height="74" rx="18" /><text x={cell.x + 84} y={cell.y + 44} textAnchor="middle">{label(["a", "b", "c"][index]!)}</text></g>)}
        {!compact ? <text x="766" y="410" textAnchor="middle" className="visual-note">{label("e")}</text> : null}
      </DiagramFrame>
    );
  }

  if (visualId === "rocket-curiosity") {
    const stars = [
      { x: 92, y: 112 },
      { x: 176, y: 78 },
      { x: 246, y: 132 },
      { x: 332, y: 88 },
      { x: 398, y: 142 },
    ];

    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">LOOK UP · LOOK DOWN</text>
        <path d="M40 240H860" className="visual-axis" />
        <path
          d="M92 112L176 78L246 132L332 88L398 142"
          className="visual-flow-line visual-flow-muted"
        />
        {stars.map((star, index) => (
          <circle
            key={`${star.x}-${star.y}`}
            cx={star.x}
            cy={star.y}
            r={index === 1 ? 10 : 7}
            className="visual-checkpoint"
          />
        ))}
        {!compact ? (
          <text x="92" y="174" className="visual-micro-label">{label("a")}</text>
        ) : null}
        <path
          d="M500 408L610 250L704 408Z"
          className="visual-elevation-fill"
        />
        <path
          d="M500 408L610 250L704 408"
          className="visual-elevation-line"
        />
        <path
          d="M610 388C570 348 650 324 610 276"
          className="visual-flow-line visual-flow-hot"
        />
        <circle cx="610" cy="376" r="22" className="visual-checkpoint" />
        {!compact ? (
          <text x="610" y="440" textAnchor="middle" className="visual-micro-label">
            {label("e")} · {label("d")}
          </text>
        ) : null}
        <circle cx="450" cy="240" r="74" className="visual-boundary" />
        <text x="450" y="232" textAnchor="middle" className="visual-fallback-title">
          {label("c")}
        </text>
        <text x="450" y="263" textAnchor="middle" className="visual-micro-label">
          {label("b")}
        </text>
        <path d="M398 142L430 186" className="visual-flow-line" markerEnd={arrow} />
        <path d="M500 278L548 316" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
      </DiagramFrame>
    );
  }

  if (visualId === "rocket-earthbound-engineering") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">ENGINEERING · VISION · CONSEQUENCES</text>
        <circle cx="266" cy="260" r="112" className="visual-elevation-fill" />
        <circle cx="266" cy="260" r="112" className="visual-elevation-line" />
        <path d="M174 236C226 196 298 194 356 226M190 302C250 330 314 322 352 286" className="visual-flow-line visual-flow-muted" />
        <text x="266" y="268" textAnchor="middle" className="visual-fallback-title">{label("a")}</text>
        <ellipse cx="266" cy="260" rx="184" ry="146" className="visual-boundary" />
        {[{ x: 104, y: 206 }, { x: 168, y: 116 }, { x: 390, y: 146 }, { x: 438, y: 282 }].map((object, index) => (
          <g key={`${object.x}-${object.y}`}>
            <rect
              x={object.x}
              y={object.y}
              width={index === 3 ? 9 : 18}
              height={index === 3 ? 9 : 12}
              rx="3"
              className={index === 3 ? "visual-firewall" : "visual-symbol"}
            />
          </g>
        ))}
        {!compact ? <text x="82" y="92" className="visual-micro-label">{label("b")} · {label("d")}</text> : null}
        <path
          d="M390 330C502 294 544 194 674 150S812 92 854 76"
          className="visual-flow-line visual-flow-hot"
          markerEnd={arrow}
        />
        <g transform="translate(632 118) rotate(-18)" className="visual-node visual-node-success">
          <path d="M0 38L58 12L92 38L58 64Z" className="visual-symbol-success" />
          <path d="M16 32L0 12M16 44L0 64" className="visual-flow-line" />
        </g>
        <rect x="530" y="332" width="302" height="72" rx="18" className="visual-boundary" />
        <text x="681" y="362" textAnchor="middle" className="visual-note visual-note-hot">{label("e")}</text>
        <text x="681" y="388" textAnchor="middle" className="visual-micro-label">{label("c")} ≠ ABANDON EARTH</text>
      </DiagramFrame>
    );
  }

  if (visualId === "rocket-heavencraft-systems") {
    const playerNodes = [
      { x: 68, y: 130 },
      { x: 68, y: 224 },
      { x: 68, y: 318 },
    ];
    const capabilities = [
      { y: 104, key: "c" },
      { y: 204, key: "d" },
      { y: 304, key: "e" },
    ];

    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">CODE → RULES → COMMUNITY</text>
        {playerNodes.map((player, index) => (
          <g key={player.y}>
            <circle cx={player.x} cy={player.y} r="22" className="visual-checkpoint" />
            <path
              d={`M${player.x + 22} ${player.y}C180 ${player.y} 190 240 276 240`}
              className="visual-flow-line visual-flow-muted"
              markerEnd={arrow}
            />
            {!compact ? (
              <text x="68" y={player.y + 42} textAnchor="middle" className="visual-micro-label">
                P{index + 1}
              </text>
            ) : null}
          </g>
        ))}
        <rect x="276" y="112" width="286" height="256" rx="30" className="visual-boundary" />
        <text x="419" y="220" textAnchor="middle" className="visual-fallback-title">{label("b")}</text>
        <text x="419" y="252" textAnchor="middle" className="visual-micro-label">LIVE SERVER SYSTEM</text>
        <path d="M332 298H506" className="visual-axis" />
        {[354, 418, 482].map((x) => (
          <circle key={x} cx={x} cy="298" r="9" className="visual-checkpoint" />
        ))}
        {capabilities.map((capability, index) => (
          <g key={capability.key}>
            <path
              d={`M562 240C618 240 618 ${capability.y + 34} 660 ${capability.y + 34}`}
              className={index === 2 ? "visual-flow-line visual-flow-hot" : "visual-flow-line"}
              markerEnd={arrow}
            />
            <g className={`visual-node ${index === 2 ? "visual-node-hot" : "visual-node-success"}`}>
              <rect x="660" y={capability.y} width="190" height="68" rx="18" />
              <text x="755" y={capability.y + 40} textAnchor="middle">{label(capability.key)}</text>
            </g>
          </g>
        ))}
        {!compact ? <text x="68" y="408" className="visual-note">{label("a")} · REAL USAGE</text> : null}
      </DiagramFrame>
    );
  }

  if (visualId === "scaling-ci-github-actions-forest-admin") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">PARALLEL CI · FAN OUT / FAN IN</text>
        <DiagramNode x={42} y={204} width={132} label={label("a")} />
        {[96, 178, 260, 342].map((y, index) => <g key={y}><path d={`M174 240C236 240 236 ${y + 26} 294 ${y + 26}`} className="visual-flow-line visual-flow-muted" markerEnd={arrow} /><g className="visual-node"><rect x="294" y={y} width="146" height="52" rx="14" /><text x="367" y={y + 32} textAnchor="middle">SHARD {index + 1}</text></g><path d={`M440 ${y + 26}C510 ${y + 26} 510 240 572 240`} className="visual-flow-line" /></g>)}
        <DiagramNode x={572} y={204} width={154} label={label("d")} tone="hot" />
        <path d="M726 240H774" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
        <rect x="774" y="166" width="80" height="148" rx="20" className="visual-firewall" />
        <text x="814" y="240" textAnchor="middle" transform="rotate(-90 814 240)" className="visual-firewall-label">{label("e")}</text>
        {!compact ? <text x="367" y="430" textAnchor="middle" className="visual-micro-label">{label("b")} · {label("c")}</text> : null}
      </DiagramFrame>
    );
  }

  if (visualId === "scim-user-provisioning-forest-admin") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">RFC 7644 · PROVIDER REALITY</text>
        {[{ y: 106, name: "OKTA" }, { y: 204, name: "AZURE AD" }, { y: 302, name: "GOOGLE" }].map((provider) => <g key={provider.name}><circle cx="116" cy={provider.y + 36} r="34" className="visual-checkpoint" /><text x="116" y={provider.y + 41} textAnchor="middle" className="visual-micro-label">{provider.name}</text><path d={`M150 ${provider.y + 36}C240 ${provider.y + 36} 250 240 326 240`} className="visual-flow-line visual-flow-muted" /></g>)}
        <rect x="326" y="98" width="210" height="284" rx="28" className="visual-boundary" />
        <text x="431" y="154" textAnchor="middle" className="visual-kicker">{label("b")}</text>
        <DiagramNode x={356} y={204} width={150} label={label("c")} tone="hot" />
        <path d="M536 240H622" className="visual-flow-line" markerEnd={arrow} />
        {[{ y: 102, name: "CREATE" }, { y: 204, name: "UPDATE" }, { y: 306, name: "DEACTIVATE" }].map((action, index) => <g key={action.name} className={`visual-node ${index === 2 ? "visual-stop-node" : "visual-node-success"}`}><rect x="650" y={action.y} width="188" height="72" rx="18" /><text x="744" y={action.y + 42} textAnchor="middle">{action.name}</text><path d={`M622 240C640 240 640 ${action.y + 36} 650 ${action.y + 36}`} className="visual-flow-line" markerEnd={arrow} /></g>)}
      </DiagramFrame>
    );
  }

  if (visualId === "security-authentication-idp-openid-connect") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">FEDERATED TRUST BOUNDARIES</text>
        <rect x="54" y="98" width="230" height="276" rx="28" className="visual-boundary" />
        <rect x="616" y="98" width="230" height="276" rx="28" className="visual-boundary" />
        <DiagramNode x={84} y={204} width={170} label={label("b")} />
        <DiagramNode x={646} y={204} width={170} label={label("c")} tone="success" />
        <circle cx="450" cy="240" r="72" className="visual-checkpoint" />
        <text x="450" y="232" textAnchor="middle" className="visual-fallback-title">IDENTITY</text>
        <text x="450" y="260" textAnchor="middle" className="visual-micro-label">BROKER</text>
        <path d="M254 218C330 154 368 154 402 196" className="visual-flow-line" markerEnd={arrow} />
        <path d="M498 196C532 154 570 154 646 218" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
        <path d="M646 264C570 326 532 326 498 284" className="visual-flow-line" markerEnd={arrow} />
        <path d="M402 284C368 326 330 326 254 264" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
        {!compact ? <><text x="328" y="136" textAnchor="middle" className="visual-micro-label">OIDC</text><text x="572" y="136" textAnchor="middle" className="visual-micro-label">SAML</text><text x="450" y="382" textAnchor="middle" className="visual-note">OAUTH 2.0 · BEARER TOKEN</text></> : null}
      </DiagramFrame>
    );
  }

  if (visualId === "self-service-analytics-that-doesnt-lie") {
    return <SelfServiceAnalyticsVisual copy={copy} markerId={markerId} variant={variant} />;
  }

  if (visualId === "the-onboarding-matrix-forest-admin") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">COMBINATORIAL EXPLOSION → COMPOSITION</text>
        <g transform="translate(50 104)">{[0, 1, 2, 3].map((row) => [0, 1, 2, 3].map((column) => <rect key={`${row}-${column}`} x={column * 54} y={row * 54} width="42" height="42" rx="8" className={row === column ? "visual-firewall" : "visual-boundary"} />))}</g>
        {[0, 1, 2, 3].map((index) => <path key={index} d={`M250 ${126 + index * 54}C330 ${126 + index * 54} 330 ${204 + index * 16} 382 ${204 + index * 16}`} className="visual-flow-line visual-flow-muted" />)}
        <DiagramNode x={382} y={204} width={162} label={label("b")} tone="hot" />
        {[{ y: 104, name: "POSTGRES" }, { y: 204, name: "MONGODB" }, { y: 304, name: "SUPABASE" }].map((adapter) => <g key={adapter.name}><path d={`M544 240C608 240 608 ${adapter.y + 34} 666 ${adapter.y + 34}`} className="visual-flow-line" markerEnd={arrow} /><g className="visual-node visual-node-success"><rect x="666" y={adapter.y} width="178" height="68" rx="18" /><text x="755" y={adapter.y + 40} textAnchor="middle">{adapter.name}</text></g></g>)}
        {!compact ? <text x="154" y="378" textAnchor="middle" className="visual-micro-label">IF / ELSE MATRIX</text> : null}
      </DiagramFrame>
    );
  }

  if (visualId === "unknown-unknowns-software-architecture") {
    return <UnknownUnknownsVisual copy={copy} markerId={markerId} variant={variant} />;
  }

  return (
    <DiagramFrame markerId={markerId}>
      <g className="visual-stop-node">
        <rect x="280" y="186" width="340" height="108" rx="24" />
        <text x="450" y="246" textAnchor="middle">UNMAPPED VISUAL</text>
      </g>
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
      <ArticleEssenceDiagram
        copy={copy}
        markerId={markerId}
        visualId={visualId}
        compact={compact}
        variant={variant}
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
