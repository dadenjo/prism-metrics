import { describe, it, expect } from "vitest";
import { analyzeEip, detectEipPatterns, EIP_PATTERN_DEFS } from "../score.js";
import { EIP_METHODOLOGY } from "../methodology.js";

import mdIn from "./__fixtures__/message-driven.input.json";
import mdOut from "./__fixtures__/message-driven.expected.json";
import emptyIn from "./__fixtures__/empty.input.json";
import emptyOut from "./__fixtures__/empty.expected.json";
import sagaIn from "./__fixtures__/saga-driven.input.json";
import sagaOut from "./__fixtures__/saga-driven.expected.json";

describe("analyzeEip", () => {
  it("matches message-driven fixture", () => {
    expect(analyzeEip(mdIn)).toEqual(mdOut);
  });
  it("returns point_to_point on empty input", () => {
    expect(analyzeEip(emptyIn)).toEqual(emptyOut);
  });
  it("classifies saga + messaging as event_driven_saga", () => {
    expect(analyzeEip(sagaIn)).toEqual(sagaOut);
  });
});

describe("detectEipPatterns", () => {
  it("returns 18 entries for the full pattern catalog", () => {
    expect(detectEipPatterns([]).length).toBe(EIP_PATTERN_DEFS.length);
    expect(EIP_PATTERN_DEFS.length).toBe(18);
  });
});

describe("EIP_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(EIP_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
