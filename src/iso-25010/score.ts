/**
 * ISO/IEC 25010 scoring — 6 per-characteristic LOCKED_FORMULA
 * implementations, mirroring the prism0x2A dashboard.
 *
 * Overall = mean(characteristics), rounded.
 */

import { clamp, roundScore, scoreToGrade } from "../core/methodology.js";
import type {
  Iso25010CharacteristicScore,
  Iso25010ScoreResult,
  Iso25010Signals,
} from "./types.js";

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
//   churnPenalty = min(50, avgChurn × 2)
//   score        = max(0, round(densityScore − churnPenalty))
function performanceEfficiency(sig: Iso25010Signals): number {
  const churnPenalty = Math.min(50, sig.averageChurn * 2);
  const fileDensity = sig.fileDensity;
  const densityScore = fileDensity > 20 ? 50 : fileDensity > 10 ? 70 : 85;
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

// LOCKED_FORMULA — security
//   secretPenalty = min(60, 15 × hardcodedSecretFiles)
//   configPenalty = min(20,  5 × hardcodedConfigFiles)
//   score         = max(0, 85 − secretPenalty − configPenalty)
function security(sig: Iso25010Signals): number {
  const secretPenalty = Math.min(60, sig.hardcodedSecretHits * 15);
  const configPenalty = Math.min(20, sig.hardcodedConfigHits * 5);
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

export function analyzeIso25010(sig: Iso25010Signals): Iso25010ScoreResult {
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
    overallScore,
    grade: scoreToGrade(overallScore),
    characteristics,
  };
}
