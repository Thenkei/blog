import { buildPostManifest } from "./manifest";
import { getTopic } from "./topics";
import type { ComponentType } from "react";
import type {
  PostDocument,
  PostAccessScope,
  PostLocale,
  PostSummary,
  PostVisibility,
  SearchDocument,
} from "./types";

type PostModule = {
  default: ComponentType;
};

const rawMetadata = import.meta.glob<{ meta?: unknown }>(
  "/content/posts/*/*.mdx",
  {
    eager: true,
    import: "meta",
    query: "?meta",
  },
);

const postModules = import.meta.glob<PostModule>("/content/posts/*/*.mdx");

const manifest = buildPostManifest(
  Object.fromEntries(
    Object.entries(rawMetadata).map(([path, meta]) => [path, { meta }]),
  ),
);

type PostContentKey = Pick<PostDocument, "locale" | "slug">;

function getPostPath({ locale, slug }: PostContentKey): string {
  return `/content/posts/${slug}/${locale}.mdx`;
}

export async function loadPostComponent(
  post: PostContentKey,
  access: PostAccessScope,
): Promise<ComponentType> {
  if (!getPost(post.locale, post.slug, access)) {
    throw new Error(`Post is not accessible: ${post.slug}/${post.locale}`);
  }

  const load = postModules[getPostPath(post)];
  if (!load) {
    throw new Error(`Missing post module for ${post.slug}/${post.locale}`);
  }

  const module = await load();
  return module.default;
}

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
    visualId: post.visualId,
    seriesId: post.seriesId,
    seriesOrder: post.seriesOrder,
    visibility: post.visibility,
  };
}

function isPublished(post: PostDocument): boolean {
  return !post.draft;
}

function isAccessible(
  post: PostDocument,
  access: PostAccessScope,
): boolean {
  return isPublished(post) &&
    (post.visibility === "public" || post.visibility === access);
}

function accessiblePosts(
  posts: PostDocument[],
  access: PostAccessScope,
): PostDocument[] {
  return posts.filter((post) => isAccessible(post, access));
}

export function hasPostSlug(
  slug: string,
  access: PostAccessScope,
): boolean {
  return getPost("en", slug, access) !== null ||
    getPost("fr", slug, access) !== null;
}

export function getPost(
  locale: PostLocale,
  slug: string,
  access: PostAccessScope,
): PostDocument | null {
  const post = manifest.byLocaleAndSlug[locale].get(slug);
  return post && isAccessible(post, access) ? post : null;
}

export function getPostSummaries(
  locale: PostLocale,
  access: PostAccessScope,
): PostSummary[] {
  return accessiblePosts(manifest.byLocale[locale], access).map(toSummary);
}

export function getThemeExclusivePostSummaries(
  locale: PostLocale,
  theme: Exclude<PostVisibility, "public">,
): PostSummary[] {
  return accessiblePosts(manifest.byLocale[locale], theme)
    .filter((post) => post.visibility === theme)
    .sort((a, b) => {
      const orderA = a.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      if (orderA === orderB) {
        return b.publishedAt.localeCompare(a.publishedAt);
      }
      return orderA - orderB;
    })
    .map(toSummary);
}

export function getAvailableTags(
  locale: PostLocale,
  access: PostAccessScope,
): string[] {
  const tags = new Set<string>();
  for (const post of accessiblePosts(manifest.byLocale[locale], access)) {
    for (const tag of post.tags) {
      tags.add(tag);
    }
  }

  return [...tags].sort((a, b) => a.localeCompare(b));
}

export function getTopicPosts(
  locale: PostLocale,
  topicSlug: string,
  access: PostAccessScope,
): PostSummary[] {
  const topic = getTopic(topicSlug);
  if (!topic) {
    return [];
  }

  return accessiblePosts(manifest.byLocale[locale], access)
    .filter((post) => post.tags.some((tag) => topic.tags.includes(tag)))
    .map(toSummary);
}

export function getSearchDocuments(
  locale: PostLocale,
  access: PostAccessScope,
): SearchDocument[] {
  return accessiblePosts(manifest.byLocale[locale], access).map((post) => ({
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
  access: PostAccessScope,
  limit = 3,
): PostSummary[] {
  const current = getPost(locale, slug, access);
  if (!current) {
    return [];
  }

  const candidates = accessiblePosts(manifest.byLocale[locale], access)
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
  access: PostAccessScope,
): { previous: PostSummary | null; next: PostSummary | null } {
  const current = getPost(locale, slug, access);
  if (!current) {
    return { previous: null, next: null };
  }

  const posts = accessiblePosts(manifest.byLocale[locale], access)
    .filter((post) => post.visibility === current.visibility)
    .sort((a, b) => {
      if (current.visibility === "public") {
        return 0;
      }

      return (b.seriesOrder ?? 0) - (a.seriesOrder ?? 0);
    });
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

export function getPostLocales(
  slug: string,
  access: PostAccessScope,
): PostLocale[] {
  const locales: PostLocale[] = [];
  if (getPost("en", slug, access)) {
    locales.push("en");
  }
  if (getPost("fr", slug, access)) {
    locales.push("fr");
  }
  return locales;
}

export type {
  PostDocument,
  PostAccessScope,
  PostFrontmatter,
  PostLocale,
  PostSummary,
  PostVisibility,
  PostVisualId,
  SearchDocument,
} from "./types";

export { postVisibilities, postVisualIds } from "./types";

export { buildPostManifest };
export { postFrontmatterSchema } from "./schema";
export { getTopic, topics } from "./topics";
export type { TopicDefinition } from "./topics";
