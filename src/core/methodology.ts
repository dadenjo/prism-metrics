/**
 * Methodology — the published contract for "how is this scored?"
 *
 * Every framework module exports a `METHODOLOGY` constant of this shape.
 * Editing rule: if a scoring formula changes, update both the score
 * function AND the methodology's `formula` field in the same commit.
 */

export interface MethodologyFormula {
  /** Plain-English description of the calculation. */
  description: string;
  /** Pointer to the line(s) in this repo that implement the formula. */
  codeRef: string;
  /** Optional pseudo-code or formula snippet. */
  snippet?: string;
}

export interface Methodology {
  /** One- or two-sentence definition with primary attribution. */
  definition: string;
  /** Canonical primary source URL. */
  referenceUrl: string;
  /** Short link text for the reference. */
  referenceLabel: string;
  /** What signals feed the score. */
  signals: string[];
  /** How the signals combine into the score. */
  formula: MethodologyFormula;
  /** Optional coverage note (what's in / out of scope). */
  coverage?: string;
  /**
   * Optional honest-gap disclosure. Present only where there is a
   * genuine known limitation worth surfacing to consumers.
   */
  honestGap?: string;
}

import { isInsufficient, type InsufficientSignalResult } from "./insufficient.js";

/**
 * Letter grade from a 0-100 score, standard A-F scale.
 *
 * If passed an {@link InsufficientSignalResult}, this throws — callers
 * MUST narrow the union (e.g. via {@link isInsufficient}) before grading,
 * so an "insufficient signal" result is never silently rendered as a
 * letter grade like "D" or "F".
 */
export function scoreToGrade(score: number): string;
export function scoreToGrade(input: InsufficientSignalResult): never;
export function scoreToGrade(input: number | InsufficientSignalResult): string {
  if (isInsufficient(input)) {
    throw new TypeError(
      `scoreToGrade called on InsufficientSignalResult (reason=${input.reason}): ${input.detail}. ` +
        `Callers must handle insufficient-signal results before grading.`,
    );
  }
  const score = input;
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

/** Clamp a number into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Round a number to the nearest integer (banker's rounding not used). */
export function roundScore(value: number): number {
  return Math.round(value);
}
