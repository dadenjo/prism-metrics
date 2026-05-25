/**
 * DORA (predicted) — predicts the four key DORA outcomes from
 * architectural signals. The subpath name carries the disclaimer:
 * these are predictions, not measurements of real deploys.
 *
 * Signals mirror those the prism0x2A dashboard uses in its
 * `analyzeDORA` implementation.
 */

export type DoraLevel = "elite" | "high" | "medium" | "low";

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
}

export interface DoraScoreResult {
  deploymentFrequency: DoraLevel;
  leadTimeForChanges: DoraLevel;
  changeFailureRate: DoraLevel;
  meanTimeToRestore: DoraLevel;
  /** Average level-rank across the four metrics (elite=3 .. low=0). */
  overallRank: number;
  overallLevel: DoraLevel;
}
