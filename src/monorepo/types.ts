/**
 * Monorepo per-capability isolation scoring.
 *
 * mono-2 — Pre-fix this was limited to the JS/TS ecosystem
 * (bazel/turborepo/nx/lerna) plus 'none' which overloaded both
 * 'no build system' AND 'unknown'. Now extended to cover Go
 * workspaces, Cargo workspaces, Pants, Buck2, Gradle composite,
 * pnpm workspaces — plus an explicit 'unknown' distinct from 'none'.
 */
export type BuildSystem =
  | "bazel"
  | "turborepo"
  | "nx"
  | "lerna"
  | "pnpm"
  | "go-workspaces"
  | "cargo-workspaces"
  | "pants"
  | "buck2"
  | "gradle"
  | "none"
  | "unknown";

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
  /** Mean health score across capabilities, rounded. Null when noData. */
  averageHealth: number | null;
  unhealthyCount: number;
  /**
   * mono-1 — true when capabilities is empty OR buildSystem is 'none' /
   * 'unknown' (= polyrepo or unanalysable). Score should not be trusted
   * in this state.
   */
  noData: boolean;
}
