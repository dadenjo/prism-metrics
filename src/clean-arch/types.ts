/**
 * Clean Architecture — dependency-rule violation scoring.
 *
 * Caller classifies each capability into a layer
 * (entities | use_cases | interface_adapters | frameworks_drivers | unknown)
 * and counts dependency edges that violate the inner-only rule.
 */

export type CleanLayer =
  | "entities"
  | "use_cases"
  | "interface_adapters"
  | "frameworks_drivers"
  | "unknown";

export interface CleanArchSignals {
  totalCapabilities: number;
  /** Capabilities whose layer could not be classified by the caller. */
  unknownCapabilities: number;
  /** Edges that skip an adjacent layer outward (1 layer gap). */
  adjacentViolations: number;
  /** Edges that skip across the middle (2 layer gap). */
  mediumViolations: number;
  /** Edges that skip from entities/use_cases all the way to outermost. */
  criticalViolations: number;
  /**
   * Optional audit-only field. The list of filesystem paths the caller
   * excluded before counting capabilities (typically derived from
   * `src/core/scanner-exclusions.ts`). Does NOT affect the score.
   */
  excludedPaths?: string[];
}

export interface CleanArchScoreResult {
  score: number;
  grade: string;
  totalViolations: number;
  unknownRatio: number;
  /** True when > 30% of capabilities are in the "unknown" layer. */
  unknownLayerInsight: boolean;
}
