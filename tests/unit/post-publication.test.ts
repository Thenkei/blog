import { describe, expect, it } from "vitest";
import {
  getPost,
  getPostSummaries,
  hasPostSlug,
} from "../../src/features/posts/content";

const engineeringIdeasSlugs = [
  "unknown-unknowns-software-architecture",
  "self-service-analytics-that-doesnt-lie",
  "context-engineering-beyond-prompt-engineering",
  "engineering-documents-age-poorly",
];

describe("published article discovery", () => {
  it.each(["en", "fr"] as const)(
    "exposes every published engineering ideas article in %s",
    (locale) => {
      const visibleSlugs = new Set(
        getPostSummaries(locale).map((post) => post.slug),
      );

      expect(
        engineeringIdeasSlugs.filter((slug) => !visibleSlugs.has(slug)),
      ).toEqual([]);
    },
  );

  it("keeps draft articles out of every publication path", () => {
    expect(getPost("en", "claude-code-product-os")).toBeNull();
    expect(hasPostSlug("claude-code-product-os")).toBe(false);
    expect(
      getPostSummaries("en").map((post) => post.slug),
    ).not.toContain("claude-code-product-os");
  });
});
