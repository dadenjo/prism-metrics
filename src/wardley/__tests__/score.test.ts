import { describe, it, expect } from "vitest";
import {
  analyzeWardley,
  classifyEvolution,
  classifyValueChain,
} from "../score.js";
import { WARDLEY_METHODOLOGY } from "../methodology.js";

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
});

describe("classifyEvolution", () => {
  it("classifies auth-like capabilities as commodity", () => {
    const r = classifyEvolution({ name: "Auth service", id: "auth" });
    expect(r.stage).toBe("commodity");
    expect(r.score).toBeGreaterThanOrEqual(0.82);
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
  });
  it("defaults to custom_built with criticality=critical", () => {
    const r = classifyEvolution({
      name: "Billing core",
      id: "billing_core",
      criticality: "critical",
    });
    expect(r.stage).toBe("custom_built");
  });
  it("is deterministic for the same input", () => {
    const a = classifyEvolution({ name: "Auth", id: "auth" });
    const b = classifyEvolution({ name: "Auth", id: "auth" });
    expect(a.score).toBe(b.score);
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
});
