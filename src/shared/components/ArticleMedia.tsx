import type { PostLocale } from "../../features/posts/content";
import { InlineMotionFigure } from "../../features/posts/motion/InlineMotionFigure";

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
  "hat-switching-tax",
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
    "hat-switching-tax": {
      title: "Switching hats looks free until the invoice comes due at day's end",
      description:
        "A pressure gauge fills silently every time focus shifts between roles sharing the same terminal, then the accumulated cost surfaces all at once at the end of the day.",
      caption:
        "Each hat switch looks free in the moment. The cost doesn't disappear — it just waits, then arrives as one invoice at day's end.",
      eyebrow: "SAME TERMINAL · FIVE ROLES · ONE INVOICE",
      labels: {
        switch: "HAT SWITCH",
        silent: "LOOKS FREE",
        pressure: "COGNITIVE PRESSURE",
        invisible: "BUILDS SILENTLY",
        invoice: "THE INVOICE",
        dayend: "ARRIVES AT DAY'S END",
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
    "hat-switching-tax": {
      title: "Changer de casquette semble gratuit, jusqu'à la facture en fin de journée",
      description:
        "Une jauge de pression se remplit en silence à chaque changement de rôle sur le même terminal, puis le coût accumulé arrive d'un coup en fin de journée.",
      caption:
        "Chaque changement de casquette semble gratuit sur l'instant. Le coût ne disparaît pas — il attend, puis arrive comme une seule facture en fin de journée.",
      eyebrow: "MÊME TERMINAL · CINQ RÔLES · UNE SEULE FACTURE",
      labels: {
        switch: "CHANGEMENT DE CASQUETTE",
        silent: "SEMBLE GRATUIT",
        pressure: "PRESSION COGNITIVE",
        invisible: "S'ACCUMULE EN SILENCE",
        invoice: "LA FACTURE",
        dayend: "ARRIVE EN FIN DE JOURNÉE",
      },
    },
  },
};

export function ArticleMedia({ mediaId }: { mediaId: ArticleMediaId }) {
  return <InlineMotionFigure mediaId={mediaId} />;
}

export function getArticleMediaCopy(mediaId: ArticleMediaId, locale: PostLocale) {
  return MEDIA_COPY[locale][mediaId];
}
