import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getMotionStory, MOTION_STORIES } from "../../src/features/posts/motion/stories";

describe("article motion coverage", () => {
  it("has a bilingual, readable three-beat sequence for every article", () => {
    const slugs = readdirSync(resolve(process.cwd(), "content/posts")).sort();
    expect(Object.keys(MOTION_STORIES).sort()).toEqual(slugs);

    for (const slug of slugs) {
      for (const locale of ["en", "fr"] as const) {
        const story = getMotionStory(slug, locale);
        expect(story?.beats).toHaveLength(3);
        for (const beat of story?.beats ?? []) {
          expect(beat.length).toBeGreaterThan(0);
          expect(beat.length).toBeLessThan(48);
        }
      }
    }
  });
});
