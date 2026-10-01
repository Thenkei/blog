import type { PostDiagramVisualId, PostLocale } from "../content/types";
import type { ArticleMediaId } from "../../../shared/components/ArticleMedia";
import { getDiagramCopy } from "../../../shared/components/PostVisual";
import { getArticleMediaCopy } from "../../../shared/components/ArticleMedia";
import { getMotionStory, type MotionStory } from "./stories";

export type FigureStage = {
  heading: string;
  detail: string;
  nodeLabel: string;
  x: number;
  y: number;
};

export type FigureMotif = "pipeline" | "stack" | "network" | "queue" | "gauge" | "branch" | "orbit" | "exchange" | "comparison" | "route";

export type FigureScene = {
  kind: MotionStory["kind"];
  motif: FigureMotif;
  title: string;
  caption: string;
  stages: readonly [FigureStage, FigureStage, FigureStage];
};

type StagePlan = readonly [string, string, number, number];
type FigurePlan = {
  story: string;
  stages: readonly [StagePlan, StagePlan, StagePlan];
};

// The points position native Remotion actors; no source illustration is reused.
// Text comes from each figure's own localized editorial copy.
const DIAGRAM_PLANS: Record<PostDiagramVisualId, FigurePlan> = {
  "agent-battle-2026": { story: "agent-battle-2026", stages: [["a", "b", .16, .55], ["c", "d", .51, .45], ["e", "a", .83, .52]] },
  "bounded-ai-loop": { story: "ai-human-judgment-rockfi", stages: [["intent", "agent", .17, .52], ["evidence", "human", .52, .43], ["action", "stop", .82, .54]] },
  "ai-force-multiplier": { story: "ai-force-multiplier", stages: [["a", "b", .18, .72], ["b", "c", .50, .46], ["c", "a", .80, .22]] },
  "sse-outbound-channel": { story: "architecture-sse-agent-communication", stages: [["agent", "outbound", .18, .50], ["channel", "stream", .50, .43], ["backoff", "reconnect", .80, .60]] },
  "backend-to-data-engineer-rockfi": { story: "backend-to-data-engineer-rockfi", stages: [["a", "b", .17, .52], ["c", "d", .50, .50], ["e", "d", .82, .50]] },
  "internal-tools-as-product": { story: "internal-tools-are-a-product", stages: [["a", "b", .17, .52], ["c", "d", .50, .46], ["e", "c", .82, .52]] },
  "context-engineering-beyond-prompt-engineering": { story: "context-engineering-beyond-prompt-engineering", stages: [["a", "c", .18, .53], ["b", "d", .50, .46], ["e", "a", .82, .53]] },
  "trail-endurance-profile": { story: "coros-apex-4", stages: [["objective", "horizon", .19, .37], ["smart", "four", .48, .63], ["sport", "fifteen", .81, .47]] },
  "engineering-2026-ai-redefined-our-job": { story: "engineering-2026-ai-redefined-our-job", stages: [["a", "b", .18, .52], ["c", "d", .52, .48], ["e", "a", .82, .52]] },
  "engineering-documents-age-poorly": { story: "engineering-documents-age-poorly", stages: [["a", "b", .18, .52], ["c", "d", .51, .48], ["e", "a", .82, .52]] },
  "forest-admin-activity-logs-elasticsearch": { story: "forest-admin-activity-logs-elasticsearch", stages: [["a", "b", .17, .52], ["c", "d", .51, .48], ["e", "a", .83, .52]] },
  "idempotency-debounce-jobify-bullmq": { story: "idempotency-debounce-jobify-bullmq", stages: [["a", "b", .18, .52], ["c", "b", .51, .47], ["d", "e", .82, .52]] },
  "jobify-workers-queues-nestjs": { story: "jobify-workers-queues-nestjs", stages: [["a", "b", .17, .52], ["c", "d", .51, .47], ["e", "d", .83, .52]] },
  "joining-rockfi": { story: "joining-rockfi", stages: [["a", "b", .18, .52], ["c", "d", .51, .48], ["e", "d", .82, .52]] },
  "nodejs-stream-backpressure-history-export": { story: "nodejs-stream-backpressure-history-export", stages: [["a", "b", .18, .51], ["c", "d", .52, .48], ["e", "c", .82, .52]] },
  "polymagine-industry-4-eyewear-2017": { story: "polymagine-industry-4-eyewear-2017", stages: [["a", "b", .18, .52], ["c", "d", .51, .46], ["e", "d", .82, .52]] },
  "postgresql-unique-nulls": { story: "postgresql-unique-nulls", stages: [["a", "b", .18, .52], ["c", "d", .51, .46], ["e", "d", .82, .52]] },
  "rebuilding-cloud-experience-forest-admin": { story: "rebuilding-cloud-experience-forest-admin", stages: [["a", "b", .17, .52], ["c", "d", .51, .47], ["e", "f", .83, .52]] },
  "redis-memory-exhaustion-post-mortem": { story: "redis-memory-exhaustion-post-mortem", stages: [["a", "b", .18, .52], ["c", "d", .51, .45], ["e", "d", .82, .52]] },
  "rocket-curiosity": { story: "stars-volcanoes-childhood-curiosity", stages: [["a", "b", .22, .30], ["d", "e", .69, .70], ["c", "a", .52, .49]] },
  "rocket-earthbound-engineering": { story: "spacex-engineering-ambivalence", stages: [["c", "e", .72, .26], ["b", "d", .44, .45], ["a", "d", .27, .60]] },
  "rocket-heavencraft-systems": { story: "heavencraft-first-systems", stages: [["a", "b", .13, .48], ["b", "c", .48, .50], ["d", "e", .82, .51]] },
  "scaling-ci-github-actions-forest-admin": { story: "scaling-ci-github-actions-forest-admin", stages: [["a", "b", .18, .52], ["c", "d", .51, .45], ["e", "d", .82, .52]] },
  "scim-user-provisioning-forest-admin": { story: "scim-user-provisioning-forest-admin", stages: [["a", "b", .18, .52], ["c", "d", .51, .48], ["e", "d", .82, .52]] },
  "security-authentication-idp-openid-connect": { story: "security-authentication-idp-openid-connect", stages: [["a", "b", .18, .52], ["c", "d", .51, .48], ["e", "d", .82, .52]] },
  "self-service-analytics-that-doesnt-lie": { story: "self-service-analytics-that-doesnt-lie", stages: [["a", "b", .18, .52], ["c", "d", .51, .47], ["e", "d", .82, .52]] },
  "the-onboarding-matrix-forest-admin": { story: "the-onboarding-matrix-forest-admin", stages: [["a", "b", .18, .52], ["c", "d", .51, .47], ["e", "d", .82, .52]] },
  "unknown-unknowns-software-architecture": { story: "unknown-unknowns-software-architecture", stages: [["a", "b", .18, .52], ["c", "d", .51, .47], ["e", "d", .82, .52]] },
};

