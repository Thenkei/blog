import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const publicArtifact = (name: string) =>
  readFileSync(`${process.cwd()}/public/${name}`, "utf8");

describe("static publication artifacts", () => {
  it("leaves route-specific robot directives to PageMeta", () => {
    const sourceHtml = readFileSync(`${process.cwd()}/index.html`, "utf8");

    expect(sourceHtml).not.toContain('name="robots"');
  });

  it.each(["rss.xml", "sitemap.xml"])(
    "keeps Rocket transmissions out of %s",
    (artifactName) => {
      const artifact = publicArtifact(artifactName);

      expect(artifact).not.toContain("stars-volcanoes-childhood-curiosity");
      expect(artifact).not.toContain("spacex-engineering-ambivalence");
      expect(artifact).not.toContain("heavencraft-first-systems");
      expect(artifact).toContain("postgresql-unique-nulls");
    },
  );
});
