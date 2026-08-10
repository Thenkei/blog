import { describe, expect, it } from "vitest";
import { buildPostManifest } from "../../src/features/posts/content";

describe("buildPostManifest", () => {
  it("builds metadata without loading a post component", () => {
    const manifest = buildPostManifest({
      "/content/posts/example/en.mdx": {
        meta: {
          title: "Example",
          subtitle: "Subtitle",
          summary: "Summary",
          publishedAt: "2026-01-01",
          readTimeMinutes: 2,
          tags: ["example"],
          visualId: "sse-outbound-channel",
        },
      },
      "/content/posts/example/fr.mdx": {
        meta: {
          title: "Exemple",
          subtitle: "Sous-titre",
          summary: "Résumé",
          publishedAt: "2026-01-01",
          readTimeMinutes: 2,
          tags: ["example"],
          visualId: "sse-outbound-channel",
        },
      },
    });

    expect(manifest.byLocale.en[0]).toMatchObject({
      slug: "example",
      locale: "en",
      title: "Example",
      visualId: "sse-outbound-channel",
    });
    expect(manifest.byLocale.fr[0]?.visualId).toBe("sse-outbound-channel");
  });

  it("fails when a locale variant is missing", () => {
    expect(() =>
      buildPostManifest({
        "/content/posts/example/en.mdx": {
          meta: {
            title: "Example",
            subtitle: "Subtitle",
            summary: "Summary",
            publishedAt: "2026-01-01",
            readTimeMinutes: 2,
            tags: ["example"],
            visualId: "sse-outbound-channel",
          },
        },
      }),
    ).toThrow(/Missing locale variant/);
  });

  it("fails on duplicate slug-locale entries", () => {
    expect(() =>
      buildPostManifest({
        "/content/posts/example/en.mdx": {
          meta: {
            title: "Example",
            subtitle: "Subtitle",
            summary: "Summary",
            publishedAt: "2026-01-01",
            readTimeMinutes: 2,
            tags: ["example"],
            visualId: "sse-outbound-channel",
          },
        },
        "/tmp/content/posts/example/en.mdx": {
          meta: {
            title: "Example duplicate",
            subtitle: "Subtitle",
            summary: "Summary",
            publishedAt: "2026-01-01",
            readTimeMinutes: 2,
            tags: ["example"],
            visualId: "sse-outbound-channel",
          },
        },
        "/content/posts/example/fr.mdx": {
          meta: {
            title: "Exemple",
            subtitle: "Sous-titre",
            summary: "Résumé",
            publishedAt: "2026-01-01",
            readTimeMinutes: 2,
            tags: ["example"],
            visualId: "sse-outbound-channel",
          },
        },
      }),
    ).toThrow(/Duplicate locale entry/);
  });

  it("fails when locale variants use different visual identifiers", () => {
    expect(() =>
      buildPostManifest({
        "/content/posts/example/en.mdx": {
          meta: {
            title: "Example",
            subtitle: "Subtitle",
            summary: "Summary",
            publishedAt: "2026-01-01",
            readTimeMinutes: 2,
            tags: ["example"],
            visualId: "sse-outbound-channel",
          },
        },
        "/content/posts/example/fr.mdx": {
          meta: {
            title: "Exemple",
            subtitle: "Sous-titre",
            summary: "Résumé",
            publishedAt: "2026-01-01",
            readTimeMinutes: 2,
            tags: ["example"],
            visualId: "bounded-ai-loop",
          },
        },
      }),
    ).toThrow(/share visualId/);
  });
});
