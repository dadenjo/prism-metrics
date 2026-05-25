import { describe, it, expect } from "vitest";
import { analyzeEda } from "../score.js";
import { EDA_METHODOLOGY } from "../methodology.js";

import strongIn from "./__fixtures__/strong-eda.input.json";
import strongOut from "./__fixtures__/strong-eda.expected.json";
import noneIn from "./__fixtures__/none.input.json";
import noneOut from "./__fixtures__/none.expected.json";
import pubIn from "./__fixtures__/publisher-only.input.json";
import pubOut from "./__fixtures__/publisher-only.expected.json";

describe("analyzeEda", () => {
  it("matches strong-eda fixture", () => {
    expect(analyzeEda(strongIn)).toEqual(strongOut);
  });
  it("matches none fixture", () => {
    expect(analyzeEda(noneIn)).toEqual(noneOut);
  });
  it("does not claim EDA without a consumer", () => {
    expect(analyzeEda(pubIn)).toEqual(pubOut);
  });
});

describe("EDA_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(EDA_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
