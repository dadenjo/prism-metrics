import { describe, it, expect } from "vitest";
import { insufficient, isInsufficient } from "../insufficient.js";
import { scoreToGrade } from "../methodology.js";

describe("insufficient()", () => {
  it("returns the expected shape with no hint", () => {
    const r = insufficient("no_input", "signals object was empty");
    expect(r).toEqual({
      ok: false,
      reason: "no_input",
      detail: "signals object was empty",
    });
    expect("hint" in r).toBe(false);
  });

  it("includes hint when provided", () => {
    const r = insufficient("too_young", "<3 commits", "wait until 10 commits land");
    expect(r).toEqual({
      ok: false,
      reason: "too_young",
      detail: "<3 commits",
      hint: "wait until 10 commits land",
    });
  });

  it("omits hint when explicitly undefined", () => {
    const r = insufficient("missing_signal", "coverage is null", undefined);
    expect("hint" in r).toBe(false);
  });
});

describe("isInsufficient()", () => {
  it("narrows on a real InsufficientSignalResult", () => {
    const r = insufficient("single_team", "only one team detected");
    expect(isInsufficient(r)).toBe(true);
  });

  it("rejects numbers", () => {
    expect(isInsufficient(85)).toBe(false);
    expect(isInsufficient(0)).toBe(false);
  });

  it("rejects null and undefined", () => {
    expect(isInsufficient(null as unknown as number)).toBe(false);
    expect(isInsufficient(undefined as unknown as number)).toBe(false);
  });

  it("rejects a regular Iso25010Report-shaped object", () => {
    const report = {
      overallScore: 72,
      grade: "B",
      characteristics: [{ id: "security", score: 85 }],
    };
    expect(isInsufficient(report)).toBe(false);
  });

  it("rejects an object with ok:true", () => {
    expect(isInsufficient({ ok: true, reason: "no_input" } as unknown as number)).toBe(false);
  });

  it("rejects an object missing reason", () => {
    expect(isInsufficient({ ok: false } as unknown as number)).toBe(false);
  });
});

describe("scoreToGrade integration with InsufficientSignalResult", () => {
  it("throws when given an InsufficientSignalResult", () => {
    const r = insufficient("no_input", "signals empty");
    expect(() => scoreToGrade(r)).toThrow(TypeError);
    expect(() => scoreToGrade(r)).toThrow(/InsufficientSignalResult/);
    expect(() => scoreToGrade(r)).toThrow(/no_input/);
  });

  it("still grades a plain numeric score (regression)", () => {
    expect(scoreToGrade(85)).toBe("A");
    expect(scoreToGrade(95)).toBe("A+");
    expect(scoreToGrade(0)).toBe("F");
  });
});
