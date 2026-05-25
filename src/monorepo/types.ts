/**
 * Monorepo per-capability isolation scoring.
 */

export type BuildSystem = "bazel" | "turborepo" | "nx" | "lerna" | "none";

export interface MonorepoCapability {
  id: string;
  /** Cross-capability build-target dependencies. */
  crossTargetDeps: number;
}

export interface MonorepoSignals {
  buildSystem: BuildSystem;
  capabilities: MonorepoCapability[];
}

export interface MonorepoCapabilityScore {
  id: string;
  healthScore: number;
  crossTargetDeps: number;
}

export interface MonorepoResult {
  buildSystem: BuildSystem;
  capabilities: MonorepoCapabilityScore[];
  /** Mean health score across capabilities, rounded. */
  averageHealth: number;
  unhealthyCount: number;
}
