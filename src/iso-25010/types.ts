/**
 * ISO/IEC 25010 — ships 6 of 8 characteristics. Compatibility and
 * Usability are intentionally excluded (see honestGap).
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
  /** Optional previous coherence score for trend bonus (-1..+1 contribution). */
  previousCoherenceScore?: number;
  /** Ratio of drifted capabilities (drifted / total), 0..1. */
  driftRatio: number;
  /** 0-100 average test coverage. */
  averageTestCoverage: number;
  /** 0-100 average file churn (higher = more churn). */
  averageChurn: number;
  totalFiles: number;
  /** files / capability. */
  fileDensity: number;
  hardcodedSecretHits: number;
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
