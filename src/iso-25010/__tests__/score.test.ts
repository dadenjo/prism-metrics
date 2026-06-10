import { describe, it, expect } from "vitest";
import { analyzeIso25010 } from "../score.js";
import { ISO_25010_METHODOLOGY } from "../methodology.js";
import type { Iso25010Signals } from "../types.js";

import healthyIn from "./__fixtures__/healthy.input.json";
import healthyOut from "./__fixtures__/healthy.expected.json";
import strugglingIn from "./__fixtures__/struggling.input.json";
import strugglingOut from "./__fixtures__/struggling.expected.json";
import emptyIn from "./__fixtures__/empty.input.json";
import emptyOut from "./__fixtures__/empty.expected.json";

function expectOk(r: ReturnType<typeof analyzeIso25010>) {
  if (r.ok !== true) throw new Error(`expected ok:true result, got ${JSON.stringify(r)}`);
  return r;
}

describe("analyzeIso25010", () => {
  it("matches healthy fixture", () => {
    expect(analyzeIso25010(healthyIn)).toEqual(healthyOut);
  });
  it("matches struggling fixture", () => {
    expect(analyzeIso25010(strugglingIn)).toEqual(strugglingOut);
  });
  it("matches empty fixture (insufficient-signal sentinel)", () => {
    expect(analyzeIso25010(emptyIn)).toEqual(emptyOut);
  });
  it("always reports exactly six characteristics", () => {
    const r = expectOk(analyzeIso25010(healthyIn));
    expect(r.characteristics.length).toBe(6);
  });
});

describe("iso-1 — insufficient-signal sentinel", () => {
  const allZero: Iso25010Signals = {
    coherenceScore: 0,
    driftRatio: 0,
    averageTestCoverage: 0,
    averageChurn: 0,
    totalFiles: 0,
    fileDensity: 0,
    hardcodedSecretHits: 0,
    hardcodedConfigHits: 0,
    hasDockerfile: false,
    hasK8sManifests: false,
    hasEnvExample: false,
    orphanCapabilities: 0,
  };

  it("returns { ok:false, reason:'no_input' } for all-zero signals", () => {
    const r = analyzeIso25010(allZero);
    expect(r.ok).toBe(false);
    if (r.ok === false) {
      expect(r.reason).toBe("no_input");
      expect(typeof r.detail).toBe("string");
      expect(r.detail.length).toBeGreaterThan(0);
    }
  });

  it("returns a normal report when even one signal is non-zero (totalFiles=1)", () => {
    const r = analyzeIso25010({ ...allZero, totalFiles: 1 });
    expect(r.ok).toBe(true);
    if (r.ok === true) {
      expect(r.characteristics.length).toBe(6);
      expect(typeof r.overallScore).toBe("number");
      expect(typeof r.grade).toBe("string");
    }
  });

  it("returns a normal report when only an infra marker is present", () => {
    const r = analyzeIso25010({ ...allZero, hasDockerfile: true });
    expect(r.ok).toBe(true);
  });

  it("echoes excludedPaths on the insufficient-signal sentinel for audit", () => {
    const r = analyzeIso25010({ ...allZero, excludedPaths: ["node_modules/", "dist/"] });
    expect(r.ok).toBe(false);
    if (r.ok === false) {
      expect(r.excludedPaths).toEqual(["node_modules/", "dist/"]);
    }
  });
});

describe("iso-2 — security curve is log2, not linear", () => {
  const base: Iso25010Signals = {
    coherenceScore: 0,
    driftRatio: 0,
    averageTestCoverage: 0,
    averageChurn: 0,
    totalFiles: 100,
    fileDensity: 5,
    hardcodedSecretHits: 0,
    hardcodedConfigHits: 0,
    hasDockerfile: false,
    hasK8sManifests: false,
    hasEnvExample: false,
    orphanCapabilities: 0,
  };

  function securityScore(hits: number): number {
    const r = analyzeIso25010({ ...base, hardcodedSecretHits: hits });
    if (r.ok !== true) throw new Error("expected ok result");
    const s = r.characteristics.find((c) => c.id === "security");
    if (!s) throw new Error("missing security characteristic");
    return s.score;
  }

  it("1 hit → 85 - 15 = 70", () => {
    // 15 * log2(2) = 15
    expect(securityScore(1)).toBeCloseTo(70, 0);
  });

  it("4 hits → 85 - 30 = ~55 (no F cliff)", () => {
    // 15 * log2(5) ≈ 34.83 → score ≈ 50
    expect(securityScore(4)).toBeCloseTo(50, 0);
  });

  it("10 hits → 85 - ~52 = ~33", () => {
    // 15 * log2(11) ≈ 51.89 → score ≈ 33
    expect(securityScore(10)).toBeCloseTo(33, 0);
  });

  it("60 hits → penalty capped at 60, score = 25", () => {
    // 15 * log2(61) ≈ 88.95, capped at 60 → score = 25
    expect(securityScore(60)).toBe(25);
  });

  it("0 hits → no penalty (score = 85)", () => {
    expect(securityScore(0)).toBe(85);
  });
});

