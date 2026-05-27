/**
 * Conway's Law alignment score — measures how well the capability
 * ownership graph matches the dependency graph.
 */

export interface ConwaysLawSignals {
  totalTeams: number;
  totalCapabilities: number;
  unownedCapabilities: number;
  /** Number of dependency edges that cross a team boundary. */
  crossTeamDependencies: number;
  totalDependencies: number;
  hasCodeowners: boolean;
}

/**
 * High-level verdict for a Conway's-Law result.
 *
 *   - "undefined" — single-team repo: the question "is org structure
 *     aligned with code?" is ill-posed because there is no inter-team
 *     coupling to measure. Score is clamped to 50 baseline.
 *   - "aligned" / "partially_aligned" / "misaligned" / "fragmented"
 *     follow the standard >=75 / >=50 / >=25 / <25 banding.
 */
export type ConwaysLawVerdict =
  | "undefined"
  | "aligned"
  | "partially_aligned"
  | "misaligned"
  | "fragmented";

export interface ConwaysLawScoreResult {
  score: number;
  grade: string;
  /** True when totalTeams <= 1 (no inter-team coupling possible). */
  singleTeamRepo: boolean;
  couplingRatio: number;
  unownedRatio: number;
  verdict: ConwaysLawVerdict;
}
