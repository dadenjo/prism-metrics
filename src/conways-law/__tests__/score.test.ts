import { describe, it, expect } from "vitest";
import { analyzeConwaysLaw } from "../score.js";
import { CONWAYS_LAW_METHODOLOGY } from "../methodology.js";

import alignedIn from "./__fixtures__/aligned.input.json";
import alignedOut from "./__fixtures__/aligned.expected.json";
import coupledIn from "./__fixtures__/coupled.input.json";
import coupledOut from "./__fixtures__/coupled.expected.json";
import soloIn from "./__fixtures__/solo.input.json";
import soloOut from "./__fixtures__/solo.expected.json";

describe("analyzeConwaysLaw", () => {
  it("matches aligned fixture", () => {
    expect(analyzeConwaysLaw(alignedIn)).toEqual(alignedOut);
  });
  it("matches coupled fixture", () => {
    expect(analyzeConwaysLaw(coupledIn)).toEqual(coupledOut);
  });
  it("dampens single-team repos to baseline 50", () => {
    expect(analyzeConwaysLaw(soloIn)).toEqual(soloOut);
  });
});

describe("CONWAYS_LAW_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(CONWAYS_LAW_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
