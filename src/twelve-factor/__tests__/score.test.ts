import { describe, it, expect } from "vitest";
import { analyzeTwelveFactor } from "../score.js";
import { TWELVE_FACTOR_METHODOLOGY } from "../methodology.js";
import { PLATFORM_OWNED_FACTORS } from "../types.js";

import passIn from "./__fixtures__/all-pass.input.json";
import passOut from "./__fixtures__/all-pass.expected.json";
import unkIn from "./__fixtures__/all-unknown.input.json";
import unkOut from "./__fixtures__/all-unknown.expected.json";
import mixedIn from "./__fixtures__/mixed.input.json";
import mixedOut from "./__fixtures__/mixed.expected.json";
import serverlessIn from "./__fixtures__/serverless.input.json";
import serverlessOut from "./__fixtures__/serverless.expected.json";
import partialUnknownIn from "./__fixtures__/partial-unknown.input.json";
import partialUnknownOut from "./__fixtures__/partial-unknown.expected.json";

describe("analyzeTwelveFactor", () => {
  it("maxes at 100 when all pass", () => {
    expect(analyzeTwelveFactor(passIn)).toEqual(passOut);
  });
  it("all-unknown → noData=true, score=0, grade=N/A (tf-2 fix)", () => {
    expect(analyzeTwelveFactor(unkIn)).toEqual(unkOut);
  });
  it("matches mixed fixture (unknown drops out of denominator)", () => {
    expect(analyzeTwelveFactor(mixedIn)).toEqual(mixedOut);
  });
  it("serverless deployment: 5 factors n/a → score from remaining 7 (tf-1 fix)", () => {
    expect(analyzeTwelveFactor(serverlessIn)).toEqual(serverlessOut);
  });
  it("3 unknowns out of 12 → confidence 0.75, full score from measured", () => {
    expect(analyzeTwelveFactor(partialUnknownIn)).toEqual(partialUnknownOut);
  });
});

describe("PLATFORM_OWNED_FACTORS", () => {
  it("serverless owns port_binding + processes + concurrency + disposability + admin_processes", () => {
    expect(PLATFORM_OWNED_FACTORS.serverless).toContain("port_binding");
    expect(PLATFORM_OWNED_FACTORS.serverless).toContain("processes");
    expect(PLATFORM_OWNED_FACTORS.serverless).toContain("concurrency");
    expect(PLATFORM_OWNED_FACTORS.serverless).toContain("disposability");
    expect(PLATFORM_OWNED_FACTORS.serverless).toContain("admin_processes");
  });
  it("edge inherits the serverless platform-owned set", () => {
    expect(PLATFORM_OWNED_FACTORS.edge).toEqual(PLATFORM_OWNED_FACTORS.serverless);
  });
  it("vm owns nothing (app owns everything)", () => {
    expect(PLATFORM_OWNED_FACTORS.vm).toEqual([]);
  });
  it("paas owns port_binding + processes", () => {
    expect(PLATFORM_OWNED_FACTORS.paas).toEqual(["port_binding", "processes"]);
  });
});

describe("TWELVE_FACTOR_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(TWELVE_FACTOR_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
