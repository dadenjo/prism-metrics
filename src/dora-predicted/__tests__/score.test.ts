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

describe("DORA_PREDICTED_METHODOLOGY", () => {
  it("calls out predicted-not-measured", () => {
    expect(DORA_PREDICTED_METHODOLOGY.honestGap).toMatch(/predict/i);
  });
});
