import { buildPostManifest } from "./manifest";
import type { ComponentType } from "react";
import type { PostDocument, PostLocale, PostSummary, SearchDocument } from "./types";

const rawModules = import.meta.glob<{ default: ComponentType; meta?: unknown }>(
  "/content/posts/*/*.mdx",
  {
    eager: true,
  },
);

const manifest = buildPostManifest(rawModules);

function toSummary(post: PostDocument): PostSummary {
  return {
    slug: post.slug,
    locale: post.locale,
    title: post.title,
    subtitle: post.subtitle,
    summary: post.summary,
    publishedAt: post.publishedAt,
    readTimeMinutes: post.readTimeMinutes,
    tags: post.tags,
  };
}

function nonDraft(posts: PostDocument[]): PostDocument[] {
  return posts.filter((post) => !post.draft);
}

export function hasPostSlug(slug: string): boolean {
  return manifest.byLocaleAndSlug.en.has(slug) || manifest.byLocaleAndSlug.fr.has(slug);
}

export function getPost(locale: PostLocale, slug: string): PostDocument | null {
  return manifest.byLocaleAndSlug[locale].get(slug) ?? null;
}

export function getPostSummaries(locale: PostLocale): PostSummary[] {
  return nonDraft(manifest.byLocale[locale]).map(toSummary);
}

export function getAvailableTags(locale: PostLocale): string[] {
  const tags = new Set<string>();
  for (const post of nonDraft(manifest.byLocale[locale])) {
    for (const tag of post.tags) {
      tags.add(tag);
    }
  }

  return [...tags].sort((a, b) => a.localeCompare(b));
}

export function getSearchDocuments(locale: PostLocale): SearchDocument[] {
  return nonDraft(manifest.byLocale[locale]).map((post) => ({
    slug: post.slug,
    locale: post.locale,
    title: post.title,
    subtitle: post.subtitle,
    summary: post.summary,
    tags: post.tags,
    searchableText: `${post.title} ${post.subtitle} ${post.summary} ${post.tags.join(" ")}`.toLowerCase(),
  }));
}

function overlapScore(a: string[], b: string[]): number {
  const bSet = new Set(b);
  return a.reduce((score, tag) => score + (bSet.has(tag) ? 1 : 0), 0);
}

export function getRelatedPosts(
  locale: PostLocale,
  slug: string,
  limit = 3,
): PostSummary[] {
  const current = getPost(locale, slug);
  if (!current) {
    return [];
  }

  const candidates = nonDraft(manifest.byLocale[locale])
    .filter((post) => post.slug !== slug)
    .map((post) => ({
      post,
      score: overlapScore(current.tags, post.tags),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (a.score === b.score) {
        return b.post.publishedAt.localeCompare(a.post.publishedAt);
      }
      return b.score - a.score;
    })
    .slice(0, limit)
    .map((entry) => toSummary(entry.post));

  return candidates;
}

export function getAdjacentPosts(
  locale: PostLocale,
  slug: string,
): { previous: PostSummary | null; next: PostSummary | null } {
  const posts = nonDraft(manifest.byLocale[locale]);
  const index = posts.findIndex((post) => post.slug === slug);

  if (index === -1) {
    return { previous: null, next: null };
  }

  const previousPost = posts.at(index + 1);
  const nextPost = posts.at(index - 1);
  const previous = previousPost ? toSummary(previousPost) : null;
  const next = nextPost ? toSummary(nextPost) : null;

  return { previous, next };
}

export function getPostLocales(slug: string): PostLocale[] {
  const locales: PostLocale[] = [];
  if (manifest.byLocaleAndSlug.en.has(slug)) {
    locales.push("en");
  }
  if (manifest.byLocaleAndSlug.fr.has(slug)) {
    locales.push("fr");
  }
  return locales;
}

export type {
  PostDocument,
  PostFrontmatter,
  PostLocale,
  PostSummary,
  SearchDocument,
} from "./types";

export { buildPostManifest };
export { postFrontmatterSchema } from "./schema";
