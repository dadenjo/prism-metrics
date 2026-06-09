/**
 * Conway's Law scoring.
 *
 * Single-team repos are a degenerate case: the question "is your org
 * structure aligned with your code structure?" is ill-posed when there
 * is exactly one team. Rather than emit a misleading letter grade, we
 * return an {@link InsufficientSignalResult} for this case so callers
 * cannot accidentally render "D / verdict undefined" on a solo repo.
 *
 * Multi-team repos start at 100 with deductions for cross-team coupling
 * (up to 35) and unowned capabilities (up to 30), plus a CODEOWNERS
 * bonus. The deduction caps are sized so that 100% coupling + 100%
 * unowned drops below the F threshold — worst-case org dysfunction
 * should not graduate to "D" the way the old 30/20 caps allowed.
 */

import { clamp, scoreToGrade } from "../core/methodology.js";
import { insufficient, type InsufficientSignalResult } from "../core/insufficient.js";
import type {
  ConwaysLawScoreResult,
  ConwaysLawSignals,
  ConwaysLawVerdict,
} from "./types.js";

/** Maximum points removed when coupling ratio is 1.0. */
export const COUPLING_MAX_DEDUCTION = 35;
/** Maximum points removed when unowned ratio is 1.0. */
export const UNOWNED_MAX_DEDUCTION = 30;
/** Bonus when a CODEOWNERS file is present. */
export const CODEOWNERS_BONUS = 5;

function bandToVerdict(score: number): ConwaysLawVerdict {
  if (score >= 75) return "aligned";
  if (score >= 50) return "partially_aligned";
  if (score >= 25) return "misaligned";
  return "fragmented";
}

/**
 * Compute the Conway's-Law structural alignment proxy.
 *
 * Returns an {@link InsufficientSignalResult} when `totalTeams <= 1`
 * (single-team / solo repo) — Conway's Law is undefined there and
 * letter-grading would mislead. Callers MUST narrow the union before
 * treating the result as a grade; the `scoreToGrade` helper throws on
 * an insufficient-signal value to make this hard to forget.
 */
export function analyzeConwaysLaw(
  sig: ConwaysLawSignals,
): ConwaysLawScoreResult | InsufficientSignalResult {
  if (sig.totalTeams <= 1) {
    return insufficient(
      "single_team",
      "Conway's Law is undefined for a single-team repo — there is no inter-team coupling to measure.",
      "Provide a multi-team ownership graph (totalTeams > 1) to compute an alignment proxy.",
    );
  }

  const couplingRatio = sig.totalDependencies > 0
    ? sig.crossTeamDependencies / sig.totalDependencies
    : 0;
  const unownedRatio = sig.totalCapabilities > 0
    ? sig.unownedCapabilities / sig.totalCapabilities
    : 0;

  const raw = 100
    - Math.min(COUPLING_MAX_DEDUCTION, couplingRatio * COUPLING_MAX_DEDUCTION)
    - Math.min(UNOWNED_MAX_DEDUCTION, unownedRatio * UNOWNED_MAX_DEDUCTION)
    + (sig.hasCodeowners ? CODEOWNERS_BONUS : 0);
  const score = clamp(Math.round(raw), 0, 100);
  const verdict = bandToVerdict(score);
  return {
    score,
    grade: scoreToGrade(score),
    singleTeamRepo: false,
    couplingRatio,
    unownedRatio,
    verdict,
    structuralProxy: verdict,
    requiresHumanVerification: true,
  };
}
