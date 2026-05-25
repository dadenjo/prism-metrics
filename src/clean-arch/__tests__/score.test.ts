import { describe, it, expect } from "vitest";
import { analyzeCleanArch } from "../score.js";
import { CLEAN_ARCH_METHODOLOGY } from "../methodology.js";

import cleanIn from "./__fixtures__/clean.input.json";
import cleanOut from "./__fixtures__/clean.expected.json";
import mixedIn from "./__fixtures__/mixed.input.json";
import mixedOut from "./__fixtures__/mixed.expected.json";
import unkIn from "./__fixtures__/unknown-heavy.input.json";
import unkOut from "./__fixtures__/unknown-heavy.expected.json";

describe("analyzeCleanArch", () => {
  it("matches clean fixture", () => {
    expect(analyzeCleanArch(cleanIn)).toEqual(cleanOut);
  });
  it("matches mixed fixture", () => {
    expect(analyzeCleanArch(mixedIn)).toEqual(mixedOut);
  });
  it("matches unknown-heavy fixture and flips the insight", () => {
    expect(analyzeCleanArch(unkIn)).toEqual(unkOut);
  });
  it("floors at 0", () => {
    const result = analyzeCleanArch({
      totalCapabilities: 5,
      unknownCapabilities: 0,
      adjacentViolations: 0,
      mediumViolations: 0,
      criticalViolations: 50,
    });
    expect(result.score).toBe(0);
  });
});

describe("CLEAN_ARCH_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(CLEAN_ARCH_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
