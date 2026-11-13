import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "../../src/i18n/config";
import {
  ArticleVideo,
  articleVideoIds,
  getArticleVideo,
} from "../../src/shared/components/ArticleVideo";

describe("ArticleVideo", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it.each(articleVideoIds)("has a film and a poster in both locales for %s", (id) => {
    const en = getArticleVideo(id, "en");
    const fr = getArticleVideo(id, "fr");

    expect(en.src).toMatch(/\.en\.mp4/);
    expect(fr.src).toMatch(/\.fr\.mp4/);
    expect(en.poster).toMatch(/\.en\.jpg/);
    expect(fr.poster).toMatch(/\.fr\.jpg/);
    expect(en.title).not.toBe(fr.title);
    expect(en.description).not.toBe(fr.description);
  });

  it("renders a video that downloads nothing until the reader plays it", () => {
    const { container } = render(
      <ArticleVideo id="video-factory-trailer">A caption.</ArticleVideo>,
    );
    const video = container.querySelector("video");

    expect(screen.getByRole("figure", { name: /example trailer/i })).toBeInTheDocument();
    expect(video).toHaveAttribute("preload", "none");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("poster", expect.stringMatching(/trailer\.en\.jpg/));
    expect(video).not.toHaveAttribute("autoplay");
    expect(container.querySelector("source")).toHaveAttribute(
      "src",
      expect.stringMatching(/trailer\.en\.mp4/),
    );
    expect(container.querySelector("figcaption")?.textContent).toMatch(/A caption\..*Silent, 21 seconds/);
  });

  it("serves the French export and description to French readers", async () => {
    await i18n.changeLanguage("fr");
    const { container } = render(<ArticleVideo id="video-factory-release" />);

    expect(screen.getByRole("figure", { name: /film de release/i })).toBeInTheDocument();
    expect(container.querySelector("source")).toHaveAttribute(
      "src",
      expect.stringMatching(/release\.fr\.mp4/),
    );
    expect(container.querySelector("figcaption")?.textContent).toMatch(/Muet, 25 secondes/);
  });
});
