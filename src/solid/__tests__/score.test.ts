import { describe, it, expect } from "vitest";
import { analyzeSolid } from "../score.js";
import { SOLID_METHODOLOGY } from "../methodology.js";
import type { PrincipleResult, SolidSignals } from "../types.js";

import healthyInput from "./__fixtures__/healthy.input.json";
import healthyExpected from "./__fixtures__/healthy.expected.json";
import strugglingInput from "./__fixtures__/struggling.input.json";
import strugglingExpected from "./__fixtures__/struggling.expected.json";
import emptyInput from "./__fixtures__/empty.input.json";

function stripRecommendations(result: ReturnType<typeof analyzeSolid>) {
  return {
    overallScore: result.overallScore,
    grade: result.grade,
    principles: result.principles.map((p) => ({
      principle: p.principle,
      name: p.name,
      strength: p.strength,
      score: p.score,
      confidence: p.confidence,
    })),
  };
}

describe("analyzeSolid", () => {
  it("matches the healthy fixture (scores + grades)", () => {
    expect(stripRecommendations(analyzeSolid(healthyInput))).toEqual(healthyExpected);
  });
  it("matches the struggling fixture (scores + grades)", () => {
    expect(stripRecommendations(analyzeSolid(strugglingInput))).toEqual(strugglingExpected);
  });
  it("returns a structured N/A result when nothing was scanned", () => {
    const result = analyzeSolid(emptyInput);
    expect(result.noData).toBe(true);
    expect(result.grade).toBe("N/A");
    expect(result.overallScore).toBe(0);
    // Every principle is surfaced but with zero confidence.
    expect(result.principles).toHaveLength(5);
    for (const p of result.principles) {
      expect(p.confidence).toBe(0);
      expect(p.score).toBe(0);
    }
  });
  it("is deterministic", () => {
    const a = analyzeSolid(healthyInput);
    const b = analyzeSolid(healthyInput);
    expect(a).toEqual(b);
  });
  it("emits a recommendation string for every principle", () => {
    const result = analyzeSolid(healthyInput);
    for (const p of result.principles) {
      expect(typeof p.recommendation).toBe("string");
      expect(p.recommendation.length).toBeGreaterThan(0);
    }
  });
  it("does not bake a literal '0' count into any recommendation", () => {
    // A pile of inputs that historically tripped the "Replace 0 large
    // switch/if chains" / "Decompose 0 oversized files" templates.
    const cases: SolidSignals[] = [
      healthyInput as SolidSignals,
      {
        analyzedFiles: 50,
        largeFiles: 0,
        heavyExportFiles: 0,
        largeSwitchFiles: 0,
        cascadingIfFiles: 0,
        strategyPatternFiles: 2,
        inheritanceFiles: 0,
        narrowingStubFiles: 0,
        totalInterfaces: 5,
        fatInterfaces: 0,
        hasDiContainer: false,
        abstractionPatternFiles: 0,
        directInfraImportFiles: 0,
      },
    ];
    const bannedPhrases = /\b0 (large|cascading|fat|direct|narrowing|oversized|heavy-export) /i;
    for (const sig of cases) {
      const result = analyzeSolid(sig);
      for (const p of result.principles) {
        expect(p.recommendation).not.toMatch(bannedPhrases);
      }
    }
  });
  it("scores DIP as strong when there are zero direct infra imports, even without a DI container", () => {
    const sig: SolidSignals = {
      analyzedFiles: 50,
      largeFiles: 0,
      heavyExportFiles: 0,
      largeSwitchFiles: 0,
      cascadingIfFiles: 0,
      strategyPatternFiles: 2,
      inheritanceFiles: 0,
      narrowingStubFiles: 0,
      totalInterfaces: 5,
      fatInterfaces: 0,
      hasDiContainer: false,
      abstractionPatternFiles: 0,
      directInfraImportFiles: 0,
    };
    const result = analyzeSolid(sig);
    const dip = result.principles.find((p: PrincipleResult) => p.principle === "D");
    expect(dip).toBeDefined();
    expect(dip!.strength).toBe("strong");
    expect(dip!.score).toBe(90);
  });
});

describe("SOLID_METHODOLOGY", () => {
  it("declares all five principles in its formula text or signals", () => {
    expect(SOLID_METHODOLOGY.referenceUrl).toMatch(/^https:/);
    expect(SOLID_METHODOLOGY.signals.length).toBeGreaterThan(0);
    expect(SOLID_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
