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
 *   - "aligned" / "partially_aligned" / "misaligned" / "fragmented"
 *     follow the standard >=75 / >=50 / >=25 / <25 banding.
 *
 * The historical "undefined" verdict (single-team repo) is no longer
 * produced — that path now returns {@link import("../core/insufficient.js").InsufficientSignalResult}
 * because Conway's Law is undefined when there is exactly one team and
 * a letter grade is meaningless.
 */
export type ConwaysLawVerdict =
  | "aligned"
  | "partially_aligned"
  | "misaligned"
  | "fragmented";

export interface ConwaysLawScoreResult {
  score: number;
  grade: string;
  /** Always false on this path — single-team repos return an
   * {@link import("../core/insufficient.js").InsufficientSignalResult} instead. Kept for
   * back-compat with consumers that destructured this field. */
  singleTeamRepo: false;
  couplingRatio: number;
  unownedRatio: number;
  /**
   * Structural alignment band — DERIVED from code-only signals
   * (ownership + dependency edges). Conway's Law is an organizational
   * claim, not a code claim; this field is a STRUCTURAL PROXY only.
   * Use `structuralProxy` for the same value with the honest name.
   */
  verdict: ConwaysLawVerdict;
  /** Alias of `verdict` with a name that does not over-promise. The
   * methodology computes an alignment PROXY from code, not Conway's
   * Law itself, which requires an org-chart we cannot infer. */
  structuralProxy: ConwaysLawVerdict;
  /**
   * Always true on this path — Conway's Law is an organizational claim
   * and the runtime value here is a code-derived proxy. Downstream
   * dashboards MUST surface the org-chart-verification requirement to
   * the user before treating this grade as actionable.
   */
  requiresHumanVerification: true;
}