const MEDIA_PLANS: Record<ArticleMediaId, readonly [readonly [string, string, number, number], readonly [string, string, number, number], readonly [string, string, number, number]]> = {
  "sse-polling-vs-stream": [["polling", "repeat", .23, .51], ["sse", "connection", .57, .50], ["event", "send", .80, .50]],
  "sse-reconnect-storm": [["open", "heartbeat", .18, .45], ["deploy", "spike", .52, .48], ["jitter", "absorbed", .81, .57]],
  "redis-memory-pressure": [["cache", "queues", .20, .52], ["memory", "limit", .54, .47], ["isolate", "security", .81, .52]],
  "backpressure-propagation": [["source", "data", .18, .48], ["upload", "pressure", .81, .50], ["buffer", "transform", .48, .50]],
  "debounce-trigger-storm": [["triggers", "timeFrame", .18, .50], ["reschedule", "quiet", .51, .47], ["oneJob", "collapse", .81, .52]],
  "ci-reconciliation-meme": [["jobs", "fast", .23, .50], ["gate", "waiting", .64, .52], ["after", "gate", .81, .50]],
  "ai-review-meme": [["ai", "generated", .22, .50], ["human", "context", .60, .48], ["risk", "ship", .82, .52]],
  "product-os-loop": [["discover", "decide", .22, .40], ["design", "build", .52, .50], ["review", "learn", .78, .62]],
  "document-lifecycle-motion": [["decision", "active", .19, .50], ["trigger", "review", .52, .47], ["supersede", "archive", .82, .52]],
  "hat-switching-tax": [["switch", "silent", .19, .52], ["pressure", "invisible", .52, .44], ["invoice", "dayend", .81, .56]],
};

