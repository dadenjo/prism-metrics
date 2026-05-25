import { describe, it, expect } from "vitest";
import { analyzeMonorepo } from "../score.js";
import { MONOREPO_METHODOLOGY } from "../methodology.js";

import healthyIn from "./__fixtures__/healthy-turborepo.input.json";
import healthyOut from "./__fixtures__/healthy-turborepo.expected.json";
import tangledIn from "./__fixtures__/tangled-bazel.input.json";
import tangledOut from "./__fixtures__/tangled-bazel.expected.json";
import emptyIn from "./__fixtures__/empty.input.json";
import emptyOut from "./__fixtures__/empty.expected.json";

describe("analyzeMonorepo", () => {
  it("matches healthy turborepo fixture", () => {
    expect(analyzeMonorepo(healthyIn)).toEqual(healthyOut);
  });
  it("matches tangled bazel fixture", () => {
    expect(analyzeMonorepo(tangledIn)).toEqual(tangledOut);
  });
  it("handles empty capabilities", () => {
    expect(analyzeMonorepo(emptyIn)).toEqual(emptyOut);
  });
});

describe("MONOREPO_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(MONOREPO_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
