import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { postDiagramVisualIds } from "../../src/features/posts/content/types";
import { articleMediaIds } from "../../src/shared/components/ArticleMedia";
import { assetSceneIds, getAssetScene, getDiagramScene, getMediaScene } from "../../src/features/posts/motion/figureScenes";

describe("in-article motion scenes", () => {
  it("provides three localized, meaningful stages for every figure", () => {
    for (const locale of ["en", "fr"] as const) {
      const scenes = [
        ...postDiagramVisualIds.map((id) => getDiagramScene(id, locale)),
        ...articleMediaIds.map((id) => getMediaScene(id, locale)),
        ...assetSceneIds.map((id) => getAssetScene(id, locale)),
      ];
      for (const scene of scenes) {
        expect(scene.stages).toHaveLength(3);
        expect(scene.title).toBeTruthy();
        for (const stage of scene.stages) {
          expect(stage.heading).toBeTruthy();
          expect(stage.detail).toBeTruthy();
          expect(stage.detail).not.toMatch(/undefined/);
          expect(stage.x).toBeGreaterThanOrEqual(0);
          expect(stage.x).toBeLessThanOrEqual(1);
          expect(stage.y).toBeGreaterThanOrEqual(0);
          expect(stage.y).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("places a motion scene inside every localized article", () => {
    const posts = join(process.cwd(), "content", "posts");
    for (const slug of readdirSync(posts)) {
      for (const locale of ["en", "fr"] as const) {
        const content = readFileSync(join(posts, slug, `${locale}.mdx`), "utf8");
        expect(content, `${slug}/${locale}`).toMatch(/<(ArticleDiagram|ArticleMedia|InlineArticleDiagram|ImageMotionFigure|ConceptMotionFigure)\b/);
      }
    }
  });
});
