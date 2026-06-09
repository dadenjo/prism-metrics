import { describe, it, expect } from "vitest";
import { analyzeHexagonal } from "../score.js";
import { HEXAGONAL_METHODOLOGY } from "../methodology.js";
import { isInsufficient } from "../../core/insufficient.js";
import type { HexagonalScoreResult } from "../types.js";

import cleanIn from "./__fixtures__/clean.input.json";
import cleanOut from "./__fixtures__/clean.expected.json";
import noPortsIn from "./__fixtures__/no-ports.input.json";
import noPortsOut from "./__fixtures__/no-ports.expected.json";
import emptyIn from "./__fixtures__/empty.input.json";

function assertScored(r: ReturnType<typeof analyzeHexagonal>): HexagonalScoreResult {
  if (isInsufficient(r)) {
    throw new Error(`expected a scored result, got InsufficientSignalResult: ${r.reason}`);
  }
  return r;
}

describe("analyzeHexagonal", () => {
  it("matches clean fixture", () => {
    expect(analyzeHexagonal(cleanIn)).toEqual(cleanOut);
  });
  it("matches no-ports fixture", () => {
    expect(analyzeHexagonal(noPortsIn)).toEqual(noPortsOut);
  });
});

describe("hex-1 — empty / missingCore return InsufficientSignalResult", () => {
  it("returns InsufficientSignalResult on an empty registry (not 100 A+)", () => {
    const result = analyzeHexagonal(emptyIn);
    expect(isInsufficient(result)).toBe(true);
    if (isInsufficient(result)) {
      expect(result.reason).toBe("no_input");
      expect(result.detail).toMatch(/empty.*hexagonal/i);
    }
  });
  it("returns InsufficientSignalResult when registry has no core (was: 100 A+ with missingCore=true)", () => {
    const result = analyzeHexagonal({
      coreCount: 0, portCount: 2, adapterCount: 2, dependencyViolations: 0,
    });
    expect(isInsufficient(result)).toBe(true);
    if (isInsufficient(result)) {
      expect(result.reason).toBe("no_input");
      expect(result.detail).toMatch(/no core|missing/i);
    }
  });
  it("returns InsufficientSignalResult when core is missing even with violations reported", () => {
    const result = analyzeHexagonal({
      coreCount: 0, portCount: 5, adapterCount: 5, dependencyViolations: 3,
    });
    expect(isInsufficient(result)).toBe(true);
  });
  it("scores normally when core is present", () => {
    const result = analyzeHexagonal({
      coreCount: 1, portCount: 2, adapterCount: 2, dependencyViolations: 0,
    });
    expect(isInsufficient(result)).toBe(false);
    if (!isInsufficient(result)) {
      expect(result.missingCore).toBe(false);
    }
  });
});

describe("hex-2 — per-violation cap", () => {
  it("8 violations → 4 off the cap, NOT instant 0", () => {
    // 8 * 12 = 96, but capped at 60 ⇒ score 40 (was 100-96=4 then clamp).
    const result = assertScored(analyzeHexagonal({
      coreCount: 1, portCount: 2, adapterCount: 2, dependencyViolations: 8,
    }));
    expect(result.score).toBe(40);
  });
  it("9 violations does NOT drop below 8 (cap is sticky)", () => {
    const v9 = assertScored(analyzeHexagonal({
      coreCount: 1, portCount: 2, adapterCount: 2, dependencyViolations: 9,
    }));
    const v8 = assertScored(analyzeHexagonal({
      coreCount: 1, portCount: 2, adapterCount: 2, dependencyViolations: 8,
    }));
    expect(v9.score).toBe(v8.score);
  });
  it("10 violations still scores 40 (cap held)", () => {
    const result = assertScored(analyzeHexagonal({
      coreCount: 1, portCount: 2, adapterCount: 2, dependencyViolations: 10,
    }));
    expect(result.score).toBe(40);
  });
  it("at 5 violations the cap is not yet biting (60 == 12*5)", () => {
    // 5 * 12 = 60 = cap. Score: 100 - 60 = 40. From 6+ identical.
    const v5 = assertScored(analyzeHexagonal({
      coreCount: 1, portCount: 2, adapterCount: 2, dependencyViolations: 5,
    }));
    expect(v5.score).toBe(40);
  });
  it("at 4 violations the cap is still inert (48 < 60)", () => {
    const v4 = assertScored(analyzeHexagonal({
      coreCount: 1, portCount: 2, adapterCount: 2, dependencyViolations: 4,
    }));
    expect(v4.score).toBe(52);
  });
  it("adaptersWithoutPorts deduction stacks on top of the cap", () => {
    const result = assertScored(analyzeHexagonal({
      coreCount: 1, portCount: 0, adapterCount: 3, dependencyViolations: 100,
    }));
    // cap 60 + adaptersWithoutPorts 20 = 80 off ⇒ 20.
    expect(result.score).toBe(20);
    expect(result.adaptersWithoutPorts).toBe(true);
  });
});

describe("hex-3 — excludedPaths audit field", () => {
  it("round-trips excludedPaths without affecting the score", () => {
    const a = analyzeHexagonal({
      coreCount: 1, portCount: 2, adapterCount: 2, dependencyViolations: 3,
    });
    const b = analyzeHexagonal({
      coreCount: 1, portCount: 2, adapterCount: 2, dependencyViolations: 3,
      excludedPaths: ["node_modules/", "__tests__/"],
    });
    expect(a).toEqual(b);
  });
});

describe("HEXAGONAL_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(HEXAGONAL_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
  it("documents the per-violation cap", () => {
    expect(HEXAGONAL_METHODOLOGY.formula.description).toMatch(/cap/i);
    expect(HEXAGONAL_METHODOLOGY.formula.snippet).toMatch(/min\(60/);
  });
  it("documents the missingCore ⇒ InsufficientSignalResult coupling", () => {
    expect(HEXAGONAL_METHODOLOGY.formula.description).toMatch(/missingCore/);
  });
  it("discloses the scanner-exclusions contract", () => {
    expect(HEXAGONAL_METHODOLOGY.signals.join("\n")).toMatch(/scanner-exclusions/);
  });
});
