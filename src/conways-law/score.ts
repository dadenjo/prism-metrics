/**
 * Conway's Law scoring.
 *
 * Single-team repos are a degenerate case: the question "is your org
 * structure aligned with your code structure?" is ill-posed when there
 * is exactly one team, so the score is clamped to the 50 baseline and
 * the verdict is "undefined". Multi-team repos start at 100 with
 * deductions for cross-team coupling and unowned capabilities, plus a
 * small CODEOWNERS bonus.
 */

import { clamp, scoreToGrade } from "../core/methodology.js";
import type {
  ConwaysLawScoreResult,
  ConwaysLawSignals,
  ConwaysLawVerdict,
} from "./types.js";

const COUPLING_MAX_DEDUCTION = 30;
const UNOWNED_MAX_DEDUCTION = 20;
const CODEOWNERS_BONUS = 5;

function bandToVerdict(score: number): ConwaysLawVerdict {
  if (score >= 75) return "aligned";
  if (score >= 50) return "partially_aligned";
  if (score >= 25) return "misaligned";
  return "fragmented";
}

export function analyzeConwaysLaw(sig: ConwaysLawSignals): ConwaysLawScoreResult {
  const singleTeamRepo = sig.totalTeams <= 1;
  const couplingRatio = sig.totalDependencies > 0
    ? sig.crossTeamDependencies / sig.totalDependencies
    : 0;
  const unownedRatio = sig.totalCapabilities > 0
    ? sig.unownedCapabilities / sig.totalCapabilities
    : 0;

  if (singleTeamRepo) {
    // Conway's Law is undefined with a single team — return the 50
    // baseline and skip the unowned/coupling deductions that would
    // otherwise drag the score below 50 and surface a misleading
    // "Misaligned" verdict on a repo that simply has no team split.
    return {
      score: 50,
      grade: scoreToGrade(50),
      singleTeamRepo: true,
      couplingRatio,
      unownedRatio,
      verdict: "undefined",
    };
  }

  const raw = 100
    - Math.min(COUPLING_MAX_DEDUCTION, couplingRatio * COUPLING_MAX_DEDUCTION)
    - Math.min(UNOWNED_MAX_DEDUCTION, unownedRatio * UNOWNED_MAX_DEDUCTION)
    + (sig.hasCodeowners ? CODEOWNERS_BONUS : 0);
  const score = clamp(Math.round(raw), 0, 100);
  return {
    score,
    grade: scoreToGrade(score),
    singleTeamRepo: false,
    couplingRatio,
    unownedRatio,
    verdict: bandToVerdict(score),
  };
}
