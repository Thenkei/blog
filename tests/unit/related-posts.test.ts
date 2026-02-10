import { describe, expect, it } from "vitest";
import { getRelatedPosts } from "../../src/features/posts/content";

describe("getRelatedPosts", () => {
  it("returns relevant architecture neighbors for a BullMQ post", () => {
    const related = getRelatedPosts("en", "jobify-workers-queues-nestjs", 3);
    const slugs = related.map((post) => post.slug);

    expect(slugs).toContain("idempotency-debounce-jobify-bullmq");
    expect(slugs).toContain("nodejs-stream-backpressure-history-export");
  });
});
