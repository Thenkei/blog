import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InlineArticleDiagram } from "../../src/shared/components/InlineArticleDiagram";

describe("InlineArticleDiagram", () => {
  it("keeps the imported SVG accessible and renders its caption", () => {
    render(
      <InlineArticleDiagram
        svg={`<svg role="img" aria-labelledby="diagram-title diagram-desc"><title id="diagram-title">Diagram title</title><desc id="diagram-desc">Diagram description</desc></svg>`}
      >
        Diagram caption
      </InlineArticleDiagram>,
    );

    expect(screen.getByRole("img", { name: "Diagram title Diagram description" })).toBeInTheDocument();
    expect(screen.getByText("Diagram caption")).toBeInTheDocument();
  });
});
