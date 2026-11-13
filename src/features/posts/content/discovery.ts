import type { PostLocale } from "./types";

type LocalizedText = Record<PostLocale, string>;

// Authored tags stay as written in each article. Discovery resolves them to one
// canonical (English) slug, so /en?tag=running and /fr?tag=running select the
// same articles and the tag filter never lists a subject twice.
//
// Key: canonical slug. Value: the spelling used by the French articles, which is
// also the label shown in the French tag filter.
const frenchTagLabels: Record<string, string> = {
  ai: "ia",
  astronomy: "astronomie",
  authentication: "authentification",
  biometrics: "biometrie",
  career: "carriere",
  community: "communaute",
  "developer-tools": "outils-developpement",
  energy: "energie",
  engineering: "ingenierie",
  entrepreneurship: "entrepreneuriat",
  environment: "ecologie",
  "frontier-models": "modeles-frontier",
  gaming: "jeux-video",
  gear: "equipement",
  idempotency: "idempotence",
  "identity-federation": "federation-identite",
  "industry-4-0": "industrie-4-0",
  "orbital-debris": "debris-orbitaux",
  personal: "personnel",
  product: "produit",
  programming: "programmation",
  reflection: "reflexion",
  reliability: "fiabilite",
  running: "course",
  science: "sciences",
  security: "securite",
  space: "espace",
  strategy: "strategie",
  systems: "systemes",
  technology: "technologie",
  training: "entraînement",
  volcanoes: "volcans",
};

// Other spellings found in articles that are not the French label itself.
const tagSpellingVariants: Record<string, string> = {
  entrainement: "training",
  games: "gaming",
};

const canonicalTagByAlias = new Map<string, string>([
  ...Object.entries(frenchTagLabels).map(
    ([canonical, french]) => [french, canonical] as const,
  ),
  ...Object.entries(tagSpellingVariants),
]);

export function canonicalPostTag(tag: string): string {
  const normalized = tag.trim().toLowerCase();
  return canonicalTagByAlias.get(normalized) ?? normalized;
}

export function canonicalPostTags(tags: readonly string[]): string[] {
  return [...new Set(tags.map(canonicalPostTag))];
}

export function matchesPostTag(
  tags: readonly string[],
  selectedTag: string,
): boolean {
  const canonical = canonicalPostTag(selectedTag);
  return tags.some((tag) => canonicalPostTag(tag) === canonical);
}

// What the tag filter shows for a canonical slug in the given locale.
export function getPostTagLabel(tag: string, locale: PostLocale): string {
  const canonical = canonicalPostTag(tag);
  return locale === "fr" ? (frenchTagLabels[canonical] ?? canonical) : canonical;
}

export type PostCategory = {
  slug: string;
  title: LocalizedText;
  // Canonical tag slugs. A post belongs to the category when it carries one.
  tags: readonly string[];
};

