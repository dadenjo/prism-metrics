import { describe, it, expect } from "vitest";
import { analyzeDoraPredicted } from "../score.js";
import { DORA_PREDICTED_METHODOLOGY } from "../methodology.js";

import eliteIn from "./__fixtures__/elite.input.json";
import eliteOut from "./__fixtures__/elite.expected.json";
import mediumIn from "./__fixtures__/medium.input.json";
import mediumOut from "./__fixtures__/medium.expected.json";
import critIn from "./__fixtures__/critical-drift.input.json";
import critOut from "./__fixtures__/critical-drift.expected.json";

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
});

describe("DORA_PREDICTED_METHODOLOGY", () => {
  it("calls out predicted-not-measured", () => {
    expect(DORA_PREDICTED_METHODOLOGY.honestGap).toMatch(/predict/i);
  });
});
