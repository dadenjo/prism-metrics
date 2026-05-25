import { describe, it, expect } from "vitest";
import { analyzeSolid } from "../score.js";
import { SOLID_METHODOLOGY } from "../methodology.js";

import healthyInput from "./__fixtures__/healthy.input.json";
import healthyExpected from "./__fixtures__/healthy.expected.json";
import strugglingInput from "./__fixtures__/struggling.input.json";
import strugglingExpected from "./__fixtures__/struggling.expected.json";
import emptyInput from "./__fixtures__/empty.input.json";
import emptyExpected from "./__fixtures__/empty.expected.json";

describe("analyzeSolid", () => {
  it("matches the healthy fixture", () => {
    expect(analyzeSolid(healthyInput)).toEqual(healthyExpected);
  });
  it("matches the struggling fixture", () => {
    expect(analyzeSolid(strugglingInput)).toEqual(strugglingExpected);
  });
  it("matches the empty fixture", () => {
    expect(analyzeSolid(emptyInput)).toEqual(emptyExpected);
  });
  it("is deterministic", () => {
    const a = analyzeSolid(healthyInput);
    const b = analyzeSolid(healthyInput);
    expect(a).toEqual(b);
  });
});

describe("SOLID_METHODOLOGY", () => {
  it("declares all five principles in its formula text or signals", () => {
    expect(SOLID_METHODOLOGY.referenceUrl).toMatch(/^https:/);
    expect(SOLID_METHODOLOGY.signals.length).toBeGreaterThan(0);
    expect(SOLID_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
