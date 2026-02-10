import { describe, expect, it } from "vitest";
import {
  computeRocketProgress,
  computeRocketVars,
} from "../../src/shared/components/parallax/useRocketCamera";

describe("rocket camera math", () => {
  it("normalizes and clamps progress from scroll range", () => {
    expect(computeRocketProgress(80, 140, 900)).toBe(0);
    expect(computeRocketProgress(590, 140, 900)).toBeCloseTo(0.5, 5);
    expect(computeRocketProgress(1200, 140, 900)).toBe(1);
  });

  it("applies space/planet/asteroid speed multipliers", () => {
    const vars = computeRocketVars(0.5, false);

    expect(vars.spaceShift).toBeCloseTo(-18, 3);
    expect(vars.planetShift).toBeCloseTo(-54, 3);
    expect(vars.asteroidShift).toBeCloseTo(-147.6, 3);
    expect(vars.clearance).toBe(false);
  });

  it("drives rocket trajectory and clearance near end", () => {
    const mid = computeRocketVars(0.45, false);
    const end = computeRocketVars(0.86, false);

    expect(mid.rocketX).toBeLessThan(end.rocketX);
    expect(mid.rocketY).toBeGreaterThan(end.rocketY);
    expect(end.clearance).toBe(true);
    expect(computeRocketVars(0.79, false).clearance).toBe(false);
  });

  it("uses reduced travel on mobile fallback", () => {
    const desktop = computeRocketVars(0.5, false);
    const mobile = computeRocketVars(0.5, true);

    expect(Math.abs(mobile.spaceShift)).toBeLessThan(Math.abs(desktop.spaceShift));
    expect(Math.abs(mobile.planetShift)).toBeLessThan(Math.abs(desktop.planetShift));
    expect(Math.abs(mobile.asteroidShift)).toBeLessThan(Math.abs(desktop.asteroidShift));
  });
});