const DIAGRAM_MOTIFS: Record<PostDiagramVisualId, FigureMotif> = {
  "agent-battle-2026": "comparison", "bounded-ai-loop": "branch", "ai-force-multiplier": "stack",
  "sse-outbound-channel": "exchange", "backend-to-data-engineer-rockfi": "pipeline",
  "context-engineering-beyond-prompt-engineering": "stack",
  "trail-endurance-profile": "gauge", "engineering-2026-ai-redefined-our-job": "orbit",
  "engineering-documents-age-poorly": "orbit", "forest-admin-activity-logs-elasticsearch": "network",
  "idempotency-debounce-jobify-bullmq": "queue", "internal-tools-as-product": "orbit", "jobify-workers-queues-nestjs": "queue",
  "joining-rockfi": "route", "nodejs-stream-backpressure-history-export": "exchange",
  "polymagine-industry-4-eyewear-2017": "pipeline", "postgresql-unique-nulls": "branch",
  "rebuilding-cloud-experience-forest-admin": "network", "redis-memory-exhaustion-post-mortem": "gauge",
  "rocket-curiosity": "orbit", "rocket-earthbound-engineering": "route",
  "rocket-heavencraft-systems": "network", "scaling-ci-github-actions-forest-admin": "queue",
  "scim-user-provisioning-forest-admin": "pipeline", "security-authentication-idp-openid-connect": "exchange",
  "self-service-analytics-that-doesnt-lie": "stack", "the-onboarding-matrix-forest-admin": "branch",
  "unknown-unknowns-software-architecture": "orbit",
};

const MEDIA_MOTIFS: Record<ArticleMediaId, FigureMotif> = {
  "sse-polling-vs-stream": "comparison", "sse-reconnect-storm": "gauge",
  "redis-memory-pressure": "gauge", "backpressure-propagation": "exchange",
  "debounce-trigger-storm": "queue", "ci-reconciliation-meme": "queue",
  "ai-review-meme": "comparison", "product-os-loop": "orbit",
  "document-lifecycle-motion": "orbit", "hat-switching-tax": "gauge",
};

export function getDiagramScene(id: PostDiagramVisualId, locale: PostLocale): FigureScene {
  const plan = DIAGRAM_PLANS[id];
  const copy = getDiagramCopy(id, locale);
  const story = getMotionStory(plan.story, locale);
  if (!story) throw new Error(`Missing motion story for ${id}`);
  return {
    kind: story.kind,
    motif: DIAGRAM_MOTIFS[id],
    title: copy.title,
    caption: copy.caption,
    stages: plan.stages.map(([primary, secondary, x, y], index) => ({
      heading: story.beats[index]!,
      detail: `${copy.labels[primary] ?? primary}  ·  ${copy.labels[secondary] ?? secondary}`,
      nodeLabel: copy.labels[primary] ?? primary,
      x,
      y,
    })) as unknown as FigureScene["stages"],
  };
}

