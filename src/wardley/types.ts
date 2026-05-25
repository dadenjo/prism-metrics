/**
 * Wardley Mapping — capability evolution-stage classification and
 * deterministic X-position via seeded hash.
 */

export type EvolutionStage = "genesis" | "custom_built" | "product" | "commodity";

export interface WardleyComponent {
  id: string;
  /** Visibility / value-chain Y-position, 0..1. Caller computes this. */
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
