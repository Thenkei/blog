import { describe, expect, it } from "vitest";
import { computeCinematicProgress } from "../../src/shared/components/parallax/useCinematicScroll";

describe("cinematic scroll progress", () => {
  it("normalizes progress within the measured scroll range", () => {
    expect(computeCinematicProgress(200, 200, 800)).toBe(0);
    expect(computeCinematicProgress(600, 200, 800)).toBeCloseTo(0.5, 5);
    expect(computeCinematicProgress(1000, 200, 800)).toBe(1);
  });

  it("clamps progress before and after the measured scroll range", () => {
    expect(computeCinematicProgress(50, 200, 800)).toBe(0);
    expect(computeCinematicProgress(1200, 200, 800)).toBe(1);
  });

  it("returns zero when no usable scroll range exists", () => {
    expect(computeCinematicProgress(300, 200, 0)).toBe(0);
    expect(computeCinematicProgress(300, 200, -100)).toBe(0);
    expect(computeCinematicProgress(Number.NaN, 200, 800)).toBe(0);
  });
});