describe("iso-3 — performance density curve is continuous (no step cliff at 10/20)", () => {
  // Pre-fix the formula used 50/70/85 step buckets that swung 20 points
  // across density 10.0 vs 10.1 and 20.0 vs 20.1. The continuous curve
  // clamp(95 - 2*max(0, density-5), 50, 95) should be monotonic with
  // small deltas near the old cliffs.
  const baseSig: any = {
    coherenceScore: 70, driftRatio: 0.1, averageTestCoverage: 60,
    hardcodedSecretHits: 0, hardcodedConfigHits: 0, averageChurn: 0,
    orphanCapabilities: 0, totalFiles: 100,
    hasDockerfile: false, hasK8sManifests: false, hasEnvExample: false,
  };
  function perfOf(fileDensity: number): number {
    const r = analyzeIso25010({ ...baseSig, fileDensity });
    if (!r.ok) throw new Error("expected ok");
    const perf = r.characteristics.find((c) => c.id === "performance_efficiency");
    return perf!.score;
  }
  it("density 19.9 vs 20.1 differ by < 2 points (no cliff)", () => {
    const diff = Math.abs(perfOf(20.1) - perfOf(19.9));
    expect(diff).toBeLessThan(2);
  });
  it("density 9.9 vs 10.1 differ by < 2 points (no cliff)", () => {
    const diff = Math.abs(perfOf(10.1) - perfOf(9.9));
    expect(diff).toBeLessThan(2);
  });
  it("density 30 hits the floor at 50", () => {
    // formula: clamp(95 - 2*(30-5), 50, 95) = clamp(45, 50, 95) = 50
    expect(perfOf(30)).toBe(50);
  });
  it("density 5 (no penalty) tops at 95", () => {
    expect(perfOf(5)).toBe(95);
  });
});

describe("iso-4 — churn penalty capped at 20 (not 50)", () => {
  const baseSig: any = {
    coherenceScore: 70, driftRatio: 0.1, averageTestCoverage: 60,
    hardcodedSecretHits: 0, hardcodedConfigHits: 0,
    orphanCapabilities: 0, totalFiles: 100, fileDensity: 5,
    hasDockerfile: false, hasK8sManifests: false, hasEnvExample: false,
  };
  function perfOf(averageChurn: number): number {
    const r = analyzeIso25010({ ...baseSig, averageChurn });
    if (!r.ok) throw new Error("expected ok");
    return r.characteristics.find((c) => c.id === "performance_efficiency")!.score;
  }
  it("churn=25 vs churn=100 produces the same perf score (cap binding)", () => {
    expect(perfOf(25)).toBe(perfOf(100));
  });
  it("perf score with high churn stays >= densityScore - 20", () => {
    // densityScore at fileDensity=5 is 95. Cap is 20. Floor is 75.
    expect(perfOf(100)).toBeGreaterThanOrEqual(75);
  });
});

describe("iso-2 — excludedPaths round-trip", () => {
  it("echoes excludedPaths on a normal report", () => {
    const r = analyzeIso25010({
      coherenceScore: 70,
      driftRatio: 0.1,
      averageTestCoverage: 60,
      averageChurn: 4,
      totalFiles: 50,
      fileDensity: 5,
      hardcodedSecretHits: 0,
      hardcodedConfigHits: 0,
      hasDockerfile: true,
      hasK8sManifests: false,
      hasEnvExample: true,
      orphanCapabilities: 0,
      excludedPaths: ["vendor/", ".cache/"],
    });
    expect(r.ok).toBe(true);
    if (r.ok === true) {
      expect(r.excludedPaths).toEqual(["vendor/", ".cache/"]);
    }
  });

  it("omits excludedPaths when input has none", () => {
    const r = analyzeIso25010({
      coherenceScore: 70,
      driftRatio: 0.1,
      averageTestCoverage: 60,
      averageChurn: 4,
      totalFiles: 50,
      fileDensity: 5,
      hardcodedSecretHits: 0,
      hardcodedConfigHits: 0,
      hasDockerfile: true,
      hasK8sManifests: false,
      hasEnvExample: true,
      orphanCapabilities: 0,
    });
    expect(r.ok).toBe(true);
    if (r.ok === true) {
      expect("excludedPaths" in r).toBe(false);
    }
  });
});

