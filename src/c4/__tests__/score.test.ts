import { describe, it, expect } from "vitest";
import { analyzeC4 } from "../score.js";
import { C4_METHODOLOGY } from "../methodology.js";

import fullIn from "./__fixtures__/full.input.json";
import fullOut from "./__fixtures__/full.expected.json";
import ctxIn from "./__fixtures__/context-only.input.json";
import ctxOut from "./__fixtures__/context-only.expected.json";
import emptyIn from "./__fixtures__/empty.input.json";
import emptyOut from "./__fixtures__/empty.expected.json";

describe("analyzeC4", () => {
  it("matches full fixture", () => {
    expect(analyzeC4(fullIn)).toEqual(fullOut);
  });
  it("matches context-only fixture", () => {
    expect(analyzeC4(ctxIn)).toEqual(ctxOut);
  });
  it("matches empty fixture", () => {
    expect(analyzeC4(emptyIn)).toEqual(emptyOut);
  });
  it("never marks code level as covered", () => {
    expect(analyzeC4({ systemCount: 99, containerCount: 99, componentCount: 99 }).hasCode).toBe(false);
  });
});

describe("C4_METHODOLOGY", () => {
  it("declares coverage scope", () => {
    expect(C4_METHODOLOGY.coverage).toMatch(/3 of the 4/);
  });
});
