import { describe, it, expect } from "vitest";
import { analyzeAutoDetect } from "../score.js";
import { AUTO_DETECT_METHODOLOGY } from "../methodology.js";

import nextIn from "./__fixtures__/nextjs-app.input.json";
import nextOut from "./__fixtures__/nextjs-app.expected.json";
import expressIn from "./__fixtures__/express-api.input.json";
import expressOut from "./__fixtures__/express-api.expected.json";
import emptyIn from "./__fixtures__/empty.input.json";
import emptyOut from "./__fixtures__/empty.expected.json";

describe("analyzeAutoDetect", () => {
  it("matches nextjs-app fixture", () => {
    expect(analyzeAutoDetect(nextIn)).toEqual(nextOut);
  });
  it("matches express-api fixture", () => {
    expect(analyzeAutoDetect(expressIn)).toEqual(expressOut);
  });
  it("returns no detections for empty input", () => {
    expect(analyzeAutoDetect(emptyIn)).toEqual(emptyOut);
  });
  it("sorts detections by confidence desc", () => {
    const r = analyzeAutoDetect(nextIn);
    for (let i = 1; i < r.detected.length; i++) {
      expect(r.detected[i - 1]!.confidence).toBeGreaterThanOrEqual(r.detected[i]!.confidence);
    }
  });
});

describe("AUTO_DETECT_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(AUTO_DETECT_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
