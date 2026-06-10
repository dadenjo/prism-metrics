import { describe, it, expect } from "vitest";
import { analyzeConwaysLaw } from "../score.js";
import { CONWAYS_LAW_METHODOLOGY } from "../methodology.js";
import { isInsufficient } from "../../core/insufficient.js";
import { scoreToGrade } from "../../core/methodology.js";

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
  it("returns InsufficientSignalResult for solo / single-team repos", () => {
    const r = analyzeConwaysLaw(soloIn);
    expect(r).toEqual(soloOut);
    expect(isInsufficient(r)).toBe(true);
    if (isInsufficient(r)) {
      expect(r.reason).toBe("single_team");
    }
  });
  it("returns insufficient for single-team repos regardless of unowned count", () => {
    // Previously the unowned-capability deduction was applied on top of
    // the 50 baseline, pushing the score below 50 and surfacing a
    // misleading "Misaligned" verdict on a repo that simply has no team
    // split. Now we refuse to grade at all.
    const result = analyzeConwaysLaw({
      totalTeams: 1,
      totalCapabilities: 20,
      unownedCapabilities: 15,
      crossTeamDependencies: 0,
      totalDependencies: 30,
      hasCodeowners: false,
    });
    expect(isInsufficient(result)).toBe(true);
    // And scoreToGrade refuses to letter-grade it.
    expect(() => scoreToGrade(result as never)).toThrow(/InsufficientSignalResult/);
  });
  it("returns insufficient for zero-team repos too (totalTeams=0)", () => {
    const r = analyzeConwaysLaw({
      totalTeams: 0,
      totalCapabilities: 0,
      unownedCapabilities: 0,
      crossTeamDependencies: 0,
      totalDependencies: 0,
      hasCodeowners: false,
    });
    expect(isInsufficient(r)).toBe(true);
  });
  it("derives a banded verdict for multi-team repos", () => {
    // 100 - 35 (coupling) - 30 (unowned) = 35 → misaligned band (>=25, <50)
    const worst = analyzeConwaysLaw({
      totalTeams: 3,
      totalCapabilities: 10,
      unownedCapabilities: 10,
      crossTeamDependencies: 50,
      totalDependencies: 50,
      hasCodeowners: false,
    });
    expect(isInsufficient(worst)).toBe(false);
    if (!isInsufficient(worst)) {
      expect(worst.score).toBe(35);
      expect(worst.verdict).toBe("misaligned");
      expect(worst.structuralProxy).toBe("misaligned");
      expect(worst.requiresHumanVerification).toBe(true);
    }
    const aligned = analyzeConwaysLaw({
      totalTeams: 5,
      totalCapabilities: 50,
      unownedCapabilities: 0,
      crossTeamDependencies: 1,
      totalDependencies: 200,
      hasCodeowners: true,
    });
    expect(isInsufficient(aligned)).toBe(false);
    if (!isInsufficient(aligned)) {
      expect(aligned.verdict).toBe("aligned");
    }
  });
  it("conway-3: 100% coupling + 100% unowned, no codeowners is solidly F-territory bordering misaligned", () => {
    // New caps (35 + 30) produce 100 - 35 - 30 = 35 (misaligned band).
    // The bug class wanted F-zone (<=44). 35 is well inside D/F floor
    // and below the old 50 cap that produced a misleading "D".
    const r = analyzeConwaysLaw({
      totalTeams: 4,
      totalCapabilities: 8,
      unownedCapabilities: 8,
      crossTeamDependencies: 40,
      totalDependencies: 40,
      hasCodeowners: false,
    });
    if (isInsufficient(r)) throw new Error("expected scored result");
    expect(r.score).toBe(35);
    // Old behavior would have produced 50 / D. New behavior produces F.
    expect(r.grade).toBe("F");
  });
  it("conway-4: totalDependencies=0 with multi-team is NOT a free A+", () => {
    // Zero dependencies + multiple teams gives no coupling evidence
    // either way. Previously this scored a clean A+ (100). We document
    // this is a known limitation of the proxy — the score does land at
    // 100 with no codeowners bonus, but `requiresHumanVerification: true`
    // forces the caller to disclose that no inter-team edges existed.
    const r = analyzeConwaysLaw({
      totalTeams: 5,
      totalCapabilities: 10,
      unownedCapabilities: 0,
      crossTeamDependencies: 0,
      totalDependencies: 0,
      hasCodeowners: false,
    });
    if (isInsufficient(r)) throw new Error("expected scored result");
    expect(r.score).toBe(100);
    expect(r.requiresHumanVerification).toBe(true);
    expect(r.couplingRatio).toBe(0);
  });
  it("conway-4: malformed input — negative ratios still clamp into [0,100]", () => {
    // Defensive: if a caller passes degenerate counts the score should
    // still land in [0,100] without throwing.
    const r = analyzeConwaysLaw({
      totalTeams: 3,
      totalCapabilities: 5,
      unownedCapabilities: 50, // > totalCapabilities — caller bug
      crossTeamDependencies: 100, // > totalDependencies — caller bug
      totalDependencies: 10,
      hasCodeowners: false,
    });
    if (isInsufficient(r)) throw new Error("expected scored result");
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});