// ── iso-5 (branch coverage) — hasAnySignal accepts EACH signal independently ──
// Pre-pass-2 branch coverage was 67% because most signal-presence branches in
// hasAnySignal were exercised only via the healthy + struggling fixtures
// (which set every signal simultaneously). This block toggles each individual
// signal and asserts the function escapes the "no_input" sentinel.
describe("iso-5 — hasAnySignal accepts each individual signal", () => {
  const ZERO: Iso25010Signals = {
    coherenceScore: 0, driftRatio: 0, averageTestCoverage: 0,
    hardcodedSecretHits: 0, hardcodedConfigHits: 0, averageChurn: 0,
    fileDensity: 0, totalFiles: 0, totalCapabilities: 0, orphanCapabilities: 0,
    hasDockerfile: false, hasK8sManifests: false, hasEnvExample: false,
  };
  function escapesSentinel(s: Iso25010Signals): boolean {
    const r = analyzeIso25010(s);
    return r.ok === true;
  }
  it("totalFiles > 0 alone escapes the sentinel", () => {
    expect(escapesSentinel({ ...ZERO, totalFiles: 1 })).toBe(true);
  });
  it("totalCapabilities > 0 alone escapes the sentinel", () => {
    expect(escapesSentinel({ ...ZERO, totalCapabilities: 1 })).toBe(true);
  });
  it("hardcodedSecretHits > 0 alone escapes the sentinel", () => {
    expect(escapesSentinel({ ...ZERO, hardcodedSecretHits: 1 })).toBe(true);
  });
  it("hardcodedConfigHits > 0 alone escapes the sentinel", () => {
    expect(escapesSentinel({ ...ZERO, hardcodedConfigHits: 1 })).toBe(true);
  });
  it("coherenceScore > 0 alone escapes the sentinel", () => {
    expect(escapesSentinel({ ...ZERO, coherenceScore: 1 })).toBe(true);
  });
  it("previousCoherenceScore !== undefined alone escapes the sentinel (even = 0)", () => {
    expect(escapesSentinel({ ...ZERO, previousCoherenceScore: 0 })).toBe(true);
  });
  it("driftRatio > 0 alone escapes the sentinel", () => {
    expect(escapesSentinel({ ...ZERO, driftRatio: 0.01 })).toBe(true);
  });
  it("averageTestCoverage > 0 alone escapes the sentinel", () => {
    expect(escapesSentinel({ ...ZERO, averageTestCoverage: 1 })).toBe(true);
  });
  it("averageChurn > 0 alone escapes the sentinel", () => {
    expect(escapesSentinel({ ...ZERO, averageChurn: 1 })).toBe(true);
  });
  it("fileDensity > 0 alone escapes the sentinel", () => {
    expect(escapesSentinel({ ...ZERO, fileDensity: 0.1 })).toBe(true);
  });
  it("orphanCapabilities > 0 alone escapes the sentinel", () => {
    expect(escapesSentinel({ ...ZERO, orphanCapabilities: 1 })).toBe(true);
  });
  it("hasDockerfile=true alone escapes the sentinel", () => {
    expect(escapesSentinel({ ...ZERO, hasDockerfile: true })).toBe(true);
  });
  it("hasK8sManifests=true alone escapes the sentinel", () => {
    expect(escapesSentinel({ ...ZERO, hasK8sManifests: true })).toBe(true);
  });
  it("hasEnvExample=true alone escapes the sentinel", () => {
    expect(escapesSentinel({ ...ZERO, hasEnvExample: true })).toBe(true);
  });
});