export function getMediaScene(id: ArticleMediaId, locale: PostLocale): FigureScene {
  const copy = getArticleMediaCopy(id, locale);
  return {
    kind: id === "product-os-loop" || id === "document-lifecycle-motion" ? "cycle" : id === "redis-memory-pressure" || id === "sse-reconnect-storm" ? "threshold" : "flow",
    motif: MEDIA_MOTIFS[id],
    title: copy.title,
    caption: copy.caption,
    stages: MEDIA_PLANS[id].map(([primary, secondary, x, y]) => ({
      heading: copy.labels[primary] ?? primary,
      detail: copy.labels[secondary] ?? secondary,
      nodeLabel: copy.labels[primary] ?? primary,
      x,
      y,
    })) as unknown as FigureScene["stages"],
  };
}

export const assetSceneIds = [
  "context-stack", "self-service-lanes", "unknowns-review",
  "ai-material-chain", "polymagine-pipeline",
  "identity-federation", "oidc-code-flow", "agent-token-validation", "saml-token-bridge",
  "frontier-dimensions", "saint-jacques-race",
] as const;

export type AssetSceneId = (typeof assetSceneIds)[number];

type LocalizedAssetPlan = {
  kind: FigureScene["kind"];
  motif: FigureMotif;
  points: readonly [readonly [number, number], readonly [number, number], readonly [number, number]];
  en: readonly [readonly [string, string], readonly [string, string], readonly [string, string]];
  fr: readonly [readonly [string, string], readonly [string, string], readonly [string, string]];
};

