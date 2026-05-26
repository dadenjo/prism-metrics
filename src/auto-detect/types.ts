/**
 * Framework auto-detection. Caller supplies manifest signals (deps,
 * devDeps, top-level dirs, src/ subdirs, top-level files); the detector
 * returns hand-calibrated frameworks + an inferred architecture style.
 *
 * Signatures, confidence values, and architecture-style precedence
 * mirror the prism0x2A dashboard's `frameworkDetector` so anyone
 * implementing the spec produces the same detections from the same
 * inputs.
 *
 * Recommendation text generation (UI copy) stays dashboard-side and
 * is intentionally NOT in this package.
 */

export type FrameworkCategory =
  | "architecture_pattern"
  | "build_system"
  | "cloud_framework"
  | "testing"
  | "frontend"
  | "backend";

export interface AutoDetectSignals {
  /** Production dependency map: name -> version (may be empty). */
  dependencies: Record<string, string>;
  /** Dev dependency map: name -> version (may be empty). */
  devDependencies?: Record<string, string>;
  /** Names of top-level directories observed in the project root. */
  topLevelDirs: string[];
  /** Names of directories observed inside src/, when present. */
  srcDirs?: string[];
  /** Names of top-level files observed in the project root. */
  topLevelFiles?: string[];
  /** package.json scripts map (script name -> command). Optional. */
  scripts?: Record<string, string>;
}

export interface FrameworkDetection {
  /** Stable id (e.g. "nextjs", "hexagonal_architecture"). */
  id: string;
  name: string;
  category: FrameworkCategory;
  confidence: number;
  signals: string[];
  /** Extracted version (from deps), if any — leading ^/~/>= stripped. */
  version?: string;
}

export type ArchitectureStyle =
  | "hexagonal"
  | "clean"
  | "ddd"
  | "event_driven"
  | "microservices"
  | "layered_nestjs"
  | "layered_traditional"
  | "unknown";

export interface ArchitectureStyleResult {
  primary: ArchitectureStyle;
  confidence: number;
  rationale: string;
}

export interface AutoDetectResult {
  detected: FrameworkDetection[];
  architectureStyle: ArchitectureStyleResult;
  /** Aggregated detection signals across all matched frameworks. */
  detectionSignals: string[];
}
