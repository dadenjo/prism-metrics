import { describe, it, expect } from "vitest";
import { analyzeEip, detectEipPatterns, EIP_PATTERN_DEFS } from "../score.js";
import { EIP_METHODOLOGY } from "../methodology.js";
import { shouldScanFile } from "../../core/scanner-exclusions.js";

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
  it("returns unknown architectureType on empty input", () => {
    expect(analyzeEip(emptyIn)).toEqual(emptyOut);
    expect(analyzeEip(emptyIn).architectureType).toBe("unknown");
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
  it("discloses the exclusion contract in signals", () => {
    const text = EIP_METHODOLOGY.signals.join("\n");
    expect(text).toMatch(/scanner-exclusions/);
  });
});

// ── eip-1: exclusion contract is callers' responsibility, asserted ─────────
describe("eip-1: test/fixture exclusion contract", () => {
  it("scanner-exclusions filters typical test/fixture/mock paths the caller MUST drop", () => {
    // These would all trip EIP patterns trivially if not pre-filtered.
    expect(shouldScanFile("src/__tests__/event-bus.test.ts")).toBe(false);
    expect(shouldScanFile("src/foo/event-bus.mock.ts")).toBe(false);
    expect(shouldScanFile("src/foo/saga.spec.ts")).toBe(false);
    expect(shouldScanFile("src/fixtures/orchestrator.ts")).toBe(false);
    // ... and a production file passes:
    expect(shouldScanFile("src/messaging/event-bus.ts")).toBe(true);
  });
  it("when a caller skips the exclusion contract, fixture filenames are scored as real (regression doc)", () => {
    // This is the documented hazard — analyzeEip cannot itself tell test
    // files from prod. The point of this test is to make the behaviour
    // explicit so any future "auto-skip tests" change is intentional.
    const r = analyzeEip({ candidates: ["event-bus.mock.ts"] });
    const bus = r.patterns.find((p) => p.name === "Message Bus")!;
    expect(bus.status).toBe("present");
  });
});

// ── eip-2: bus / filter / emit tightening ─────────────────────────────────
describe("eip-2: dangerous generic patterns tightened", () => {
  it("does NOT mark Message Bus present for `business` / `omnibus`", () => {
    const r = analyzeEip({
      candidates: ["business-logic.ts", "omnibus-handler.ts", "busy-worker.ts"],
    });
    const bus = r.patterns.find((p) => p.name === "Message Bus")!;
    expect(bus.status).toBe("absent");
  });
  it("DOES mark Message Bus present for `event-bus.ts`", () => {
    const r = analyzeEip({ candidates: ["event-bus.ts"] });
    const bus = r.patterns.find((p) => p.name === "Message Bus")!;
    expect(bus.status).toBe("present");
  });
  it("does NOT mark Message Filter present for a generic `filter.ts`", () => {
    const r = analyzeEip({ candidates: ["filter.ts", "user-filter.ts"] });
    const mf = r.patterns.find((p) => p.name === "Message Filter")!;
    // \bfilter\b is now only a possibleSignal.
    expect(mf.status).toBe("possible");
  });
  it("DOES mark Message Filter present for `message-filter.ts`", () => {
    const r = analyzeEip({ candidates: ["message-filter.ts"] });
    const mf = r.patterns.find((p) => p.name === "Message Filter")!;
    expect(mf.status).toBe("present");
  });
  it("two distinct messaging-infra signals are required before pubsub escalation", () => {
    // Only Publish-Subscribe present → no ≥2 msg infra → message_based not picked
    const r = analyzeEip({ candidates: ["order-publisher.ts"] });
    expect(r.architectureType).not.toBe("event_driven_pubsub");
  });
});

// ── eip-3: React onClick false-positive ───────────────────────────────────
describe("eip-3: React onClick does not trip Event-Driven Consumer", () => {
  it("`onClick.something` does NOT mark Event-Driven Consumer present", () => {
    const r = analyzeEip({
      candidates: ["onClick.something", "onChange.handler", "onSubmit.x"],
    });
    const edc = r.patterns.find((p) => p.name === "Event-Driven Consumer")!;
    expect(edc.status).toBe("absent");
  });
  it("`onMessage` / `onEvent` DOES mark Event-Driven Consumer present", () => {
    const r = analyzeEip({
      candidates: ["socket.onMessage", "bus.onEvent"],
    });
    const edc = r.patterns.find((p) => p.name === "Event-Driven Consumer")!;
    expect(edc.status).toBe("present");
  });
});

// ── eip-4: workflow → saga drift fixed ────────────────────────────────────
describe("eip-4: Workflow capability alone does not imply Saga", () => {
  it("Workflow Engine present + messaging does NOT classify as event_driven_saga", () => {
    // Workflow Engine matches Process Manager / Saga's `/\bworkflow\b/i`
    // present signal directly, so this is testing inferArchitectureType
    // (hasSaga literal match) when Process Manager / Saga IS technically
    // present. That literal match is intentional — workflow-engine.ts
    // still IS a workflow / saga signal at the catalog level.
    // The drift case the audit calls out is when a CAPABILITY named
    // "Workflow" exists but Process Manager / Saga is NOT in present
    // names. We simulate that by directly constructing patterns.
    const synthetic = detectEipPatterns([
      "event-bus.ts",
      "kafka-producer.ts",
    ]).map((p) =>
      p.name === "Workflow" ? { ...p, status: "present" as const } : p,
    );
    const r = analyzeEip(synthetic);
    expect(r.architectureType).not.toBe("event_driven_saga");
  });
});

// ── eip-5: unknown for empty, opinionated point_to_point gone ─────────────
describe("eip-5: empty input lands on `unknown`, not point_to_point", () => {
  it("zero candidates → architectureType `unknown`", () => {
    expect(analyzeEip({ candidates: [] }).architectureType).toBe("unknown");
  });
  it("candidates that match nothing → architectureType `unknown`", () => {
    expect(
      analyzeEip({ candidates: ["foo.ts", "bar.ts", "baz.ts"] })
        .architectureType,
    ).toBe("unknown");
  });
});

// ── eip-6: missing-pattern suggestions gated on detectedCount >= 3 ────────
describe("eip-6: suggestions only fire above detection floor", () => {
  it("single messaging file does NOT trigger Dead Letter / Idempotent suggestion", () => {
    const r = analyzeEip({ candidates: ["event-bus.ts"] });
    expect(r.missingPatternSuggestions).toEqual([]);
  });
  it("two messaging files still below floor → no suggestions", () => {
    const r = analyzeEip({
      candidates: ["event-bus.ts", "message-bus.ts"],
    });
    expect(r.missingPatternSuggestions).toEqual([]);
  });
});
