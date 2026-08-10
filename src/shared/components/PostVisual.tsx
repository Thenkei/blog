import { useId, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type {
  PostLocale,
  PostVisualId,
} from "../../features/posts/content";
import { normalizeLocale } from "../routing";
import {
  EditorialPostVisual,
  hasEditorialPostVisual,
} from "./EditorialPostVisual";

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
        channel: "SSE sortant",
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
        smartShort: "Montre · 4 h",
        sportShort: "Sport · 15 h",
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
      description: "Une requête traverse la passerelle applicative et les Lambdas, converge vers un pool de connexions borné, puis sort via une passerelle NAT vers la base hébergée par le client.",
      caption: "Le compute peut scaler rapidement ; le pool, la sortie NAT et la base du client restent des contraintes explicites.",
      labels: { a: "Client", b: "Passerelle", c: "Lambda", d: "Pool", e: "Passerelle NAT", f: "BDD client" },
    },
    "redis-memory-exhaustion-post-mortem": {
      title: "Convergence des charges dans Redis",
      description: "Cache, queues et sessions partagent la même mémoire jusqu'à provoquer éviction, saturation et panne.",
      caption: "Des cycles de vie différents ne doivent pas être forcés dans une même enveloppe mémoire.",
      labels: { a: "Cache", b: "Queues", c: "Sessions", d: "Mémoire", e: "Isolation", workloads: "Charges partagées" },
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
        channel: "Outbound SSE",
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
        smartShort: "Watch · 4 h",
        sportShort: "Sport · 15 h",
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
      description: "A request crosses the application gateway and Lambdas, converges on a bounded connection pool, then exits through a NAT gateway toward the client-hosted database.",
      caption: "Compute can scale quickly; the pool, NAT egress, and client database remain explicit constraints.",
      labels: { a: "Client", b: "Gateway", c: "Lambda", d: "Pool", e: "NAT gateway", f: "Client DB" },
    },
    "redis-memory-exhaustion-post-mortem": {
      title: "Workload convergence in Redis",
      description: "Cache, queues, and sessions share memory until eviction, saturation, and outage occur.",
      caption: "Different lifecycles should not be forced into one memory envelope.",
      labels: { a: "Cache", b: "Queues", c: "Sessions", d: "Memory", e: "Isolation", workloads: "Shared loads" },
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

const TRAIL_RACE_COPY: Record<PostLocale, DiagramCopy> = {
  en: {
    title: "Trail race recovery profile",
    description:
      "An over-fast opening leads into depletion, a decisive aid-station recovery, and a shared finish after one hundred kilometres.",
    caption:
      "The race changed when restraint failed, support arrived, and finishing became a shared effort rather than an individual pace target.",
    labels: {
      start: "Fast start",
      four: "Depletion",
      checkpoint: "Aid station",
      sport: "Shared finish",
    },
  },
  fr: {
    title: "Profil de récupération sur un trail",
    description:
      "Un départ trop rapide mène à l'épuisement, puis un ravitaillement décisif permet une arrivée partagée après cent kilomètres.",
    caption:
      "La course a changé quand la retenue a manqué, que le soutien est arrivé et que finir est devenu un effort partagé.",
    labels: {
      start: "Départ rapide",
      four: "Épuisement",
      checkpoint: "Ravitaillement",
      sport: "Arrivée partagée",
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

function RadarScope({
  cx,
  cy,
  radius,
}: {
  cx: number;
  cy: number;
  radius: number;
}) {
  const middleRadius = radius * 0.66;
  const innerRadius = radius * 0.32;
  const sweepX = radius * 0.866;
  const sweepY = radius * -0.5;

  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={radius} className="visual-editorial-radar" />
      <circle r={middleRadius} className="visual-editorial-radar-inner" />
      <circle r={innerRadius} className="visual-editorial-radar-inner" />
      <path
        d={`M${-radius} 0H${radius}M0 ${-radius}V${radius}`}
        className="visual-editorial-radar-crosshair"
      />
      <g
        className="visual-editorial-radar-sweep"
        style={{ transformOrigin: "0px 0px" }}
      >
        <path
          d={`M0 0L0 ${-radius}A${radius} ${radius} 0 0 1 ${sweepX} ${sweepY}Z`}
          className="visual-editorial-sweep"
        />
        <path d={`M0 0L0 ${-radius}`} className="visual-editorial-sweep-edge" />
      </g>
      <circle
        cx={radius * 0.44}
        cy={radius * -0.38}
        r={radius * 0.075}
        className="visual-editorial-radar-target visual-editorial-radar-target-primary"
      />
      <circle
        cx={radius * -0.52}
        cy={radius * 0.22}
        r={radius * 0.055}
        className="visual-editorial-radar-target visual-editorial-radar-target-secondary"
      />
      <circle
        cx={radius * 0.2}
        cy={radius * 0.56}
        r={radius * 0.045}
        className="visual-editorial-radar-target visual-editorial-radar-target-tertiary"
      />
      <circle
        cx={radius * 0.44}
        cy={radius * -0.38}
        r={radius * 0.17}
        className="visual-editorial-radar-ping"
      />
    </g>
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
        <RadarScope cx={450} cy={240} radius={126} />
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <RadarScope cx={282} cy={240} radius={154} />
        <path d="M350 182C448 104 536 116 622 202" className="visual-editorial-line-hot" />
        <rect x="622" y="150" width="174" height="180" rx="56" className="visual-editorial-success" />
        <path d="M668 240L706 276L762 198" className="visual-editorial-check" />
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
        <RadarScope cx={148} cy={224} radius={90} />
        <text x="148" y="368" textAnchor="middle" className="visual-editorial-label">
          {labels.b}
        </text>
      </g>
      <g>
        <rect x="356" y="134" width="188" height="180" rx="46" className="visual-editorial-layer-middle" />
        <rect x="394" y="172" width="112" height="104" rx="34" className="visual-editorial-panel-hot" />
        <circle cx="450" cy="224" r="14" className="visual-editorial-checkpoint" />
        <text x="450" y="368" textAnchor="middle" className="visual-editorial-label">
          {labels.c}
        </text>
      </g>
      <g>
        <rect x="654" y="140" width="170" height="168" rx="54" className="visual-editorial-success" />
        <path d="M698 224L730 256L782 192" className="visual-editorial-check" />
        <text x="739" y="368" textAnchor="middle" className="visual-editorial-label">
          {labels.e}
        </text>
      </g>
    </EditorialFrame>
  );
}

function OnboardingMatrixVisual({
  copy,
  markerId,
  variant,
}: EditorialVisualProps) {
  const labels = copy.labels;
  const arrow = `url(#${markerId}-arrow)`;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <g transform="translate(122 128)">
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2, 3].map((column) => (
              <rect
                key={`${row}-${column}`}
                x={column * 48}
                y={row * 48}
                width="34"
                height="34"
                rx="9"
                className={
                  row === column
                    ? "visual-editorial-matrix-cell visual-editorial-matrix-cell-hot"
                    : "visual-editorial-matrix-cell"
                }
              />
            )),
          )}
        </g>
        <path d="M314 152C380 152 376 240 420 240M314 296C380 296 376 240 420 240" className="visual-editorial-flow-trace" />
        <rect x="420" y="154" width="164" height="172" rx="48" className="visual-editorial-panel-hot" />
        <path d="M466 240L502 276L548 204" className="visual-editorial-check" />
        {[144, 224, 304].map((y, index) => (
          <g key={y}>
            <path d={`M584 240C630 240 626 ${y + 26} 662 ${y + 26}`} className="visual-editorial-flow-trace" />
            <rect
              x="662"
              y={y}
              width="126"
              height="52"
              rx="18"
              className={index === 1 ? "visual-editorial-success" : "visual-editorial-layer-middle"}
            />
          </g>
        ))}
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <g transform="translate(82 108)">
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2, 3, 4].map((column) => (
              <rect
                key={`${row}-${column}`}
                x={column * 48}
                y={row * 58}
                width="34"
                height="42"
                rx="9"
                className={
                  (row + column) % 5 === 0
                    ? "visual-editorial-matrix-cell visual-editorial-matrix-cell-hot"
                    : "visual-editorial-matrix-cell"
                }
              />
            )),
          )}
        </g>
        <path d="M308 132C384 132 378 240 424 240M308 324C384 324 378 240 424 240" className="visual-editorial-flow-trace" />
        <rect x="424" y="142" width="178" height="196" rx="52" className="visual-editorial-panel-hot" />
        <path d="M474 240L512 278L560 200" className="visual-editorial-check" />
        {[118, 212, 306].map((y, index) => (
          <g key={y}>
            <path d={`M602 240C652 240 646 ${y + 30} 686 ${y + 30}`} className="visual-editorial-flow-trace" />
            <rect
              x="686"
              y={y}
              width="148"
              height="60"
              rx="20"
              className={index === 1 ? "visual-editorial-success" : "visual-editorial-layer-middle"}
            />
          </g>
        ))}
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <g transform="translate(66 116)">
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3].map((column) => (
            <rect
              key={`${row}-${column}`}
              x={column * 44}
              y={row * 44}
              width="32"
              height="32"
              rx="8"
              className={
                row === column
                  ? "visual-editorial-matrix-cell visual-editorial-matrix-cell-hot"
                  : "visual-editorial-matrix-cell"
              }
            />
          )),
        )}
      </g>
      <path d="M246 182C326 182 322 224 366 224" className="visual-editorial-flow-trace" markerEnd={arrow} />
      <path d="M246 270C326 270 322 240 366 240" className="visual-editorial-flow-trace" />
      <rect x="366" y="136" width="176" height="176" rx="50" className="visual-editorial-panel-hot" />
      <path d="M414 224L450 260L500 188" className="visual-editorial-check" />
      {[126, 206, 286].map((y, index) => (
        <g key={y}>
          <path d={`M542 224C606 224 600 ${y + 28} 650 ${y + 28}`} className="visual-editorial-flow-trace" />
          <rect
            x="650"
            y={y}
            width="178"
            height="56"
            rx="18"
            className={index === 1 ? "visual-editorial-success" : "visual-editorial-layer-middle"}
          />
          <path d={`M686 ${y + 28}H792`} className="visual-editorial-detail" />
        </g>
      ))}
      <text x="144" y="380" textAnchor="middle" className="visual-editorial-label">
        {labels.a}
      </text>
      <text x="454" y="380" textAnchor="middle" className="visual-editorial-label">
        {labels.b}
      </text>
      <text x="739" y="380" textAnchor="middle" className="visual-editorial-label">
        {labels.c} / {labels.d}
      </text>
    </EditorialFrame>
  );
}

