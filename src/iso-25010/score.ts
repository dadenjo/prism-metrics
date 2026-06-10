/**
 * ISO/IEC 25010 scoring — 6 per-characteristic LOCKED_FORMULA
 * implementations, mirroring the prism0x2A dashboard.
 *
 * Overall = mean(characteristics), rounded.
 */

import { clamp, roundScore, scoreToGrade } from "../core/methodology.js";
import type {
  Iso25010CharacteristicScore,
  Iso25010InsufficientSignal,
  Iso25010Report,
  Iso25010Signals,
} from "./types.js";

/**
 * True if the signal bundle carries at least one non-zero, defined input.
 * Used to short-circuit empty-input scoring so brand-new / unscanned repos
 * don't get rendered as "D" out of the box (see iso-1 finding).
 */
function hasAnySignal(sig: Iso25010Signals): boolean {
  if ((sig.totalFiles ?? 0) > 0) return true;
  if ((sig.totalCapabilities ?? 0) > 0) return true;
  if ((sig.hardcodedSecretHits ?? 0) > 0) return true;
  if ((sig.hardcodedConfigHits ?? 0) > 0) return true;
  if ((sig.coherenceScore ?? 0) > 0) return true;
  if (sig.previousCoherenceScore !== undefined) return true;
  if ((sig.driftRatio ?? 0) > 0) return true;
  if ((sig.averageTestCoverage ?? 0) > 0) return true;
  if ((sig.averageChurn ?? 0) > 0) return true;
  if ((sig.fileDensity ?? 0) > 0) return true;
  if ((sig.orphanCapabilities ?? 0) > 0) return true;
  if (sig.hasDockerfile || sig.hasK8sManifests || sig.hasEnvExample) return true;
  return false;
}

// LOCKED_FORMULA — functional_suitability
//   coverageScore = min(100, avgCoverage)
//   driftPenalty  = driftRatio × 30
//   score         = max(0, round(coverageScore × 0.6 + (100 − driftPenalty) × 0.4))
function functionalSuitability(sig: Iso25010Signals): number {
  const coverageScore = Math.min(100, sig.averageTestCoverage);
  const driftPenalty = sig.driftRatio * 30;
  return clamp(coverageScore * 0.6 + (100 - driftPenalty) * 0.4, 0, 100);
}

// LOCKED_FORMULA — performance_efficiency
//   densityScore = files-per-cap > 20 ? 50 : > 10 ? 70 : 85
//
// iso-3 + iso-4 fixed (W11-audit):
//   densityScore continuous: clamp(95 − 2 × max(0, fileDensity − 5), 50, 95)
//     - fileDensity 5  → 95
//     - fileDensity 10 → 85
//     - fileDensity 20 → 65
//     - fileDensity 25+ → 50 (floor)
//     Pre-fix: 50/70/85 step cliffs at exactly 10 and 20 swung 20 points
//     between fileDensity 19.9 and 20.1.
//
//   churnPenalty capped at 20 (was 50). Churn is a maintainability
//   signal, not a performance signal — capping the bleed-into-perf
//   at 20 stops refactor-heavy phases from tanking the perf score.
function performanceEfficiency(sig: Iso25010Signals): number {
  const churnPenalty = Math.min(20, sig.averageChurn * 0.8);
  const fileDensity = sig.fileDensity;
  const densityScore = clamp(95 - 2 * Math.max(0, fileDensity - 5), 50, 95);
  return clamp(densityScore - churnPenalty, 0, 100);
}

// LOCKED_FORMULA — reliability
//   trendBonus = +5 if delta > 0, -10 if < -5, else 0
//   score = min(100, max(0, round(
//             coherence × 0.5
//             + (100 − driftRatio × 100) × 0.4
//             − driftRatio × 40
//             + trendBonus)))
function reliability(sig: Iso25010Signals): number {
  const trend =
    sig.previousCoherenceScore === undefined
      ? 0
      : sig.coherenceScore - sig.previousCoherenceScore;
  const trendBonus = trend > 0 ? 5 : trend < -5 ? -10 : 0;
  const coherenceContrib = sig.coherenceScore * 0.5;
  const driftPenalty = sig.driftRatio * 40;
  return clamp(
    coherenceContrib +
      (100 - sig.driftRatio * 100) * 0.4 -
      driftPenalty +
      trendBonus,
    0,
    100,
  );
}

