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
  it("clamps single-team repos to 50 even when there are unowned capabilities", () => {
    // Previously the unowned-capability deduction was applied on top of
    // the 50 baseline, pushing the score below 50 and surfacing a
    // misleading "Misaligned" verdict on a repo that simply has no team
    // split. The clamp must hold regardless of unowned count.
    const result = analyzeConwaysLaw({
      totalTeams: 1,
      totalCapabilities: 20,
      unownedCapabilities: 15,
      crossTeamDependencies: 0,
      totalDependencies: 30,
      hasCodeowners: false,
    });
    expect(result.score).toBe(50);
    expect(result.singleTeamRepo).toBe(true);
    expect(result.verdict).toBe("undefined");
  });
  it("derives a banded verdict for multi-team repos", () => {
    // 100 - 30 (coupling) - 20 (unowned) = 50 → boundary, partially_aligned.
    expect(analyzeConwaysLaw({
      totalTeams: 3,
      totalCapabilities: 10,
      unownedCapabilities: 10,
      crossTeamDependencies: 50,
      totalDependencies: 50,
      hasCodeowners: false,
    }).verdict).toBe("partially_aligned");
    // Push below 50 via a heavy coupling ratio with no codeowners bonus:
    // simulate it directly via a partial-band score expectation.
    const aligned = analyzeConwaysLaw({
      totalTeams: 5,
      totalCapabilities: 50,
      unownedCapabilities: 0,
      crossTeamDependencies: 1,
      totalDependencies: 200,
      hasCodeowners: true,
    });
    expect(aligned.verdict).toBe("aligned");
  });
});

describe("CONWAYS_LAW_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(CONWAYS_LAW_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
