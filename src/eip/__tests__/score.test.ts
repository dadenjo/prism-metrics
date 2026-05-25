import { describe, it, expect } from "vitest";
import { analyzeEip } from "../score.js";
import { EIP_METHODOLOGY } from "../methodology.js";

import mdIn from "./__fixtures__/message-driven.input.json";
import mdOut from "./__fixtures__/message-driven.expected.json";
import emptyIn from "./__fixtures__/empty.input.json";
import emptyOut from "./__fixtures__/empty.expected.json";
import mixedIn from "./__fixtures__/mixed.input.json";
import mixedOut from "./__fixtures__/mixed.expected.json";

describe("analyzeEip", () => {
  it("matches message-driven fixture", () => {
    expect(analyzeEip(mdIn)).toEqual(mdOut);
  });
  it("returns unclassified for empty input", () => {
    expect(analyzeEip(emptyIn)).toEqual(emptyOut);
  });
  it("classifies as mixed when both message-driven and request-reply present", () => {
    expect(analyzeEip(mixedIn)).toEqual(mixedOut);
  });
});

describe("EIP_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(EIP_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
