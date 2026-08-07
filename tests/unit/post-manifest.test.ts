import { describe, expect, it } from "vitest";
import { buildPostManifest } from "../../src/features/posts/content";

function DummyPost() {
  return null;
}

describe("buildPostManifest", () => {
  it("propagates visual identifiers into post documents", () => {
    const manifest = buildPostManifest({
      "/content/posts/example/en.mdx": {
        default: DummyPost,
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
        default: DummyPost,
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

    expect(manifest.byLocale.en[0]?.visualId).toBe("sse-outbound-channel");
    expect(manifest.byLocale.fr[0]?.visualId).toBe("sse-outbound-channel");
  });

  it("fails when a locale variant is missing", () => {
    expect(() =>
      buildPostManifest({
        "/content/posts/example/en.mdx": {
          default: DummyPost,
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
          default: DummyPost,
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
          default: DummyPost,
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
          default: DummyPost,
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
          default: DummyPost,
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
          default: DummyPost,
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
