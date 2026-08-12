import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "../../src/i18n/config";
import i18n from "../../src/i18n/config";
import {
  ArticleMedia,
  articleMediaIds,
} from "../../src/shared/components/ArticleMedia";

describe("ArticleMedia", () => {
  it.each(articleMediaIds)("renders %s as an accessible article figure", (mediaId) => {
    const { container } = render(<ArticleMedia mediaId={mediaId} />);

    expect(container.querySelector(`[data-article-media="${mediaId}"]`)).toBeTruthy();
    expect(screen.getByRole("img", { name: /.+/ })).toBeInTheDocument();
    expect(container.querySelector("svg title")?.textContent).toMatch(/.+/);
    expect(container.querySelector("svg desc")?.textContent).toMatch(/.+/);
    expect(container.querySelector("figcaption")?.textContent).toMatch(/.+/);
  });

  it("localizes the figure when the application language is French", async () => {
    await i18n.changeLanguage("fr");

    render(<ArticleMedia mediaId="backpressure-propagation" />);

    expect(screen.getByRole("img", { name: /La backpressure remonte/i })).toBeInTheDocument();
    expect(screen.getByText(/La backpressure remonte/i)).toBeInTheDocument();
    expect(screen.getByText(/Le pipeline garde une mémoire bornée/i)).toBeInTheDocument();

    await i18n.changeLanguage("en");
  });
});
