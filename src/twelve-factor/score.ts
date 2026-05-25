/**
 * Twelve-Factor scoring — per-factor points (pass=8, warn=4, unknown=2,
 * fail=0). Sum, then linearly scale to 0-100. Conservative by design:
 * cannot fail a passing app, only refuses to credit deep compliance.
 */

import { roundScore, scoreToGrade } from "../core/methodology.js";
import type {
  FactorStatus,
  TwelveFactorScoreResult,
  TwelveFactorSignals,
} from "./types.js";

const POINTS_PER_FACTOR = 8;
const TOTAL_FACTORS = 12;
const MAX_POINTS = POINTS_PER_FACTOR * TOTAL_FACTORS;

function statusPoints(s: FactorStatus): number {
  if (s === "pass") return 8;
  if (s === "warn") return 4;
  if (s === "unknown") return 2;
  return 0;
}

function readiness(score: number): TwelveFactorScoreResult["readiness"] {
  if (score >= 80) return "cloud-ready";
  if (score >= 60) return "mostly-ready";
  if (score >= 40) return "early-stage";
  return "not-ready";
}

export function analyzeTwelveFactor(sig: TwelveFactorSignals): TwelveFactorScoreResult {
  let passCount = 0;
  let warnCount = 0;
  let unknownCount = 0;
  let failCount = 0;
  let rawPoints = 0;
  for (const f of sig.factors) {
    rawPoints += statusPoints(f.status);
    if (f.status === "pass") passCount++;
    else if (f.status === "warn") warnCount++;
    else if (f.status === "unknown") unknownCount++;
    else failCount++;
  }
  const score = roundScore((rawPoints / MAX_POINTS) * 100);
  return {
    score,
    grade: scoreToGrade(score),
    rawPoints,
    passCount,
    warnCount,
    unknownCount,
    failCount,
    readiness: readiness(score),
  };
}
