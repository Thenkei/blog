import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const root = process.cwd();
const contentDir = path.join(root, "content", "posts");
const publicDir = path.join(root, "public");
const siteUrl = (process.env.SITE_URL || "https://thenkei.github.io/blog").replace(/\/$/, "");

const frontmatterSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  summary: z.string().min(1),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  readTimeMinutes: z.number().int().positive(),
  tags: z.array(z.string().min(1)).min(1),
  seriesId: z.string().min(1).optional(),
  seriesOrder: z.number().int().positive().optional(),
  draft: z.boolean().optional(),
});

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function loadEntries() {
  const slugDirs = await fs.readdir(contentDir, { withFileTypes: true });
  const entries = [];

  for (const dirent of slugDirs) {
    if (!dirent.isDirectory()) {
      continue;
    }

    const slug = dirent.name;
    const localeFiles = {
      en: path.join(contentDir, slug, "en.mdx"),
      fr: path.join(contentDir, slug, "fr.mdx"),
    };

    for (const locale of ["en", "fr"]) {
      try {
        await fs.access(localeFiles[locale]);
      } catch {
        throw new Error(`Missing locale file for ${slug}: ${locale}.mdx`);
      }
    }

    for (const locale of ["en", "fr"]) {
      const filePath = localeFiles[locale];
      const source = await fs.readFile(filePath, "utf8");
      const parsed = matter(source);
      const meta = frontmatterSchema.parse(parsed.data);

      if (meta.updatedAt && meta.updatedAt < meta.publishedAt) {
        throw new Error(`updatedAt cannot be before publishedAt for ${slug}/${locale}`);
      }

      entries.push({
        slug,
        locale,
        ...meta,
      });
    }
  }

  return entries.filter((entry) => !entry.draft);
}

function buildSitemap(entries) {
  const urls = entries
    .map((entry) => {
      const loc = `${siteUrl}/${entry.locale}/posts/${entry.slug}`;
      const lastmod = entry.updatedAt || entry.publishedAt;
      return `<url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod></url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildRss(entries) {
  const enEntries = entries
    .filter((entry) => entry.locale === "en")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const items = enEntries
    .map((entry) => {
      const link = `${siteUrl}/en/posts/${entry.slug}`;
      return `<item>\n<title>${escapeXml(entry.title)}</title>\n<link>${escapeXml(link)}</link>\n<guid>${escapeXml(link)}</guid>\n<description>${escapeXml(entry.summary)}</description>\n<pubDate>${new Date(`${entry.publishedAt}T00:00:00.000Z`).toUTCString()}</pubDate>\n</item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n<title>Morgan's Blog</title>\n<link>${escapeXml(siteUrl)}</link>\n<description>Engineering deep dives, architecture notes, and backend lessons.</description>\n${items}\n</channel>\n</rss>\n`;
}

function buildRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

async function main() {
  const entries = await loadEntries();

  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(path.join(publicDir, "sitemap.xml"), buildSitemap(entries), "utf8");
  await fs.writeFile(path.join(publicDir, "rss.xml"), buildRss(entries), "utf8");
  await fs.writeFile(path.join(publicDir, "robots.txt"), buildRobots(), "utf8");

  console.log("Generated sitemap.xml, rss.xml, and robots.txt");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
