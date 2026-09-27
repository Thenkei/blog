import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "../../src/i18n/config";
import i18n from "../../src/i18n/config";
import { ArticleMedia, articleMediaIds } from "../../src/shared/components/ArticleMedia";

describe("ArticleMedia", () => {
  it.each(articleMediaIds)("renders %s as a three-stage native storyboard", (mediaId) => {
    const { container } = render(<ArticleMedia mediaId={mediaId} />);

    expect(container.querySelector(`[data-inline-motion="${mediaId}"]`)).toBeTruthy();
    expect(screen.getByRole("figure")).toBeInTheDocument();
    expect(container.querySelectorAll(".native-scene-poster-steps li")).toHaveLength(3);
    expect(container.querySelector(".article-media-svg")).toBeNull();
    expect(container.querySelector("figcaption")?.textContent).toMatch(/.+/);
  });

  it("localizes the storyboard in French", async () => {
    await i18n.changeLanguage("fr");
    render(<ArticleMedia mediaId="backpressure-propagation" />);

    expect(screen.getByRole("figure", { name: /La backpressure remonte/i })).toBeInTheDocument();
    expect(screen.getByText(/Le pipeline garde une mémoire bornée/i)).toBeInTheDocument();
    await i18n.changeLanguage("en");
  });
});
