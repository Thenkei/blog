import type { PostLocale } from "./types";

type LocalizedText = Record<PostLocale, string>;

export type TopicDefinition = {
  slug: string;
  tags: string[];
  title: LocalizedText;
  description: LocalizedText;
};

export const topics: TopicDefinition[] = [
  {
    slug: "architecture",
    tags: ["architecture", "backend", "workers", "bullmq", "nodejs", "nestjs", "sse", "websockets", "streams", "idempotency", "database", "postgresql", "redis"],
    title: { en: "Architecture", fr: "Architecture" },
    description: {
      en: "Backend systems, data consistency, asynchronous workflows, and the trade-offs behind reliable software.",
      fr: "Systèmes backend, cohérence des données, workflows asynchrones et compromis d'un logiciel fiable.",
    },
  },
  {
    slug: "platform",
    tags: ["aws", "serverless", "lambda", "s3", "scaling", "ci-cd", "github-actions", "devops", "elasticsearch"],
    title: { en: "Platform", fr: "Plateforme" },
    description: {
      en: "Cloud infrastructure, delivery systems, and operating services at scale.",
      fr: "Infrastructure cloud, systèmes de delivery et exploitation de services à l'échelle.",
    },
  },
  {
    slug: "security",
    tags: ["security", "identity", "authentication", "identity-federation", "oidc", "oauth2", "saml", "scim", "enterprise"],
    title: { en: "Security", fr: "Sécurité" },
    description: {
      en: "Identity, access control, and the engineering details of secure enterprise systems.",
      fr: "Identité, contrôle d'accès et détails d'ingénierie des systèmes d'entreprise sécurisés.",
    },
  },
  {
    slug: "ai",
    tags: ["ai", "developer-tools", "operations", "leadership", "reflection"],
    title: { en: "AI and engineering", fr: "IA et ingénierie" },
    description: {
      en: "How AI is changing software delivery, engineering judgment, and team operating models.",
      fr: "Comment l'IA transforme la livraison logicielle, le jugement d'ingénierie et les modèles d'équipe.",
    },
  },
  {
    slug: "career",
    tags: ["career", "engineering", "wealth-tech", "rockfi", "data-engineering", "dagster", "onboarding", "dx"],
    title: { en: "Career and craft", fr: "Carrière et pratique" },
    description: {
      en: "Career decisions, engineering practice, and building useful systems in wealth tech.",
      fr: "Décisions de carrière, pratique de l'ingénierie et construction de systèmes utiles dans la wealth tech.",
    },
  },
  {
    slug: "running",
    tags: ["running", "gear", "training"],
    title: { en: "Running", fr: "Course à pied" },
    description: {
      en: "Training, equipment, and the routines that make endurance sustainable.",
      fr: "Entraînement, équipement et routines pour une endurance durable.",
    },
  },
  {
    slug: "product",
    tags: ["3d", "ar-vr", "biometrics", "industry-4-0", "startup", "strategy"],
    title: { en: "Product", fr: "Produit" },
    description: {
      en: "Product building at the intersection of technology, experience, and strategy.",
      fr: "Construire des produits au croisement de la technologie, de l'expérience et de la stratégie.",
    },
  },
];

export function getTopic(slug: string): TopicDefinition | null {
  return topics.find((topic) => topic.slug === slug) ?? null;
}