// ── iso-6 (branch coverage) — reliability trend bonus 3-way ──
// The trend bonus has three branches: trend > 0 → +5, trend < -5 → -10,
// otherwise 0. Pre-pass-2, only the "no previousCoherenceScore" path was
// exercised in fixtures.
describe("iso-6 — reliability trend bonus has 3 branches", () => {
  const BASE: Iso25010Signals = {
    coherenceScore: 70, driftRatio: 0.1, averageTestCoverage: 50,
    hardcodedSecretHits: 0, hardcodedConfigHits: 0, averageChurn: 0,
    fileDensity: 5, totalFiles: 100, orphanCapabilities: 0,
    hasDockerfile: false, hasK8sManifests: false, hasEnvExample: false,
  };
  function relOf(s: Iso25010Signals): number {
    const r = expectOk(analyzeIso25010(s));
    return r.characteristics.find((c) => c.id === "reliability")!.score;
  }
  it("trend > 0 produces a +5 bonus over the no-trend baseline", () => {
    const baseline = relOf(BASE);
    const up = relOf({ ...BASE, previousCoherenceScore: 60 });  // trend=+10
    expect(up - baseline).toBe(5);
  });
  it("trend < -5 produces a -10 penalty over the no-trend baseline", () => {
    const baseline = relOf(BASE);
    const down = relOf({ ...BASE, previousCoherenceScore: 80 });  // trend=-10
    expect(down - baseline).toBe(-10);
  });
  it("trend exactly 0 (previous=current) produces no bonus", () => {
    const baseline = relOf(BASE);
    const flat = relOf({ ...BASE, previousCoherenceScore: 70 });  // trend=0
    expect(flat).toBe(baseline);
  });
  it("trend in (-5, 0] produces no bonus (boundary)", () => {
    const baseline = relOf(BASE);
    const small = relOf({ ...BASE, previousCoherenceScore: 73 });  // trend=-3
    expect(small).toBe(baseline);
  });
  it("trend exactly -5 produces no bonus (strict less-than)", () => {
    const baseline = relOf(BASE);
    const edge = relOf({ ...BASE, previousCoherenceScore: 75 });  // trend=-5
    expect(edge).toBe(baseline);
  });
});

// ── iso-7 (branch coverage) — portability 8-way matrix ──
// portability = max(10, sumOfThreeOptionalBonuses). Pre-pass-2, fixtures
// covered "all 3 true" and "none true" but not the 6 intermediate combos.
describe("iso-7 — portability flag matrix (8 combinations)", () => {
  const BASE: Iso25010Signals = {
    coherenceScore: 1, driftRatio: 0, averageTestCoverage: 0,
    hardcodedSecretHits: 0, hardcodedConfigHits: 0, averageChurn: 0,
    fileDensity: 0, totalFiles: 1, orphanCapabilities: 0,
    hasDockerfile: false, hasK8sManifests: false, hasEnvExample: false,
  };
  function portOf(s: Iso25010Signals): number {
    const r = expectOk(analyzeIso25010(s));
    return r.characteristics.find((c) => c.id === "portability")!.score;
  }
  it("none → floor at 10", () => {
    expect(portOf(BASE)).toBe(10);
  });
  it("Dockerfile only → 35", () => {
    expect(portOf({ ...BASE, hasDockerfile: true })).toBe(35);
  });
  it("K8s only → 30", () => {
    expect(portOf({ ...BASE, hasK8sManifests: true })).toBe(30);
  });
  it(".env.example only → 25", () => {
    expect(portOf({ ...BASE, hasEnvExample: true })).toBe(25);
  });
  it("Dockerfile + K8s → 65", () => {
    expect(portOf({ ...BASE, hasDockerfile: true, hasK8sManifests: true })).toBe(65);
  });
  it("Dockerfile + .env.example → 60", () => {
    expect(portOf({ ...BASE, hasDockerfile: true, hasEnvExample: true })).toBe(60);
  });
  it("K8s + .env.example → 55", () => {
    expect(portOf({ ...BASE, hasK8sManifests: true, hasEnvExample: true })).toBe(55);
  });
  it("all three → 90", () => {
    expect(portOf({ ...BASE, hasDockerfile: true, hasK8sManifests: true, hasEnvExample: true })).toBe(90);
  });
});

describe("ISO_25010_METHODOLOGY", () => {
  it("declares 6-of-8 coverage", () => {
    expect(ISO_25010_METHODOLOGY.coverage).toMatch(/6 of/);
  });
});
