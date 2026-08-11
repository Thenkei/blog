import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "../../src/i18n/config";
import {
  PostVisual,
  type PostVisualVariant,
} from "../../src/shared/components/PostVisual";
import { editorialPostVisualIds } from "../../src/shared/components/EditorialPostVisual";
import {
  postVisualIds,
  type PostVisualId,
} from "../../src/features/posts/content";

const visuals: Array<{ id: PostVisualId; title: RegExp }> = postVisualIds.map((id) => ({
  id,
  title: /.+/,
}));

const editorialPrototypeIds = [
  "engineering-documents-age-poorly",
  "context-engineering-beyond-prompt-engineering",
  "self-service-analytics-that-doesnt-lie",
  "unknown-unknowns-software-architecture",
  "the-onboarding-matrix-forest-admin",
  "rebuilding-cloud-experience-forest-admin",
  "scaling-ci-github-actions-forest-admin",
] as const satisfies readonly PostVisualId[];

const editorialSystemIds = [
  ...editorialPrototypeIds,
  ...editorialPostVisualIds,
] as const satisfies readonly PostVisualId[];

const editorialSystemTextBudgets = [
  { id: "engineering-documents-age-poorly", inlineLabels: 3 },
  { id: "context-engineering-beyond-prompt-engineering", inlineLabels: 3 },
  { id: "self-service-analytics-that-doesnt-lie", inlineLabels: 3 },
  { id: "unknown-unknowns-software-architecture", inlineLabels: 3 },
  { id: "the-onboarding-matrix-forest-admin", inlineLabels: 3 },
  { id: "rebuilding-cloud-experience-forest-admin", inlineLabels: 6 },
  { id: "scaling-ci-github-actions-forest-admin", inlineLabels: 4 },
  { id: "agent-battle-2026", inlineLabels: 3 },
  { id: "bounded-ai-loop", inlineLabels: 4 },
  { id: "ai-force-multiplier", inlineLabels: 3 },
  { id: "sse-outbound-channel", inlineLabels: 3 },
  { id: "backend-to-data-engineer-rockfi", inlineLabels: 3 },
  { id: "claude-code-product-os", inlineLabels: 3 },
  { id: "trail-endurance-profile", inlineLabels: 3 },
  { id: "engineering-2026-ai-redefined-our-job", inlineLabels: 3 },
  { id: "forest-admin-activity-logs-elasticsearch", inlineLabels: 3 },
  { id: "idempotency-debounce-jobify-bullmq", inlineLabels: 3 },
  { id: "jobify-workers-queues-nestjs", inlineLabels: 4 },
  { id: "joining-rockfi", inlineLabels: 4 },
  { id: "nodejs-stream-backpressure-history-export", inlineLabels: 4 },
  { id: "polymagine-industry-4-eyewear-2017", inlineLabels: 3 },
  { id: "postgresql-unique-nulls", inlineLabels: 3 },
  { id: "redis-memory-exhaustion-post-mortem", inlineLabels: 3 },
  { id: "scim-user-provisioning-forest-admin", inlineLabels: 3 },
  { id: "security-authentication-idp-openid-connect", inlineLabels: 3 },
] as const satisfies ReadonlyArray<{ id: PostVisualId; inlineLabels: number }>;

