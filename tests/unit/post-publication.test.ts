import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isPublished, utcToday } from "../../src/features/posts/content/publication";
import {
  getAvailableTags,
  getPost,
  getPostLocales,
  getPostSummaries,
  getSearchDocuments,
  getThemeExclusivePostSummaries,
  hasPostSlug,
} from "../../src/features/posts/content";

const engineeringIdeasSlugs = [
  "unknown-unknowns-software-architecture",
  "self-service-analytics-that-doesnt-lie",
  "context-engineering-beyond-prompt-engineering",
  "engineering-documents-age-poorly",
];

const postsDirectory = join(process.cwd(), "content", "posts");
const contentSlugs = readdirSync(postsDirectory).sort();
// Same clock as the content module: dev and tests preview scheduled posts.
const clock = { today: utcToday(), includeScheduled: import.meta.env.DEV };

function readPublicationFields(slug: string) {
  const source = readFileSync(join(postsDirectory, slug, "en.mdx"), "utf8");
  const publishedAt = /^publishedAt: "(\d{4}-\d{2}-\d{2})"$/m.exec(source)?.[1];
  if (!publishedAt) throw new Error(`Missing publishedAt for ${slug}`);
  return { publishedAt, draft: /^draft: true$/m.test(source) };
}

const rocketLogbookSlugs = [
  "stars-volcanoes-childhood-curiosity",
  "spacex-engineering-ambivalence",
  "heavencraft-first-systems",
];

describe("published article discovery", () => {
  it.each(["en", "fr"] as const)(
    "exposes every published engineering ideas article in %s",
    (locale) => {
      const visibleSlugs = new Set(
        getPostSummaries(locale, "public").map((post) => post.slug),
      );

      expect(
        engineeringIdeasSlugs.filter((slug) => !visibleSlugs.has(slug)),
      ).toEqual([]);
    },
  );

  // Checked against the real content set: every draft present in content/posts
  // must stay out of every path, and every path must apply the shared rule
  // (whose draft branch is unit-tested in post-scheduling.test.ts).
  it("keeps draft articles out of every publication path", () => {
    const liveSlugs = contentSlugs.filter((slug) =>
      isPublished(readPublicationFields(slug), clock),
    );
    const draftSlugs = contentSlugs.filter(
      (slug) => readPublicationFields(slug).draft,
    );

    for (const slug of draftSlugs) {
      expect(liveSlugs).not.toContain(slug);
    }

    for (const locale of ["en", "fr"] as const) {
      expect(
        getPostSummaries(locale, "rocket").map((post) => post.slug).sort(),
      ).toEqual(liveSlugs);
      expect(
        getSearchDocuments(locale, "rocket").map((post) => post.slug).sort(),
      ).toEqual(liveSlugs);

      for (const slug of contentSlugs) {
        expect(getPost(locale, slug, "rocket") !== null, slug).toBe(
          liveSlugs.includes(slug),
        );
      }
    }

    for (const slug of contentSlugs) {
      expect(hasPostSlug(slug, "rocket"), slug).toBe(liveSlugs.includes(slug));
    }
  });

  it.each(["en", "fr"] as const)(
    "keeps Rocket transmissions out of public discovery in %s",
    (locale) => {
      const summaries = getPostSummaries(locale, "public");
      const searchDocuments = getSearchDocuments(locale, "public");

      for (const slug of rocketLogbookSlugs) {
        expect(getPost(locale, slug, "public")).toBeNull();
        expect(summaries.map((post) => post.slug)).not.toContain(slug);
        expect(searchDocuments.map((post) => post.slug)).not.toContain(slug);
      }

      expect(getPostLocales(rocketLogbookSlugs[0]!, "public")).toEqual([]);
    },
  );

  it("does not expose Rocket-only tags through public discovery", () => {
    expect(getAvailableTags("en", "public")).not.toContain("astronomy");
    expect(getAvailableTags("fr", "public")).not.toContain("astronomie");
    expect(hasPostSlug(rocketLogbookSlugs[0]!, "public")).toBe(false);
  });

  it.each(["en", "fr"] as const)(
    "exposes the ordered logbook only with Rocket access in %s",
    (locale) => {
      expect(
        getThemeExclusivePostSummaries(locale, "rocket").map(
          (post) => post.slug,
        ),
      ).toEqual(rocketLogbookSlugs);

      for (const slug of rocketLogbookSlugs) {
        expect(getPost(locale, slug, "rocket")).not.toBeNull();
        expect(
          getSearchDocuments(locale, "rocket").map((post) => post.slug),
        ).toContain(slug);
      }
    },
  );

  it("keeps both locale variants available inside Rocket", () => {
    expect(
      getPostLocales("stars-volcanoes-childhood-curiosity", "rocket"),
    ).toEqual(["en", "fr"]);
    expect(
      hasPostSlug("stars-volcanoes-childhood-curiosity", "rocket"),
    ).toBe(true);
  });
});
