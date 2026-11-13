import { describe, expect, it } from "vitest";
import { resolveArticleLink } from "../../src/app/mdxComponents";

describe("resolveArticleLink", () => {
  it.each([
    ["../posts/jobify-workers-queues-nestjs", "/fr/posts/jobify-workers-queues-nestjs"],
    ["./posts/jobify-workers-queues-nestjs", "/fr/posts/jobify-workers-queues-nestjs"],
    ["posts/jobify-workers-queues-nestjs/", "/fr/posts/jobify-workers-queues-nestjs"],
    // An absolute "/posts/…" used to leave the "/blog/" base and 404.
    ["/posts/nodejs-stream-backpressure-history-export", "/fr/posts/nodejs-stream-backpressure-history-export"],
    ["../posts/postgresql-unique-nulls#the-plot-twist", "/fr/posts/postgresql-unique-nulls#the-plot-twist"],
  ])("routes the post link %s inside the app, in the active locale", (href, route) => {
    expect(resolveArticleLink(href, "fr")).toBe(route);
  });

  it.each([
    "https://example.com/posts/not-ours",
    "//example.com/posts/not-ours",
    "mailto:someone@example.com",
    "#a-section",
    "/rss.xml",
    undefined,
  ])("leaves %s to the browser", (href) => {
    expect(resolveArticleLink(href, "en")).toBeNull();
  });
});
