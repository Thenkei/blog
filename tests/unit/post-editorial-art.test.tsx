import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  getPostEditorialArt,
  hasPostEditorialArt,
  PostEditorialArt,
} from "../../src/shared/components/PostEditorialArt";

const editorialSlugs = [
  "agent-battle-2026",
  "ai-force-multiplier",
  "ai-human-judgment-rockfi",
  "architecture-sse-agent-communication",
  "backend-to-data-engineer-rockfi",
  "claude-code-product-os",
  "context-engineering-beyond-prompt-engineering",
  "coros-apex-4",
  "engineering-2026-ai-redefined-our-job",
  "engineering-documents-age-poorly",
  "forest-admin-activity-logs-elasticsearch",
  "heavencraft-first-systems",
  "idempotency-debounce-jobify-bullmq",
  "jobify-workers-queues-nestjs",
  "joining-rockfi",
  "nodejs-stream-backpressure-history-export",
  "polymagine-industry-4-eyewear-2017",
  "postgresql-unique-nulls",
  "rebuilding-cloud-experience-forest-admin",
  "redis-memory-exhaustion-post-mortem",
  "scaling-ci-github-actions-forest-admin",
  "scim-user-provisioning-forest-admin",
  "security-authentication-idp-openid-connect",
  "self-service-analytics-that-doesnt-lie",
  "spacex-engineering-ambivalence",
  "stars-volcanoes-childhood-curiosity",
  "the-onboarding-matrix-forest-admin",
  "trail-saint-jacques-100k-2026",
  "unknown-unknowns-software-architecture",
] as const;

describe("PostEditorialArt", () => {
  it.each(editorialSlugs)("registers %s with localized alt text", (slug) => {
    const art = getPostEditorialArt(slug);

    expect(art).not.toBeNull();
    expect(art?.alt.en).toMatch(/.+/);
    expect(art?.alt.fr).toMatch(/.+/);
    expect(hasPostEditorialArt(slug)).toBe(true);
  });

  it("renders responsive sources for cards and headers", () => {
    const { container, rerender } = render(
      <PostEditorialArt locale="en" slug="coros-apex-4" variant="card" />,
    );

    expect(container.querySelector("[data-editorial-art='coros-apex-4']")).toBeTruthy();
    expect(container.querySelectorAll("source")).toHaveLength(4);
    expect(screen.getByRole("img", { name: /trail runner/i })).toHaveAttribute(
      "loading",
      "lazy",
    );

    rerender(<PostEditorialArt locale="fr" slug="coros-apex-4" variant="header" />);
    expect(screen.getByRole("img", { name: /coureur de trail/i })).toHaveAttribute(
      "loading",
      "eager",
    );
  });

  it("renders nothing for posts without editorial artwork", () => {
    const { container } = render(
      <PostEditorialArt locale="en" slug="not-a-real-post" variant="card" />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(hasPostEditorialArt("not-a-real-post")).toBe(false);
  });
});
