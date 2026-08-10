import { describe, expect, it } from "vitest";
import {
  getAdjacentPosts,
  getRelatedPosts,
  getTopicPosts,
  loadPostComponent,
} from "../../src/features/posts/content";

describe("getRelatedPosts", () => {
  it("returns relevant architecture neighbors for a BullMQ post", () => {
    const related = getRelatedPosts(
      "en",
      "jobify-workers-queues-nestjs",
      "public",
      10,
    );
    const slugs = related.map((post) => post.slug);

    expect(slugs).toContain("idempotency-debounce-jobify-bullmq");
    expect(slugs).toContain("nodejs-stream-backpressure-history-export");
  });

  it("keeps Rocket transmissions out of public recommendations", () => {
    const publicRelated = getRelatedPosts(
      "en",
      "joining-rockfi",
      "public",
      20,
    );
    const rocketRelated = getRelatedPosts(
      "en",
      "joining-rockfi",
      "rocket",
      20,
    );

    expect(publicRelated.map((post) => post.slug)).not.toContain(
      "spacex-engineering-ambivalence",
    );
    expect(rocketRelated.map((post) => post.slug)).toContain(
      "spacex-engineering-ambivalence",
    );
  });

  it("keeps Rocket navigation inside the ordered logbook", () => {
    const adjacent = getAdjacentPosts(
      "en",
      "spacex-engineering-ambivalence",
      "rocket",
    );

    expect(adjacent.previous?.slug).toBe(
      "stars-volcanoes-childhood-curiosity",
    );
    expect(adjacent.next?.slug).toBe("heavencraft-first-systems");
  });
});

describe("getTopicPosts", () => {
  it("groups posts under the durable architecture topic", () => {
    const posts = getTopicPosts("en", "architecture", "public");
    expect(posts.map((post) => post.slug)).toContain(
      "idempotency-debounce-jobify-bullmq",
    );
  });

  it("only exposes a Rocket transmission in matching topics under Rocket", () => {
    expect(
      getTopicPosts("en", "career", "public").map((post) => post.slug),
    ).not.toContain("spacex-engineering-ambivalence");
    expect(
      getTopicPosts("en", "career", "rocket").map((post) => post.slug),
    ).toContain("spacex-engineering-ambivalence");
  });
});

describe("loadPostComponent", () => {
  it("loads the requested MDX component on demand", async () => {
    await expect(
      loadPostComponent(
        { locale: "en", slug: "jobify-workers-queues-nestjs" },
        "public",
      ),
    ).resolves.toBeTypeOf("function");
  });

  it("does not load a Rocket transmission through public access", async () => {
    await expect(
      loadPostComponent(
        { locale: "en", slug: "stars-volcanoes-childhood-curiosity" },
        "public",
      ),
    ).rejects.toThrow(/not accessible/);
  });
});
