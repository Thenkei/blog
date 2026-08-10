export type PostLocale = "en" | "fr";

export const postVisualIds = [
  "agent-battle-2026",
  "bounded-ai-loop",
  "ai-force-multiplier",
  "sse-outbound-channel",
  "backend-to-data-engineer-rockfi",
  "claude-code-product-os",
  "context-engineering-beyond-prompt-engineering",
  "trail-endurance-profile",
  "engineering-2026-ai-redefined-our-job",
  "engineering-documents-age-poorly",
  "forest-admin-activity-logs-elasticsearch",
  "idempotency-debounce-jobify-bullmq",
  "jobify-workers-queues-nestjs",
  "joining-rockfi",
  "nodejs-stream-backpressure-history-export",
  "polymagine-industry-4-eyewear-2017",
  "postgresql-unique-nulls",
  "rebuilding-cloud-experience-forest-admin",
  "redis-memory-exhaustion-post-mortem",
  "scaling-ci-github-actions-forest-admin",
  "scim-user-provisioning-forest-admin",
  "security-authentication-idp-openid-connect",
  "self-service-analytics-that-doesnt-lie",
  "the-onboarding-matrix-forest-admin",
  "unknown-unknowns-software-architecture",
] as const;

export type PostVisualId = (typeof postVisualIds)[number];

export interface PostFrontmatter {
  title: string;
  subtitle: string;
  summary: string;
  publishedAt: string;
  updatedAt?: string | undefined;
  readTimeMinutes: number;
  tags: string[];
  visualId: PostVisualId;
  seriesId?: string | undefined;
  seriesOrder?: number | undefined;
  draft?: boolean | undefined;
}

export interface PostDocument extends PostFrontmatter {
  slug: string;
  locale: PostLocale;
}

export interface PostSummary {
  slug: string;
  locale: PostLocale;
  title: string;
  subtitle: string;
  summary: string;
  publishedAt: string;
  readTimeMinutes: number;
  tags: string[];
  visualId: PostVisualId;
}

export interface SearchDocument {
  slug: string;
  locale: PostLocale;
  title: string;
  subtitle: string;
  summary: string;
  tags: string[];
  searchableText: string;
}

export interface ManifestBuildOutput {
  documents: PostDocument[];
  byLocale: Record<PostLocale, PostDocument[]>;
  byLocaleAndSlug: Record<PostLocale, Map<string, PostDocument>>;
}
