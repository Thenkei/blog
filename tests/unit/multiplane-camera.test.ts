import { describe, expect, it } from "vitest";
import {
  computeCameraProgress,
  computeMultiplaneVars,
} from "../../src/shared/components/parallax/useMultiplaneCamera";

describe("multiplane camera math", () => {
  it("normalizes and clamps progress from scroll range", () => {
    expect(computeCameraProgress(100, 200, 1000)).toBe(0);
    expect(computeCameraProgress(700, 200, 1000)).toBeCloseTo(0.5, 5);
    expect(computeCameraProgress(1300, 200, 1000)).toBe(1);
  });

  it("applies sky/far/near speed multipliers", () => {
    const vars = computeMultiplaneVars(0.5, false);

    expect(vars.skyShift).toBeCloseTo(-16, 3);
    expect(vars.farShift).toBeCloseTo(-48, 3);
    expect(vars.nearShift).toBeCloseTo(-128, 3);
    expect(vars.nearScale).toBeGreaterThan(1);
  });

  it("switches to clearance stage near end of camera run", () => {
    expect(computeMultiplaneVars(0.77, false).clearance).toBe(false);
    expect(computeMultiplaneVars(0.78, false).clearance).toBe(true);
    expect(computeMultiplaneVars(1, false).clearance).toBe(true);
  });

  it("reduces travel on mobile fallback", () => {
    const desktop = computeMultiplaneVars(0.5, false);
    const mobile = computeMultiplaneVars(0.5, true);

    expect(Math.abs(mobile.skyShift)).toBeLessThan(Math.abs(desktop.skyShift));
    expect(Math.abs(mobile.farShift)).toBeLessThan(Math.abs(desktop.farShift));
    expect(Math.abs(mobile.nearShift)).toBeLessThan(Math.abs(desktop.nearShift));
  });
});
