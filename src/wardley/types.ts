/**
 * Wardley Mapping — capability evolution-stage classification + value-chain
 * positioning + deterministic X-axis plotting via seeded hash.
 *
 * Classification heuristics (commodity / genesis / product signal sets,
 * value-chain keyword map, lifecycle and criticality fallbacks) mirror
 * the prism0x2A dashboard's `classifyEvolution` and `classifyValueChain`
 * implementations so anyone deriving a Wardley map from AMBER-style
 * capabilities produces identical stages and visibility positions.
 */

export type EvolutionStage = "genesis" | "custom_built" | "product" | "commodity";

export type LifecycleHint = "experimental" | "stable" | "deprecated" | undefined;
export type CriticalityHint = "critical" | "high" | "medium" | "low" | undefined;

/** Inputs for `classifyEvolution`. */
export interface ClassifyEvolutionInput {
  name: string;
  id: string;
  lifecycle?: LifecycleHint;
  criticality?: CriticalityHint;
  fileCount?: number;
}

export interface ClassifyEvolutionResult {
  stage: EvolutionStage;
  /** 0..1 evolution-axis score (0=genesis, 1=commodity). */
  score: number;
  /**
   * 0..1 confidence in the stage label.
   *
   *  - <=0.55  single weak signal (e.g. a single regex name match, or
   *            a fileCount-only promotion). Treat as "candidate only".
   *  - 0.55-0.75 a lifecycle/criticality signal corroborates a stage.
   *  - >=0.82  multiple independent signals agree.
   *
   * Added to fix wardley-2: previously consumers saw a precise
   * `score: 0.847` for what was, internally, a one-regex guess and
   * had no way to detect it.
   */
  confidence: number;
  /**
   * `true` when the classification rests on a SINGLE keyword-regex
   * match with no corroborating lifecycle / criticality signal. Set
   * on commodity / product / genesis matches whose only evidence is
   * the name-pattern. Surfaced so dashboards can render a "review"
   * affordance instead of treating the stage as settled.
   *
   * Added to fix wardley-1: the bespoke-auth → commodity false
   * positive was previously emitted at 0.82-0.97 with no flag.
   */
  disputed: boolean;
  signals: string[];
}

export interface WardleyComponent {
  id: string;
  /** Visibility / value-chain Y-position, 0..1. Caller computes this
   * via `classifyValueChain` or supplies their own. */
  visibility: number;
  stage: EvolutionStage;
  confidence: number;
}

export interface WardleySignals {
  components: WardleyComponent[];
}

export interface WardleyPlottedComponent extends WardleyComponent {
  /** X-position on the evolution axis, 0..1. */
  x: number;
  /** Y-position copied from visibility, kept for ergonomics. */
  y: number;
}

export interface WardleyMapResult {
  components: WardleyPlottedComponent[];
  stageCounts: Record<EvolutionStage, number>;
}