// ── conway-5 (pass-2) — CODEOWNERS bonus arithmetic on worst-case ──
describe("conway-5 — CODEOWNERS bonus is additive after deduction caps", () => {
  it("worst-case (100% coupling + 100% unowned) without CODEOWNERS = 35 (F)", () => {
    const r = analyzeConwaysLaw({
      totalTeams: 5,
      totalCapabilities: 10,
      unownedCapabilities: 10,
      crossTeamDependencies: 100,
      totalDependencies: 100,
      hasCodeowners: false,
    });
    if (!("score" in r)) throw new Error("expected score result");
    expect(r.score).toBe(35);
    expect(r.grade).toBe("F");
  });
  it("worst-case + CODEOWNERS = 40 (still F, +5 bonus pinned)", () => {
    const r = analyzeConwaysLaw({
      totalTeams: 5,
      totalCapabilities: 10,
      unownedCapabilities: 10,
      crossTeamDependencies: 100,
      totalDependencies: 100,
      hasCodeowners: true,
    });
    if (!("score" in r)) throw new Error("expected score result");
    expect(r.score).toBe(40);
    expect(r.grade).toBe("F");  // 40 < 50 threshold
  });
});

// ── conway — branch coverage for partially_aligned + misaligned bands ──
describe("conway — verdict band coverage (aligned / partial / misaligned)", () => {
  it("partially_aligned verdict band (score in [50, 75))", () => {
    // coupling 50% (deduction 17.5) + 40% unowned (deduction 12) = 100 - 17.5 - 12 = 70.5 → 71 → partially_aligned
    const r = analyzeConwaysLaw({
      totalTeams: 3,
      totalCapabilities: 10,
      unownedCapabilities: 4,
      crossTeamDependencies: 50,
      totalDependencies: 100,
      hasCodeowners: false,
    });
    if (!("score" in r)) throw new Error("expected score result");
    expect(r.score).toBeGreaterThanOrEqual(50);
    expect(r.score).toBeLessThan(75);
    expect(r.verdict).toBe("partially_aligned");
  });
  it("misaligned verdict band (score in [25, 50))", () => {
    // coupling 90% (deduction 31.5) + 80% unowned (deduction 24) = 100 - 31.5 - 24 = 44.5 → 45 → misaligned
    const r = analyzeConwaysLaw({
      totalTeams: 5,
      totalCapabilities: 10,
      unownedCapabilities: 8,
      crossTeamDependencies: 90,
      totalDependencies: 100,
      hasCodeowners: false,
    });
    if (!("score" in r)) throw new Error("expected score result");
    expect(r.score).toBeGreaterThanOrEqual(25);
    expect(r.score).toBeLessThan(50);
    expect(r.verdict).toBe("misaligned");
  });
});

describe("CONWAYS_LAW_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(CONWAYS_LAW_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
  it("discloses that single-team repos return InsufficientSignalResult", () => {
    expect(CONWAYS_LAW_METHODOLOGY.formula.description).toMatch(/InsufficientSignalResult/);
  });
});
