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

describe("DORA_PREDICTED_METHODOLOGY", () => {
  it("calls out predicted-not-measured", () => {
    expect(DORA_PREDICTED_METHODOLOGY.honestGap).toMatch(/predict/i);
  });
});
