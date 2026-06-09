import { describe, it, expect } from "vitest";
import { analyzeEda, bandConfidence } from "../score.js";
import { EDA_METHODOLOGY } from "../methodology.js";
import { isInsufficient } from "../../core/insufficient.js";
import type { EdaResult, EdaSignals } from "../types.js";

const zero: EdaSignals = {
  publisherFiles: 0,
  consumerFiles: 0,
  brokerFiles: 0,
  cqrsFiles: 0,
  sagaFiles: 0,
  eventStoreFiles: 0,
  couplingIssueCount: 0,
  hasStateCarryingEvent: false,
};

function asResult(sig: EdaSignals): EdaResult {
  const r = analyzeEda(sig);
  if (isInsufficient(r)) {
    throw new Error(
      `Expected EdaResult, got InsufficientSignalResult: ${r.detail}`,
    );
  }
  return r;
}

describe("analyzeEda — strong signal", () => {
  it("classifies multi-category as hasEda with high band", () => {
    const r = asResult({
      ...zero,
      publisherFiles: 5,
      consumerFiles: 7,
      brokerFiles: 2,
      cqrsFiles: 1,
      couplingIssueCount: 1,
      hasStateCarryingEvent: true,
    });
    expect(r.hasEda).toBe(true);
    // proportional sum: 0.2433 + 0.1806 + 0.1460 + 0.0425 ≈ 0.61
    expect(r.confidence).toBeGreaterThanOrEqual(0.55);
    expect(r.confidence).toBeLessThanOrEqual(0.65);
    expect(r.confidenceBand).toBe("high");
    expect(r.patternsDetected).toContain("event_notification");
    expect(r.patternsDetected).toContain("cqrs");
    expect(r.patternsDetected).toContain("event_carried_state_transfer");
    expect(r.couplingIssueCount).toBe(1);
  });
});

describe("analyzeEda — publisher + broker (floor met)", () => {
  it("returns hasEda with low band on small counts", () => {
    const r = asResult({
      ...zero,
      publisherFiles: 3,
      brokerFiles: 1,
    });
    expect(r.hasEda).toBe(true);
    // proportional sum ≈ 0.27
    expect(r.confidence).toBeGreaterThanOrEqual(0.22);
    expect(r.confidence).toBeLessThanOrEqual(0.32);
    expect(r.confidenceBand).toBe("low");
    expect(r.patternsDetected).toEqual(["event_notification"]);
  });
});

// ── eda-2: floor + InsufficientSignalResult ───────────────────────────────
describe("eda-2: signal floor returns InsufficientSignalResult below threshold", () => {
  it("all zeros → insufficient", () => {
    const r = analyzeEda(zero);
    expect(isInsufficient(r)).toBe(true);
    if (isInsufficient(r)) {
      expect(r.reason).toBe("missing_signal");
    }
  });
  it("a single consumer file → insufficient (one UI listener does not make EDA)", () => {
    const r = analyzeEda({ ...zero, consumerFiles: 1 });
    expect(isInsufficient(r)).toBe(true);
  });
  it("a single broker file → insufficient", () => {
    const r = analyzeEda({ ...zero, brokerFiles: 1 });
    expect(isInsufficient(r)).toBe(true);
  });
  it("publisher + consumer ≥ 3 meets floor even with single category split", () => {
    const r = analyzeEda({ ...zero, publisherFiles: 2, consumerFiles: 1 });
    expect(isInsufficient(r)).toBe(false);
  });
  it("two distinct non-zero categories meets floor (1+1)", () => {
    const r = analyzeEda({ ...zero, publisherFiles: 1, brokerFiles: 1 });
    expect(isInsufficient(r)).toBe(false);
  });
});

