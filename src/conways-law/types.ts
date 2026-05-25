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

export interface ConwaysLawScoreResult {
  score: number;
  grade: string;
  /** True when totalTeams <= 1 (no inter-team coupling possible). */
  singleTeamRepo: boolean;
  couplingRatio: number;
  unownedRatio: number;
}
