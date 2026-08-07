import type { ComponentType } from "react";

export type PostLocale = "en" | "fr";

export const postVisualIds = [
  "bounded-ai-loop",
  "sse-outbound-channel",
  "trail-endurance-profile",
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
  visualId?: PostVisualId | undefined;
  seriesId?: string | undefined;
  seriesOrder?: number | undefined;
  draft?: boolean | undefined;
}

export interface PostDocument extends PostFrontmatter {
  slug: string;
  locale: PostLocale;
  Component: ComponentType;
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
  visualId?: PostVisualId | undefined;
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
