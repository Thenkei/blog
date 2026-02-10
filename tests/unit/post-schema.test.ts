import { describe, expect, it } from "vitest";
import { postFrontmatterSchema } from "../../src/features/posts/content";

describe("postFrontmatterSchema", () => {
  it("accepts valid frontmatter", () => {
    const parsed = postFrontmatterSchema.parse({
      title: "Valid title",
      subtitle: "Valid subtitle",
      summary: "Valid summary",
      publishedAt: "2026-01-26",
      readTimeMinutes: 5,
      tags: ["nodejs", "backend"],
    });

    expect(parsed.title).toBe("Valid title");
  });

  it("rejects invalid date values", () => {
    expect(() =>
      postFrontmatterSchema.parse({
        title: "Invalid",
        subtitle: "Invalid",
        summary: "Invalid",
        publishedAt: "2026-13-42",
        readTimeMinutes: 5,
        tags: ["nodejs"],
      }),
    ).toThrow();
  });
});