function CloudExecutionVisual({
  copy,
  markerId,
  variant,
}: EditorialVisualProps) {
  const labels = copy.labels;
  const arrow = `url(#${markerId}-arrow)`;

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <g data-cloud-stage="client">
          <circle cx="58" cy="240" r="28" className="visual-editorial-source" />
        </g>
        <path d="M86 240H116" className="visual-editorial-flow-trace" />
        <g data-cloud-stage="gateway" className="visual-editorial-app-gateway">
          <rect x="116" y="174" width="46" height="132" rx="22" />
          <path d="M127 214L150 240L127 266" className="visual-editorial-gateway-route" />
        </g>
        <path d="M162 240H206" className="visual-editorial-flow-trace" />

        <rect x="206" y="104" width="430" height="272" rx="50" className="visual-editorial-cloud-boundary" />
        <g data-cloud-stage="lambda" className="visual-editorial-compute">
          {[168, 240, 312].map((y, index) => (
            <path
              key={y}
              d={`M244 ${y}L270 ${y - 16}L296 ${y}V${y + 32}L270 ${y + 48}L244 ${y + 32}Z`}
              className={`visual-editorial-panel visual-editorial-compute-${index + 1}`}
            />
          ))}
        </g>
        <path d="M296 184C356 184 350 240 402 240M296 256H402M296 328C356 328 350 256 402 256" className="visual-editorial-line-muted" />

        <g data-cloud-stage="pool" className="visual-editorial-connection-pool">
          <rect x="402" y="168" width="100" height="144" rx="28" className="visual-editorial-pool" />
          {[194, 224, 254, 284].map((y, index) => (
            <circle key={y} cx="452" cy={y} r="10" className={index < 3 ? "visual-editorial-pool-slot-active" : "visual-editorial-pool-slot"} />
          ))}
        </g>
        <path d="M502 240H556" className="visual-editorial-flow-trace" />
        <g data-cloud-stage="nat-gateway" className="visual-editorial-nat-gateway">
          <rect x="556" y="166" width="52" height="148" rx="24" />
          <path d="M568 268V220M568 220L596 204M568 220L596 236" className="visual-editorial-gateway-route" />
        </g>
        <path d="M608 240H682" className="visual-editorial-flow-trace" />

        <rect x="682" y="120" width="184" height="240" rx="46" className="visual-editorial-client-boundary" />
        <g data-cloud-stage="client-database" className="visual-editorial-database">
          <ellipse cx="774" cy="174" rx="58" ry="21" />
          <path d="M716 174V302C716 316 742 326 774 326S832 316 832 302V174" />
          <ellipse cx="774" cy="302" rx="58" ry="21" />
        </g>
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <g data-cloud-stage="client">
          <circle cx="54" cy="238" r="30" className="visual-editorial-source" />
        </g>
        <path d="M84 238H108" className="visual-editorial-flow-trace" />
        <g data-cloud-stage="gateway" className="visual-editorial-app-gateway">
          <rect x="108" y="154" width="52" height="168" rx="25" />
          <path d="M120 204L148 238L120 272" className="visual-editorial-gateway-route" />
        </g>
        <path d="M160 238H198" className="visual-editorial-flow-trace" />

        <rect x="198" y="76" width="454" height="326" rx="56" className="visual-editorial-cloud-boundary" />
        <g data-cloud-stage="lambda">
          {[130, 220, 310].map((y, index) => (
            <g key={y} className={`visual-editorial-compute visual-editorial-compute-${index + 1}`}>
              <path d={`M234 ${y}L266 ${y - 20}L298 ${y}V${y + 40}L266 ${y + 60}L234 ${y + 40}Z`} className="visual-editorial-panel" />
              <circle cx="266" cy={y + 20} r="7" className="visual-editorial-pool-slot-active" />
            </g>
          ))}
        </g>
        <path d="M298 150C366 150 356 220 406 226M298 240H406M298 330C366 330 356 260 406 254" className="visual-editorial-line-muted" />

        <g data-cloud-stage="pool" className="visual-editorial-connection-pool">
          <rect x="406" y="148" width="108" height="180" rx="32" className="visual-editorial-pool" />
          {[180, 220, 260, 300].map((y, index) => (
            <circle key={y} cx="460" cy={y} r="12" className={index < 3 ? "visual-editorial-pool-slot-active" : "visual-editorial-pool-slot"} />
          ))}
        </g>
        <path d="M514 238H566" className="visual-editorial-flow-trace" />
        <g data-cloud-stage="nat-gateway" className="visual-editorial-nat-gateway">
          <rect x="566" y="146" width="56" height="184" rx="27" />
          <path d="M578 278V224M578 224L610 204M578 224L610 246" className="visual-editorial-gateway-route" />
        </g>
        <path d="M622 238H686" className="visual-editorial-flow-trace" />

        <rect x="686" y="104" width="188" height="268" rx="48" className="visual-editorial-client-boundary" />
        <g data-cloud-stage="client-database" className="visual-editorial-database">
          <ellipse cx="780" cy="160" rx="60" ry="22" />
          <path d="M720 160V314C720 328 746 340 780 340S840 328 840 314V160" />
          <ellipse cx="780" cy="314" rx="60" ry="22" />
        </g>
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <g data-cloud-stage="client">
        <circle cx="46" cy="216" r="26" className="visual-editorial-source" />
      </g>
      <path d="M72 216H100" className="visual-editorial-flow-trace" markerEnd={arrow} />
      <g data-cloud-stage="gateway" className="visual-editorial-app-gateway">
        <rect x="106" y="156" width="44" height="120" rx="21" />
        <path d="M116 190L140 216L116 242" className="visual-editorial-gateway-route" />
      </g>
      <path d="M150 216H190" className="visual-editorial-flow-trace" markerEnd={arrow} />

      <rect x="190" y="86" width="448" height="260" rx="48" className="visual-editorial-cloud-boundary" />
      <g data-cloud-stage="lambda">
        {[136, 208, 280].map((y, index) => (
          <g key={y} className={`visual-editorial-compute visual-editorial-compute-${index + 1}`}>
            <path d={`M220 ${y}L246 ${y - 16}L272 ${y}V${y + 32}L246 ${y + 48}L220 ${y + 32}Z`} className="visual-editorial-panel" />
            <circle cx="246" cy={y + 16} r="6" className="visual-editorial-pool-slot-active" />
          </g>
        ))}
      </g>
      <path d="M272 152C328 152 326 204 368 210M272 224H368M272 296C328 296 326 244 368 238" className="visual-editorial-line-muted" />

      <g data-cloud-stage="pool" className="visual-editorial-connection-pool">
        <rect x="368" y="148" width="94" height="136" rx="27" className="visual-editorial-pool" />
        {[174, 202, 230, 258].map((y, index) => (
          <circle key={y} cx="415" cy={y} r="9" className={index < 3 ? "visual-editorial-pool-slot-active" : "visual-editorial-pool-slot"} />
        ))}
      </g>
      <path d="M462 216H520" className="visual-editorial-flow-trace" markerEnd={arrow} />
      <g data-cloud-stage="nat-gateway" className="visual-editorial-nat-gateway">
        <rect x="526" y="148" width="48" height="136" rx="23" />
        <path d="M537 254V204M537 204L563 190M537 204L563 224" className="visual-editorial-gateway-route" />
      </g>
      <path d="M574 216H660" className="visual-editorial-flow-trace" markerEnd={arrow} />

      <rect x="660" y="108" width="210" height="216" rx="44" className="visual-editorial-client-boundary" />
      <g data-cloud-stage="client-database" className="visual-editorial-database">
        <ellipse cx="765" cy="154" rx="58" ry="20" />
        <path d="M707 154V278C707 292 733 302 765 302S823 292 823 278V154" />
        <ellipse cx="765" cy="278" rx="58" ry="20" />
      </g>
      {[
        { x: 34, key: "a" },
        { x: 140, key: "b" },
        { x: 248, key: "c" },
        { x: 415, key: "d" },
        { x: 550, key: "e" },
        { x: 765, key: "f" },
      ].map((item) => (
        <text key={item.key} x={item.x} y="386" textAnchor="middle" className="visual-editorial-label visual-editorial-label-compact">
          {labels[item.key]}
        </text>
      ))}
    </EditorialFrame>
  );
}

