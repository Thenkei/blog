import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isPublished, isScheduled, utcToday } from "../../src/features/posts/content/publication";

const production = (today: string) => ({ today, includeScheduled: false });

describe("scheduled publication", () => {
  it("shows a post from its publishedAt day, in UTC", () => {
    const post = { publishedAt: "2026-10-01" };

    expect(isPublished(post, production("2026-09-30"))).toBe(false);
    expect(isPublished(post, production("2026-10-01"))).toBe(true);
    expect(isPublished(post, production("2026-10-02"))).toBe(true);
    expect(utcToday(new Date("2026-09-30T23:30:00-02:00"))).toBe("2026-10-01");
  });

  it("previews scheduled posts in dev but never drafts", () => {
    const dev = { today: "2026-09-28", includeScheduled: true };

    expect(isPublished({ publishedAt: "2026-10-19" }, dev)).toBe(true);
    expect(isPublished({ publishedAt: "2026-01-01", draft: true }, dev)).toBe(false);
  });

  it("keeps every generated feed entry on or before today", () => {
    const today = utcToday();
    for (const artifact of ["rss.xml", "sitemap.xml"]) {
      const xml = readFileSync(join(process.cwd(), "public", artifact), "utf8");
      const scheduledSlugs = readdirSync(join(process.cwd(), "content", "posts")).filter((slug) => {
        const source = readFileSync(join(process.cwd(), "content", "posts", slug, "en.mdx"), "utf8");
        const publishedAt = /^publishedAt: "(\d{4}-\d{2}-\d{2})"$/m.exec(source)?.[1];
        return publishedAt !== undefined && isScheduled({ publishedAt }, today);
      });

      for (const slug of scheduledSlugs) {
        expect(xml, `${artifact} lists scheduled ${slug}`).not.toContain(`/posts/${slug}<`);
      }
    }
  });
});
