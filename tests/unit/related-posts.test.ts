import { describe, expect, it } from "vitest";
import { getRelatedPosts, getTopicPosts } from "../../src/features/posts/content";

describe("getRelatedPosts", () => {
  it("returns relevant architecture neighbors for a BullMQ post", () => {
    const related = getRelatedPosts("en", "jobify-workers-queues-nestjs", 10);
    const slugs = related.map((post) => post.slug);

    expect(slugs).toContain("idempotency-debounce-jobify-bullmq");
    expect(slugs).toContain("nodejs-stream-backpressure-history-export");
  });
});

describe("getTopicPosts", () => {
  it("groups posts under the durable architecture topic", () => {
    const posts = getTopicPosts("en", "architecture");
    expect(posts.map((post) => post.slug)).toContain(
      "idempotency-debounce-jobify-bullmq",
    );
  });
});
