/**
 * Twelve-Factor scoring.
 *
 * Pre-fix: pass=8, warn=4, unknown=2, fail=0 against a fixed 96-point
 * denominator. Problems flagged by the 2026-06-09 audit:
 *
 *   tf-1 — Deployment-target unawareness. port_binding / processes /
 *   concurrency / disposability / admin_processes are caller-owned on
 *   Heroku/VM but platform-owned on Vercel/Lambda/Workers. A correctly-
 *   built Next.js app got dinged on 4-5 factors it can't control.
 *
 *   tf-2 — `unknown` gave 25% credit instead of "we don't know". An
 *   all-unknown repo scored 25/F (active penalty for things we can't
 *   measure).
 *
 * Post-fix:
 *   - New "n/a" status (tf-1) excluded from denominator
 *   - "unknown" is also excluded from denominator (tf-2) and drops
 *     confidence instead
 *   - score = rawPoints / (measuredCount * 8) * 100
 *   - confidence = measuredCount / applicableCount  (0-1)
 *   - noData when applicableCount === 0 OR every applicable is unknown
 *
 * Conservative-by-design framing preserved — we still cap per-factor
 * at 8 and never penalise a passing app.
 */

import { roundScore, scoreToGrade } from "../core/methodology.js";
import type {
  FactorStatus,
  TwelveFactorScoreResult,
  TwelveFactorSignals,
} from "./types.js";

const POINTS_PER_FACTOR = 8;

function statusPoints(s: FactorStatus): number {
  if (s === "pass") return 8;
  if (s === "warn") return 4;
  // tf-2: 'unknown' no longer awards points + drops out of denominator.
  // tf-1: 'n/a' likewise excluded from denominator.
  return 0;
}

function readiness(score: number): "cloud-ready" | "mostly-ready" | "early-stage" | "not-ready" {
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
  let naCount = 0;
  let rawPoints = 0;
  for (const f of sig.factors) {
    rawPoints += statusPoints(f.status);
    if (f.status === "pass") passCount++;
    else if (f.status === "warn") warnCount++;
    else if (f.status === "unknown") unknownCount++;
    else if (f.status === "n/a") naCount++;
    else failCount++;
  }
  // tf-1: applicable = total - n/a
  // tf-2: measured = applicable - unknown (unknown drops out)
  const applicableCount = Math.max(0, sig.factors.length - naCount);
  const measuredCount = Math.max(0, applicableCount - unknownCount);
  const noData = applicableCount === 0 || measuredCount === 0;
  const denominator = measuredCount * POINTS_PER_FACTOR;
  const score = noData ? 0 : roundScore((rawPoints / denominator) * 100);
  const confidence = applicableCount === 0
    ? 0
    : Math.round((measuredCount / applicableCount) * 100) / 100;
  return {
    score: noData ? 0 : score,
    grade: noData ? "N/A" : scoreToGrade(score),
    rawPoints,
    passCount,
    warnCount,
    unknownCount,
    failCount,
    naCount,
    confidence,
    noData,
    readiness: noData ? null : readiness(score),
  };
}
