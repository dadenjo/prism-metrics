/**
 * DORA (predicted) — predicts the four key DORA outcomes from
 * architectural signals. The subpath name carries the disclaimer:
 * these are predictions, not measurements of real deploys.
 *
 * Signals mirror those the prism0x2A dashboard uses in its
 * `analyzeDORA` implementation.
 *
 * dora-1 + dora-3 fixes:
 *   - Added "insufficient" level for noData state (was missing — empty
 *     repos fell through to "high overall" because zero/zero/zero
 *     hit the elite branches by coincidence)
 *   - Added predictionConfidence: number (0-1) so callers can show
 *     uncertainty alongside the predicted level
 *   - Renamed runtime fields to `predicted*` so the prediction nature
 *     is un-strippable downstream (UIs printing
 *     "Deployment Frequency: elite" couldn't distinguish from a
 *     measured DORA report)
 */

export type DoraLevel = "elite" | "high" | "medium" | "low" | "insufficient";

export interface DoraSignals {
  /** 0-100 cross-layer coherence score. */
  coherenceScore: number;
  /** Pairwise dependency-cycle count between capabilities. */
  importCycles: number;
  /** Capabilities whose docs disagree with code. */
  driftCount: number;
  /** True iff at least one drifted capability is flagged `critical`. */
  criticalDrifted: boolean;
  /** Average cognitive load 0-100 across capabilities. */
  averageCognitiveLoad: number;
  /** Capabilities whose cognitive load > 60. */
  highCogLoadCapabilities: number;
  /**
   * dora-1 — total capability count. When 0 (no caps at all) OR every
   * signal is at the default zero, returns 'insufficient' rather than
   * the elite-by-coincidence high. Optional for back-compat; if not
   * provided, the all-zero-signal heuristic still catches the case.
   */
  totalCapabilities?: number;
}

export interface DoraScoreResult {
  /**
   * dora-3 — renamed from `deploymentFrequency` to make the prediction
   * nature explicit downstream. UIs can't accidentally print this as
   * a measured DORA report.
   */
  predictedDeploymentFrequency: DoraLevel;
  predictedLeadTimeForChanges: DoraLevel;
  predictedChangeFailureRate: DoraLevel;
  predictedMeanTimeToRestore: DoraLevel;
  /** Average level-rank across the four metrics (elite=3 .. low=0).
   *  null when overall level is 'insufficient' (dora-1). */
  overallRank: number | null;
  overallLevel: DoraLevel;
  /**
   * dora-3 — confidence in the predictions (0-1):
   *   0   for insufficient state
   *   0.6 for a normal prediction (architectural proxies are inherently
   *       uncertain — see honestGap in methodology.ts)
   * Future iteration: scale with totalCapabilities + signal completeness.
   */
  predictionConfidence: number;
  /**
   * dora-1 — true when overall level is 'insufficient'. UIs MUST
   * suppress the per-metric levels in that state.
   */
  insufficient: boolean;
}
