import { describe, expect, it } from "vitest";
import {
  computeRocketProgress,
  computeRocketVars,
} from "../../src/shared/components/parallax/useRocketCamera";

describe("rocket cinematic camera math", () => {
  it("normalizes and clamps progress from the available scrub range", () => {
    expect(computeRocketProgress(80, 140, 900)).toBe(0);
    expect(computeRocketProgress(590, 140, 900)).toBeCloseTo(0.5, 5);
    expect(computeRocketProgress(1200, 140, 900)).toBe(1);
  });

  it("keeps the background planes depth ordered", () => {
    const vars = computeRocketVars(0.5, false);

    expect(vars.spaceShift).toBeCloseTo(-13, 3);
    expect(vars.planetShift).toBeCloseTo(-32, 3);
    expect(vars.asteroidShift).toBeCloseTo(-79, 3);
    expect(Math.abs(vars.spaceShift)).toBeLessThan(Math.abs(vars.planetShift));
    expect(Math.abs(vars.planetShift)).toBeLessThan(Math.abs(vars.asteroidShift));
  });

  it("completes the full flight and leaves a visible arrival state", () => {
    const start = computeRocketVars(0, false);
    const middle = computeRocketVars(0.55, false);
    const end = computeRocketVars(1, false);

    expect(start.rocketX).toBeLessThan(5);
    expect(middle.rocketX).toBeGreaterThan(start.rocketX);
    expect(end.flightProgress).toBe(1);
    expect(end.flightReveal).toBe(1);
    expect(end.rocketX).toBeGreaterThan(110);
    expect(end.rocketY).toBeLessThan(0);
    expect(end.rocketOpacity).toBe(0);
    expect(end.arrival).toBe(1);
    expect(end.handoff).toBe(1);
  });

  it("keeps the former clearance boundary continuous", () => {
    const before = computeRocketVars(0.799, false);
    const after = computeRocketVars(0.801, false);

    expect(Math.abs(after.asteroidOpacity - before.asteroidOpacity)).toBeLessThan(0.02);
    expect(Math.abs(after.rocketOpacity - before.rocketOpacity)).toBeLessThan(0.02);
    expect(Math.abs(after.titleOpacity - before.titleOpacity)).toBeLessThan(0.02);
    expect(after.flightProgress).toBeGreaterThanOrEqual(before.flightProgress);
  });

  it("uses reduced travel and ship scale on compact layouts", () => {
    const desktop = computeRocketVars(0.5, false);
    const compact = computeRocketVars(0.5, true);

    expect(Math.abs(compact.spaceShift)).toBeLessThan(Math.abs(desktop.spaceShift));
    expect(Math.abs(compact.planetShift)).toBeLessThan(Math.abs(desktop.planetShift));
    expect(Math.abs(compact.asteroidShift)).toBeLessThan(Math.abs(desktop.asteroidShift));
    expect(compact.rocketScale).toBeLessThan(desktop.rocketScale);
  });

  it("returns a balanced reduced-motion poster state", () => {
    const poster = computeRocketVars(0, false, true);

    expect(poster.rocketOpacity).toBe(1);
    expect(poster.flightProgress).toBeCloseTo(0.42, 5);
    expect(poster.titleOpacity).toBe(1);
    expect(poster.titleShift).toBe(0);
    expect(poster.planetOpacity).toBe(1);
    expect(poster.handoff).toBe(0);
  });
});
