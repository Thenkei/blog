import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "../../src/i18n/config";
import { InlineArticleDiagram } from "../../src/shared/components/InlineArticleDiagram";

describe("InlineArticleDiagram", () => {
  it("renders a native storyboard and its caption without source SVG artwork", () => {
    render(
      <InlineArticleDiagram assetId="context-stack">
        Diagram caption
      </InlineArticleDiagram>,
    );

    expect(screen.getByRole("figure")).toBeInTheDocument();
    expect(screen.getAllByText("Start with authority").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Verify the result").length).toBeGreaterThan(1);
    expect(screen.getByText("Diagram caption")).toBeInTheDocument();
  });
});
