/**
 * DORA (predicted) — predicts the four key DORA outcomes from
 * architectural signals. The subpath name carries the disclaimer:
 * these are predictions, not measurements of real deploys.
 */

export type DoraLevel = "elite" | "high" | "medium" | "low";

export interface DoraSignals {
  /** 0-100 cross-layer coherence score. */
  coherenceScore: number;
  /** Pairwise dependency-cycle count between capabilities. */
  importCycles: number;
  /** Capabilities whose docs disagree with code. */
  driftCount: number;
  /** Capability drifts flagged as critical (security/contract/etc). */
  criticalDriftCount: number;
  averageCognitiveLoad: number;
  /** Capabilities whose cognitive load > 60. */
  highCogLoadCapabilities: number;
}

export interface DoraScoreResult {
  deploymentFrequency: DoraLevel;
  leadTimeForChanges: DoraLevel;
  changeFailureRate: DoraLevel;
  meanTimeToRestore: DoraLevel;
  /** Average level-rank across the four metrics (elite=4 .. low=1). */
  overallRank: number;
  overallLevel: DoraLevel;
}
