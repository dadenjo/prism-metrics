/**
 * Clean Architecture scoring — start at 100, subtract per dependency-rule
 * violation by severity. Floor at 0. Surface an explicit unknown-layer
 * insight when > 30% of capabilities can't be classified.
 */

import { clamp, scoreToGrade } from "../core/methodology.js";
import type { CleanArchScoreResult, CleanArchSignals } from "./types.js";

const CRITICAL_DEDUCTION = 15;
const MEDIUM_DEDUCTION = 8;
const ADJACENT_DEDUCTION = 4;
const UNKNOWN_INSIGHT_THRESHOLD = 0.3;

export function analyzeCleanArch(sig: CleanArchSignals): CleanArchScoreResult {
  const raw = 100
    - CRITICAL_DEDUCTION * sig.criticalViolations
    - MEDIUM_DEDUCTION * sig.mediumViolations
    - ADJACENT_DEDUCTION * sig.adjacentViolations;
  const score = clamp(raw, 0, 100);
  const totalViolations =
    sig.criticalViolations + sig.mediumViolations + sig.adjacentViolations;
  const unknownRatio = sig.totalCapabilities > 0
    ? sig.unknownCapabilities / sig.totalCapabilities
    : 0;
  return {
    score,
    grade: scoreToGrade(score),
    totalViolations,
    unknownRatio,
    unknownLayerInsight: unknownRatio > UNKNOWN_INSIGHT_THRESHOLD,
  };
}
