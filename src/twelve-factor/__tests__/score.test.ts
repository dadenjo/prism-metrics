import { describe, it, expect } from "vitest";
import { analyzeTwelveFactor } from "../score.js";
import { TWELVE_FACTOR_METHODOLOGY } from "../methodology.js";

import passIn from "./__fixtures__/all-pass.input.json";
import passOut from "./__fixtures__/all-pass.expected.json";
import unkIn from "./__fixtures__/all-unknown.input.json";
import unkOut from "./__fixtures__/all-unknown.expected.json";
import mixedIn from "./__fixtures__/mixed.input.json";
import mixedOut from "./__fixtures__/mixed.expected.json";

describe("analyzeTwelveFactor", () => {
  it("maxes at 100 when all pass", () => {
    expect(analyzeTwelveFactor(passIn)).toEqual(passOut);
  });
  it("scores all-unknown at ~25", () => {
    expect(analyzeTwelveFactor(unkIn)).toEqual(unkOut);
  });
  it("matches mixed fixture", () => {
    expect(analyzeTwelveFactor(mixedIn)).toEqual(mixedOut);
  });
});

describe("TWELVE_FACTOR_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(TWELVE_FACTOR_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
