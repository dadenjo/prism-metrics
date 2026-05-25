import { describe, it, expect } from "vitest";
import { scoreToGrade, clamp, roundScore } from "../methodology.js";

describe("scoreToGrade", () => {
  it("maps 90+ to A+", () => {
    expect(scoreToGrade(90)).toBe("A+");
    expect(scoreToGrade(100)).toBe("A+");
  });
  it("maps 80-89 to A", () => {
    expect(scoreToGrade(80)).toBe("A");
    expect(scoreToGrade(89)).toBe("A");
  });
  it("maps 70-79 to B", () => {
    expect(scoreToGrade(70)).toBe("B");
  });
  it("maps 60-69 to C", () => {
    expect(scoreToGrade(60)).toBe("C");
  });
  it("maps 45-59 to D", () => {
    expect(scoreToGrade(45)).toBe("D");
    expect(scoreToGrade(59)).toBe("D");
  });
  it("maps below 45 to F", () => {
    expect(scoreToGrade(44)).toBe("F");
    expect(scoreToGrade(0)).toBe("F");
  });
});

describe("clamp", () => {
  it("clamps to lower bound", () => {
    expect(clamp(-5, 0, 100)).toBe(0);
  });
  it("clamps to upper bound", () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });
  it("passes through in-range", () => {
    expect(clamp(42, 0, 100)).toBe(42);
  });
});

describe("roundScore", () => {
  it("rounds to nearest integer", () => {
    expect(roundScore(42.4)).toBe(42);
    expect(roundScore(42.5)).toBe(43);
  });
});
