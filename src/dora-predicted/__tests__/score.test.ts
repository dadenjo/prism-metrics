import { describe, it, expect } from "vitest";
import { analyzeDoraPredicted } from "../score.js";
import { DORA_PREDICTED_METHODOLOGY } from "../methodology.js";

import eliteIn from "./__fixtures__/elite.input.json";
import eliteOut from "./__fixtures__/elite.expected.json";
import mediumIn from "./__fixtures__/medium.input.json";
import mediumOut from "./__fixtures__/medium.expected.json";
import critIn from "./__fixtures__/critical-drift.input.json";
import critOut from "./__fixtures__/critical-drift.expected.json";
import emptyIn from "./__fixtures__/empty.input.json";
import emptyOut from "./__fixtures__/empty.expected.json";

describe("analyzeDoraPredicted", () => {
  it("matches elite fixture", () => {
    expect(analyzeDoraPredicted(eliteIn)).toEqual(eliteOut);
  });
  it("matches medium fixture", () => {
    expect(analyzeDoraPredicted(mediumIn)).toEqual(mediumOut);
  });
  it("drops change-failure-rate to low on any critical drift", () => {
    expect(analyzeDoraPredicted(critIn)).toEqual(critOut);
  });
  it("dora-1: all-zero signals → insufficient (not elite by coincidence)", () => {
    expect(analyzeDoraPredicted(emptyIn)).toEqual(emptyOut);
  });
  it("dora-1: totalCapabilities === 0 → insufficient even with some non-zero signals", () => {
    const r = analyzeDoraPredicted({
      coherenceScore: 75,
      importCycles: 1,
      driftCount: 2,
      criticalDrifted: false,
      averageCognitiveLoad: 35,
      highCogLoadCapabilities: 1,
      totalCapabilities: 0,
    });
    expect(r.insufficient).toBe(true);
    expect(r.overallLevel).toBe("insufficient");
    expect(r.predictionConfidence).toBe(0);
  });
  it("dora-3: predictionConfidence is 0.6 for normal predictions", () => {
    const r = analyzeDoraPredicted(mediumIn);
    expect(r.predictionConfidence).toBe(0.6);
  });
  it("dora-3: result fields are named predicted* (prediction nature un-strippable)", () => {
    const r = analyzeDoraPredicted(eliteIn);
    expect(r).toHaveProperty("predictedDeploymentFrequency");
    expect(r).toHaveProperty("predictedLeadTimeForChanges");
    expect(r).toHaveProperty("predictedChangeFailureRate");
    expect(r).toHaveProperty("predictedMeanTimeToRestore");
  });
});

describe("dora-5: cliff boundary tests", () => {
  // Coherence 80 boundary in deploymentFrequency: >80 + cycles=0 → elite
  // Coherence ≥60 + cycles≤2 → high; exactly 80 → high (not elite)
  it("coherenceScore exactly 80 (boundary) → high, not elite", () => {
    const r = analyzeDoraPredicted({
      coherenceScore: 80, importCycles: 0, driftCount: 0,
      criticalDrifted: false, averageCognitiveLoad: 20,
      highCogLoadCapabilities: 0,
    });
    expect(r.predictedDeploymentFrequency).toBe("high");
  });
  it("coherenceScore 81 (just over) → elite", () => {
    const r = analyzeDoraPredicted({
      coherenceScore: 81, importCycles: 0, driftCount: 0,
      criticalDrifted: false, averageCognitiveLoad: 20,
      highCogLoadCapabilities: 0,
    });
    expect(r.predictedDeploymentFrequency).toBe("elite");
  });
  it("cog 30 exactly + drift 0 → elite (cog<30 fails strict less-than)", () => {
    const r = analyzeDoraPredicted({
      coherenceScore: 50, importCycles: 0, driftCount: 0,
      criticalDrifted: false, averageCognitiveLoad: 30,
      highCogLoadCapabilities: 0,
    });
    // cog<30 means cog=30 is NOT elite → falls to high
    expect(r.predictedLeadTimeForChanges).toBe("high");
  });
  it("driftCount exactly 3 (boundary) → driftRiskLevel = 1 → high (≤1)", () => {
    const r = analyzeDoraPredicted({
      coherenceScore: 70, importCycles: 0, driftCount: 3,
      criticalDrifted: false, averageCognitiveLoad: 45,
      highCogLoadCapabilities: 0,
    });
    expect(r.predictedLeadTimeForChanges).toBe("high");
  });
});

