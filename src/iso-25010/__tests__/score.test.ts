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

describe("ISO_25010_METHODOLOGY", () => {
  it("declares 6-of-8 coverage", () => {
    expect(ISO_25010_METHODOLOGY.coverage).toMatch(/6 of/);
  });
});
