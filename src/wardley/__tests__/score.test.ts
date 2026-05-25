import { describe, it, expect } from "vitest";
import { analyzeWardley } from "../score.js";
import { WARDLEY_METHODOLOGY } from "../methodology.js";

import fourIn from "./__fixtures__/four-stages.input.json";
import fourOut from "./__fixtures__/four-stages.expected.json";
import emptyIn from "./__fixtures__/empty.input.json";
import emptyOut from "./__fixtures__/empty.expected.json";

describe("analyzeWardley", () => {
  it("matches four-stages fixture", () => {
    expect(analyzeWardley(fourIn)).toEqual(fourOut);
  });
  it("matches empty fixture", () => {
    expect(analyzeWardley(emptyIn)).toEqual(emptyOut);
  });
  it("plots the same id at the same x every time", () => {
    const a = analyzeWardley(fourIn);
    const b = analyzeWardley(fourIn);
    expect(a.components.map((c) => c.x)).toEqual(b.components.map((c) => c.x));
  });
});

describe("WARDLEY_METHODOLOGY", () => {
  it("calls out determinism in the formula", () => {
    expect(WARDLEY_METHODOLOGY.formula.description).toMatch(/deterministic/i);
  });
});
