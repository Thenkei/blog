import type { PostLocale } from "./types";

// Keep authored tags intact while grouping their EN/FR variants for discovery.
const tagAliases: Record<string, string> = {
  ia: "ai",
  ingenierie: "engineering",
  carriere: "career",
  course: "running",
  equipement: "gear",
  entraînement: "training",
  entrainement: "training",
  authentification: "authentication",
  "federation-identite": "identity-federation",
  securite: "security",
  fiabilite: "reliability",
  idempotence: "idempotency",
  "outils-developpement": "developer-tools",
  reflexion: "reflection",
  produit: "product",
  strategie: "strategy",
  biometrie: "biometrics",
  "industrie-4-0": "industry-4-0",
};

export function canonicalPostTag(tag: string): string {
  const normalized = tag.trim().toLowerCase();
  return Object.hasOwn(tagAliases, normalized) ? tagAliases[normalized] ?? normalized : normalized;
}

export function matchesPostTag(tags: string[], selectedTag: string): boolean {
  return tags.some((tag) => canonicalPostTag(tag) === canonicalPostTag(selectedTag));
}

export type PostCategory = {
  slug: string;
  title: Record<PostLocale, string>;
  tags: string[];
};

export const postCategories: PostCategory[] = [
  {
    slug: "engineering",
    title: { en: "Engineering", fr: "Ingénierie" },
    tags: ["engineering", "architecture", "backend", "infrastructure", "devops", "security", "database", "nodejs", "workers", "ci-cd", "serverless", "product"],
  },
  {
    slug: "data",
    title: { en: "Data", fr: "Data" },
    tags: ["data", "data-engineering", "analytics", "dagster", "dbt", "snowflake", "airbyte"],
  },
  {
    slug: "ai",
    title: { en: "AI", fr: "IA" },
    tags: ["ai", "agents", "llm", "context-engineering", "modeles-frontier"],
  },
  {
    slug: "running",
    title: { en: "Trail running", fr: "Trail" },
    tags: ["running", "trail", "training", "gear", "race-report"],
  },
  {
    slug: "career",
    title: { en: "Career", fr: "Parcours" },
    tags: ["career", "leadership", "reflection", "industry-4-0"],
  },
];

export function matchesPostCategory(tags: string[], category: PostCategory): boolean {
  return category.tags.some((tag) => matchesPostTag(tags, tag));
}