const localizedPrototypeLabels = [
  { id: "engineering-documents-age-poorly", en: "Active reference", fr: "Référence active" },
  {
    id: "context-engineering-beyond-prompt-engineering",
    en: "State + Provenance",
    fr: "État + Provenance",
  },
  { id: "self-service-analytics-that-doesnt-lie", en: "Self-service", fr: "Libre-service" },
  { id: "unknown-unknowns-software-architecture", en: "Recover", fr: "Récupérer" },
  {
    id: "the-onboarding-matrix-forest-admin",
    en: "Adapter / Flow",
    fr: "Adaptateur / Flow",
  },
  { id: "rebuilding-cloud-experience-forest-admin", en: "Client DB", fr: "BDD client" },
  { id: "scaling-ci-github-actions-forest-admin", en: "Artifacts", fr: "Artefacts" },
  { id: "agent-battle-2026", en: "Value", fr: "Valeur" },
  { id: "bounded-ai-loop", en: "Human gate", fr: "Gate humain" },
  { id: "ai-force-multiplier", en: "Human direction", fr: "Direction humaine" },
  {
    id: "sse-outbound-channel",
    en: "Outbound SSE",
    fr: "SSE sortant",
  },
  { id: "backend-to-data-engineer-rockfi", en: "Warehouse", fr: "Entrepôt" },
  { id: "claude-code-product-os", en: "Release", fr: "Release" },
  {
    id: "trail-endurance-profile",
    en: "Sport · 15 h",
    fr: "Sport · 15 h",
  },
  { id: "engineering-2026-ai-redefined-our-job", en: "Review", fr: "Revoir" },
  { id: "forest-admin-activity-logs-elasticsearch", en: "Hybrid search", fr: "Recherche hybride" },
  {
    id: "idempotency-debounce-jobify-bullmq",
    en: "Job ID / Debounce",
    fr: "Job ID / Debounce",
  },
  { id: "jobify-workers-queues-nestjs", en: "Runner / Worker", fr: "Runner / Worker" },
  { id: "joining-rockfi", en: "RockFi", fr: "RockFi" },
  { id: "nodejs-stream-backpressure-history-export", en: "Pressure upstream", fr: "Pression en amont" },
  { id: "polymagine-industry-4-eyewear-2017", en: "3D mesh", fr: "Maillage 3D" },
  { id: "postgresql-unique-nulls", en: "Collision", fr: "Collision" },
  { id: "redis-memory-exhaustion-post-mortem", en: "Memory", fr: "Mémoire" },
  {
    id: "scim-user-provisioning-forest-admin",
    en: "SCIM / Normalize",
    fr: "SCIM / Normaliser",
  },
  { id: "security-authentication-idp-openid-connect", en: "SAML / OIDC", fr: "SAML / OIDC" },
] as const satisfies ReadonlyArray<{ id: PostVisualId; en: string; fr: string }>;

const reworkedArticleMotifs = [
  {
    id: "engineering-documents-age-poorly",
    slug: "engineering-documents-age-poorly",
    motif: "document-drift-review",
  },
  {
    id: "self-service-analytics-that-doesnt-lie",
    slug: "self-service-analytics-that-doesnt-lie",
    motif: "governed-self-service",
  },
  {
    id: "trail-endurance-profile",
    slug: "trail-saint-jacques-100k-2026",
    motif: "saint-jacques-course-profile",
  },
  {
    id: "nodejs-stream-backpressure-history-export",
    slug: "nodejs-stream-backpressure-history-export",
    motif: "backpressure-return",
  },
  {
    id: "backend-to-data-engineer-rockfi",
    slug: "backend-to-data-engineer-rockfi",
    motif: "partner-medallion-foundation",
  },
  {
    id: "joining-rockfi",
    slug: "joining-rockfi",
    motif: "new-chapter-foundation",
  },
  {
    id: "ai-force-multiplier",
    slug: "ai-force-multiplier",
    motif: "ai-engineering-substrate",
  },
  {
    id: "forest-admin-activity-logs-elasticsearch",
    slug: "forest-admin-activity-logs-elasticsearch",
    motif: "hybrid-log-search",
  },
] as const satisfies ReadonlyArray<{
  id: PostVisualId;
  slug: string;
  motif: string;
}>;

function geometrySignature(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll("svg path, svg rect, svg circle, svg ellipse, svg line"),
  )
    .map((element) =>
      ["d", "x", "y", "width", "height", "cx", "cy", "r", "rx", "ry"]
        .map((attribute) => element.getAttribute(attribute) ?? "")
        .join(":"),
    )
    .join("|");
}

