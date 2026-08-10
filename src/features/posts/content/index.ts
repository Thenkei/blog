import { buildPostManifest } from "./manifest";
import { getTopic } from "./topics";
import type { ComponentType } from "react";
import type { PostDocument, PostLocale, PostSummary, SearchDocument } from "./types";

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
): Promise<ComponentType> {
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
  };
}

function isPublished(post: PostDocument): boolean {
  return !post.draft;
}

function nonDraft(posts: PostDocument[]): PostDocument[] {
  return posts.filter(isPublished);
}

export function hasPostSlug(slug: string): boolean {
  return getPost("en", slug) !== null || getPost("fr", slug) !== null;
}

export function getPost(locale: PostLocale, slug: string): PostDocument | null {
  const post = manifest.byLocaleAndSlug[locale].get(slug);
  return post && isPublished(post) ? post : null;
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

export function getTopicPosts(
  locale: PostLocale,
  topicSlug: string,
): PostSummary[] {
  const topic = getTopic(topicSlug);
  if (!topic) {
    return [];
  }

  return nonDraft(manifest.byLocale[locale])
    .filter((post) => post.tags.some((tag) => topic.tags.includes(tag)))
    .map(toSummary);
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
  if (getPost("en", slug)) {
    locales.push("en");
  }
  if (getPost("fr", slug)) {
    locales.push("fr");
  }
  return locales;
}

export type {
  PostDocument,
  PostFrontmatter,
  PostLocale,
  PostSummary,
  PostVisualId,
  SearchDocument,
} from "./types";

export { postVisualIds } from "./types";

export { buildPostManifest };
export { postFrontmatterSchema } from "./schema";
export { getTopic, topics } from "./topics";
export type { TopicDefinition } from "./topics";