const ASSET_PLANS: Record<AssetSceneId, LocalizedAssetPlan> = {
  "context-stack": { kind: "flow", motif: "stack", points: [[.20,.50],[.50,.48],[.80,.50]], en: [["Start with authority", "Intent and action boundaries"],["Load current state", "Contracts, branch and provenance"],["Verify the result", "Evidence with a validity period"]], fr: [["Partir de l’autorité", "Intention et limites d’action"],["Charger l’état courant", "Contrats, branche et provenance"],["Vérifier le résultat", "Preuves et période de validité"]] },
  "self-service-lanes": { kind: "flow", motif: "stack", points: [[.20,.49],[.50,.49],[.80,.49]], en: [["Explore safely", "Bounded access and visible assumptions"],["Certify shared metrics", "Version, owner, tests and freshness"],["Publish with provenance", "Review proportionate to the decision"]], fr: [["Explorer en sécurité", "Accès borné et hypothèses visibles"],["Certifier les métriques", "Version, owner, tests et fraîcheur"],["Publier avec provenance", "Revue adaptée à la décision"]] },
  "unknowns-review": { kind: "cycle", motif: "orbit", points: [[.20,.48],[.50,.49],[.80,.49]], en: [["Name the assumption", "Turn an invisible risk into a question"],["Attach evidence or a signal", "Test the contract and observe divergence"],["Prepare recovery", "Isolate the blast radius and replay safely"]], fr: [["Nommer l’hypothèse", "Transformer un risque invisible en question"],["Lier preuve ou signal", "Tester le contrat et observer les écarts"],["Préparer la reprise", "Isoler l’impact et rejouer sans risque"]] },
  "ai-material-chain": { kind: "flow", motif: "pipeline", points: [[.20,.52],[.50,.48],[.80,.48]], en: [["Extraction", "Minerals, factories and territories"],["Electricity", "Generation, grids and cooling"],["Computation", "Data centres make the interface possible"]], fr: [["Extraction", "Minéraux, usines et territoires"],["Électricité", "Production, réseaux et refroidissement"],["Calcul", "Les data centres rendent l’interface possible"]] },
  "polymagine-pipeline": { kind: "threshold", motif: "pipeline", points: [[.19,.50],[.51,.49],[.82,.50]], en: [["Capture", "Facial biometrics begin the pipeline"],["Generate a 3D mesh", "Customer-specific geometry in under one second"],["Validate and produce", "AR fitting connects design to manufacturing"]], fr: [["Capturer", "La biométrie faciale ouvre la chaîne"],["Générer le maillage 3D", "Géométrie personnalisée en moins d’une seconde"],["Valider et produire", "Le fitting AR relie design et fabrication"]] },
  "identity-federation": { kind: "flow", motif: "exchange", points: [[.18,.50],[.50,.47],[.82,.51]], en: [["Upstream identity", "Enterprise IdP authenticates the user"],["Forest translates trust", "SP upstream, issuer downstream"],["Agent checks access", "A separate token and audience boundary"]], fr: [["Identité en amont", "L’IdP d’entreprise authentifie l’utilisateur"],["Forest traduit la confiance", "SP en amont, émetteur en aval"],["L’agent contrôle l’accès", "Jeton et audience distincts"]] },
  "oidc-code-flow": { kind: "flow", motif: "exchange", points: [[.18,.50],[.50,.47],[.82,.51]], en: [["Redirect", "Browser reaches the upstream OIDC provider"],["Exchange the code", "Forest uses the authorization code"],["Validate identity", "Check signature, issuer, audience and nonce"]], fr: [["Redirection", "Le navigateur rejoint l’IdP OIDC"],["Échanger le code", "Forest utilise le code d’autorisation"],["Valider l’identité", "Signature, issuer, audience et nonce"]] },
  "agent-token-validation": { kind: "choice", motif: "branch", points: [[.18,.50],[.50,.47],[.82,.51]], en: [["Mint a narrow token", "Forest binds principal, tenant and agent audience"],["Check every claim", "Signature, issuer, scope, lifetime and replay"],["Allow or deny", "Decision is observable and auditable"]], fr: [["Émettre un jeton borné", "Principal, tenant et audience agent"],["Vérifier chaque claim", "Signature, issuer, scope, durée et replay"],["Autoriser ou refuser", "Décision observable et auditable"]] },
  "saml-token-bridge": { kind: "flow", motif: "exchange", points: [[.18,.50],[.50,.47],[.82,.51]], en: [["Receive SAML assertion", "Upstream IdP supplies signed identity"],["Validate before exchange", "Audience, signature, tenant and policy"],["Mint downstream access", "Narrow scope for one agent audience"]], fr: [["Recevoir l’assertion SAML", "L’IdP amont fournit une identité signée"],["Valider avant échange", "Audience, signature, tenant et politique"],["Émettre l’accès aval", "Scope borné pour un seul agent"]] },
  "frontier-dimensions": { kind: "choice", motif: "comparison", points: [[.18,.50],[.50,.47],[.82,.51]], en: [["Capability", "Reasoning, coding, context and multimodality"],["Economics and control", "Latency, cost, openness and deployment"],["Workflow fit", "Distribution and governance decide utility"]], fr: [["Capacités", "Raisonnement, code, contexte et multimodalité"],["Économie et contrôle", "Latence, coût, ouverture et déploiement"],["Adéquation au workflow", "Distribution et gouvernance décident de l’utilité"]] },
  "saint-jacques-race": { kind: "threshold", motif: "route", points: [[.18,.55],[.50,.67],[.82,.30]], en: [["A fast start", "35–40 minutes ahead at the first aid station"],["The hard middle", "Water runs out before the longest hot climb"],["Recover and finish", "Support at Lac du Bouchet resets the race"]], fr: [["Départ rapide", "35 à 40 minutes d’avance au premier ravito"],["Le milieu difficile", "L’eau manque avant la longue montée sous le soleil"],["Repartir et finir", "Le soutien au lac du Bouchet relance la course"]] },
};

export function getAssetScene(id: AssetSceneId, locale: PostLocale): FigureScene {
  const plan = ASSET_PLANS[id];
  const localized = plan[locale];
  return {
    kind: plan.kind,
    motif: plan.motif,
    title: localized[0][0],
    caption: localized[2][1],
    stages: localized.map(([heading, detail], index) => ({ heading, detail, nodeLabel: heading, x: plan.points[index]![0], y: plan.points[index]![1] })) as unknown as FigureScene["stages"],
  };
}
