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

  it("marks a silent film as muted and gives it no caption track", () => {
    const { container } = render(<ArticleVideo id="video-factory-release" />);
    const video = container.querySelector("video");

    expect(video?.muted).toBe(true);
    expect(container.querySelector("track")).toBeNull();
    expect(getArticleVideo("video-factory-release", "en").captions).toBeUndefined();
  });

  it("plays a film with music with its sound on and no caption track", async () => {
    const { container, unmount } = render(<ArticleVideo id="video-factory-intro" />);

    expect(container.querySelector("video")?.muted).toBe(false);
    // No speech, so nothing to caption.
    expect(container.querySelector("track")).toBeNull();
    expect(getArticleVideo("video-factory-intro", "en").captions).toBeUndefined();
    expect(container.querySelector("figcaption")?.textContent).toMatch(/Music, no voice, 29 seconds/);
    unmount();

    await i18n.changeLanguage("fr");
    const french = render(<ArticleVideo id="video-factory-intro" />);

    expect(french.container.querySelector("source")).toHaveAttribute(
      "src",
      expect.stringMatching(/intro\.fr\.mp4/),
    );
    expect(french.container.querySelector("figcaption")?.textContent).toMatch(/Musique, sans voix, 29 secondes/);
  });

  it("plays a narrated film with its sound on and offers captions in the reader's language", async () => {
    const { container, unmount } = render(<ArticleVideo id="video-factory-explainer" />);

    expect(container.querySelector("video")?.muted).toBe(false);
    expect(container.querySelector("track")).toHaveAttribute("kind", "captions");
    expect(container.querySelector("track")).toHaveAttribute("srclang", "en");
    expect(container.querySelector("track")).toHaveAttribute(
      "src",
      expect.stringMatching(/explainer\.en\.vtt/),
    );
    // The reader turns captions on: the film already carries on-screen text.
    expect(container.querySelector("track")).not.toHaveAttribute("default");
    expect(container.querySelector("figcaption")?.textContent).toMatch(/Narrated, 60 seconds/);
    unmount();

    await i18n.changeLanguage("fr");
    const french = render(<ArticleVideo id="video-factory-explainer" />);

    expect(french.container.querySelector("track")).toHaveAttribute("srclang", "fr");
    expect(french.container.querySelector("track")).toHaveAttribute(
      "src",
      expect.stringMatching(/explainer\.fr\.vtt/),
    );
    expect(french.container.querySelector("figcaption")?.textContent).toMatch(/Avec voix, 64 secondes/);
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