function ScalingCiVisual({
  copy,
  markerId,
  variant,
}: EditorialVisualProps) {
  const labels = copy.labels;
  const arrow = `url(#${markerId}-arrow)`;
  const shardRows = variant === "inline" ? [116, 184, 252, 320] : [112, 192, 272, 352];

  if (variant === "card") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <circle cx="104" cy="240" r="42" className="visual-editorial-source" />
        {shardRows.map((y, index) => (
          <g key={y}>
            <path d={`M146 240C214 240 214 ${y + 20} 272 ${y + 20}`} className="visual-editorial-flow-trace" />
            <rect x="272" y={y} width="126" height="40" rx="14" className={`visual-editorial-ci-shard visual-editorial-compute-${index + 1}`} />
            <path d={`M398 ${y + 20}C468 ${y + 20} 468 240 526 240`} className="visual-editorial-flow-trace" />
          </g>
        ))}
        <path d="M526 240L586 184L646 240L586 296Z" className="visual-editorial-panel-hot" />
        <path d="M646 240H704" className="visual-editorial-flow-trace" />
        <rect x="704" y="154" width="112" height="172" rx="42" className="visual-editorial-success" />
        <path d="M734 240L758 264L790 214" className="visual-editorial-check" />
      </EditorialFrame>
    );
  }

  if (variant === "header") {
    return (
      <EditorialFrame markerId={markerId} variant={variant}>
        <circle cx="82" cy="240" r="44" className="visual-editorial-source" />
        {shardRows.map((y, index) => (
          <g key={y}>
            <path d={`M126 240C206 240 206 ${y + 23} 270 ${y + 23}`} className="visual-editorial-flow-trace" />
            <rect x="270" y={y} width="152" height="46" rx="15" className={`visual-editorial-ci-shard visual-editorial-compute-${index + 1}`} />
            <path d={`M422 ${y + 23}C506 ${y + 23} 506 240 566 240`} className="visual-editorial-flow-trace" />
          </g>
        ))}
        <path d="M566 240L632 176L698 240L632 304Z" className="visual-editorial-panel-hot" />
        <path d="M698 240H744" className="visual-editorial-flow-trace" />
        <rect x="744" y="142" width="112" height="196" rx="44" className="visual-editorial-success" />
        <path d="M774 240L798 266L830 210" className="visual-editorial-check" />
      </EditorialFrame>
    );
  }

  return (
    <EditorialFrame markerId={markerId} variant={variant}>
      <circle cx="72" cy="218" r="34" className="visual-editorial-source" />
      {shardRows.map((y, index) => (
        <g key={y}>
          <path d={`M106 218C176 218 176 ${y + 22} 236 ${y + 22}`} className="visual-editorial-flow-trace" />
          <rect x="236" y={y} width="142" height="44" rx="14" className={`visual-editorial-ci-shard visual-editorial-compute-${index + 1}`} />
          <path d={`M378 ${y + 22}C464 ${y + 22} 464 218 528 218`} className="visual-editorial-flow-trace" />
        </g>
      ))}
      <path d="M528 218L592 156L656 218L592 280Z" className="visual-editorial-panel-hot" />
      <path d="M656 218H714" className="visual-editorial-flow-trace" markerEnd={arrow} />
      <rect x="714" y="138" width="120" height="160" rx="44" className="visual-editorial-success" />
      <path d="M744 218L770 244L806 190" className="visual-editorial-check" />
      <text x="72" y="388" textAnchor="middle" className="visual-editorial-label">
        {labels.a}
      </text>
      <text x="307" y="388" textAnchor="middle" className="visual-editorial-label">
        {labels.b} / {labels.c}
      </text>
      <text x="592" y="388" textAnchor="middle" className="visual-editorial-label">
        {labels.d}
      </text>
      <text x="774" y="388" textAnchor="middle" className="visual-editorial-label">
        {labels.e}
      </text>
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

  if (visualId === "context-engineering-beyond-prompt-engineering") {
    return <ContextEngineeringVisual copy={copy} markerId={markerId} variant={variant} />;
  }

  if (visualId === "engineering-documents-age-poorly") {
    return <EngineeringDocumentsVisual copy={copy} markerId={markerId} variant={variant} />;
  }

  if (visualId === "rebuilding-cloud-experience-forest-admin") {
    return <CloudExecutionVisual copy={copy} markerId={markerId} variant={variant} />;
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
    return <ScalingCiVisual copy={copy} markerId={markerId} variant={variant} />;
  }

  if (visualId === "self-service-analytics-that-doesnt-lie") {
    return <SelfServiceAnalyticsVisual copy={copy} markerId={markerId} variant={variant} />;
  }

  if (visualId === "the-onboarding-matrix-forest-admin") {
    return <OnboardingMatrixVisual copy={copy} markerId={markerId} variant={variant} />;
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
  const copy =
    visualId === "trail-endurance-profile" && slug === "trail-saint-jacques-100k-2026"
      ? TRAIL_RACE_COPY[resolvedLocale]
      : VISUAL_COPY[resolvedLocale][visualId ?? "fallback"];
  const instanceId = useId().replaceAll(":", "");
  const markerId = `post-visual-${instanceId}`;
  const compact = variant === "card";
  const titleId = `${markerId}-title`;
  const descriptionId = `${markerId}-description`;

  let diagram: ReactNode;
  if (visualId && hasEditorialPostVisual(visualId)) {
    diagram = (
      <EditorialPostVisual
        copy={copy}
        markerId={markerId}
        slug={slug}
        variant={variant}
        visualId={visualId}
      />
    );
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
