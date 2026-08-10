import { describe, expect, it } from "vitest";
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

  it("keeps draft articles out of every publication path", () => {
    expect(getPost("en", "claude-code-product-os", "rocket")).toBeNull();
    expect(hasPostSlug("claude-code-product-os", "rocket")).toBe(false);
    expect(
      getPostSummaries("en", "rocket").map((post) => post.slug),
    ).not.toContain("claude-code-product-os");
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