export const postCategories: readonly PostCategory[] = [
  {
    slug: "engineering",
    title: { en: "Engineering", fr: "Ingénierie" },
    tags: [
      "engineering",
      "architecture",
      "backend",
      "infrastructure",
      "devops",
      "security",
      "database",
      "nodejs",
      "workers",
      "ci-cd",
      "serverless",
      "product",
    ],
  },
  {
    slug: "data",
    title: { en: "Data", fr: "Data" },
    tags: [
      "data",
      "data-engineering",
      "analytics",
      "dagster",
      "dbt",
      "snowflake",
      "airbyte",
    ],
  },
  {
    slug: "ai",
    title: { en: "AI", fr: "IA" },
    tags: ["ai", "agents", "llm", "context-engineering", "frontier-models"],
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

export function getPostCategory(slug: string | null): PostCategory | null {
  return postCategories.find((category) => category.slug === slug) ?? null;
}

export function matchesPostCategory(
  tags: readonly string[],
  category: PostCategory,
): boolean {
  return tags.some((tag) => category.tags.includes(canonicalPostTag(tag)));
}

export type PostSortOrder = "newest" | "oldest";

export type PostDiscoveryFilters = {
  query: string;
  // Canonical tag slug, or null for every tag.
  tag: string | null;
  // Category slug, or null for every category.
  category: string | null;
  sort: PostSortOrder;
};

export const defaultDiscoveryFilters: PostDiscoveryFilters = {
  query: "",
  tag: null,
  category: null,
  sort: "newest",
};

// The URL is the source of truth for the filters, so a filtered list can be
// shared and survives a language switch. Unknown values fall back to defaults.
export function readDiscoveryFilters(
  params: URLSearchParams,
): PostDiscoveryFilters {
  const tag = params.get("tag")?.trim();
  return {
    query: params.get("q") ?? "",
    tag: tag && tag !== "all" ? canonicalPostTag(tag) : null,
    category: getPostCategory(params.get("category"))?.slug ?? null,
    sort: params.get("sort") === "oldest" ? "oldest" : "newest",
  };
}

// Returns a copy: unrelated query parameters are kept as they are.
export function writeDiscoveryFilters(
  params: URLSearchParams,
  filters: PostDiscoveryFilters,
): URLSearchParams {
  const next = new URLSearchParams(params);
  const entries: [string, string | null][] = [
    ["q", filters.query.trim() ? filters.query : null],
    ["tag", filters.tag],
    ["category", filters.category],
    ["sort", filters.sort === "oldest" ? "oldest" : null],
  ];

  for (const [key, value] of entries) {
    if (value === null) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }

  return next;
}

export function hasActiveDiscoveryFilters(
  filters: PostDiscoveryFilters,
): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.tag !== null ||
    filters.category !== null
  );
}

// The featured card only makes sense on the untouched list: once the reader
// filters or reverses the order, every result gets the same weight.
export function showsFeaturedPost(filters: PostDiscoveryFilters): boolean {
  return !hasActiveDiscoveryFilters(filters) && filters.sort === "newest";
}

type DiscoverablePost = {
  title: string;
  subtitle: string;
  summary: string;
  publishedAt: string;
  tags: readonly string[];
};

// Case- and accent-insensitive, so "securite" finds "sécurité".
function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function matchesQuery(post: DiscoverablePost, query: string): boolean {
  const needle = normalizeSearchText(query);
  if (!needle) {
    return true;
  }

  // Search authored tags and their canonical and French forms alike, so a
  // reader can type "course" or "running" and reach the same articles.
  const tagForms = post.tags.flatMap((tag) => [
    tag,
    canonicalPostTag(tag),
    getPostTagLabel(tag, "fr"),
  ]);
  const haystack = normalizeSearchText(
    [post.title, post.subtitle, post.summary, ...tagForms].join(" "),
  );
  return haystack.includes(needle);
}

export function filterPosts<Post extends DiscoverablePost>(
  posts: readonly Post[],
  filters: PostDiscoveryFilters,
): Post[] {
  const category = getPostCategory(filters.category);
  const tag = filters.tag;
  const direction = filters.sort === "newest" ? -1 : 1;

  return posts
    .filter(
      (post) =>
        matchesQuery(post, filters.query) &&
        (tag === null || matchesPostTag(post.tags, tag)) &&
        (category === null || matchesPostCategory(post.tags, category)),
    )
    .sort((a, b) => direction * a.publishedAt.localeCompare(b.publishedAt));
}

// Canonical tags carried by the given posts, sorted by their localized label.
export function collectPostTags(
  posts: readonly Pick<DiscoverablePost, "tags">[],
  locale: PostLocale,
): string[] {
  const tags = new Set(posts.flatMap((post) => canonicalPostTags(post.tags)));
  return [...tags].sort((a, b) =>
    getPostTagLabel(a, locale).localeCompare(getPostTagLabel(b, locale), locale),
  );
}
