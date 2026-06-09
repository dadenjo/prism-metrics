import { describe, it, expect } from "vitest";
import { analyzeCleanArch } from "../score.js";
import { CLEAN_ARCH_METHODOLOGY } from "../methodology.js";
import { isInsufficient } from "../../core/insufficient.js";
import type { CleanArchScoreResult } from "../types.js";

import cleanIn from "./__fixtures__/clean.input.json";
import cleanOut from "./__fixtures__/clean.expected.json";
import mixedIn from "./__fixtures__/mixed.input.json";
import mixedOut from "./__fixtures__/mixed.expected.json";
import unkIn from "./__fixtures__/unknown-heavy.input.json";
import unkOut from "./__fixtures__/unknown-heavy.expected.json";

function assertScored(r: ReturnType<typeof analyzeCleanArch>): CleanArchScoreResult {
  if (isInsufficient(r)) {
    throw new Error(`expected a scored result, got InsufficientSignalResult: ${r.reason}`);
  }
  return r;
}

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
  it("floors at 0 even when all three severity buckets cap out together", () => {
    // Caps are 45/32/24 ⇒ total max bucket deduction 101 ⇒ clamps to 0.
    const result = assertScored(analyzeCleanArch({
      totalCapabilities: 50,
      unknownCapabilities: 0,
      adjacentViolations: 50,
      mediumViolations: 50,
      criticalViolations: 50,
    }));
    expect(result.score).toBe(0);
  });
});

describe("ca-1 — severity-bucket caps", () => {
  it("caps critical bucket at 45 off — 7 criticals are NOT instant F", () => {
    const result = assertScored(analyzeCleanArch({
      totalCapabilities: 20,
      unknownCapabilities: 0,
      adjacentViolations: 0,
      mediumViolations: 0,
      criticalViolations: 7,
    }));
    expect(result.score).toBe(55);
    expect(result.grade).toBe("D");
  });
  it("caps critical bucket at 45 off — 100 criticals stays at 55, not -1400", () => {
    const result = assertScored(analyzeCleanArch({
      totalCapabilities: 20,
      unknownCapabilities: 0,
      adjacentViolations: 0,
      mediumViolations: 0,
      criticalViolations: 100,
    }));
    expect(result.score).toBe(55);
  });
  it("caps medium bucket at 32 off", () => {
    const result = assertScored(analyzeCleanArch({
      totalCapabilities: 20, unknownCapabilities: 0,
      adjacentViolations: 0, mediumViolations: 100, criticalViolations: 0,
    }));
    expect(result.score).toBe(68);
  });
  it("caps adjacent bucket at 24 off", () => {
    const result = assertScored(analyzeCleanArch({
      totalCapabilities: 20, unknownCapabilities: 0,
      adjacentViolations: 100, mediumViolations: 0, criticalViolations: 0,
    }));
    expect(result.score).toBe(76);
  });
  it("does not change scoring when no bucket exceeds its cap (parity with old behavior)", () => {
    // 1 crit (15) + 2 med (16) + 3 adj (12) = 43 off ⇒ 57 — exactly the
    // old mixed-fixture result.
    const result = assertScored(analyzeCleanArch({
      totalCapabilities: 30, unknownCapabilities: 0,
      adjacentViolations: 3, mediumViolations: 2, criticalViolations: 1,
    }));
    expect(result.score).toBe(57);
  });
});

describe("ca-2 — empty registry returns InsufficientSignalResult", () => {
  it("returns InsufficientSignalResult (not A+) for an empty registry", () => {
    const result = analyzeCleanArch({
      totalCapabilities: 0,
      unknownCapabilities: 0,
      adjacentViolations: 0,
      mediumViolations: 0,
      criticalViolations: 0,
    });
    expect(isInsufficient(result)).toBe(true);
    if (isInsufficient(result)) {
      expect(result.reason).toBe("no_input");
      expect(result.detail).toMatch(/empty.*registry/i);
    }
  });
  it("does not return InsufficientSignalResult when totalCapabilities > 0 even with all-zero violations", () => {
    const result = analyzeCleanArch({
      totalCapabilities: 5, unknownCapabilities: 0,
      adjacentViolations: 0, mediumViolations: 0, criticalViolations: 0,
    });
    expect(isInsufficient(result)).toBe(false);
  });
});

describe("ca-3 — excludedPaths audit field", () => {
  it("round-trips excludedPaths without affecting the score", () => {
    const a = analyzeCleanArch({
      totalCapabilities: 30, unknownCapabilities: 4,
      adjacentViolations: 3, mediumViolations: 2, criticalViolations: 1,
    });
    const b = analyzeCleanArch({
      totalCapabilities: 30, unknownCapabilities: 4,
      adjacentViolations: 3, mediumViolations: 2, criticalViolations: 1,
      excludedPaths: ["node_modules/", "__tests__/"],
    });
    expect(a).toEqual(b);
  });
});

describe("CLEAN_ARCH_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(CLEAN_ARCH_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
  it("documents the per-bucket caps", () => {
    expect(CLEAN_ARCH_METHODOLOGY.formula.description).toMatch(/cap/i);
    expect(CLEAN_ARCH_METHODOLOGY.formula.snippet).toMatch(/min\(45/);
  });
  it("discloses the caller-side scanner-exclusions contract", () => {
    expect(CLEAN_ARCH_METHODOLOGY.signals.join("\n")).toMatch(/scanner-exclusions/);
  });
});
