/**
 * Framework auto-detection. The caller supplies the manifest signals
 * (deps + observed top-level directories); the detector returns a list
 * of frameworks with a calibrated confidence value each.
 *
 * No 0-100 score — confidence values are hand-calibrated and meant to
 * be read rather than aggregated.
 */

export interface AutoDetectSignals {
  /** Direct dependency map: name -> version. May include devDependencies. */
  dependencies: Record<string, string>;
  /** Names of top-level directories observed in the project root. */
  topLevelDirs: string[];
}

export interface FrameworkDetection {
  id: string;
  name: string;
  confidence: number;
  reasons: string[];
}

export interface AutoDetectResult {
  detected: FrameworkDetection[];
}
