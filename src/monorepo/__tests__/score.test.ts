import { describe, it, expect } from "vitest";
import { analyzeMonorepo } from "../score.js";
import { MONOREPO_METHODOLOGY } from "../methodology.js";

import healthyIn from "./__fixtures__/healthy-turborepo.input.json";
import healthyOut from "./__fixtures__/healthy-turborepo.expected.json";
import tangledIn from "./__fixtures__/tangled-bazel.input.json";
import tangledOut from "./__fixtures__/tangled-bazel.expected.json";
import emptyIn from "./__fixtures__/empty.input.json";
import emptyOut from "./__fixtures__/empty.expected.json";
import goIn from "./__fixtures__/go-workspaces.input.json";
import goOut from "./__fixtures__/go-workspaces.expected.json";
import unkIn from "./__fixtures__/unknown.input.json";
import unkOut from "./__fixtures__/unknown.expected.json";

describe("analyzeMonorepo", () => {
  it("matches healthy turborepo fixture", () => {
    expect(analyzeMonorepo(healthyIn)).toEqual(healthyOut);
  });
  it("matches tangled bazel fixture", () => {
    expect(analyzeMonorepo(tangledIn)).toEqual(tangledOut);
  });
  it("mono-1: empty caps + 'none' → noData=true, averageHealth=null", () => {
    expect(analyzeMonorepo(emptyIn)).toEqual(emptyOut);
  });
  it("mono-2: go-workspaces is now a first-class build system", () => {
    expect(analyzeMonorepo(goIn)).toEqual(goOut);
  });
  it("mono-1/2: 'unknown' build system → noData=true even with capabilities", () => {
    expect(analyzeMonorepo(unkIn)).toEqual(unkOut);
  });
});

describe("MONOREPO_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(MONOREPO_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
