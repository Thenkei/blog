import { describe, expect, it } from "vitest";
import {
  computeArticleReadingProgress,
  computeRocketReadingState,
} from "../../src/features/reading/readingProgressState";

describe("reading progress state", () => {
  it.each([
    [300, 0],
    [750, 25],
    [1200, 50],
    [1650, 75],
    [2100, 100],
  ])("maps scroll position %d to %d percent linearly", (scrollY, expected) => {
    expect(
      computeArticleReadingProgress({
        articleTop: 500,
        articleBottom: 2900,
        scrollY,
        viewportHeight: 1000,
      }),
    ).toBe(expected);
  });

  it("clamps progress outside the article range", () => {
    expect(
      computeArticleReadingProgress({
        articleTop: 500,
        articleBottom: 2900,
        scrollY: -400,
        viewportHeight: 1000,
      }),
    ).toBe(0);
    expect(
      computeArticleReadingProgress({
        articleTop: 500,
        articleBottom: 2900,
        scrollY: 4000,
        viewportHeight: 1000,
      }),
    ).toBe(100);
  });

  it("keeps ship travel linear while boost follows a separate envelope", () => {
    const ignition = computeRocketReadingState(0);
    const midFlight = computeRocketReadingState(50);
    const approach = computeRocketReadingState(98);

    expect(ignition.travelProgress).toBe(0);
    expect(midFlight.travelProgress).toBe(0.5);
    expect(approach.travelProgress).toBe(0.98);
    expect(midFlight.boostPower).toBeGreaterThan(ignition.boostPower);
    expect(midFlight.boostPower).toBeGreaterThan(approach.boostPower);
  });

  it("enters orbit only at complete progress and reverses cleanly", () => {
    const almostComplete = computeRocketReadingState(99.8);

    expect(almostComplete).toMatchObject({
      phase: "approach",
      orbitActive: false,
    });
    expect(almostComplete.travelProgress).toBeCloseTo(0.998);
    const completed = computeRocketReadingState(99.9);

    expect(completed).toMatchObject({
      phase: "orbit",
      orbitActive: true,
    });
    expect(completed.travelProgress).toBeCloseTo(0.999);
    expect(computeRocketReadingState(75)).toMatchObject({
      phase: "approach",
      orbitActive: false,
      travelProgress: 0.75,
    });
  });

  it("clamps Rocket visual state to valid progress and boost ranges", () => {
    const before = computeRocketReadingState(-20);
    const after = computeRocketReadingState(140);

    expect(before.progress).toBe(0);
    expect(before.boostPower).toBeGreaterThanOrEqual(0);
    expect(after.progress).toBe(100);
    expect(after.boostPower).toBeLessThanOrEqual(1);
  });

});
