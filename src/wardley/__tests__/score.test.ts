import { describe, it, expect } from "vitest";
import {
  analyzeWardley,
  classifyEvolution,
  classifyValueChain,
} from "../score.js";
import { WARDLEY_METHODOLOGY } from "../methodology.js";
import {
  STAGE_BASE_X,
  JITTER_HALF_WIDTH,
  SINGLE_SIGNAL_BASE,
  CORROBORATED_BASE,
} from "../constants.js";

import fourIn from "./__fixtures__/four-stages.input.json";
import fourOut from "./__fixtures__/four-stages.expected.json";
import emptyIn from "./__fixtures__/empty.input.json";
import emptyOut from "./__fixtures__/empty.expected.json";

describe("analyzeWardley", () => {
  it("matches four-stages fixture", () => {
    expect(analyzeWardley(fourIn)).toEqual(fourOut);
  });
  it("matches empty fixture", () => {
    expect(analyzeWardley(emptyIn)).toEqual(emptyOut);
  });
  it("plots the same id at the same x every time", () => {
    const a = analyzeWardley(fourIn);
    const b = analyzeWardley(fourIn);
    expect(a.components.map((c) => c.x)).toEqual(b.components.map((c) => c.x));
  });
  it("wardley-4: jitter cannot push X across a stage boundary", () => {
    // Each stage band is 0.25 wide and centers sit at the midpoint, so
    // jitter must stay strictly below 0.125 to never cross a divider.
    expect(JITTER_HALF_WIDTH).toBeLessThan(0.125);
    // Brute-force sample a bunch of ids and check the plotted X stays
    // in the correct band for each stage.
    const stages: Array<keyof typeof STAGE_BASE_X> = [
      "genesis",
      "custom_built",
      "product",
      "commodity",
    ];
    const bandFor = (s: keyof typeof STAGE_BASE_X) => {
      const center = STAGE_BASE_X[s];
      return [center - 0.125, center + 0.125] as const;
    };
    for (const stage of stages) {
      const components = Array.from({ length: 200 }, (_, i) => ({
        id: `probe-${stage}-${i}`,
        visibility: 0.5,
        stage,
        confidence: 0.5,
      }));
      const r = analyzeWardley({ components });
      const [lo, hi] = bandFor(stage);
      for (const c of r.components) {
        expect(c.x).toBeGreaterThanOrEqual(lo);
        expect(c.x).toBeLessThanOrEqual(hi);
      }
    }
  });
});

describe("classifyEvolution", () => {
  it("classifies auth-like capabilities as commodity (but disputed without corroboration)", () => {
    const r = classifyEvolution({ name: "Auth service", id: "auth" });
    expect(r.stage).toBe("commodity");
    // wardley-1: single-signal commodity must NOT confidently auto-commoditize.
    expect(r.disputed).toBe(true);
    expect(r.confidence).toBeGreaterThanOrEqual(SINGLE_SIGNAL_BASE);
    expect(r.confidence).toBeLessThan(CORROBORATED_BASE);
    expect(r.score).toBeLessThan(0.82);
  });
  it("wardley-1: auth + lifecycle=stable is corroborated → confident commodity", () => {
    const r = classifyEvolution({
      name: "Auth service",
      id: "auth",
      lifecycle: "stable",
    });
    expect(r.stage).toBe("commodity");
    expect(r.disputed).toBe(false);
    expect(r.confidence).toBeGreaterThanOrEqual(CORROBORATED_BASE);
    expect(r.score).toBeGreaterThanOrEqual(0.82);
  });
  it("wardley-5: bespoke custom auth (criticality=critical) is NOT commoditized", () => {
    // This is the canonical false-positive case from the audit: a name
    // contains "auth" but the capability is in-house critical infra.
    const r = classifyEvolution({
      name: "Custom Auth Core",
      id: "custom_auth_core",
      lifecycle: "stable",
      criticality: "critical",
    });
    expect(r.stage).toBe("custom_built");
    expect(r.disputed).toBe(false);
    // The override branch fires a signal that mentions criticality.
    expect(r.signals.join(" ")).toMatch(/criticality=critical/);
  });
  it("classifies experimental ML capabilities as genesis", () => {
    const r = classifyEvolution({ name: "ML experiment", id: "ml_lab" });
    expect(r.stage).toBe("genesis");
  });
  it("classifies notification-like as product", () => {
    const r = classifyEvolution({
      name: "Notification service",
      id: "notif",
    });
    expect(r.stage).toBe("product");
  });
  it("uses lifecycle=experimental as genesis fallback", () => {
    const r = classifyEvolution({
      name: "Something",
      id: "something",
      lifecycle: "experimental",
    });
    expect(r.stage).toBe("genesis");
    expect(r.disputed).toBe(false);
  });
  it("wardley-5: lifecycle=deprecated on non-commodity name is still commodity, undisputed", () => {
    const r = classifyEvolution({
      name: "Legacy Pricing Engine",
      id: "legacy_pricing",
      lifecycle: "deprecated",
    });
    expect(r.stage).toBe("commodity");
    expect(r.disputed).toBe(false);
  });
  it("defaults to custom_built with criticality=critical, undisputed", () => {
    const r = classifyEvolution({
      name: "Billing core",
      id: "billing_core",
      criticality: "critical",
    });
    expect(r.stage).toBe("custom_built");
    expect(r.disputed).toBe(false);
    expect(r.confidence).toBeGreaterThanOrEqual(0.7);
  });
  it("wardley-3: fileCount > 3 alone yields custom_built but disputed + low confidence", () => {
    const r = classifyEvolution({
      name: "Some module",
      id: "some_module",
      fileCount: 12,
    });
    expect(r.stage).toBe("custom_built");
    expect(r.disputed).toBe(true);
    expect(r.confidence).toBeLessThan(SINGLE_SIGNAL_BASE + 0.06);
  });
  it("wardley-5: empty-string name/id falls through to disputed default custom_built", () => {
    const r = classifyEvolution({ name: "", id: "" });
    expect(r.stage).toBe("custom_built");
    expect(r.disputed).toBe(true);
    expect(r.confidence).toBeLessThan(CORROBORATED_BASE);
  });
  it("is deterministic for the same input", () => {
    const a = classifyEvolution({ name: "Auth", id: "auth" });
    const b = classifyEvolution({ name: "Auth", id: "auth" });
    expect(a.score).toBe(b.score);
    expect(a.confidence).toBe(b.confidence);
    expect(a.disputed).toBe(b.disputed);
  });
});

describe("classifyValueChain", () => {
  it("places checkout near the top", () => {
    expect(classifyValueChain("Checkout", "checkout")).toBeGreaterThan(0.9);
  });
  it("places database near the bottom", () => {
    expect(classifyValueChain("User DB", "user_db")).toBeLessThan(0.3);
  });
  it("falls back to a mid-band deterministic value", () => {
    const v = classifyValueChain("Mystery widget", "mystery_widget");
    expect(v).toBeGreaterThanOrEqual(0.4);
    expect(v).toBeLessThanOrEqual(0.55);
  });
});

describe("WARDLEY_METHODOLOGY", () => {
  it("calls out determinism in the formula", () => {
    expect(WARDLEY_METHODOLOGY.formula.description).toMatch(/deterministic/i);
  });
  it("discloses the disputed flag and confidence band", () => {
    expect(WARDLEY_METHODOLOGY.formula.description).toMatch(/disputed/);
    expect(WARDLEY_METHODOLOGY.formula.description).toMatch(/confidence/i);
  });
});
