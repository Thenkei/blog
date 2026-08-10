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
    "trail-saint-jacques-100k-2026": {
      title: "Route du Trail du Saint-Jacques 100K",
      description:
        "Le parcours relie Monistrol-d'Allier au Puy-en-Velay par une trace de crête ponctuée d'un départ trop rapide, d'un ravitaillement décisif après une déshydratation, puis d'une arrivée de nuit à la cathédrale.",
      caption:
        "Les ravitaillements, les rencontres et le retour des jambes ont compté autant que les kilomètres jusqu'à la cathédrale.",
      labels: {
        course: "86 KM · 3 500 M D+",
        start: "Départ trop rapide",
        water: "Eau vide",
        crew: "Ravitaillement · soutien",
        finish: "Le Puy · arrivée",
        monistrol: "Monistrol-d'Allier",
        cathedral: "Cathédrale",
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
    "trail-saint-jacques-100k-2026": {
      title: "Trail du Saint-Jacques 100K route",
      description:
        "The route connects Monistrol-d'Allier to Le Puy-en-Velay along a ridge line marked by an over-fast start, a decisive aid station after dehydration, and a night finish at the cathedral.",
      caption:
        "Aid stations, strangers on the trail, and legs that came back mattered as much as the kilometres to the cathedral.",
      labels: {
        course: "86 KM · 3,500 M+",
        start: "Too-fast start",
        water: "Water empty",
        crew: "Aid station · crew",
        finish: "Le Puy · finish",
        monistrol: "Monistrol-d'Allier",
        cathedral: "Cathedral",
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

export type SecurityDiagramId =
  | "federation-overview"
  | "oidc-authorization-code"
  | "downstream-validation"
  | "saml-rfc7522-bridge";

type SecurityDiagramCopy = {
  title: string;
  description: string;
  caption: string;
  labels: Record<string, string>;
};

const SECURITY_DIAGRAM_COPY: Record<
  PostLocale,
  Record<SecurityDiagramId, SecurityDiagramCopy>
> = {
  en: {
    "federation-overview": {
      title: "Identity federation across two trust boundaries",
      description:
        "An upstream identity proof reaches Forest, where policy is translated before a narrow token is issued to a customer-hosted agent.",
      caption:
        "Forest is an upstream service provider and downstream identity provider: it translates trust rather than passing it through.",
      labels: {
        browser: "Browser",
        forest: "Forest",
        upstream: "Upstream IdP",
        agent: "Customer agent",
        sp: "SP boundary",
        idp: "IDP boundary",
        proof: "Identity proof",
        token: "Narrow token",
      },
    },
    "oidc-authorization-code": {
      title: "OIDC authorization code flow",
      description:
        "The browser is redirected to the identity provider, returns an authorization code to Forest, then Forest redeems the code before a session is established.",
      caption:
        "The authorization code is not the session: Forest verifies the redemption and issuer material before it trusts the result.",
      labels: {
        browser: "Browser",
        forest: "Forest",
        idp: "OIDC IdP",
        redirect: "Redirect",
        code: "Authorization code",
        redeem: "Redeem + verify",
        session: "Scoped session",
      },
    },
    "downstream-validation": {
      title: "Downstream bearer-token validation",
      description:
        "A frontend bearer token reaches a customer-hosted agent, which checks signature and issuer, audience tenant and scope, then time and replay conditions before allowing access.",
      caption:
        "The agent makes every claim check explicit; both allow and deny outcomes remain auditable.",
      labels: {
        frontend: "Frontend",
        agent: "Agent gate",
        allow: "Allow",
        deny: "Deny",
        signature: "Signature + issuer",
        audience: "Audience + tenant + scope",
        time: "Time + replay",
        audit: "Audit",
      },
    },
    "saml-rfc7522-bridge": {
      title: "SAML-to-OAuth bridge with RFC 7522",
      description:
        "A signed enterprise SAML assertion enters Forest validation, then a constrained RFC 7522 exchange produces an agent token with a narrow audience tenant and scope.",
      caption:
        "Forest validates the signed assertion before the exchange; a broad or bypassed token is never the output.",
      labels: {
        enterprise: "Enterprise IdP",
        assertion: "Signed SAML assertion",
        validate: "Validate",
        exchange: "RFC 7522 exchange",
        token: "aud + tenant + scope",
        unsafe: "Unsafe bypass",
      },
    },
  },
  fr: {
    "federation-overview": {
      title: "Fédération d'identité à travers deux frontières de confiance",
      description:
        "Une preuve d'identité amont atteint Forest, où la politique est traduite avant l'émission d'un token étroit vers un agent hébergé chez le client.",
      caption:
        "Forest est service provider vers l'amont et identity provider vers l'aval : il traduit la confiance au lieu de la transmettre telle quelle.",
      labels: {
        browser: "Navigateur",
        forest: "Forest",
        upstream: "IdP amont",
        agent: "Agent client",
        sp: "Frontière SP",
        idp: "Frontière IdP",
        proof: "Preuve d'identité",
        token: "Token borné",
      },
    },
    "oidc-authorization-code": {
      title: "Flux OIDC Authorization Code",
      description:
        "Le navigateur est redirigé vers l'identity provider, renvoie un code d'autorisation à Forest, puis Forest échange ce code avant d'établir une session.",
      caption:
        "Le code d'autorisation n'est pas une session : Forest vérifie l'échange et le matériel d'issuer avant de faire confiance au résultat.",
      labels: {
        browser: "Navigateur",
        forest: "Forest",
        idp: "IdP OIDC",
        redirect: "Redirection",
        code: "Code d'autorisation",
        redeem: "Échange + vérification",
        session: "Session bornée",
      },
    },
    "downstream-validation": {
      title: "Validation d'un bearer token côté agent",
      description:
        "Un bearer token présenté par le frontend atteint l'agent client, qui vérifie signature et issuer, audience tenant et scope, puis les conditions de temps et de replay avant d'autoriser l'accès.",
      caption:
        "L'agent rend chaque vérification de claim explicite ; les décisions allow et deny restent auditables.",
      labels: {
        frontend: "Frontend",
        agent: "Gate agent",
        allow: "Autoriser",
        deny: "Refuser",
        signature: "Signature + issuer",
        audience: "Audience + tenant + scope",
        time: "Temps + replay",
        audit: "Audit",
      },
    },
    "saml-rfc7522-bridge": {
      title: "Pont SAML-vers-OAuth avec RFC 7522",
      description:
        "Une assertion SAML d'entreprise signée entre dans la validation Forest, puis un échange RFC 7522 contraint produit un token agent avec audience tenant et scope étroits.",
      caption:
        "Forest valide l'assertion signée avant l'échange : il ne produit jamais un token large ou qui contourne cette frontière.",
      labels: {
        enterprise: "IdP entreprise",
        assertion: "Assertion SAML signée",
        validate: "Valider",
        exchange: "Échange RFC 7522",
        token: "aud + tenant + scope",
        unsafe: "Contournement dangereux",
      },
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
          <stop offset="0.52" stopColor="var(--visual-surface)" />
          <stop offset="1" stopColor="var(--visual-surface-strong)" />
        </linearGradient>
        <radialGradient id={`${markerId}-atmosphere`} cx="18%" cy="12%" r="76%">
          <stop offset="0" stopColor="var(--visual-line)" stopOpacity="0.2" />
          <stop offset="0.38" stopColor="var(--visual-line-secondary)" stopOpacity="0.08" />
          <stop offset="1" stopColor="var(--visual-surface)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${markerId}-hotspot`} cx="76%" cy="24%" r="52%">
          <stop offset="0" stopColor="var(--visual-hot)" stopOpacity="0.16" />
          <stop offset="1" stopColor="var(--visual-hot)" stopOpacity="0" />
        </radialGradient>
        <pattern id={`${markerId}-grid`} width="42" height="42" patternUnits="userSpaceOnUse">
          <path d="M42 0H0V42" className="visual-grid-line" />
        </pattern>
        <pattern id={`${markerId}-stars`} width="160" height="120" patternUnits="userSpaceOnUse">
          <circle cx="22" cy="26" r="1.4" className="visual-star" />
          <circle cx="94" cy="18" r="0.9" className="visual-star visual-star-muted" />
          <circle cx="138" cy="54" r="1.2" className="visual-star" />
          <circle cx="62" cy="96" r="0.8" className="visual-star visual-star-muted" />
          <circle cx="152" cy="108" r="1" className="visual-star" />
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
      <rect width="900" height="480" rx="28" className="visual-frame-base" fill={`url(#${markerId}-wash)`} />
      <rect width="900" height="480" rx="28" fill={`url(#${markerId}-atmosphere)`} />
      <rect width="900" height="480" rx="28" fill={`url(#${markerId}-hotspot)`} />
      <rect width="900" height="480" rx="28" fill={`url(#${markerId}-grid)`} />
      <rect width="900" height="480" rx="28" fill={`url(#${markerId}-stars)`} className="visual-starfield" />
      <path d="M-44 392C168 268 318 504 514 318S726 144 944 248" className="visual-frame-orbit" />
      <circle cx="794" cy="102" r="56" className="visual-frame-orbit visual-frame-orbit-secondary" />
      <circle cx="794" cy="102" r="4" className="visual-frame-beacon" />
      <rect x="1" y="1" width="898" height="478" rx="27" className="visual-frame-border" />
      {children}
    </>
  );
}

type EmblemTone = "default" | "hot" | "success" | "danger";

function EmblemCapsule({
  x,
  y,
  width = 112,
  height = 62,
  tone = "default",
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
  tone?: EmblemTone;
}) {
  return (
    <g className={`visual-emblem-capsule visual-emblem-capsule-${tone}`}>
      <rect x={x} y={y} width={width} height={height} rx={Math.min(22, height / 2)} />
      <path d={`M${x + 24} ${y + height / 2}H${x + width - 24}`} />
    </g>
  );
}

function EmblemCheckpoint({
  x,
  y,
  tone = "hot",
  radius = 10,
}: {
  x: number;
  y: number;
  tone?: EmblemTone;
  radius?: number;
}) {
  return (
    <g className={`visual-emblem-checkpoint visual-emblem-checkpoint-${tone}`}>
      <circle cx={x} cy={y} r={radius + 7} className="visual-emblem-checkpoint-ring" />
      <circle cx={x} cy={y} r={radius} />
    </g>
  );
}

function EmblemScene({
  markerId,
  children,
}: {
  markerId: string;
  children: ReactNode;
}) {
  return <DiagramFrame markerId={markerId}>{children}</DiagramFrame>;
}

function PostVisualEmblem({
  markerId,
  visualId,
}: {
  markerId: string;
  visualId?: PostVisualId | undefined;
}) {
  const arrow = `url(#${markerId}-arrow)`;

  if (visualId === "bounded-ai-loop") {
    return (
      <EmblemScene markerId={markerId}>
        <rect x="138" y="92" width="606" height="290" rx="44" className="visual-emblem-boundary" />
        <path d="M198 238H692" className="visual-emblem-route" markerEnd={arrow} />
        {[198, 312, 426, 540, 654].map((x, index) => (
          <EmblemCheckpoint
            key={x}
            x={x}
            y={238}
            tone={index === 3 ? "hot" : index === 4 ? "success" : "default"}
            radius={index === 3 ? 15 : 10}
          />
        ))}
        <path d="M426 248V326H584" className="visual-emblem-route visual-emblem-route-danger" />
        <EmblemCapsule x={532} y={294} width={152} height={62} tone="danger" />
      </EmblemScene>
    );
  }

  if (visualId === "sse-outbound-channel") {
    return (
      <EmblemScene markerId={markerId}>
        <EmblemCapsule x={90} y={190} width={182} height={88} />
        <rect x="408" y="96" width="48" height="288" rx="24" className="visual-emblem-firewall" />
        <EmblemCapsule x={628} y={190} width={182} height={88} tone="success" />
        <path d="M272 208C356 120 536 120 628 208" className="visual-emblem-route" markerEnd={arrow} />
        <path d="M628 260C536 348 356 348 272 260" className="visual-emblem-route visual-emblem-route-hot" markerEnd={arrow} />
        <EmblemCheckpoint x={538} y={298} tone="hot" radius={7} />
      </EmblemScene>
    );
  }

  if (visualId === "trail-endurance-profile") {
    return (
      <EmblemScene markerId={markerId}>
        <path
          d="M72 290L142 256L204 280L276 184L342 236L424 126L494 210L568 166L638 242L710 186L828 272L828 316H72Z"
          className="visual-emblem-terrain"
        />
        <path
          d="M72 290L142 256L204 280L276 184L342 236L424 126L494 210L568 166L638 242L710 186L828 272"
          className="visual-emblem-terrain-line"
        />
        <path d="M108 370H370" className="visual-emblem-capacity visual-emblem-capacity-danger" />
        <path d="M108 408H778" className="visual-emblem-capacity visual-emblem-capacity-success" />
        <path d="M696 338V434" className="visual-emblem-target" />
        <EmblemCheckpoint x={424} y={126} tone="hot" radius={10} />
      </EmblemScene>
    );
  }

  if (visualId === "trail-saint-jacques-100k-2026") {
    return (
      <EmblemScene markerId={markerId}>
        <path
          d="M54 336C126 290 168 268 234 286S334 320 402 224S516 104 610 182S726 334 846 142"
          className="visual-emblem-route visual-emblem-route-trail"
          markerEnd={arrow}
        />
        <path
          d="M52 358L138 312L214 342L310 264L382 330L486 176L558 236L650 140L728 268L846 184"
          className="visual-emblem-terrain-line visual-emblem-terrain-muted"
        />
        <EmblemCheckpoint x={118} y={300} tone="hot" radius={9} />
        <EmblemCheckpoint x={402} y={224} tone="danger" radius={10} />
        <EmblemCheckpoint x={610} y={182} tone="success" radius={11} />
        <g className="visual-emblem-cathedral">
          <path d="M804 112V174H852V112L828 82Z" />
          <path d="M816 112V92H840V112" />
        </g>
      </EmblemScene>
    );
  }

  if (visualId === "agent-battle-2026") {
    return (
      <EmblemScene markerId={markerId}>
        <circle cx="450" cy="238" r="88" className="visual-emblem-orbit-core" />
        <EmblemCapsule x={394} y={208} width={112} height={60} tone="hot" />
        {[
          { x: 200, y: 138, tone: "default" as const },
          { x: 636, y: 146, tone: "success" as const },
          { x: 430, y: 350, tone: "hot" as const },
        ].map((node) => (
          <g key={`${node.x}-${node.y}`}>
            <path
              d={`M${node.x + 56} ${node.y + 31}Q450 238 ${node.x < 400 ? 394 : 506} ${node.y < 250 ? 208 : 268}`}
              className="visual-emblem-route visual-emblem-route-muted"
            />
            <EmblemCapsule x={node.x} y={node.y} width={112} height={62} tone={node.tone} />
          </g>
        ))}
      </EmblemScene>
    );
  }

  if (visualId === "ai-force-multiplier") {
    return (
      <EmblemScene markerId={markerId}>
        {[104, 168, 232, 296].map((y) => (
          <g key={y}>
            <EmblemCapsule x={72} y={y} width={112} height={38} />
            <path d={`M184 ${y + 19}C272 ${y + 19} 292 240 364 240`} className="visual-emblem-route visual-emblem-route-muted" />
          </g>
        ))}
        <EmblemCapsule x={364} y={184} width={172} height={112} tone="hot" />
        <path d="M536 240H746" className="visual-emblem-route" markerEnd={arrow} />
        <EmblemCapsule x={708} y={190} width={130} height={100} tone="success" />
        <path d="M430 182C430 86 680 82 760 164" className="visual-emblem-route visual-emblem-route-hot" />
      </EmblemScene>
    );
  }

  if (visualId === "backend-to-data-engineer-rockfi") {
    return (
      <EmblemScene markerId={markerId}>
        {[128, 214, 300].map((y, index) => (
          <EmblemCheckpoint key={y} x={104} y={y} tone={index === 2 ? "hot" : "default"} radius={14 - index * 2} />
        ))}
        <path d="M120 128C232 128 202 210 300 210S366 256 404 290" className="visual-emblem-route" markerEnd={arrow} />
        <path d="M120 214C230 214 260 256 404 290M120 300C240 300 304 320 404 290" className="visual-emblem-route visual-emblem-route-muted" />
        {[{ x: 422, y: 270, h: 98 }, { x: 560, y: 204, h: 164 }, { x: 698, y: 126, h: 242 }].map((layer, index) => (
          <rect
            key={layer.x}
            x={layer.x}
            y={layer.y}
            width="104"
            height={layer.h}
            rx="28"
            className={`visual-emblem-terrace visual-emblem-terrace-${index}`}
          />
        ))}
      </EmblemScene>
    );
  }

  if (visualId === "claude-code-product-os") {
    const points = [{ x: 450, y: 106 }, { x: 674, y: 190 }, { x: 596, y: 350 }, { x: 304, y: 350 }, { x: 226, y: 190 }];
    return (
      <EmblemScene markerId={markerId}>
        <circle cx="450" cy="238" r="82" className="visual-emblem-orbit-core" />
        <EmblemCapsule x={392} y={206} width={116} height={64} tone="hot" />
        {points.map((point, index) => {
          const next = points[(index + 1) % points.length]!;
          return (
            <g key={`${point.x}-${point.y}`}>
              <path d={`M${point.x} ${point.y}Q450 238 ${next.x} ${next.y}`} className="visual-emblem-route" markerEnd={arrow} />
              <EmblemCheckpoint x={point.x} y={point.y} tone={index === 2 ? "success" : "default"} radius={14} />
            </g>
          );
        })}
      </EmblemScene>
    );
  }

  if (visualId === "context-engineering-beyond-prompt-engineering") {
    return (
      <EmblemScene markerId={markerId}>
        {[{ x: 126, y: 84, w: 480, h: 304 }, { x: 168, y: 126, w: 396, h: 220 }, { x: 210, y: 168, w: 312, h: 136 }].map((layer, index) => (
          <rect key={layer.x} x={layer.x} y={layer.y} width={layer.w} height={layer.h} rx={38 - index * 6} className="visual-emblem-stack" />
        ))}
        <EmblemCapsule x={298} y={205} width={136} height={62} tone="hot" />
        <path d="M434 236H686" className="visual-emblem-route" markerEnd={arrow} />
        <rect x="688" y="158" width="58" height="156" rx="29" className="visual-emblem-firewall" />
        <EmblemCheckpoint x={798} y={236} tone="success" radius={20} />
      </EmblemScene>
    );
  }

  if (visualId === "engineering-2026-ai-redefined-our-job") {
    return (
      <EmblemScene markerId={markerId}>
        <EmblemCapsule x={142} y={128} width={176} height={74} />
        <EmblemCapsule x={142} y={278} width={176} height={74} tone="hot" />
        <EmblemCheckpoint x={450} y={238} tone="hot" radius={34} />
        <path d="M318 165C372 165 368 216 412 226M318 315C372 315 368 260 412 250" className="visual-emblem-route" />
        <path d="M488 226C544 214 548 160 604 160M488 250C544 262 548 316 604 316" className="visual-emblem-route visual-emblem-route-hot" />
        <EmblemCapsule x={604} y={130} width={146} height={60} tone="success" />
        <EmblemCapsule x={604} y={286} width={146} height={60} tone="success" />
      </EmblemScene>
    );
  }

  if (visualId === "engineering-documents-age-poorly") {
    return (
      <EmblemScene markerId={markerId}>
        <path d="M174 116H474L554 196V362H174Z" className="visual-emblem-document" />
        <path d="M474 116V196H554M232 214H468M232 256H430M232 298H388" className="visual-emblem-document-line" />
        <path d="M556 142C726 128 782 214 742 326C708 410 574 402 548 320" className="visual-emblem-route visual-emblem-route-hot" markerEnd={arrow} />
        <EmblemCheckpoint x={730} y={216} tone="hot" radius={16} />
        <EmblemCapsule x={626} y={300} width={132} height={66} tone="success" />
      </EmblemScene>
    );
  }

  if (visualId === "forest-admin-activity-logs-elasticsearch") {
    return (
      <EmblemScene markerId={markerId}>
        <g className="visual-emblem-vault">
          <ellipse cx="202" cy="158" rx="92" ry="30" />
          <path d="M110 158V336C110 376 294 376 294 336V158" />
          <ellipse cx="202" cy="336" rx="92" ry="30" />
          {[202, 236, 270].map((y) => <path key={y} d={`M136 ${y}H268`} />)}
        </g>
        <path d="M294 244H548" className="visual-emblem-route" markerEnd={arrow} />
        <g className="visual-emblem-index">
          {[{ x: 612, y: 142 }, { x: 724, y: 188 }, { x: 650, y: 304 }, { x: 760, y: 330 }].map((node) => (
            <circle key={`${node.x}-${node.y}`} cx={node.x} cy={node.y} r="24" />
          ))}
          <path d="M612 142L724 188L650 304L760 330M724 188L760 330" />
        </g>
        <circle cx="794" cy="116" r="42" className="visual-emblem-lens" />
        <path d="M824 146L856 178" className="visual-emblem-lens" />
      </EmblemScene>
    );
  }

  if (visualId === "idempotency-debounce-jobify-bullmq") {
    return (
      <EmblemScene markerId={markerId}>
        {[116, 194, 272].map((y, index) => (
          <g key={y}>
            <EmblemCapsule x={96} y={y} width={150} height={54} tone={index === 1 ? "hot" : "default"} />
            <path d={`M246 ${y + 27}H370`} className="visual-emblem-route visual-emblem-route-muted" />
          </g>
        ))}
        <rect x="370" y="142" width="148" height="182" rx="42" className="visual-emblem-stamp" />
        <path d="M518 232H712" className="visual-emblem-route" markerEnd={arrow} />
        <EmblemCapsule x={680} y={196} width={142} height={72} tone="success" />
        <path d="M206 326V380H340" className="visual-emblem-route visual-emblem-route-danger" />
      </EmblemScene>
    );
  }

  if (visualId === "jobify-workers-queues-nestjs") {
    return (
      <EmblemScene markerId={markerId}>
        {[108, 184, 260].map((y, index) => <EmblemCapsule key={y} x={80} y={y} width={142} height={48} tone={index === 1 ? "hot" : "default"} />)}
        <path d="M222 132C290 132 288 226 358 226M222 208H358M222 284C290 284 288 226 358 226" className="visual-emblem-route" />
        <rect x="358" y="176" width="164" height="100" rx="32" className="visual-emblem-queue" />
        <path d="M522 226H630" className="visual-emblem-route" markerEnd={arrow} />
        <EmblemCapsule x={630} y={176} width={118} height={100} tone="hot" />
        <path d="M748 226H830" className="visual-emblem-route" markerEnd={arrow} />
      </EmblemScene>
    );
  }

  if (visualId === "joining-rockfi") {
    return (
      <EmblemScene markerId={markerId}>
        <path d="M68 366C190 330 206 274 320 272S458 182 564 184S694 118 834 110" className="visual-emblem-route visual-emblem-route-trail" markerEnd={arrow} />
        {[{ x: 156, y: 334 }, { x: 338, y: 268 }, { x: 548, y: 184 }, { x: 740, y: 130 }].map((point, index) => (
          <EmblemCheckpoint key={`${point.x}-${point.y}`} {...point} tone={index === 3 ? "success" : "default"} radius={index === 3 ? 16 : 11} />
        ))}
        <path d="M694 182L742 102L790 182Z" className="visual-emblem-launchpad" />
        <path d="M742 102V68" className="visual-emblem-launchpad" />
      </EmblemScene>
    );
  }

  if (visualId === "nodejs-stream-backpressure-history-export") {
    return (
      <EmblemScene markerId={markerId}>
        <path d="M82 164H684C748 164 774 210 774 258V306" className="visual-emblem-pipe" />
        <path d="M82 316H684C718 316 726 290 726 258" className="visual-emblem-pipe" />
        {[180, 334, 488, 642].map((x, index) => <rect key={x} x={x} y="142" width="84" height="196" rx="26" className={`visual-emblem-valve visual-emblem-valve-${index}`} />)}
        <path d="M786 162V354C786 382 834 382 834 354V162" className="visual-emblem-reservoir" />
        <path d="M116 238H716" className="visual-emblem-route visual-emblem-route-hot" markerEnd={arrow} />
        {[268, 422, 576].map((x) => <path key={x} d={`M${x} 188V288`} className="visual-emblem-pressure" />)}
      </EmblemScene>
    );
  }

  if (visualId === "polymagine-industry-4-eyewear-2017") {
    return (
      <EmblemScene markerId={markerId}>
        <path d="M244 128C160 164 152 314 224 360C300 410 436 396 478 316C514 244 468 138 388 118C338 106 286 108 244 128Z" className="visual-emblem-face" />
        {[{ x: 252, y: 180 }, { x: 316, y: 140 }, { x: 386, y: 174 }, { x: 232, y: 250 }, { x: 300, y: 302 }, { x: 400, y: 282 }].map((point) => <circle key={`${point.x}-${point.y}`} {...point} r="5" className="visual-emblem-scan-dot" />)}
        <path d="M238 230C266 208 310 208 338 230M338 230C366 208 410 208 438 230M338 230H354" className="visual-emblem-glasses" />
        <path d="M494 236H746" className="visual-emblem-route" markerEnd={arrow} />
        <path d="M664 166L746 236L664 306" className="visual-emblem-mesh" />
        <path d="M664 166V306M664 236H746" className="visual-emblem-mesh" />
        <EmblemCheckpoint x={786} y={236} tone="success" radius={30} />
      </EmblemScene>
    );
  }

  if (visualId === "postgresql-unique-nulls") {
    return (
      <EmblemScene markerId={markerId}>
        <EmblemCapsule x={108} y={138} width={170} height={74} />
        <EmblemCapsule x={108} y={270} width={170} height={74} />
        <path d="M278 174C360 174 350 230 414 230M278 306C360 306 350 250 414 250" className="visual-emblem-route" />
        <rect x="414" y="158" width="150" height="164" rx="42" className="visual-emblem-lock" />
        <path d="M452 216V196C452 152 526 152 526 196V216M470 216H508V274H470Z" className="visual-emblem-lock-glyph" />
        <path d="M564 240H760" className="visual-emblem-route" markerEnd={arrow} />
        <EmblemCapsule x={702} y={198} width={126} height={84} tone="success" />
      </EmblemScene>
    );
  }

  if (visualId === "rebuilding-cloud-experience-forest-admin") {
    return (
      <EmblemScene markerId={markerId}>
        {[{ x: 96, y: 126 }, { x: 96, y: 226 }, { x: 96, y: 326 }, { x: 238, y: 176 }, { x: 238, y: 276 }].map((node, index) => (
          <EmblemCapsule key={`${node.x}-${node.y}`} {...node} width={88} height={56} tone={index === 4 ? "hot" : "default"} />
        ))}
        <path d="M184 154C328 154 332 238 410 238M184 254H410M184 354C328 354 332 242 410 242M326 204C366 204 370 238 410 238M326 304C366 304 370 242 410 242" className="visual-emblem-route visual-emblem-route-muted" />
        <path d="M410 140H484L534 240L484 340H410L460 240Z" className="visual-emblem-nat" />
        <path d="M534 240H640" className="visual-emblem-route visual-emblem-route-hot" markerEnd={arrow} />
        <g className="visual-emblem-db">
          <ellipse cx="730" cy="170" rx="92" ry="28" />
          <path d="M638 170V330C638 368 822 368 822 330V170" />
          <ellipse cx="730" cy="330" rx="92" ry="28" />
        </g>
      </EmblemScene>
    );
  }

  if (visualId === "redis-memory-exhaustion-post-mortem") {
    return (
      <EmblemScene markerId={markerId}>
        <rect x="142" y="110" width="344" height="260" rx="56" className="visual-emblem-pressure-vessel" />
        {[{ y: 142, tone: "default" as const }, { y: 214, tone: "hot" as const }, { y: 286, tone: "danger" as const }].map((segment) => (
          <EmblemCapsule key={segment.y} x={180} y={segment.y} width={268} height={44} tone={segment.tone} />
        ))}
        <path d="M486 240H616" className="visual-emblem-route visual-emblem-route-danger" />
        <path d="M568 240L636 166M568 240L636 240M568 240L636 314" className="visual-emblem-split" />
        {[166, 240, 314].map((y, index) => <EmblemCapsule key={y} x={636} y={y - 24} width={164} height={48} tone={index === 2 ? "success" : "default"} />)}
      </EmblemScene>
    );
  }

  if (visualId === "rocket-curiosity") {
    return (
      <EmblemScene markerId={markerId}>
        <path d="M104 156L212 102L312 166L412 92L510 146" className="visual-emblem-constellation" />
        {[{ x: 104, y: 156 }, { x: 212, y: 102 }, { x: 312, y: 166 }, { x: 412, y: 92 }, { x: 510, y: 146 }].map((point) => <EmblemCheckpoint key={`${point.x}-${point.y}`} {...point} tone="default" radius={7} />)}
        <path d="M72 354C214 324 292 376 430 338S666 300 836 344" className="visual-emblem-horizon" />
        <path d="M542 338C572 220 612 176 652 338Z" className="visual-emblem-volcano" />
        <path d="M596 236C620 210 648 202 678 184" className="visual-emblem-volcano-glow" />
        <path d="M510 146C568 184 594 232 596 272" className="visual-emblem-route visual-emblem-route-hot" />
      </EmblemScene>
    );
  }

  if (visualId === "rocket-earthbound-engineering") {
    return (
      <EmblemScene markerId={markerId}>
        <circle cx="348" cy="270" r="132" className="visual-emblem-earth" />
        <path d="M196 260C264 200 366 194 474 240M218 320C302 274 398 288 466 336" className="visual-emblem-earth-line" />
        <ellipse cx="348" cy="270" rx="252" ry="128" className="visual-emblem-orbit" />
        <path d="M484 186C610 112 694 118 788 72" className="visual-emblem-route" markerEnd={arrow} />
        <path d="M544 158L578 178L548 200Z" className="visual-emblem-ship" />
        {[{ x: 528, y: 224 }, { x: 586, y: 166 }, { x: 634, y: 128 }].map((point) => <circle key={`${point.x}-${point.y}`} {...point} r="5" className="visual-emblem-debris" />)}
      </EmblemScene>
    );
  }

  if (visualId === "rocket-heavencraft-systems") {
    return (
      <EmblemScene markerId={markerId}>
        <g className="visual-emblem-voxel-core">
          <path d="M450 144L548 200V312L450 368L352 312V200Z" />
          <path d="M450 144V256L548 200M450 256L352 200M450 256V368" />
        </g>
        {[{ x: 156, y: 126 }, { x: 656, y: 126 }, { x: 672, y: 302 }, { x: 144, y: 306 }].map((node, index) => (
          <g key={`${node.x}-${node.y}`}>
            <path d={`M${node.x + 54} ${node.y + 38}Q450 256 ${index < 2 ? 396 : 504} ${index < 2 ? 208 : 304}`} className="visual-emblem-route visual-emblem-route-muted" />
            <EmblemCapsule x={node.x} y={node.y} width={108} height={76} tone={index === 2 ? "success" : "default"} />
          </g>
        ))}
      </EmblemScene>
    );
  }

  if (visualId === "scaling-ci-github-actions-forest-admin") {
    return (
      <EmblemScene markerId={markerId}>
        {[110, 250, 390, 530].map((x, index) => (
          <g key={x} className="visual-emblem-booster">
            <path d={`M${x} 324L${x + 44} 124L${x + 88} 324Z`} />
            <path d={`M${x + 44} 324V364`} />
            <circle cx={x + 44} cy="216" r="14" className={index === 3 ? "visual-emblem-hot-fill" : undefined} />
          </g>
        ))}
        <path d="M154 364C308 430 526 430 690 330" className="visual-emblem-route" markerEnd={arrow} />
        <rect x="674" y="252" width="132" height="128" rx="36" className="visual-emblem-gate" />
        <path d="M714 316L738 340L776 288" className="visual-emblem-gate-check" />
      </EmblemScene>
    );
  }

  if (visualId === "scim-user-provisioning-forest-admin") {
    return (
      <EmblemScene markerId={markerId}>
        {[104, 202, 300].map((y, index) => (
          <g key={y}>
            <rect x="94" y={y} width="170" height="72" rx="20" className={`visual-emblem-passport visual-emblem-passport-${index}`} />
            <circle cx="128" cy={y + 36} r="12" />
            <path d={`M154 ${y + 26}H230M154 ${y + 46}H210`} />
          </g>
        ))}
        <path d="M264 140C360 140 346 236 410 236M264 238H410M264 336C360 336 346 240 410 240" className="visual-emblem-route" />
        <rect x="410" y="146" width="104" height="184" rx="42" className="visual-emblem-airlock" />
        <path d="M514 238H654" className="visual-emblem-route" markerEnd={arrow} />
        <EmblemCapsule x={654} y={186} width={154} height={104} tone="success" />
      </EmblemScene>
    );
  }

  if (visualId === "security-authentication-idp-openid-connect") {
    return (
      <EmblemScene markerId={markerId}>
        <rect x="72" y="116" width="230" height="246" rx="40" className="visual-emblem-trust-zone" />
        <rect x="598" y="78" width="230" height="154" rx="40" className="visual-emblem-trust-zone" />
        <rect x="598" y="248" width="230" height="154" rx="40" className="visual-emblem-trust-zone" />
        <EmblemCapsule x={116} y={210} width={142} height={60} />
        <rect x="366" y="154" width="168" height="168" rx="52" className="visual-emblem-trust-tower" />
        <path d="M258 240H366M534 192C576 182 570 156 598 156M534 284C576 294 570 324 598 324" className="visual-emblem-route" markerEnd={arrow} />
        <EmblemCapsule x={642} y={124} width={142} height={54} tone="hot" />
        <EmblemCapsule x={642} y={294} width={142} height={54} tone="success" />
        <EmblemCheckpoint x={450} y={238} tone="hot" radius={18} />
      </EmblemScene>
    );
  }

  if (visualId === "self-service-analytics-that-doesnt-lie") {
    return (
      <EmblemScene markerId={markerId}>
        {[118, 220, 322].map((y) => <EmblemCheckpoint key={y} x={112} y={y} tone="default" radius={12} />)}
        <path d="M128 118C236 118 258 184 346 212M128 220H346M128 322C236 322 258 274 346 252" className="visual-emblem-route visual-emblem-route-muted" />
        <rect x="346" y="148" width="182" height="164" rx="46" className="visual-emblem-certified-core" />
        <path d="M528 230H676" className="visual-emblem-route" markerEnd={arrow} />
        <rect x="676" y="154" width="142" height="152" rx="38" className="visual-emblem-dashboard" />
        <path d="M704 260H790M704 228H760M704 196H776" className="visual-emblem-dashboard-line" />
        <path d="M194 382C378 432 528 416 660 332" className="visual-emblem-route visual-emblem-route-danger" />
      </EmblemScene>
    );
  }

  if (visualId === "the-onboarding-matrix-forest-admin") {
    return (
      <EmblemScene markerId={markerId}>
        {[{ x: 106, y: 120 }, { x: 216, y: 120 }, { x: 106, y: 230 }, { x: 216, y: 230 }].map((cell) => <rect key={`${cell.x}-${cell.y}`} {...cell} width="92" height="92" rx="18" className="visual-emblem-matrix-cell" />)}
        <path d="M152 166C290 86 278 372 414 238M262 166C330 116 320 328 414 238M152 276C294 394 312 84 414 238M262 276C356 362 358 128 414 238" className="visual-emblem-tangle" />
        <EmblemCheckpoint x={414} y={238} tone="hot" radius={22} />
        <path d="M436 238H564" className="visual-emblem-route" markerEnd={arrow} />
        {[120, 220, 320].map((y, index) => <EmblemCapsule key={y} x={596} y={y} width={166} height={52} tone={index === 1 ? "success" : "default"} />)}
      </EmblemScene>
    );
  }

  if (visualId === "unknown-unknowns-software-architecture") {
    return (
      <EmblemScene markerId={markerId}>
        <path d="M116 360A246 246 0 0 1 468 108" className="visual-emblem-radar" />
        <path d="M116 360L466 142L400 360Z" className="visual-emblem-radar-cone" />
        {[{ x: 256, y: 254 }, { x: 330, y: 196 }, { x: 398, y: 290 }].map((point, index) => <EmblemCheckpoint key={`${point.x}-${point.y}`} {...point} tone={index === 1 ? "danger" : "hot"} radius={10} />)}
        <path d="M470 102V378" className="visual-emblem-boundary-line" />
        <path d="M492 330C570 280 620 222 720 234S788 160 836 114" className="visual-emblem-route" markerEnd={arrow} />
        {[{ x: 568, y: 286 }, { x: 688, y: 234 }, { x: 788, y: 170 }].map((point, index) => <EmblemCheckpoint key={`${point.x}-${point.y}`} {...point} tone={index === 2 ? "success" : "default"} radius={index === 2 ? 15 : 10} />)}
      </EmblemScene>
    );
  }

  return (
    <EmblemScene markerId={markerId}>
      <path d="M84 332C212 238 292 348 414 224S646 194 816 122" className="visual-emblem-route" markerEnd={arrow} />
      {[{ x: 84, y: 332 }, { x: 414, y: 224 }, { x: 816, y: 122 }].map((point, index) => <EmblemCheckpoint key={`${point.x}-${point.y}`} {...point} tone={index === 2 ? "success" : "default"} />)}
    </EmblemScene>
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

function TrailSaintJacquesProfile({
  copy,
  markerId,
}: {
  copy: DiagramCopy;
  markerId: string;
}) {
  const labels = copy.labels;
  const arrow = `url(#${markerId}-arrow)`;
  const route = "M64 352C134 300 188 280 252 300S340 344 414 242S526 96 624 180S744 336 846 132";
  const checkpoints = [
    { x: 134, y: 308, label: labels.start, tone: "hot" as const },
    { x: 414, y: 242, label: labels.water, tone: "danger" as const },
    { x: 624, y: 180, label: labels.crew, tone: "success" as const },
    { x: 808, y: 160, label: labels.finish, tone: "success" as const },
  ];

  return (
    <DiagramFrame markerId={markerId}>
      <text x="52" y="62" className="visual-kicker">
        {labels.course}
      </text>
      <path
        d="M54 382L136 330L212 360L312 278L384 340L492 192L568 254L658 144L736 284L846 178"
        className="visual-elevation-line visual-elevation-line-muted"
      />
      <path d={route} className="visual-route visual-route-hot" markerEnd={arrow} />
      <path d="M64 398H846" className="visual-axis" />
      <text x="64" y="430" className="visual-micro-label">
        {labels.monistrol}
      </text>
      <text x="846" y="430" textAnchor="end" className="visual-micro-label visual-micro-label-hot">
        {labels.cathedral}
      </text>
      {checkpoints.map((checkpoint, index) => (
        <g key={checkpoint.label}>
          <circle
            cx={checkpoint.x}
            cy={checkpoint.y}
            r={index === 3 ? 18 : 12}
            className={
              checkpoint.tone === "danger"
                ? "visual-checkpoint visual-checkpoint-danger"
                : checkpoint.tone === "success"
                  ? "visual-checkpoint visual-checkpoint-success"
                  : "visual-checkpoint"
            }
          />
          <text
            x={checkpoint.x}
            y={checkpoint.y - (index === 2 ? 34 : 26)}
            textAnchor="middle"
            className={checkpoint.tone === "danger" ? "visual-micro-label visual-micro-label-danger" : "visual-micro-label"}
          >
            {checkpoint.label}
          </text>
        </g>
      ))}
      <g className="visual-cathedral">
        <path d="M778 112V172H842V112L810 76Z" />
        <path d="M794 112V90H826V112" />
        <path d="M810 76V54" />
      </g>
    </DiagramFrame>
  );
}

function ArticleEssenceDiagram({
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
  const label = (key: string) => copy.labels[key] ?? "";
  const arrow = `url(#${markerId}-arrow)`;

  if (visualId === "agent-battle-2026") {
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">AGENT ARENA · 2026</text>
        {[{ x: 58, name: "CODEX", y: 138 }, { x: 338, name: "CLAUDE CODE", y: 174 }, { x: 618, name: "HERD", y: 116 }].map((agent) => (
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
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">AUTHORIZED OPERATING STATE</text>
        {[{ x: 70, y: 78, w: 650, h: 330, key: "d" }, { x: 126, y: 124, w: 538, h: 238, key: "c" }, { x: 186, y: 168, w: 418, h: 150, key: "b" }].map((layer, index) => <g key={layer.key}><rect x={layer.x} y={layer.y} width={layer.w} height={layer.h} rx={28 - index * 4} className="visual-boundary" /><text x={layer.x + 18} y={layer.y + 28} className="visual-micro-label">{label(layer.key)}</text></g>)}
        <DiagramNode x={310} y={204} width={170} label="AGENT" tone="hot" />
        <rect x="760" y="104" width="48" height="274" rx="20" className="visual-firewall" />
        <text x="784" y="242" textAnchor="middle" transform="rotate(-90 784 242)" className="visual-firewall-label">{label("e")}</text>
        <path d="M480 240H744" className="visual-flow-line" markerEnd={arrow} />
        <circle cx="846" cy="240" r="22" className="visual-checkpoint" />
        {!compact ? <text x="846" y="286" textAnchor="middle" className="visual-micro-label">ACTION</text> : null}
      </DiagramFrame>
    );
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
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">DOCUMENT DECAY CURVE</text>
        <path d="M72 118C226 126 312 176 414 246S664 354 830 374" className="visual-elevation-line" />
        <path d="M72 396V92M72 396H842" className="visual-axis" />
        {[{ x: 130, y: 136, key: "a" }, { x: 272, y: 188, key: "b" }, { x: 414, y: 246, key: "c" }].map((point) => <g key={point.key}><circle cx={point.x} cy={point.y} r="11" className="visual-checkpoint" /><text x={point.x} y={point.y - 24} textAnchor="middle" className="visual-micro-label">{label(point.key)}</text></g>)}
        <path d="M632 102V396" className="visual-target-line" />
        <text x="632" y="86" textAnchor="middle" className="visual-note visual-note-hot">{label("d")}</text>
        <path d="M632 330C632 196 738 154 820 154" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
        <DiagramNode x={702} y={118} width={138} label={label("e")} tone="success" />
      </DiagramFrame>
    );
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
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">GOVERNED QUERY PATH</text>
        {[112, 202, 292].map((y, index) => <g key={y}><circle cx="82" cy={y + 28} r="20" className="visual-checkpoint" /><path d={`M102 ${y + 28}C178 ${y + 28} 178 240 238 240`} className="visual-flow-line visual-flow-muted" /><text x="82" y={y + 66} textAnchor="middle" className="visual-micro-label">S{index + 1}</text></g>)}
        <rect x="238" y="92" width="256" height="296" rx="28" className="visual-boundary" />
        <text x="264" y="130" className="visual-kicker">GOVERNED ZONE</text>
        {[154, 224, 294].map((y, index) => <g key={y} className="visual-node"><rect x="286" y={y} width="160" height="52" rx="14" /><text x="366" y={y + 32} textAnchor="middle">MART {index + 1}</text></g>)}
        <path d="M494 240H584" className="visual-flow-line" markerEnd={arrow} />
        <rect x="584" y="116" width="58" height="248" rx="22" className="visual-firewall" />
        <text x="613" y="240" textAnchor="middle" transform="rotate(-90 613 240)" className="visual-firewall-label">{label("c")}</text>
        <path d="M642 240H716" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
        <DiagramNode x={716} y={204} width={148} label={label("d")} tone="success" />
        <path d="M102 362C292 446 540 446 584 342" className="visual-flow-line visual-flow-danger" markerEnd={arrow} />
        {!compact ? <text x="334" y="430" textAnchor="middle" className="visual-note visual-note-hot">RAW BYPASS · REJECTED</text> : null}
      </DiagramFrame>
    );
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
    return (
      <DiagramFrame markerId={markerId}>
        <text x="44" y="58" className="visual-kicker">ARCHITECTURAL KNOWLEDGE MATRIX</text>
        <path d="M114 102V398M114 398H724" className="visual-axis" />
        {[{ x: 114, y: 102, hot: false }, { x: 420, y: 102, hot: false }, { x: 114, y: 250, hot: false }, { x: 420, y: 250, hot: true }].map((cell, index) => <g key={`${cell.x}-${cell.y}`}><rect x={cell.x} y={cell.y} width="306" height="148" className={cell.hot ? "visual-firewall" : "visual-boundary"} /><text x={cell.x + 153} y={cell.y + 80} textAnchor="middle" className={cell.hot ? "visual-firewall-label" : "visual-note"}>{["KNOWN / KNOWN", "KNOWN / UNKNOWN", "UNKNOWN / KNOWN", "UNKNOWN / UNKNOWN"][index]}</text></g>)}
        {[{ x: 470, y: 304 }, { x: 566, y: 350 }, { x: 670, y: 288 }].map((sensor) => <circle key={`${sensor.x}-${sensor.y}`} cx={sensor.x} cy={sensor.y} r="10" className="visual-checkpoint" />)}
        <path d="M724 324H812V170" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
        <DiagramNode x={744} y={98} width={126} label={label("e")} tone="success" />
        {!compact ? <text x="810" y="360" textAnchor="middle" className="visual-micro-label">{label("b")} · {label("c")}</text> : null}
      </DiagramFrame>
    );
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

function SecurityDiagramScene({
  copy,
  markerId,
  diagramId,
}: {
  copy: SecurityDiagramCopy;
  markerId: string;
  diagramId: SecurityDiagramId;
}) {
  const labels = copy.labels;
  const arrow = `url(#${markerId}-arrow)`;

  if (diagramId === "federation-overview") {
    return (
      <DiagramFrame markerId={markerId}>
        <rect x="42" y="100" width="232" height="272" rx="30" className="visual-boundary" />
        <rect x="592" y="56" width="264" height="154" rx="30" className="visual-boundary" />
        <rect x="592" y="270" width="264" height="154" rx="30" className="visual-boundary" />
        <text x="64" y="132" className="visual-kicker">{labels.sp}</text>
        <text x="614" y="88" className="visual-kicker">{labels.idp}</text>
        <DiagramNode x={82} y={212} width={154} label={labels.browser ?? ""} />
        <DiagramNode x={358} y={194} width={156} label={labels.forest ?? ""} tone="hot" />
        <DiagramNode x={636} y={112} width={176} label={labels.upstream ?? ""} />
        <DiagramNode x={636} y={322} width={176} label={labels.agent ?? ""} tone="success" />
        <path d="M236 248H358M514 224C574 220 566 148 636 148" className="visual-flow-line" markerEnd={arrow} />
        <path d="M514 266C574 270 566 358 636 358" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
        <text x="538" y="172" textAnchor="middle" className="visual-micro-label">{labels.proof}</text>
        <text x="548" y="334" textAnchor="middle" className="visual-micro-label visual-micro-label-hot">{labels.token}</text>
        <EmblemCheckpoint x={436} y={248} tone="hot" radius={12} />
      </DiagramFrame>
    );
  }

  if (diagramId === "oidc-authorization-code") {
    return (
      <DiagramFrame markerId={markerId}>
        <DiagramNode x={82} y={172} width={166} label={labels.browser ?? ""} />
        <DiagramNode x={368} y={292} width={166} label={labels.forest ?? ""} tone="hot" />
        <DiagramNode x={654} y={172} width={166} label={labels.idp ?? ""} />
        <path d="M248 198C358 88 542 88 654 198" className="visual-flow-line" markerEnd={arrow} />
        <path d="M654 242C550 354 352 354 248 242" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
        <path d="M248 242V330H368" className="visual-flow-line visual-flow-muted" markerEnd={arrow} />
        <path d="M534 330H654V250" className="visual-flow-line" markerEnd={arrow} />
        <text x="450" y="102" textAnchor="middle" className="visual-micro-label">{labels.redirect}</text>
        <text x="450" y="384" textAnchor="middle" className="visual-micro-label visual-micro-label-hot">{labels.code}</text>
        <text x="622" y="310" textAnchor="middle" className="visual-micro-label">{labels.redeem}</text>
        <EmblemCheckpoint x={451} y={330} tone="hot" radius={10} />
        <path d="M450 408H756" className="visual-axis" />
        <text x="756" y="434" textAnchor="end" className="visual-micro-label">{labels.session}</text>
      </DiagramFrame>
    );
  }

  if (diagramId === "downstream-validation") {
    return (
      <DiagramFrame markerId={markerId}>
        <DiagramNode x={64} y={190} width={150} label={labels.frontend ?? ""} />
        <rect x="328" y="90" width="190" height="302" rx="38" className="visual-firewall" />
        <text x="423" y="136" textAnchor="middle" className="visual-kicker">{labels.agent}</text>
        {[labels.signature, labels.audience, labels.time].map((label, index) => (
          <g key={label}>
            <circle cx="374" cy={190 + index * 66} r="9" className="visual-checkpoint" />
            <text x="396" y={195 + index * 66} className="visual-micro-label">{label}</text>
          </g>
        ))}
        <DiagramNode x={676} y={140} width={150} label={labels.allow ?? ""} tone="success" />
        <DiagramNode x={676} y={290} width={150} label={labels.deny ?? ""} />
        <path d="M214 226H328M518 200H676" className="visual-flow-line" markerEnd={arrow} />
        <path d="M518 282H612V326H676" className="visual-flow-line visual-flow-danger" markerEnd={arrow} />
        <path d="M422 392V432H612" className="visual-flow-line visual-flow-muted" markerEnd={arrow} />
        <text x="638" y="436" className="visual-micro-label">{labels.audit}</text>
      </DiagramFrame>
    );
  }

  return (
    <DiagramFrame markerId={markerId}>
      <DiagramNode x={54} y={190} width={150} label={labels.enterprise ?? ""} />
      <DiagramNode x={254} y={190} width={170} label={labels.assertion ?? ""} />
      <rect x="484" y="132" width="100" height="192" rx="36" className="visual-firewall" />
      <text x="534" y="238" textAnchor="middle" transform="rotate(-90 534 238)" className="visual-firewall-label">{labels.validate}</text>
      <DiagramNode x={634} y={190} width={156} label={labels.exchange ?? ""} tone="hot" />
      <path d="M204 226H254M424 226H484M584 226H634" className="visual-flow-line" markerEnd={arrow} />
      <path d="M790 226H846" className="visual-flow-line visual-flow-hot" markerEnd={arrow} />
      <text x="450" y="112" textAnchor="middle" className="visual-micro-label visual-micro-label-hot">{labels.unsafe}</text>
      <path d="M424 140C512 52 628 58 724 140" className="visual-flow-line visual-flow-danger" />
      <path d="M446 118L468 142M468 118L446 142" className="visual-flow-danger-cross" />
      <text x="846" y="198" textAnchor="end" className="visual-micro-label">{labels.token}</text>
      <EmblemCheckpoint x={534} y={226} tone="hot" radius={12} />
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
  const compact = false;
  const titleId = `${markerId}-title`;
  const descriptionId = `${markerId}-description`;

  let diagram: ReactNode;
  if (variant !== "inline" && visualId) {
    diagram = <PostVisualEmblem markerId={markerId} visualId={visualId} />;
  } else if (visualId === "bounded-ai-loop") {
    diagram = <BoundedAiLoop copy={copy} markerId={markerId} compact={compact} />;
  } else if (visualId === "sse-outbound-channel") {
    diagram = <SseOutboundChannel copy={copy} markerId={markerId} compact={compact} />;
  } else if (visualId === "trail-endurance-profile") {
    diagram = <TrailEnduranceProfile copy={copy} markerId={markerId} compact={compact} />;
  } else if (visualId === "trail-saint-jacques-100k-2026") {
    diagram = <TrailSaintJacquesProfile copy={copy} markerId={markerId} />;
  } else if (visualId) {
    diagram = (
      <ArticleEssenceDiagram
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

export function SecurityDiagram({ diagramId }: { diagramId: SecurityDiagramId }) {
  const { i18n } = useTranslation();
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language);
  const copy = SECURITY_DIAGRAM_COPY[locale][diagramId];
  const instanceId = useId().replaceAll(":", "");
  const markerId = `security-diagram-${instanceId}`;
  const titleId = `${markerId}-title`;
  const descriptionId = `${markerId}-description`;

  return (
    <figure
      className="post-visual post-system-visual post-system-visual-inline"
      data-visual-id={`security-${diagramId}`}
    >
      <svg
        className="post-system-visual-svg"
        viewBox="0 0 900 480"
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
      >
        <title id={titleId}>{copy.title}</title>
        <desc id={descriptionId}>{copy.description}</desc>
        <SecurityDiagramScene copy={copy} markerId={markerId} diagramId={diagramId} />
      </svg>
      <figcaption>{copy.caption}</figcaption>
    </figure>
  );
}
