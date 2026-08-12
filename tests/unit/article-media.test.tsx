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

  it("shows polling and SSE as distinct static flows", () => {
    const { container } = render(<ArticleMedia mediaId="sse-polling-vs-stream" />);

    expect(screen.getByText("REQUEST")).toBeInTheDocument();
    expect(screen.getByText("NO CHANGE")).toBeInTheDocument();
    expect(screen.getByText("OPEN HTTPS GET")).toBeInTheDocument();
    expect(screen.getByText("EVENT ONLY")).toBeInTheDocument();
    expect(container.querySelectorAll(".article-media-packet, .article-media-event")).toHaveLength(0);
  });

  it("shows held SSE connections and jittered reconnect load", () => {
    const { container } = render(<ArticleMedia mediaId="sse-reconnect-storm" />);

    expect(screen.getByText("OPEN SSE")).toBeInTheDocument();
    expect(screen.getByText("ALL RECONNECT NOW")).toBeInTheDocument();
    expect(screen.getByText("JITTERED BACKOFF")).toBeInTheDocument();
    expect(screen.getByText("WINDOW · 1–10 s")).toBeInTheDocument();
    expect(screen.getByText("LOAD ABSORBED")).toBeInTheDocument();
    expect(container.querySelectorAll(".article-media-heartbeat")).toHaveLength(4);
    expect(container.querySelectorAll(".article-media-burst-pulse")).toHaveLength(3);
    expect(container.querySelectorAll(".article-media-jitter-bar")).toHaveLength(6);
  });
});
