import { describe, expect, it } from "vitest";
import {
  canonicalPostTag,
  collectPostTags,
  defaultDiscoveryFilters,
  filterPosts,
  getPostSummaries,
  getPostTagLabel,
  getRelatedPosts,
  getTopicPosts,
  matchesPostCategory,
  matchesPostTag,
  postCategories,
  readDiscoveryFilters,
  showsFeaturedPost,
  topics,
  writeDiscoveryFilters,
  type PostDiscoveryFilters,
} from "../../src/features/posts/content";

function filters(patch: Partial<PostDiscoveryFilters>): PostDiscoveryFilters {
  return { ...defaultDiscoveryFilters, ...patch };
}

const post = (
  slug: string,
  publishedAt: string,
  tags: string[],
  title = slug,
) => ({ slug, publishedAt, tags, title, subtitle: "", summary: "" });

describe("tag aliases", () => {
  it("resolves French and variant spellings to one canonical slug", () => {
    expect(canonicalPostTag("ia")).toBe("ai");
    expect(canonicalPostTag(" Securite ")).toBe("security");
    expect(canonicalPostTag("entraînement")).toBe("training");
    expect(canonicalPostTag("entrainement")).toBe("training");
    expect(canonicalPostTag("modeles-frontier")).toBe("frontier-models");
    expect(canonicalPostTag("postgresql")).toBe("postgresql");
  });

  it("matches a tag whichever spelling the article or the URL uses", () => {
    expect(matchesPostTag(["course", "equipement"], "running")).toBe(true);
    expect(matchesPostTag(["running"], "course")).toBe(true);
    expect(matchesPostTag(["running"], "gear")).toBe(false);
  });

  it("labels a canonical tag in the reader's language", () => {
    expect(getPostTagLabel("running", "fr")).toBe("course");
    expect(getPostTagLabel("course", "en")).toBe("running");
    expect(getPostTagLabel("postgresql", "fr")).toBe("postgresql");
  });

  it("lists each subject once, sorted by its localized label", () => {
    const posts = [post("a", "2026-01-01", ["ia", "securite"]), post("b", "2026-01-02", ["ai", "security", "backend"])];

    expect(collectPostTags(posts, "en")).toEqual(["ai", "backend", "security"]);
    expect(collectPostTags(posts, "fr").map((tag) => getPostTagLabel(tag, "fr")))
      .toEqual(["backend", "ia", "securite"]);
  });

  // The alias table is maintained by hand. This fails when a translated article
  // introduces a French tag that has no entry, before the filter shows it twice.
  it("gives the English and French versions of every post the same canonical tags", () => {
    const french = new Map(
      getPostSummaries("fr", "rocket").map((summary) => [summary.slug, summary]),
    );

    for (const english of getPostSummaries("en", "rocket")) {
      const translated = french.get(english.slug);
      if (!translated) continue;

      expect(
        translated.tags.map(canonicalPostTag).sort(),
        english.slug,
      ).toEqual(english.tags.map(canonicalPostTag).sort());
    }
  });
});

describe("categories", () => {
  it("only lists canonical tags, so a French alias cannot be skipped", () => {
    for (const category of postCategories) {
      for (const tag of category.tags) {
        expect(canonicalPostTag(tag), `${category.slug}/${tag}`).toBe(tag);
      }
    }
  });

  it.each(["en", "fr"] as const)(
    "places every public %s post in at least one category",
    (locale) => {
      const uncategorized = getPostSummaries(locale, "public")
        .filter((summary) =>
          !postCategories.some((category) =>
            matchesPostCategory(summary.tags, category),
          ),
        )
        .map((summary) => summary.slug);

      expect(uncategorized).toEqual([]);
    },
  );

  it.each(postCategories.map((category) => category.slug))(
    "shows the same posts in the %s category in both languages",
    (category) => {
      const slugs = (locale: "en" | "fr") =>
        filterPosts(getPostSummaries(locale, "public"), filters({ category }))
          .map((summary) => summary.slug);

      expect(slugs("fr")).toEqual(slugs("en"));
      expect(slugs("en").length).toBeGreaterThan(0);
    },
  );
});

