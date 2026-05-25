import { describe, it, expect } from "vitest";
import { analyzeIso25010 } from "../score.js";
import { ISO_25010_METHODOLOGY } from "../methodology.js";

import healthyIn from "./__fixtures__/healthy.input.json";
import healthyOut from "./__fixtures__/healthy.expected.json";
import strugglingIn from "./__fixtures__/struggling.input.json";
import strugglingOut from "./__fixtures__/struggling.expected.json";
import emptyIn from "./__fixtures__/empty.input.json";
import emptyOut from "./__fixtures__/empty.expected.json";

describe("analyzeIso25010", () => {
  it("matches healthy fixture", () => {
    expect(analyzeIso25010(healthyIn)).toEqual(healthyOut);
  });
  it("matches struggling fixture", () => {
    expect(analyzeIso25010(strugglingIn)).toEqual(strugglingOut);
  });
  it("matches empty fixture", () => {
    expect(analyzeIso25010(emptyIn)).toEqual(emptyOut);
  });
  it("always reports exactly six characteristics", () => {
    expect(analyzeIso25010(healthyIn).characteristics.length).toBe(6);
  });
});

describe("ISO_25010_METHODOLOGY", () => {
  it("declares 6-of-8 coverage", () => {
    expect(ISO_25010_METHODOLOGY.coverage).toMatch(/6 of/);
  });
});
