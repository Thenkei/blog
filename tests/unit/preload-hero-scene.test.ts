import { describe, expect, it, vi } from "vitest";
import { isHomePath, preloadHeroScene } from "../../src/app/preloadHeroScene";

describe("home path detection", () => {
  it("accepts the base path with or without a locale", () => {
    expect(isHomePath("/blog/", "/blog/")).toBe(true);
    expect(isHomePath("/blog", "/blog/")).toBe(true);
    expect(isHomePath("/blog/fr", "/blog/")).toBe(true);
    expect(isHomePath("/blog/en/", "/blog/")).toBe(true);
    expect(isHomePath("/", "/")).toBe(true);
    expect(isHomePath("/fr", "/")).toBe(true);
  });

  it("rejects every other page", () => {
    expect(isHomePath("/blog/fr/about", "/blog/")).toBe(false);
    expect(isHomePath("/blog/en/posts/some-post", "/blog/")).toBe(false);
    expect(isHomePath("/blog/about", "/blog/")).toBe(false);
  });
});

describe("hero scene preload", () => {
  it("fetches the scene for a Mountain visitor landing on the home page", () => {
    const load = vi.fn(() => Promise.resolve());

    expect(preloadHeroScene("mountain", "/blog/fr", "/blog/", load)).toBe(true);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("does nothing for other themes or other pages", () => {
    const load = vi.fn(() => Promise.resolve());

    expect(preloadHeroScene("rocket", "/blog/fr", "/blog/", load)).toBe(false);
    expect(preloadHeroScene(undefined, "/blog/", "/blog/", load)).toBe(false);
    expect(
      preloadHeroScene("mountain", "/blog/fr/posts/some-post", "/blog/", load),
    ).toBe(false);
    expect(load).not.toHaveBeenCalled();
  });

  it("leaves a failed download to the hero's own request", async () => {
    const load = vi.fn(() => Promise.reject(new Error("offline")));

    expect(preloadHeroScene("mountain", "/blog/", "/blog/", load)).toBe(true);
    // The rejection is handled: nothing reaches the unhandled-rejection hook.
    await Promise.resolve();
  });
});