describe("filterPosts", () => {
  const posts = [
    post("old-run", "2026-01-14", ["course", "equipement"], "Montre de trail"),
    post("new-data", "2026-11-09", ["data-engineering", "dagster"], "Plateforme data"),
    post("mid-ai", "2026-08-22", ["ia", "securite"], "Sécurité des agents"),
  ];

  it("sorts newest first by default and oldest first on request", () => {
    expect(filterPosts(posts, filters({})).map((p) => p.slug))
      .toEqual(["new-data", "mid-ai", "old-run"]);
    expect(filterPosts(posts, filters({ sort: "oldest" })).map((p) => p.slug))
      .toEqual(["old-run", "mid-ai", "new-data"]);
  });

  it("does not mutate the list it receives", () => {
    const before = posts.map((p) => p.slug);
    filterPosts(posts, filters({ sort: "oldest" }));
    expect(posts.map((p) => p.slug)).toEqual(before);
  });

  it("combines category, tag and search", () => {
    expect(filterPosts(posts, filters({ category: "running" })).map((p) => p.slug))
      .toEqual(["old-run"]);
    expect(filterPosts(posts, filters({ category: "ai", tag: "security" })).map((p) => p.slug))
      .toEqual(["mid-ai"]);
    expect(filterPosts(posts, filters({ category: "data", query: "agents" })))
      .toEqual([]);
  });

  it("searches without regard to case, accents or tag language", () => {
    expect(filterPosts(posts, filters({ query: "SECURITE" })).map((p) => p.slug))
      .toEqual(["mid-ai"]);
    expect(filterPosts(posts, filters({ query: "running" })).map((p) => p.slug))
      .toEqual(["old-run"]);
    expect(filterPosts(posts, filters({ query: "  " }))).toHaveLength(3);
  });

  it("ignores an unknown category instead of emptying the list", () => {
    expect(filterPosts(posts, filters({ category: "nope" }))).toHaveLength(3);
  });
});

describe("discovery filters in the URL", () => {
  it("reads defaults from an empty query string", () => {
    expect(readDiscoveryFilters(new URLSearchParams())).toEqual(defaultDiscoveryFilters);
  });

  it("canonicalizes the tag and drops unknown values", () => {
    expect(
      readDiscoveryFilters(new URLSearchParams("tag=Course&category=nope&sort=sideways&q=bull")),
    ).toEqual({ query: "bull", tag: "running", category: null, sort: "newest" });
    expect(readDiscoveryFilters(new URLSearchParams("tag=all")).tag).toBeNull();
  });

  it("writes only non-default filters and keeps unrelated parameters", () => {
    const params = new URLSearchParams("utm_source=newsletter&tag=old&sort=oldest");
    const next = writeDiscoveryFilters(
      params,
      filters({ query: " bullmq ", category: "engineering" }),
    );

    expect(next.toString()).toBe("utm_source=newsletter&q=+bullmq+&category=engineering");
    expect(params.get("tag")).toBe("old");
  });

  it("round-trips a full set of filters", () => {
    const value = filters({ query: "nexus", tag: "ai", category: "ai", sort: "oldest" });
    expect(readDiscoveryFilters(writeDiscoveryFilters(new URLSearchParams(), value)))
      .toEqual(value);
  });

  it("features the latest post only on the untouched newest-first list", () => {
    expect(showsFeaturedPost(filters({}))).toBe(true);
    expect(showsFeaturedPost(filters({ query: "  " }))).toBe(true);
    expect(showsFeaturedPost(filters({ sort: "oldest" }))).toBe(false);
    expect(showsFeaturedPost(filters({ category: "ai" }))).toBe(false);
    expect(showsFeaturedPost(filters({ tag: "ai" }))).toBe(false);
    expect(showsFeaturedPost(filters({ query: "a" }))).toBe(false);
  });
});

describe("tag aliases outside the list page", () => {
  it.each(topics.map((topic) => topic.slug))(
    "lists the same posts on the %s topic page in both languages",
    (topic) => {
      const slugs = (locale: "en" | "fr") =>
        getTopicPosts(locale, topic, "public").map((summary) => summary.slug);

      expect(slugs("fr")).toEqual(slugs("en"));
    },
  );

  it("recommends the same related posts in both languages", () => {
    const slugs = (locale: "en" | "fr") =>
      getRelatedPosts(locale, "ai-is-not-immaterial", "public", 4)
        .map((summary) => summary.slug);

    expect(slugs("fr")).toEqual(slugs("en"));
  });
});
