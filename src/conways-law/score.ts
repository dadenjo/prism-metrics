/**
 * Conway's Law scoring — single-team repos are dampened to baseline 50
 * (no inter-team coupling to measure). Multi-team repos start at 100,
 * with deductions for cross-team coupling and unowned capabilities and
 * a small CODEOWNERS bonus.
 */

import { clamp, scoreToGrade } from "../core/methodology.js";
import type { ConwaysLawScoreResult, ConwaysLawSignals } from "./types.js";

const COUPLING_MAX_DEDUCTION = 30;
const UNOWNED_MAX_DEDUCTION = 20;
const CODEOWNERS_BONUS = 5;

export function analyzeConwaysLaw(sig: ConwaysLawSignals): ConwaysLawScoreResult {
  const singleTeamRepo = sig.totalTeams <= 1;
  const couplingRatio = sig.totalDependencies > 0
    ? sig.crossTeamDependencies / sig.totalDependencies
    : 0;
  const unownedRatio = sig.totalCapabilities > 0
    ? sig.unownedCapabilities / sig.totalCapabilities
    : 0;
  const base = singleTeamRepo ? 50 : 100;
  const raw = base
    - Math.min(COUPLING_MAX_DEDUCTION, couplingRatio * COUPLING_MAX_DEDUCTION)
    - Math.min(UNOWNED_MAX_DEDUCTION, unownedRatio * UNOWNED_MAX_DEDUCTION)
    + (sig.hasCodeowners ? CODEOWNERS_BONUS : 0);
  const score = clamp(Math.round(raw), 0, 100);
  return {
    score,
    grade: scoreToGrade(score),
    singleTeamRepo,
    couplingRatio,
    unownedRatio,
  };
}
