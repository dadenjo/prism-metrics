/**
 * Hexagonal (Ports & Adapters) — dependency-rule violation scoring.
 */

export type HexElement =
  | "core"
  | "inbound_port"
  | "outbound_port"
  | "primary_adapter"
  | "secondary_adapter"
  | "infrastructure";

export interface HexagonalSignals {
  coreCount: number;
  portCount: number;
  adapterCount: number;
  /** Edges that violate the rule "core must not depend on adapter/infra". */
  dependencyViolations: number;
  /**
   * Optional audit-only field. The list of filesystem paths the caller
   * excluded before counting (typically derived from
   * `src/core/scanner-exclusions.ts`). Does NOT affect the score.
   */
  excludedPaths?: string[];
}

export interface HexagonalScoreResult {
  score: number;
  grade: string;
  /** True when adapters exist but no ports do — structural break. */
  adaptersWithoutPorts: boolean;
  /** True when the registry has no core capability. */
  missingCore: boolean;
}
