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
  /** Optional capability count, used by has-signal detection. */
  totalCapabilities?: number;
  /**
   * Paths that were excluded from the scan (for audit-trail / methodology
   * transparency). When non-empty, downstream UIs can disclose what got
   * skipped — silent skips look like cheating. Purely informational; does
   * not affect scoring math.
   */
  excludedPaths?: string[];
}

/**
 * Sentinel returned by `analyzeIso25010` when the input has no usable
 * signal (e.g. a brand-new or unscanned repo). Keeps grades from being
 * rendered on top of an empty dataset. Shape is forward-compatible with
 * `core/InsufficientSignalResult`, which will replace it in a follow-up.
 */
export interface Iso25010InsufficientSignal {
  readonly ok: false;
  readonly reason: "no_input";
  readonly detail: string;
  /** Echo of the input's excludedPaths, if any, for audit trail. */
  readonly excludedPaths?: string[];
}

/** Successful score result is now explicitly tagged with ok:true. */
export type Iso25010Report = Iso25010ScoreResult & { ok: true; excludedPaths?: string[] };

export interface Iso25010CharacteristicScore {
  id: Iso25010Characteristic;
  score: number;
}

export interface Iso25010ScoreResult {
  overallScore: number;
  grade: string;
  characteristics: Iso25010CharacteristicScore[];
}
