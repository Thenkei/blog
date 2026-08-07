import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "../../src/i18n/config";
import {
  PostVisual,
  type PostVisualVariant,
} from "../../src/shared/components/PostVisual";
import type { PostVisualId } from "../../src/features/posts/content";

const visuals: Array<{ id: PostVisualId; title: RegExp }> = [
  { id: "bounded-ai-loop", title: /Bounded AI loop with human validation/i },
  { id: "sse-outbound-channel", title: /Outbound SSE channel through a firewall/i },
  { id: "trail-endurance-profile", title: /Endurance profile for a 100 km objective/i },
];

describe("PostVisual", () => {
  it.each(visuals)("renders $id as an accessible inline diagram", ({ id, title }) => {
    render(<PostVisual locale="en" slug={id} variant="inline" visualId={id} />);

    expect(screen.getByRole("img", { name: title })).toBeInTheDocument();
    expect(document.querySelector(`[data-visual-id="${id}"]`)).toBeTruthy();
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
