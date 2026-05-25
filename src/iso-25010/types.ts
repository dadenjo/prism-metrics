/**
 * ISO/IEC 25010 — ships 6 of 8 characteristics. Compatibility and
 * Usability are intentionally excluded (see honestGap).
 *
 * Signals and formulas are aligned with the prism0x2A dashboard's
 * LOCKED_FORMULA per-characteristic implementations.
 */

export type Iso25010Characteristic =
  | "functional_suitability"
  | "performance_efficiency"
  | "reliability"
  | "security"
  | "maintainability"
  | "portability";

export interface Iso25010Signals {
  /** Most recent 0-100 coherence score. */
  coherenceScore: number;
  /** Optional previous coherence score for trend bonus. */
  previousCoherenceScore?: number;
  /** Ratio of drifted capabilities (drifted / total), 0..1. */
  driftRatio: number;
  /** 0-100 average test coverage. */
  averageTestCoverage: number;
  /** Average file churn per capability (raw count, not 0-100). */
  averageChurn: number;
  totalFiles: number;
  /** files / capability. */
  fileDensity: number;
  /** Number of files matching hardcoded-secret patterns. */
  hardcodedSecretHits: number;
  /** Number of files matching hardcoded host/port config patterns. */
  hardcodedConfigHits: number;
  hasDockerfile: boolean;
  hasK8sManifests: boolean;
  hasEnvExample: boolean;
  orphanCapabilities: number;
}

export interface Iso25010CharacteristicScore {
  id: Iso25010Characteristic;
  score: number;
}

export interface Iso25010ScoreResult {
  overallScore: number;
  grade: string;
  characteristics: Iso25010CharacteristicScore[];
}