describe("PostVisual", () => {
  it.each(visuals)("renders $id as an accessible inline diagram", ({ id, title }) => {
    render(<PostVisual locale="en" slug={id} variant="inline" visualId={id} />);

    expect(screen.getByRole("img", { name: title })).toBeInTheDocument();
    expect(document.querySelector(`[data-visual-id="${id}"]`)).toBeTruthy();
  });

  it.each(postVisualIds)("renders %s in card and header variants", (id) => {
    const { container, rerender } = render(
      <PostVisual locale="en" slug={id} variant="card" visualId={id} />,
    );
    expect(container.querySelector(`[data-visual-id="${id}"]`)).toBeTruthy();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");

    rerender(<PostVisual locale="en" slug={id} variant="header" visualId={id} />);
    expect(container.querySelector(`[data-visual-id="${id}"]`)).toBeTruthy();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps a distinct SVG geometry for every article visual", () => {
    const signatures = postVisualIds.map((id) => {
      const { container, unmount } = render(
        <PostVisual locale="en" slug={id} variant="header" visualId={id} />,
      );
      const geometry = geometrySignature(container);
      unmount();
      return geometry;
    });

    expect(new Set(signatures).size).toBe(postVisualIds.length);
  });

  it.each(editorialSystemIds)(
    "uses purpose-built geometry for every %s placement",
    (id) => {
      const signatures = (["card", "header", "inline"] satisfies PostVisualVariant[]).map(
        (variant) => {
          const { container, unmount } = render(
            <PostVisual locale="en" slug={id} variant={variant} visualId={id} />,
          );

          expect(
            container.querySelector(`[data-composition="${variant}"]`),
          ).toBeTruthy();
          const signature = geometrySignature(container);
          unmount();
          return signature;
        },
      );

      expect(new Set(signatures).size).toBe(3);
    },
  );

  it.each(editorialSystemTextBudgets)(
    "keeps $id within its placement text budgets",
    ({ id, inlineLabels }) => {
      for (const variant of ["card", "header"] satisfies PostVisualVariant[]) {
        const { container, unmount } = render(
          <PostVisual locale="en" slug={id} variant={variant} visualId={id} />,
        );

        expect(container.querySelectorAll("svg text")).toHaveLength(0);
        unmount();
      }

      const { container } = render(
        <PostVisual locale="en" slug={id} variant="inline" visualId={id} />,
      );
      expect(container.querySelectorAll("svg text")).toHaveLength(inlineLabels);
    },
  );

  it.each(reworkedArticleMotifs)(
    "keeps the article-specific $motif motif in every $id placement",
    ({ id, slug, motif }) => {
      for (const variant of ["card", "header", "inline"] satisfies PostVisualVariant[]) {
        const { container, unmount } = render(
          <PostVisual locale="en" slug={slug} variant={variant} visualId={id} />,
        );

        expect(container.querySelector(`[data-visual-motif="${motif}"]`)).toBeTruthy();
        unmount();
      }
    },
  );

  it("shows autonomous analytics behind one governed metric contract", () => {
    const { container } = render(
      <PostVisual
        locale="en"
        slug="self-service-analytics-that-doesnt-lie"
        variant="card"
        visualId="self-service-analytics-that-doesnt-lie"
      />,
    );

    expect(container.querySelectorAll(".visual-editorial-analytics-chart")).toHaveLength(3);
    expect(container.querySelector(".visual-editorial-ring .visual-editorial-check")).toBeFalsy();
    expect(container.querySelector("[data-visual-motif='governed-self-service'] .visual-editorial-check")).toBeTruthy();
  });

  it("makes backpressure travel against the data flow", () => {
    const { container } = render(
      <PostVisual
        locale="en"
        slug="nodejs-stream-backpressure-history-export"
        variant="card"
        visualId="nodejs-stream-backpressure-history-export"
      />,
    );

    expect(container.querySelectorAll(".visual-editorial-data-packet")).toHaveLength(5);
    expect(container.querySelectorAll(".visual-editorial-pressure-return")).toHaveLength(2);
    expect(container.querySelectorAll(".visual-editorial-buffer-slot-full")).toHaveLength(4);
  });

  it("places AI beneath software systems while engineers remain in control", () => {
    const { container } = render(
      <PostVisual
        locale="en"
        slug="ai-force-multiplier"
        variant="card"
        visualId="ai-force-multiplier"
      />,
    );

    expect(container.querySelector("[data-ai-layer='substrate']")).toBeTruthy();
    expect(container.querySelector("[data-ai-layer='systems']")).toBeTruthy();
    expect(container.querySelector("[data-ai-layer='human-control']")).toBeTruthy();
    expect(container.querySelector(".visual-editorial-ai-substrate-core")).toBeTruthy();
    expect(container.querySelectorAll(".visual-editorial-ai-module")).toHaveLength(5);
    expect(container.querySelectorAll(".visual-editorial-ai-engineer")).toHaveLength(3);
  });

  it("uses the supplied Saint-Jacques course silhouette", () => {
    const { container } = render(
      <PostVisual
        locale="en"
        slug="trail-saint-jacques-100k-2026"
        variant="card"
        visualId="trail-endurance-profile"
      />,
    );

    expect(container.querySelector(".visual-editorial-course-profile")).toHaveAttribute(
      "d",
      expect.stringMatching(/^M40 350L62 302L76 247/),
    );
  });

  it("exposes a complete animated radar motif without relying on text", () => {
    const { container } = render(
      <PostVisual
        locale="en"
        slug="unknown-unknowns-software-architecture"
        variant="card"
        visualId="unknown-unknowns-software-architecture"
      />,
    );

    expect(container.querySelector(".visual-editorial-radar-sweep")).toBeTruthy();
    expect(container.querySelectorAll(".visual-editorial-radar-target")).toHaveLength(3);
    expect(container.querySelector(".visual-editorial-radar-ping")).toBeTruthy();
    expect(container.querySelectorAll("svg text")).toHaveLength(0);
  });

  it.each(["card", "header", "inline"] satisfies PostVisualVariant[])(
    "keeps the cloud topology accurate in the %s placement",
    (variant) => {
      const { container } = render(
        <PostVisual
          locale="en"
          slug="rebuilding-cloud-experience-forest-admin"
          variant={variant}
          visualId="rebuilding-cloud-experience-forest-admin"
        />,
      );

      expect(
        Array.from(container.querySelectorAll("[data-cloud-stage]"), (stage) =>
          stage.getAttribute("data-cloud-stage"),
        ),
      ).toEqual([
        "client",
        "gateway",
        "lambda",
        "pool",
        "nat-gateway",
        "client-database",
      ]);
      expect(container.querySelectorAll(".visual-editorial-app-gateway")).toHaveLength(1);
      expect(container.querySelectorAll(".visual-editorial-nat-gateway")).toHaveLength(1);
      expect(container.querySelectorAll(".visual-editorial-client-boundary")).toHaveLength(1);
    },
  );

  it("gives the watch review and race report article-specific endurance stories", () => {
    const watch = render(
      <PostVisual
        locale="en"
        slug="coros-apex-4"
        variant="inline"
        visualId="trail-endurance-profile"
      />,
    );
    expect(screen.getByText("Sport · 15 h")).toBeInTheDocument();
    const watchGeometry = geometrySignature(watch.container);
    watch.unmount();

    const race = render(
      <PostVisual
        locale="en"
        slug="trail-saint-jacques-100k-2026"
        variant="inline"
        visualId="trail-endurance-profile"
      />,
    );
    expect(screen.getByText("Shared finish")).toBeInTheDocument();
    expect(screen.getByText(/The race changed when restraint failed/i)).toBeInTheDocument();
    expect(geometrySignature(race.container)).not.toBe(watchGeometry);
  });

  it.each(localizedPrototypeLabels)(
    "localizes the editorial labels for $id",
    ({ id, en, fr }) => {
      const { unmount } = render(
        <PostVisual locale="en" slug={id} variant="inline" visualId={id} />,
      );
      expect(screen.getByText(en)).toBeInTheDocument();
      unmount();

      render(<PostVisual locale="fr" slug={id} variant="inline" visualId={id} />);
      expect(screen.getByText(fr)).toBeInTheDocument();
    },
  );

  it.each(postVisualIds)("maps %s to a concrete diagram", (id) => {
    render(<PostVisual locale="en" slug={id} variant="inline" visualId={id} />);
    expect(screen.queryByText("UNMAPPED VISUAL")).not.toBeInTheDocument();
  });

  it("localizes visible captions", () => {
    render(
      <PostVisual
        locale="fr"
        slug="bounded-ai-loop"
        variant="inline"
        visualId="bounded-ai-loop"
      />,
    );

    expect(
      screen.getByText(/Une boucle agentique sûre produit une preuve/i),
    ).toBeInTheDocument();
  });

  it("renders a deterministic decorative fallback", () => {
    const { container, rerender } = render(
      <PostVisual locale="en" slug="stable-system" variant="card" />,
    );
    const firstPaths = Array.from(container.querySelectorAll(".visual-contour"))
      .map((path) => path.getAttribute("d"))
      .join("|");

    rerender(<PostVisual locale="en" slug="stable-system" variant="card" />);
    const secondPaths = Array.from(container.querySelectorAll(".visual-contour"))
      .map((path) => path.getAttribute("d"))
      .join("|");

    expect(firstPaths).toBe(secondPaths);

    rerender(<PostVisual locale="en" slug="another-system" variant="card" />);
    const differentSlugPaths = Array.from(
      container.querySelectorAll(".visual-contour"),
    )
      .map((path) => path.getAttribute("d"))
      .join("|");

    expect(differentSlugPaths).not.toBe(firstPaths);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it.each(["card", "header"] satisfies PostVisualVariant[])(
    "keeps the %s variant decorative",
    (variant) => {
      const { container } = render(
        <PostVisual
          locale="en"
          slug="bounded-ai-loop"
          variant={variant}
          visualId="bounded-ai-loop"
        />,
      );

      expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    },
  );
});
