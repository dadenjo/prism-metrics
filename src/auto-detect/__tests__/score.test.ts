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
      dependencies: {}, topLevelDirs: ["domain", "application", "infrastructure"],
    });
    expect(r.architectureStyle.primary).toBe("clean");
    expect(
      r.detected.find((d) => d.id === "clean_architecture")?.confidence,
    ).toBe(0.85);
  });
  it("classifies DDD when bounded-contexts dir present", () => {
    const r = detectFrameworks({
      dependencies: {}, topLevelDirs: ["bounded-contexts"],
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

describe("node:test detection (script-driven)", () => {
  it("detects node:test when scripts contain 'node --test'", () => {
    const r = detectFrameworks({
      dependencies: {},
      topLevelDirs: [],
      scripts: { test: "node --test" },
    });
    expect(r.detected.find((d) => d.id === "node-test")).toBeDefined();
    expect(r.detected.find((d) => d.id === "node-test")?.confidence).toBe(0.96);
  });
  it("detects node:test when scripts contain 'tsx --test foo.ts'", () => {
    const r = detectFrameworks({
      dependencies: {},
      topLevelDirs: [],
      scripts: { test: "tsx --test foo.ts" },
    });
    expect(r.detected.find((d) => d.id === "node-test")).toBeDefined();
  });
  it("does NOT falsely detect node:test when scripts use jest", () => {
    const r = detectFrameworks({
      dependencies: {},
      topLevelDirs: [],
      scripts: { test: "jest" },
    });
    expect(r.detected.find((d) => d.id === "node-test")).toBeUndefined();
  });
});

describe("analyzeAutoDetect alias", () => {
  it("is the same function as detectFrameworks", () => {
    expect(analyzeAutoDetect).toBe(detectFrameworks);
  });
});

// ── auto-1 (pass-2) — extractVersion strips compound range prefixes ──
describe("auto-1 — extractVersion strips ALL leading comparators", () => {
  it("strips '>=' from '>=15.0.0'", () => {
    const r = detectFrameworks({
      dependencies: { next: ">=15.0.0", react: "18.2.0", "react-dom": "18.2.0" }, topLevelDirs: [],
    });
    const next = r.detected.find((d) => d.id === "nextjs");
    expect(next?.version).toBe("15.0.0");
  });
  it("strips '~>' from '~>1.2.3'", () => {
    const r = detectFrameworks({
      dependencies: { react: "~>1.2.3" }, topLevelDirs: [],
    });
    const react = r.detected.find((d) => d.id === "react");
    expect(react?.version).toBe("1.2.3");
  });
  it("strips '^>=' compound prefix", () => {
    const r = detectFrameworks({
      dependencies: { react: "^>=18.0.0" }, topLevelDirs: [],
    });
    const react = r.detected.find((d) => d.id === "react");
    expect(react?.version).toBe("18.0.0");
  });
  it("leaves a bare version untouched", () => {
    const r = detectFrameworks({
      dependencies: { react: "18.2.0" }, topLevelDirs: [],
    });
    const react = r.detected.find((d) => d.id === "react");
    expect(react?.version).toBe("18.2.0");
  });
});

// ── auto-3 + auto-4 (pass-2) — 2-of-3 clean-layer dirs classify as clean ──
describe("auto-3/auto-4 — 2-of-3 clean layers emit clean_architecture at confidence 0.6", () => {
  it("domain/ + application/ yields clean_architecture at 0.6", () => {
    const r = detectFrameworks({
      dependencies: {}, topLevelDirs: ["domain", "application"],
    });
    const clean = r.detected.find((d) => d.id === "clean_architecture");
    expect(clean?.confidence).toBe(0.6);
  });
  it("2-of-3 layers also lifts architectureStyle.primary to 'clean' (auto-4 gate 0.6)", () => {
    const r = detectFrameworks({
      dependencies: {}, topLevelDirs: ["domain", "application"],
    });
    expect(r.architectureStyle.primary).toBe("clean");
  });
  it("3-of-3 (domain + application + infrastructure) emits at confidence 0.85", () => {
    const r = detectFrameworks({
      dependencies: {}, topLevelDirs: ["domain", "application", "infrastructure"],
    });
    const clean = r.detected.find((d) => d.id === "clean_architecture");
    expect(clean?.confidence).toBe(0.85);
  });
});

// ── auto-6 (pass-2) — DDD signal label reflects matched directory ──
describe("auto-6 — DDD signal label reflects the matched directory name", () => {
  it("'bounded-contexts/' label when bounded-contexts/ matched", () => {
    const r = detectFrameworks({
      dependencies: {}, topLevelDirs: ["bounded-contexts"],
    });
    const ddd = r.detected.find((d) => d.id === "ddd");
    expect(ddd?.signals).toContain("directory: bounded-contexts/");
  });
  it("'contexts/' label when contexts/ matched (was hard-coded to bounded-contexts/)", () => {
    const r = detectFrameworks({
      dependencies: {}, topLevelDirs: ["contexts"],
    });
    const ddd = r.detected.find((d) => d.id === "ddd");
    expect(ddd?.signals).toContain("directory: contexts/");
  });
});

// ── branch coverage — uncovered build-system + architecture-style branches ──
describe("branch coverage — Bazel / Turbo / Nx detection", () => {
  it("Bazel: BUILD/BUILD.bazel file triggers Bazel detection", () => {
    const r = detectFrameworks({
      topLevelDirs: [],
      dependencies: {},
      topLevelFiles: ["BUILD.bazel", "WORKSPACE"],
    });
    const bazel = r.detected.find((d) => d.id === "bazel");
    expect(bazel).toBeDefined();
  });
  it("Turbo: turbo.json triggers Turborepo detection", () => {
    const r = detectFrameworks({
      dependencies: {}, topLevelDirs: [],
      topLevelFiles: ["turbo.json"],
    });
    const turbo = r.detected.find((d) => d.id === "turborepo");
    expect(turbo).toBeDefined();
  });
  it("Nx: nx.json triggers Nx detection", () => {
    const r = detectFrameworks({
      dependencies: {}, topLevelDirs: [],
      topLevelFiles: ["nx.json"],
    });
    const nx = r.detected.find((d) => d.id === "nx");
    expect(nx).toBeDefined();
  });
});

describe("branch coverage — layered_nestjs architecture-style branch", () => {
  it("@nestjs/core dependency lifts architectureStyle to layered_nestjs", () => {
    const r = detectFrameworks({
      dependencies: { "@nestjs/core": "10.0.0" }, topLevelDirs: [],
    });
    expect(r.architectureStyle.primary).toBe("layered_nestjs");
  });
});

describe("AUTO_DETECT_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(AUTO_DETECT_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
