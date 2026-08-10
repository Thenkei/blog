import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "../../src/i18n/config";
import {
  PostVisual,
  type PostVisualVariant,
} from "../../src/shared/components/PostVisual";
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
] as const satisfies readonly PostVisualId[];

const localizedPrototypeLabels = [
  { id: "engineering-documents-age-poorly", en: "Decision", fr: "Décision" },
  {
    id: "context-engineering-beyond-prompt-engineering",
    en: "State + Provenance",
    fr: "État + Provenance",
  },
  { id: "self-service-analytics-that-doesnt-lie", en: "Contract", fr: "Contrat" },
  { id: "unknown-unknowns-software-architecture", en: "Recover", fr: "Récupérer" },
] as const satisfies ReadonlyArray<{ id: PostVisualId; en: string; fr: string }>;

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

  it.each(editorialPrototypeIds)(
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

  it.each(editorialPrototypeIds)(
    "keeps %s within its placement text budgets",
    (id) => {
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
      expect(container.querySelectorAll("svg text")).toHaveLength(3);
    },
  );

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