// ── eda-1: proportional weighting (1 file ≠ 1000) ─────────────────────────
describe("eda-1: proportional confidence weighting", () => {
  it("a saturating curve — 1 publisher is below 1000 publishers", () => {
    const one = asResult({ ...zero, publisherFiles: 1, brokerFiles: 1 });
    const many = asResult({
      ...zero,
      publisherFiles: 1000,
      brokerFiles: 1,
    });
    expect(many.confidence).toBeGreaterThan(one.confidence);
  });
  it("publisher contribution saturates near its 0.3 ceiling at high counts", () => {
    const r = asResult({
      ...zero,
      publisherFiles: 10000,
      brokerFiles: 10000,
    });
    // publisher: ~0.30, broker: ~0.30 → ~0.60
    expect(r.confidence).toBeGreaterThanOrEqual(0.55);
    expect(r.confidence).toBeLessThanOrEqual(0.65);
  });
  it("sum-of-weights is capped at 1.0 even with all categories maxed", () => {
    const r = asResult({
      ...zero,
      publisherFiles: 10000,
      consumerFiles: 10000,
      brokerFiles: 10000,
      cqrsFiles: 10000,
      sagaFiles: 10000,
      eventStoreFiles: 10000,
    });
    expect(r.confidence).toBeLessThanOrEqual(1);
    // total weight cap is 0.3+0.2+0.3+0.15+0.15+0.1 = 1.2; rounded curve
    // approaches 1.2 at high counts and is then clamped to 1.0.
    expect(r.confidence).toBe(1);
  });
});

// ── eda-4: confidenceBand cuts ────────────────────────────────────────────
describe("eda-4: confidenceBand documented cuts", () => {
  it("bandConfidence: <0.3 low", () => {
    expect(bandConfidence(0)).toBe("low");
    expect(bandConfidence(0.29)).toBe("low");
  });
  it("bandConfidence: <0.6 med", () => {
    expect(bandConfidence(0.3)).toBe("med");
    expect(bandConfidence(0.59)).toBe("med");
  });
  it("bandConfidence: >=0.6 high", () => {
    expect(bandConfidence(0.6)).toBe("high");
    expect(bandConfidence(1)).toBe("high");
  });
});

// ── eda-5: previously-missing edge cases ──────────────────────────────────
describe("eda-5: previously-missing edges", () => {
  it("single broker file alone → insufficient (no broker-only verdict)", () => {
    const r = analyzeEda({ ...zero, brokerFiles: 1 });
    expect(isInsufficient(r)).toBe(true);
  });
  it("hasStateCarryingEvent=true but zero publishers does NOT inject false signal", () => {
    // Floor is not met by hasStateCarryingEvent alone — it's a modifier
    // on top of producer/consumer signal, not a substitute.
    const r = analyzeEda({ ...zero, hasStateCarryingEvent: true });
    expect(isInsufficient(r)).toBe(true);
  });
  it("hasStateCarryingEvent=true WITH publishers surfaces the ecst pattern", () => {
    const r = asResult({
      ...zero,
      publisherFiles: 2,
      consumerFiles: 1,
      hasStateCarryingEvent: true,
    });
    expect(r.patternsDetected).toContain("event_carried_state_transfer");
  });
  it("couplingIssueCount round-trips into the result", () => {
    const r = asResult({
      ...zero,
      publisherFiles: 2,
      brokerFiles: 1,
      couplingIssueCount: 4,
    });
    expect(r.couplingIssueCount).toBe(4);
  });
});

// ── eda-3: exclusion contract is documented at the type boundary ──────────
describe("eda-3: exclusion contract documented in methodology", () => {
  it("methodology signals mention the scanner-exclusions contract", () => {
    const text = EDA_METHODOLOGY.signals.join("\n");
    expect(text).toMatch(/scanner-exclusions/);
  });
  it("honestGap mentions the caller responsibility", () => {
    expect(EDA_METHODOLOGY.honestGap ?? "").toMatch(
      /test|fixture|exclud/i,
    );
  });
});

describe("EDA_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(EDA_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