// ── dora-7 (pass-2) — meanTimeToRestore criticalDrifted + high-drift+cog branches ──
// Pre-pass-2 the MTTR 'low' branch (criticalDrifted=true OR driftCount>8+cog>65)
// was only exercised via the critical-drift fixture which hit it via the
// criticalDrifted path. The 'driftCount > 8 && cog > 65' arm had no test.
describe("dora-7 — MTTR low-branch covers both predicates independently", () => {
  const BASE: DoraSignals = {
    coherenceScore: 80,
    importCycles: 0,
    driftCount: 0,
    criticalDrifted: false,
    averageCognitiveLoad: 30,
    highCogLoadCapabilities: 0,
    totalCapabilities: 10,
  };
  it("criticalDrifted=true with otherwise-mid-range signals forces MTTR to 'low'", () => {
    // criticalDrifted is checked AFTER the elite + high branches, so it
    // only forces 'low' when neither shortcut matches. With drift=5 + cog=60
    // the otherwise-medium repo drops to low under critical pressure.
    const r = analyzeDoraPredicted({
      ...BASE,
      driftCount: 5,
      averageCognitiveLoad: 60,
      criticalDrifted: true,
    });
    expect(r.predictedMeanTimeToRestore).toBe("low");
  });
  it("driftCount > 8 AND cog > 65 (no critical) forces MTTR to 'low'", () => {
    const r = analyzeDoraPredicted({
      ...BASE,
      driftCount: 9,
      averageCognitiveLoad: 66,
      criticalDrifted: false,
    });
    expect(r.predictedMeanTimeToRestore).toBe("low");
  });
  it("driftCount > 8 alone (low cog) does NOT trigger 'low' MTTR", () => {
    const r = analyzeDoraPredicted({
      ...BASE,
      driftCount: 9,
      averageCognitiveLoad: 50,  // not > 65
      criticalDrifted: false,
    });
    expect(r.predictedMeanTimeToRestore).not.toBe("low");
  });
  it("cog > 65 alone (low drift) does NOT trigger 'low' MTTR", () => {
    const r = analyzeDoraPredicted({
      ...BASE,
      driftCount: 5,  // not > 8
      averageCognitiveLoad: 70,
      criticalDrifted: false,
    });
    expect(r.predictedMeanTimeToRestore).not.toBe("low");
  });
  it("driftCount exactly 8 + cog 66 does NOT trigger (strict >, not >=)", () => {
    const r = analyzeDoraPredicted({
      ...BASE,
      driftCount: 8,
      averageCognitiveLoad: 66,
      criticalDrifted: false,
    });
    expect(r.predictedMeanTimeToRestore).not.toBe("low");
  });
});

describe("dora — meanTimeToRestore elite + high paths", () => {
  const BASE: DoraSignals = {
    coherenceScore: 80,
    importCycles: 0,
    driftCount: 0,
    criticalDrifted: false,
    averageCognitiveLoad: 30,
    highCogLoadCapabilities: 0,
    totalCapabilities: 10,
  };
  it("driftCount=0 + cog<40 → elite MTTR", () => {
    const r = analyzeDoraPredicted(BASE);
    expect(r.predictedMeanTimeToRestore).toBe("elite");
  });
  it("driftCount<=3 + cog<55 → high MTTR", () => {
    const r = analyzeDoraPredicted({ ...BASE, driftCount: 2, averageCognitiveLoad: 50 });
    expect(r.predictedMeanTimeToRestore).toBe("high");
  });
  it("mid-range (no extremes) → medium MTTR", () => {
    const r = analyzeDoraPredicted({ ...BASE, driftCount: 5, averageCognitiveLoad: 60 });
    expect(r.predictedMeanTimeToRestore).toBe("medium");
  });
});

describe("dora — changeFailureRate branch coverage (per dora-2/dora-7 area)", () => {
  const BASE: DoraSignals = {
    coherenceScore: 80,
    importCycles: 0,
    driftCount: 0,
    criticalDrifted: false,
    averageCognitiveLoad: 30,
    highCogLoadCapabilities: 0,
    totalCapabilities: 10,
  };
  it("criticalDrifted=true forces CFR to 'low'", () => {
    const r = analyzeDoraPredicted({ ...BASE, criticalDrifted: true });
    expect(r.predictedChangeFailureRate).toBe("low");
  });
  it("clean signals → CFR 'elite'", () => {
    const r = analyzeDoraPredicted(BASE);
    expect(r.predictedChangeFailureRate).toBe("elite");
  });
});

describe("DORA_PREDICTED_METHODOLOGY", () => {
  it("calls out predicted-not-measured", () => {
    expect(DORA_PREDICTED_METHODOLOGY.honestGap).toMatch(/predict/i);
  });
});
