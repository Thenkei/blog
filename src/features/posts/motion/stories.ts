import type { PostLocale } from "../content/types";

export type MotionStory = {
  kind: "flow" | "choice" | "cycle" | "threshold";
  beats: readonly [string, string, string];
};

type LocalizedStory = Record<PostLocale, MotionStory["beats"]> & {
  kind: MotionStory["kind"];
};

// Each sequence is a compact explanation of the article's own argument.
// Keep both locales in sync when adding or changing a published article.
export const MOTION_STORIES = {
  "agent-battle-2026": {
    kind: "choice",
    en: ["Start with the task", "Match context and controls", "Choose the right agent"],
    fr: ["Partir de la tâche", "Adapter contexte et contrôles", "Choisir le bon agent"],
  },
  "ai-force-multiplier": {
    kind: "flow",
    en: ["AI accelerates execution", "Engineers direct the work", "Judgment verifies the result"],
    fr: ["L’IA accélère l’exécution", "Les ingénieurs orientent le travail", "Le jugement vérifie le résultat"],
  },
  "ai-human-judgment-rockfi": {
    kind: "cycle",
    en: ["Challenges surface real practices", "Plugins carry context across handoffs", "Humans gate decisions and merge"],
    fr: ["Les challenges révèlent les pratiques", "Les plugins portent le contexte", "Des humains valident décisions et merge"],
  },
  "ai-is-not-immaterial": {
    kind: "threshold",
    en: ["Compute needs materials", "Efficiency can increase demand", "Account for the whole system"],
    fr: ["Le calcul exige des ressources", "L’efficacité peut accroître la demande", "Compter le système entier"],
  },
  "architecture-sse-agent-communication": {
    kind: "flow",
    en: ["Agent opens outbound HTTPS", "SSE delivers events", "Heartbeats and jitter sustain it"],
    fr: ["L’agent ouvre HTTPS en sortie", "SSE livre les événements", "Heartbeat et jitter maintiennent le canal"],
  },
  "backend-to-data-engineer-rockfi": {
    kind: "flow",
    en: ["Ingest partner feeds", "Orchestrate and model", "Serve trustworthy data"],
    fr: ["Ingérer les flux partenaires", "Orchestrer et modéliser", "Servir des données fiables"],
  },
  "better-handoffs-ai-engineering": {
    kind: "flow",
    en: ["Small agents investigate", "Evidence crosses the hand-off", "An engineer takes over"],
    fr: ["De petits agents enquêtent", "Les preuves passent le relais", "Un ingénieur reprend la main"],
  },
  "context-engineering-beyond-prompt-engineering": {
    kind: "flow",
    en: ["Select current context", "Check access and provenance", "Validate before action"],
    fr: ["Choisir le contexte à jour", "Vérifier accès et provenance", "Valider avant d’agir"],
  },
  "coros-apex-4": {
    kind: "threshold",
    en: ["A 100 km goal", "GPS must last the race", "Choose for endurance"],
    fr: ["Un objectif de 100 km", "Le GPS doit tenir la course", "Choisir pour l’endurance"],
  },
  "data-platform-ingestion-drift": {
    kind: "flow",
    en: ["Sources change without notice", "Bronze keeps what was sent", "Silver contracts stop the drift"],
    fr: ["Les sources changent sans prévenir", "Bronze garde ce qui a été envoyé", "Les contrats Silver bloquent la dérive"],
  },
  "data-platform-reverse-etl-freshness": {
    kind: "threshold",
    en: ["Every clock adds its own delay", "Only fresher values are applied", "Show the time, degrade past it"],
    fr: ["Chaque horloge ajoute son retard", "N’appliquer que du plus frais", "Afficher l’heure, dégrader au-delà"],
  },
  "data-platform-retrospective": {
    kind: "choice",
    en: ["Count the moving parts", "Keep execution in our perimeter", "Match the stack to the constraints"],
    fr: ["Compter les pièces mobiles", "Garder l’exécution chez nous", "Adapter le stack aux contraintes"],
  },
  "data-platform-terraform-access-and-flows": {
    kind: "flow",
    en: ["Access and connectors as code", "Every plan reviewed in a PR", "Destroys blocked before apply"],
    fr: ["Accès et connecteurs en code", "Chaque plan relu en PR", "Destructions bloquées avant apply"],
  },
  "data-platform-tests-as-contracts": {
    kind: "threshold",
    en: ["dbt build tests between models", "A blocking check stops downstream", "An old number beats a wrong one"],
    fr: ["dbt build teste entre les modèles", "Un check bloquant arrête l’aval", "Mieux vaut daté que faux"],
  },
  "engineer-life-late-2026": {
    kind: "choice",
    en: ["Eight jobs in one terminal", "Each task needs a different review", "Check before merging or publishing"],
    fr: ["Huit métiers dans un terminal", "Chaque tâche demande une relecture adaptée", "Vérifier avant de merger ou publier"],
  },
  "engineering-2026-ai-redefined-our-job": {
    kind: "choice",
    en: ["Production gets faster", "Review becomes the bottleneck", "Engineer the new controls"],
    fr: ["La production accélère", "La revue devient le goulot", "Concevoir les nouveaux contrôles"],
  },
  "engineering-documents-age-poorly": {
    kind: "cycle",
    en: ["Record a decision", "Change triggers review", "Renew or archive the page"],
    fr: ["Consigner une décision", "Le changement déclenche une revue", "Réviser ou archiver la page"],
  },
  "forest-admin-activity-logs-elasticsearch": {
    kind: "flow",
    en: ["Activity logs grow", "Move search to an index", "Migrate without losing history"],
    fr: ["Les journaux grossissent", "Déplacer la recherche vers un index", "Migrer sans perdre l’historique"],
  },
  "frontier-model-race-2026": {
    kind: "choice",
    en: ["No single leaderboard", "Compare different strengths", "Pick for the workflow"],
    fr: ["Pas de classement unique", "Comparer des forces différentes", "Choisir selon le workflow"],
  },
  "heavencraft-first-systems": {
    kind: "cycle",
    en: ["Build a game server", "Players shape the system", "Learn from real usage"],
    fr: ["Créer un serveur de jeu", "Les joueurs façonnent le système", "Apprendre de l’usage réel"],
  },
  "idempotency-debounce-jobify-bullmq": {
    kind: "threshold",
    en: ["Many triggers arrive", "Debounce collapses the burst", "One job runs with fresh data"],
    fr: ["Les déclencheurs affluent", "Le debounce regroupe la rafale", "Un job lit les données à jour"],
  },
  "internal-tools-are-a-product": {
    kind: "flow",
    en: ["Every screen redefines the rules", "Move the rules into one engine", "Screens inherit consistency"],
    fr: ["Chaque écran redéfinit les règles", "Déplacer les règles dans un moteur", "Les écrans héritent la cohérence"],
  },
  "internal-tools-core-engine": {
    kind: "flow",
    en: ["A screen asks for data", "Identity, access, audit", "Replica reads, service writes"],
    fr: ["Un écran demande une donnée", "Identité, accès, audit", "Lire en replica, écrire par service"],
  },
  "internal-tools-query-language": {
    kind: "flow",
    en: ["One syntax for every source", "The engine plans bounded queries", "No N+1, no in-memory filters"],
    fr: ["Une syntaxe pour toutes les sources", "Le moteur planifie des requêtes bornées", "Ni N+1, ni filtre en mémoire"],
  },
  "internal-tools-governance-by-construction": {
    kind: "threshold",
    en: ["Same query, different roles", "Fields are masked, not hidden", "Every read lands in the audit"],
    fr: ["Même requête, rôles différents", "Des champs masqués, pas cachés", "Chaque lecture entre dans l’audit"],
  },
  "internal-tools-consistency-by-default": {
    kind: "choice",
    en: ["Declare a collection", "Tables, links and search come free", "Opt out only when it costs"],
    fr: ["Déclarer une collection", "Tables, liens et recherche offerts", "Retirer seulement si ça coûte"],
  },
  "internal-tools-built-with-agents": {
    kind: "cycle",
    en: ["Any agent writes a screen", "The engine enforces the rules", "Teams switch process by process"],
    fr: ["N’importe quel agent écrit un écran", "Le moteur impose les règles", "Bascule processus par processus"],
  },
  "internal-tools-still-believe": {
    kind: "choice",
    en: ["A governed foundation proposed", "RockFi chose a different direction", "The engineering conviction remains"],
    fr: ["Un socle gouverné proposé", "RockFi a choisi une autre direction", "La conviction d’ingénierie demeure"],
  },
  "jobify-workers-queues-nestjs": {
    kind: "flow",
    en: ["Declare a job contract", "Queue and worker execute", "Track failures and retries"],
    fr: ["Déclarer le contrat du job", "Queue et worker exécutent", "Suivre erreurs et tentatives"],
  },
  "joining-rockfi": {
    kind: "flow",
    en: ["Experience in platform work", "Join RockFi", "Build for wealth management"],
    fr: ["Une expérience de plateforme", "Rejoindre RockFi", "Construire pour la gestion de patrimoine"],
  },
  "nodejs-stream-backpressure-history-export": {
    kind: "flow",
    en: ["Read records in chunks", "Bound every buffer", "Let S3 pace the producer"],
    fr: ["Lire les lignes par blocs", "Borner chaque buffer", "Laisser S3 régler le débit"],
  },
  "polymagine-industry-4-eyewear-2017": {
    kind: "flow",
    en: ["Capture a face", "Model eyewear in real time", "Connect design to production"],
    fr: ["Capturer un visage", "Modéliser les lunettes en temps réel", "Relier design et production"],
  },
  "postgresql-unique-nulls": {
    kind: "threshold",
    en: ["Nullable keys look equal", "SQL treats NULLs differently", "Make conflict rules explicit"],
    fr: ["Des clés nullables semblent égales", "SQL traite NULL autrement", "Expliciter la règle de conflit"],
  },
  "rebuilding-cloud-experience-forest-admin": {
    kind: "threshold",
    en: ["Lambda scales requests", "Pools and NAT stay bounded", "Design for the bottleneck"],
    fr: ["Lambda augmente les requêtes", "Pools et NAT restent bornés", "Concevoir pour le goulot"],
  },
  "redis-memory-exhaustion-post-mortem": {
    kind: "threshold",
    en: ["Workloads share Redis", "Memory crosses the limit", "Isolate failure domains"],
    fr: ["Les usages partagent Redis", "La mémoire franchit la limite", "Isoler les domaines de panne"],
  },
  "scaling-ci-github-actions-forest-admin": {
    kind: "flow",
    en: ["Split the test suite", "Collect every artifact", "Gate on complete results"],
    fr: ["Répartir les tests", "Réunir tous les artefacts", "Valider les résultats complets"],
  },
  "scim-user-provisioning-forest-admin": {
    kind: "flow",
    en: ["IdP sends a lifecycle event", "Normalize SCIM differences", "Audit the resulting change"],
    fr: ["L’IdP envoie un événement", "Normaliser les écarts SCIM", "Auditer le changement obtenu"],
  },
  "security-authentication-idp-openid-connect": {
    kind: "flow",
    en: ["Identity starts at the IdP", "Tokens cross trust boundaries", "Verify access at the agent"],
    fr: ["L’identité part de l’IdP", "Les jetons traversent la confiance", "Vérifier l’accès côté agent"],
  },
  "self-service-analytics-that-doesnt-lie": {
    kind: "flow",
    en: ["Govern the source data", "Define shared metrics", "Explore with provenance"],
    fr: ["Gouverner les données source", "Définir les métriques communes", "Explorer avec provenance"],
  },
  "spacex-engineering-ambivalence": {
    kind: "choice",
    en: ["Admire the engineering", "Count orbital costs", "Keep both views in frame"],
    fr: ["Admirer l’ingénierie", "Compter les coûts orbitaux", "Garder les deux regards"],
  },
  "stars-volcanoes-childhood-curiosity": {
    kind: "cycle",
    en: ["Look toward the stars", "Look beneath the Earth", "Keep asking questions"],
    fr: ["Regarder les étoiles", "Regarder sous la Terre", "Continuer à questionner"],
  },
  "the-onboarding-matrix-forest-admin": {
    kind: "choice",
    en: ["Branches multiply", "Compose functional factories", "Make paths explicit"],
    fr: ["Les branches se multiplient", "Composer des factories", "Rendre les chemins explicites"],
  },
  "trail-saint-jacques-100k-2026": {
    kind: "threshold",
    en: ["Start too fast", "Adapt through the hard middle", "Finish the 100 km"],
    fr: ["Partir trop vite", "S’adapter dans la partie difficile", "Terminer les 100 km"],
  },
  "unknown-unknowns-software-architecture": {
    kind: "cycle",
    en: ["Expose assumptions", "Watch for signals", "Recover within bounds"],
    fr: ["Rendre les hypothèses visibles", "Surveiller les signaux", "Récupérer dans des limites"],
  },
} as const satisfies Record<string, LocalizedStory>;

export function getMotionStory(slug: string, locale: PostLocale): MotionStory | null {
  const story = MOTION_STORIES[slug as keyof typeof MOTION_STORIES];
  return story ? { kind: story.kind, beats: story[locale] } : null;
}
