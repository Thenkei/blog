import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "../../src/i18n/config";
import {
  ArticleGame,
  articleGameIds,
  getArticleGame,
} from "../../src/shared/components/ArticleGame";

describe("ArticleGame", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it.each(articleGameIds)("has an https source and copy in both locales for %s", (id) => {
    const en = getArticleGame(id, "en");
    const fr = getArticleGame(id, "fr");

    expect(en.src).toMatch(/^https:\/\//);
    expect(en.title).not.toBe(fr.title);
    expect(en.description).not.toBe(fr.description);
  });

  it("loads the game only after the reader presses play", () => {
    const { container } = render(<ArticleGame id="jokarikara" />);

    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("link", { name: /new tab/i })).toHaveAttribute(
      "href",
      "https://thenkei.github.io/jokarikara/",
    );

    fireEvent.click(screen.getByRole("button", { name: /play here/i }));

    const frame = container.querySelector("iframe");
    expect(frame).toHaveAttribute("src", "https://thenkei.github.io/jokarikara/");
    expect(frame).toHaveAttribute("sandbox", "allow-scripts allow-same-origin");
    expect(screen.queryByRole("button", { name: /play here/i })).toBeNull();
  });
});
