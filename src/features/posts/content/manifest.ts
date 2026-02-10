import type { ComponentType } from "react";
import { postFrontmatterSchema } from "./schema";
import type {
  ManifestBuildOutput,
  PostDocument,
  PostFrontmatter,
  PostLocale,
} from "./types";

type MdxModule = {
  default: ComponentType;
  meta?: unknown;
};

const filePattern = /\/content\/posts\/([^/]+)\/(en|fr)\.mdx$/;

function parsePath(path: string): { slug: string; locale: PostLocale } {
  const match = path.match(filePattern);
  if (!match) {
    throw new Error(`Invalid post path: ${path}`);
  }

  const slug = match[1];
  const locale = match[2];

  if (!slug || (locale !== "en" && locale !== "fr")) {
    throw new Error(`Invalid post path: ${path}`);
  }

  return { slug, locale };
}

function sortByDateDescThenSlug(a: PostDocument, b: PostDocument): number {
  if (a.publishedAt === b.publishedAt) {
    return a.slug.localeCompare(b.slug);
  }

  return b.publishedAt.localeCompare(a.publishedAt);
}

function createPostDocument(
  slug: string,
  locale: PostLocale,
  module: MdxModule,
): PostDocument {
  const parsedMeta = postFrontmatterSchema.safeParse(module.meta ?? {});
  if (!parsedMeta.success) {
    throw new Error(
      `Invalid frontmatter for ${slug}/${locale}: ${parsedMeta.error.message}`,
    );
  }

  const meta: PostFrontmatter = parsedMeta.data;

  if (meta.updatedAt && meta.updatedAt < meta.publishedAt) {
    throw new Error(
      `updatedAt cannot be before publishedAt for ${slug}/${locale}`,
    );
  }

  return {
    slug,
    locale,
    Component: module.default,
    ...meta,
  };
}

export function buildPostManifest(
  modules: Record<string, MdxModule>,
): ManifestBuildOutput {
  const bySlug = new Map<string, Map<PostLocale, PostDocument>>();

  for (const [path, module] of Object.entries(modules)) {
    const { slug, locale } = parsePath(path);
    const doc = createPostDocument(slug, locale, module);

    const locales = bySlug.get(slug) ?? new Map<PostLocale, PostDocument>();
    if (locales.has(locale)) {
      throw new Error(`Duplicate locale entry for ${slug}/${locale}`);
    }

    locales.set(locale, doc);
    bySlug.set(slug, locales);
  }

  const byLocale: ManifestBuildOutput["byLocale"] = {
    en: [],
    fr: [],
  };

  const byLocaleAndSlug: ManifestBuildOutput["byLocaleAndSlug"] = {
    en: new Map<string, PostDocument>(),
    fr: new Map<string, PostDocument>(),
  };

  for (const [slug, locales] of bySlug.entries()) {
    if (!locales.has("en") || !locales.has("fr")) {
      throw new Error(`Missing locale variant for slug ${slug}. Both en/fr are required.`);
    }

    for (const locale of ["en", "fr"] as const) {
      const doc = locales.get(locale);
      if (!doc) {
        throw new Error(`Missing ${locale} post for ${slug}`);
      }

      byLocale[locale].push(doc);
      byLocaleAndSlug[locale].set(slug, doc);
    }
  }

  byLocale.en.sort(sortByDateDescThenSlug);
  byLocale.fr.sort(sortByDateDescThenSlug);

  const documents = [...byLocale.en, ...byLocale.fr];

  return {
    documents,
    byLocale,
    byLocaleAndSlug,
  };
}
