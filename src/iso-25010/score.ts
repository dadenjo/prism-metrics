/**
 * ISO/IEC 25010 scoring — 6 per-characteristic sub-formulas. Overall
 * is the mean of the six scores, rounded. Weights are hand-picked and
 * locked at launch; see methodology for the honest-gap.
 */

import { clamp, roundScore, scoreToGrade } from "../core/methodology.js";
import type {
  Iso25010CharacteristicScore,
  Iso25010ScoreResult,
  Iso25010Signals,
} from "./types.js";

function trendBonus(sig: Iso25010Signals): number {
  if (sig.previousCoherenceScore === undefined) return 0;
  const delta = sig.coherenceScore - sig.previousCoherenceScore;
  if (delta > 5) return 5;
  if (delta < -5) return -5;
  return 0;
}

function functionalSuitability(sig: Iso25010Signals): number {
  // Coherence dominates; orphan capabilities erode functional cohesion.
  const orphanPenalty = Math.min(20, sig.orphanCapabilities * 4);
  return clamp(sig.coherenceScore - orphanPenalty, 0, 100);
}

function performanceEfficiency(sig: Iso25010Signals): number {
  // Higher density of files per capability ~> larger surface to load
  const densityPenalty = Math.min(20, Math.max(0, sig.fileDensity - 10) * 2);
  return clamp(0.7 * sig.coherenceScore + 30 - densityPenalty, 0, 100);
}

function reliability(sig: Iso25010Signals): number {
  const driftPenalty = sig.driftRatio * 100;
  return clamp(0.5 * sig.coherenceScore + 0.4 * (100 - driftPenalty) - 0.4 * driftPenalty + trendBonus(sig), 0, 100);
}

function security(sig: Iso25010Signals): number {
  const secretsPenalty = Math.min(60, sig.hardcodedSecretHits * 15);
  const envBonus = sig.hasEnvExample ? 5 : 0;
  return clamp(80 - secretsPenalty + envBonus, 0, 100);
}

function maintainability(sig: Iso25010Signals): number {
  const churnPenalty = sig.averageChurn * 0.4;
  const coverageBonus = sig.averageTestCoverage * 0.3;
  return clamp(0.5 * sig.coherenceScore + coverageBonus - churnPenalty + 10, 0, 100);
}

function portability(sig: Iso25010Signals): number {
  let s = 40;
  if (sig.hasDockerfile) s += 25;
  if (sig.hasK8sManifests) s += 20;
  if (sig.hasEnvExample) s += 15;
  return clamp(s, 0, 100);
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
