import { describe, expect, it } from "vitest";
import {
  computeCameraProgress,
  computeMultiplaneVars,
  computeRunnerPlacement,
  computeTrailEntry,
} from "../../src/shared/components/parallax/useMultiplaneCamera";

describe("mountain cinematic camera math", () => {
  it("normalizes and clamps progress from the available scrub range", () => {
    expect(computeCameraProgress(100, 200, 1000)).toBe(0);
    expect(computeCameraProgress(700, 200, 1000)).toBeCloseTo(0.5, 5);
    expect(computeCameraProgress(1300, 200, 1000)).toBe(1);
  });

  it("uses restrained, depth-ordered camera travel", () => {
    const vars = computeMultiplaneVars(0.5, false);

    expect(vars.skyShift).toBeCloseTo(-9, 3);
    expect(vars.farShift).toBeCloseTo(-28, 3);
    expect(vars.nearShift).toBeCloseTo(-46, 3);
    expect(Math.abs(vars.skyShift)).toBeLessThan(Math.abs(vars.farShift));
    expect(Math.abs(vars.farShift)).toBeLessThan(Math.abs(vars.nearShift));
    expect(vars.farScale).toBeGreaterThan(1);
    expect(vars.nearScale).toBeGreaterThan(vars.farScale);
  });

  it("carries the runner from the trailhead to the pass, never backwards", () => {
    const steps = Array.from({ length: 101 }, (_, index) =>
      computeMultiplaneVars(index / 100, false),
    );

    expect(steps[0]?.routeProgress).toBe(0);
    expect(steps[100]?.routeProgress).toBe(1);
    steps.slice(1).forEach((step, index) => {
      expect(step.routeProgress).toBeGreaterThanOrEqual(
        steps[index]?.routeProgress ?? 0,
      );
    });
    // The runner shrinks as the trail recedes towards the pass.
    expect(steps[100]?.runnerScale).toBeLessThan(steps[0]?.runnerScale ?? 0);
    expect(steps[100]?.handoff).toBe(1);
  });

  it("turns first light into sunrise over the scrub", () => {
    const start = computeMultiplaneVars(0, false);
    const middle = computeMultiplaneVars(0.5, false);
    const end = computeMultiplaneVars(1, false);

    expect(start.dawn).toBe(0);
    expect(middle.dawn).toBeGreaterThan(start.dawn);
    expect(end.dawn).toBe(1);
    expect(start.passGlow).toBe(0);
    expect(end.passGlow).toBe(1);
  });

  it("shows the scroll cue only before the journey starts", () => {
    expect(computeMultiplaneVars(0, false).hintOpacity).toBe(1);
    expect(computeMultiplaneVars(0.2, false).hintOpacity).toBe(0);
  });

  it("stays continuous: no value jumps between two adjacent frames", () => {
    for (let index = 0; index < 500; index += 1) {
      const before = computeMultiplaneVars(index / 500, false);
      const after = computeMultiplaneVars((index + 1) / 500, false);

      expect(Math.abs(after.routeProgress - before.routeProgress)).toBeLessThan(0.01);
      expect(Math.abs(after.dawn - before.dawn)).toBeLessThan(0.01);
      expect(Math.abs(after.handoff - before.handoff)).toBeLessThan(0.04);
    }
  });

  it("reduces travel for compact layouts and enlarges the runner to compensate", () => {
    const desktop = computeMultiplaneVars(0.5, false);
    const compact = computeMultiplaneVars(0.5, true);

    expect(Math.abs(compact.skyShift)).toBeLessThan(Math.abs(desktop.skyShift));
    expect(Math.abs(compact.farShift)).toBeLessThan(Math.abs(desktop.farShift));
    expect(Math.abs(compact.nearShift)).toBeLessThan(Math.abs(desktop.nearShift));
    // The compact framing shows the scene at a smaller scale.
    expect(compact.runnerScale).toBeGreaterThan(desktop.runnerScale);
  });

  it("returns a complete, readable reduced-motion poster state", () => {
    const poster = computeMultiplaneVars(0, false, true);

    expect(poster.routeProgress).toBeGreaterThan(0.4);
    expect(poster.routeProgress).toBeLessThan(1);
    expect(poster.runnerOpacity).toBe(1);
    expect(poster.titleShift).toBe(0);
    expect(poster.dawn).toBeGreaterThan(0.5);
    expect(poster.hintOpacity).toBe(0);
    expect(poster.handoff).toBe(0);
    expect(computeMultiplaneVars(0.9, false, true)).toEqual(poster);
  });
});

describe("mountain trail geometry", () => {
  const samples = [
    { x: 60, length: 0 },
    { x: 400, length: 350 },
    { x: 900, length: 860 },
    // A switchback: the trail comes back left before climbing again.
    { x: 700, length: 1080 },
    { x: 1300, length: 1700 },
  ];

  it("starts at the trailhead when it is inside the frame", () => {
    expect(computeTrailEntry(samples, 0)).toBe(0);
    expect(computeTrailEntry(samples, 60)).toBe(0);
  });

  it("starts where the trail first enters a narrower frame", () => {
    expect(computeTrailEntry(samples, 380)).toBe(350);
    expect(computeTrailEntry(samples, 650)).toBe(860);
  });

  it("falls back to the trailhead when the trail never enters the frame", () => {
    expect(computeTrailEntry(samples, 5000)).toBe(0);
    expect(computeTrailEntry([], 100)).toBe(0);
  });

  it("faces the direction of travel and leans only partly with the slope", () => {
    const climbingRight = computeRunnerPlacement({ x: 10, y: 20, dx: 4, dy: -4 });
    const climbingLeft = computeRunnerPlacement({ x: 10, y: 20, dx: -4, dy: -4 });
    const flat = computeRunnerPlacement({ x: 10, y: 20, dx: 4, dy: 0 });

    expect(climbingRight.facing).toBe(1);
    expect(climbingLeft.facing).toBe(-1);
    expect(climbingRight.rotate).toBeLessThan(0);
    expect(climbingRight.rotate).toBeGreaterThan(-45);
    // Mirrored figure, mirrored lean: both stay tilted into their own slope.
    expect(climbingLeft.rotate).toBeCloseTo(-climbingRight.rotate, 5);
    expect(flat.rotate).toBeCloseTo(0, 5);
    expect(flat).toMatchObject({ x: 10, y: 20 });
  });

  it("caps the lean on very steep sections", () => {
    const wall = computeRunnerPlacement({ x: 0, y: 0, dx: 0.1, dy: -9 });

    expect(Math.abs(wall.rotate)).toBeLessThanOrEqual(14);
  });
});
