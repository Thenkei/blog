import { describe, expect, it } from "vitest";
import {
  computeCameraProgress,
  computeMultiplaneVars,
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

  it("draws one complete foreground-to-pass route and carries the runner to its end", () => {
    const start = computeMultiplaneVars(0, false);
    const middle = computeMultiplaneVars(0.5, false);
    const end = computeMultiplaneVars(1, false);

    expect(start.routeProgress).toBeGreaterThan(0);
    expect(middle.routeProgress).toBeGreaterThan(start.routeProgress);
    expect(end.routeProgress).toBe(1);
    expect(end.runnerProgress).toBe(1);
    expect(end.runnerX).toBeCloseTo(88, 3);
    expect(end.runnerY).toBeCloseTo(30, 3);
    expect(end.runnerX).toBeGreaterThan(middle.runnerX);
    expect(end.runnerY).toBeLessThan(middle.runnerY);
    expect(end.handoff).toBe(1);
  });

  it("keeps the former clearance boundary continuous and reversible", () => {
    const before = computeMultiplaneVars(0.779, false);
    const after = computeMultiplaneVars(0.781, false);

    expect(Math.abs(after.foregroundOpacity - before.foregroundOpacity)).toBeLessThan(0.01);
    expect(Math.abs(after.titleOpacity - before.titleOpacity)).toBeLessThan(0.01);
    expect(after.routeProgress).toBeGreaterThanOrEqual(before.routeProgress);
  });

  it("reduces travel and runner scale for compact layouts", () => {
    const desktop = computeMultiplaneVars(0.5, false);
    const compact = computeMultiplaneVars(0.5, true);

    expect(Math.abs(compact.skyShift)).toBeLessThan(Math.abs(desktop.skyShift));
    expect(Math.abs(compact.farShift)).toBeLessThan(Math.abs(desktop.farShift));
    expect(Math.abs(compact.nearShift)).toBeLessThan(Math.abs(desktop.nearShift));
    expect(compact.runnerScale).toBeLessThan(desktop.runnerScale);
  });

  it("returns a complete, readable reduced-motion poster state", () => {
    const poster = computeMultiplaneVars(0, false, true);

    expect(poster.routeProgress).toBe(1);
    expect(poster.runnerOpacity).toBe(1);
    expect(poster.titleOpacity).toBe(1);
    expect(poster.titleShift).toBe(0);
    expect(poster.foregroundOpacity).toBe(1);
    expect(poster.handoff).toBe(0);
  });
});
