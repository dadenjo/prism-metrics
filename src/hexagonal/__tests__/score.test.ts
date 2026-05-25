import { describe, it, expect } from "vitest";
import { analyzeHexagonal } from "../score.js";
import { HEXAGONAL_METHODOLOGY } from "../methodology.js";

import cleanIn from "./__fixtures__/clean.input.json";
import cleanOut from "./__fixtures__/clean.expected.json";
import noPortsIn from "./__fixtures__/no-ports.input.json";
import noPortsOut from "./__fixtures__/no-ports.expected.json";
import emptyIn from "./__fixtures__/empty.input.json";
import emptyOut from "./__fixtures__/empty.expected.json";

describe("analyzeHexagonal", () => {
  it("matches clean fixture", () => {
    expect(analyzeHexagonal(cleanIn)).toEqual(cleanOut);
  });
  it("matches no-ports fixture", () => {
    expect(analyzeHexagonal(noPortsIn)).toEqual(noPortsOut);
  });
  it("returns 100 for empty registry", () => {
    expect(analyzeHexagonal(emptyIn)).toEqual(emptyOut);
  });
  it("flags missingCore when non-empty registry has no core", () => {
    const r = analyzeHexagonal({ coreCount: 0, portCount: 2, adapterCount: 2, dependencyViolations: 0 });
    expect(r.missingCore).toBe(true);
  });
});

describe("HEXAGONAL_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(HEXAGONAL_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