// LOCKED_FORMULA — security  (iso-2 softened curve, 2026-06-09)
//   secretPenalty = min(60, 15 × log2(1 + hardcodedSecretHits))
//   configPenalty = min(20,  5 × log2(1 + hardcodedConfigHits))
//   score         = max(0, 85 − secretPenalty − configPenalty)
//
// The previous linear `15 × hits` cliff sent 4 hits to a score of 25 (F),
// regardless of whether the hits came from test fixtures, comments, or
// real code. Log2 keeps the penalty meaningful while removing the cliff:
// 1 hit → 15, 4 hits → ~35, 10 hits → ~52, 60 hits → capped at 60.
function security(sig: Iso25010Signals): number {
  const secretPenalty = Math.min(
    60,
    15 * Math.log2(1 + sig.hardcodedSecretHits),
  );
  const configPenalty = Math.min(
    20,
    5 * Math.log2(1 + sig.hardcodedConfigHits),
  );
  return clamp(85 - secretPenalty - configPenalty, 0, 100);
}

// LOCKED_FORMULA — maintainability
//   coherenceContrib = coherence × 0.4
//   coverageContrib  = min(30, avgCoverage × 0.3)
//   driftPenalty     = driftRatio × 25
//   orphanPenalty    = min(20, 3 × orphanCaps)
//   score = min(100, max(0, round(
//             coherenceContrib + coverageContrib + 30
//             − driftPenalty − orphanPenalty)))
function maintainability(sig: Iso25010Signals): number {
  const orphanPenalty = Math.min(20, sig.orphanCapabilities * 3);
  const coverageContrib = Math.min(30, sig.averageTestCoverage * 0.3);
  const coherenceContrib = sig.coherenceScore * 0.4;
  const driftPenalty = sig.driftRatio * 25;
  return clamp(
    coherenceContrib + coverageContrib + 30 - driftPenalty - orphanPenalty,
    0,
    100,
  );
}

// LOCKED_FORMULA — portability
//   points = (Dockerfile?35:0) + (Helm/K8s?30:0) + (.env.example?25:0)
//   score  = min(100, max(10, points))
function portability(sig: Iso25010Signals): number {
  const points =
    (sig.hasDockerfile ? 35 : 0) +
    (sig.hasK8sManifests ? 30 : 0) +
    (sig.hasEnvExample ? 25 : 0);
  return clamp(Math.max(10, points), 0, 100);
}

export function analyzeIso25010(
  sig: Iso25010Signals,
): Iso25010Report | Iso25010InsufficientSignal {
  if (!hasAnySignal(sig)) {
    return {
      ok: false,
      reason: "no_input",
      detail:
        "No signal: every scored input (files, capabilities, coherence, drift, secret/config hits, infra markers) is zero or absent. Run a scan before grading.",
      ...(sig.excludedPaths && sig.excludedPaths.length > 0
        ? { excludedPaths: sig.excludedPaths }
        : {}),
    };
  }
  const characteristics: Iso25010CharacteristicScore[] = [
    { id: "functional_suitability", score: roundScore(functionalSuitability(sig)) },
    { id: "performance_efficiency", score: roundScore(performanceEfficiency(sig)) },
    { id: "reliability", score: roundScore(reliability(sig)) },
    { id: "security", score: roundScore(security(sig)) },
    { id: "maintainability", score: roundScore(maintainability(sig)) },
    { id: "portability", score: roundScore(portability(sig)) },
  ];
  const overallScore = roundScore(
    characteristics.reduce((sum, c) => sum + c.score, 0) / characteristics.length,
  );
  return {
    ok: true,
    overallScore,
    grade: scoreToGrade(overallScore),
    characteristics,
    ...(sig.excludedPaths && sig.excludedPaths.length > 0
      ? { excludedPaths: sig.excludedPaths }
      : {}),
  };
}
