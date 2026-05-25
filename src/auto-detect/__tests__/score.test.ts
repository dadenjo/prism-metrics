import { describe, it, expect } from "vitest";
import { analyzeAutoDetect, detectFrameworks } from "../score.js";
import { AUTO_DETECT_METHODOLOGY } from "../methodology.js";

import nextIn from "./__fixtures__/nextjs-app.input.json";
import nextOut from "./__fixtures__/nextjs-app.expected.json";
import expressIn from "./__fixtures__/express-api.input.json";
import expressOut from "./__fixtures__/express-api.expected.json";
import emptyIn from "./__fixtures__/empty.input.json";
import emptyOut from "./__fixtures__/empty.expected.json";

describe("detectFrameworks", () => {
  it("matches nextjs-app fixture", () => {
    expect(detectFrameworks(nextIn)).toEqual(nextOut);
  });
  it("matches express-api fixture (hexagonal + kafka + jest)", () => {
    expect(detectFrameworks(expressIn)).toEqual(expressOut);
  });
  it("returns unknown architecture for empty input", () => {
    expect(detectFrameworks(emptyIn)).toEqual(emptyOut);
    expect(emptyOut.architectureStyle.primary).toBe("unknown");
  });
  it("sorts detections by confidence desc", () => {
    const r = detectFrameworks(nextIn);
    for (let i = 1; i < r.detected.length; i++) {
      expect(r.detected[i - 1]!.confidence).toBeGreaterThanOrEqual(
        r.detected[i]!.confidence,
      );
    }
  });
  it("classifies clean architecture when ≥2 layer dirs present", () => {
    const r = detectFrameworks({
      dependencies: {},
      topLevelDirs: ["domain", "application", "infrastructure"],
    });
    expect(r.architectureStyle.primary).toBe("clean");
    expect(
      r.detected.find((d) => d.id === "clean_architecture")?.confidence,
    ).toBe(0.85);
  });
  it("classifies DDD when bounded-contexts dir present", () => {
    const r = detectFrameworks({
      dependencies: {},
      topLevelDirs: ["bounded-contexts"],
    });
    expect(r.architectureStyle.primary).toBe("ddd");
  });
  it("classifies microservices when docker-compose + services dir present", () => {
    const r = detectFrameworks({
      dependencies: {},
      topLevelDirs: ["services"],
      topLevelFiles: ["docker-compose.yml"],
    });
    expect(r.architectureStyle.primary).toBe("microservices");
  });
  it("classifies event-driven when kafka or bull present", () => {
    const r = detectFrameworks({
      dependencies: { bullmq: "5.0.0" },
      topLevelDirs: [],
    });
    expect(r.architectureStyle.primary).toBe("event_driven");
  });
});

describe("analyzeAutoDetect alias", () => {
  it("is the same function as detectFrameworks", () => {
    expect(analyzeAutoDetect).toBe(detectFrameworks);
  });
});

describe("AUTO_DETECT_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(AUTO_DETECT_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
