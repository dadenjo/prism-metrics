/**
 * Clean Architecture scoring — start at 100, subtract per dependency-rule
 * violation by severity. Floor at 0. Surface an explicit unknown-layer
 * insight when > 30% of capabilities can't be classified.
 *
 * Per-severity-bucket caps (ca-1):
 *   Each severity bucket's deduction is now capped so a single bucket
 *   cannot single-handedly flatten the score. With CRITICAL_DEDUCTION
 *   = 15 and CRITICAL_CAP = 45, no more than 45 points come off for
 *   critical violations even if the caller reports 100. This prevents
 *   "7 critical violations ⇒ 0/F" walls — 7 criticals now cap at 45
 *   off, so the score remains diagnostic instead of pegged at 0.
 *
 * Empty-input handling (ca-2):
 *   `totalCapabilities === 0` returns an InsufficientSignalResult. An
 *   empty registry has no architecture to score; the previous
 *   behaviour (raw=100, grade A+) was the symmetric counterpart of
 *   the ISO-25010 "empty ⇒ D" bug — pretending there is data.
 *
 * Per-bucket-cap chosen over per-capability-normalisation (ca-3):
 *   The cap-the-bucket approach is simpler and already softens the
 *   small-repo-vs-large-repo unfairness (a 5-cap repo with 4
 *   criticals now caps at 45 off instead of 60 off + clamp). We
 *   document the absolute-count choice in methodology rather than
 *   adding a second normalisation knob; consumers who want a
 *   per-graph-size view can divide totalViolations by
 *   totalCapabilities themselves.
 */

import { clamp, scoreToGrade } from "../core/methodology.js";
import { insufficient, type InsufficientSignalResult } from "../core/insufficient.js";
import type { CleanArchScoreResult, CleanArchSignals } from "./types.js";

const CRITICAL_DEDUCTION = 15;
const MEDIUM_DEDUCTION = 8;
const ADJACENT_DEDUCTION = 4;
/** Per-severity-bucket caps — prevents a single bucket from pegging at 0. */
const CRITICAL_CAP = 45;
const MEDIUM_CAP = 32;
const ADJACENT_CAP = 24;
const UNKNOWN_INSIGHT_THRESHOLD = 0.3;

export function analyzeCleanArch(
  sig: CleanArchSignals,
): CleanArchScoreResult | InsufficientSignalResult {
  // Empty registry — no architecture to score. Symmetric counterpart
  // of the ISO-25010 "empty ⇒ D" bug; returning A+ would be just as
  // misleading.
  if (sig.totalCapabilities === 0) {
    return insufficient(
      "no_input",
      "Empty capability registry — no architecture to score.",
      "Pass a non-empty CleanArchSignals.totalCapabilities to score the dependency graph.",
    );
  }

  const criticalPenalty = Math.min(CRITICAL_CAP, CRITICAL_DEDUCTION * sig.criticalViolations);
  const mediumPenalty = Math.min(MEDIUM_CAP, MEDIUM_DEDUCTION * sig.mediumViolations);
  const adjacentPenalty = Math.min(ADJACENT_CAP, ADJACENT_DEDUCTION * sig.adjacentViolations);
  const raw = 100 - criticalPenalty - mediumPenalty - adjacentPenalty;
  const score = clamp(raw, 0, 100);
  const totalViolations =
    sig.criticalViolations + sig.mediumViolations + sig.adjacentViolations;
  const unknownRatio = sig.unknownCapabilities / sig.totalCapabilities;
  return {
    score,
    grade: scoreToGrade(score),
    totalViolations,
    unknownRatio,
    unknownLayerInsight: unknownRatio > UNKNOWN_INSIGHT_THRESHOLD,
  };
}
