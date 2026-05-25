import { describe, it, expect } from "vitest";
import {
  analyzeDdd,
  classifyContext,
  extractUbiquitousLanguage,
  inferRelationshipPattern,
} from "../score.js";
import { DDD_METHODOLOGY } from "../methodology.js";

import typIn from "./__fixtures__/typical.input.json";
import typOut from "./__fixtures__/typical.expected.json";
import emptyIn from "./__fixtures__/empty.input.json";
import emptyOut from "./__fixtures__/empty.expected.json";

describe("analyzeDdd", () => {
  it("matches typical fixture", () => {
    expect(analyzeDdd(typIn)).toEqual(typOut);
  });
  it("matches empty fixture", () => {
    expect(analyzeDdd(emptyIn)).toEqual(emptyOut);
  });
  it("counts isolated contexts", () => {
    const r = analyzeDdd(typIn);
    expect(r.isolatedContexts).toBe(1);
  });
});

describe("classifyContext", () => {
  it("returns generic for auth-like capabilities", () => {
    expect(classifyContext({ id: "auth", name: "Auth service" })).toBe(
      "generic",
    );
  });
  it("returns core_domain for business keywords", () => {
    expect(classifyContext({ id: "billing", name: "Billing" })).toBe(
      "core_domain",
    );
  });
  it("returns core_domain when criticality is critical", () => {
    expect(
      classifyContext({
        id: "mystery",
        name: "Mystery widget",
        criticality: "critical",
      }),
    ).toBe("core_domain");
  });
  it("falls back to supporting", () => {
    expect(classifyContext({ id: "reporting", name: "Reporting" })).toBe(
      "supporting",
    );
  });
});

describe("extractUbiquitousLanguage", () => {
  it("returns deduped capitalised terms", () => {
    const terms = extractUbiquitousLanguage(
      "Order checkout",
      "Handles the checkout flow for an order",
    );
    expect(terms).toContain("Order");
    expect(terms).toContain("Checkout");
    expect(terms.every((t) => t[0] === t[0].toUpperCase())).toBe(true);
  });
  it("drops stopwords and short words", () => {
    expect(extractUbiquitousLanguage("the and for with", "")).toEqual([]);
  });
});

describe("inferRelationshipPattern", () => {
  it("returns partnership on mutual deps", () => {
    expect(
      inferRelationshipPattern({
        fromDependsOnTo: true,
        toDependsOnFrom: true,
        toFanIn: 2,
        toType: "core_domain",
        fromType: "core_domain",
      }),
    ).toBe("partnership");
  });
  it("returns open_host_service when fan-in ≥ 3", () => {
    expect(
      inferRelationshipPattern({
        fromDependsOnTo: true,
        toDependsOnFrom: false,
        toFanIn: 5,
        toType: "supporting",
        fromType: "supporting",
      }),
    ).toBe("open_host_service");
  });
  it("returns conformist when toType is generic", () => {
    expect(
      inferRelationshipPattern({
        fromDependsOnTo: true,
        toDependsOnFrom: false,
        toFanIn: 1,
        toType: "generic",
        fromType: "core_domain",
      }),
    ).toBe("conformist");
  });
  it("returns anticorruption_layer when core depends on supporting", () => {
    expect(
      inferRelationshipPattern({
        fromDependsOnTo: true,
        toDependsOnFrom: false,
        toFanIn: 1,
        toType: "supporting",
        fromType: "core_domain",
      }),
    ).toBe("anticorruption_layer");
  });
  it("falls back to upstream_downstream", () => {
    expect(
      inferRelationshipPattern({
        fromDependsOnTo: true,
        toDependsOnFrom: false,
        toFanIn: 1,
        toType: "core_domain",
        fromType: "supporting",
      }),
    ).toBe("upstream_downstream");
  });
});

describe("DDD_METHODOLOGY", () => {
  it("references the score file", () => {
    expect(DDD_METHODOLOGY.formula.codeRef).toContain("score.ts");
  });
});
