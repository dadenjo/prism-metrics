/**
 * Wardley map plotting — deterministic X-position from a seeded FNV-1a
 * hash of the component id (no Math.random), so the same input always
 * plots in the same place.
 */

import type {
  EvolutionStage,
  WardleyMapResult,
  WardleyPlottedComponent,
  WardleySignals,
} from "./types.js";

const STAGE_BASE_X: Record<EvolutionStage, number> = {
  genesis: 0.125,
  custom_built: 0.375,
  product: 0.625,
  commodity: 0.875,
};

const JITTER_HALF_WIDTH = 0.1; // ± 0.10 around the stage center

function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  // Normalise to unsigned 32-bit and to [0,1)
  return (hash >>> 0) / 0xffffffff;
}

function seededOffset(id: string): number {
  return (fnv1a(id) * 2 - 1) * JITTER_HALF_WIDTH;
}

export function analyzeWardley(sig: WardleySignals): WardleyMapResult {
  const stageCounts: Record<EvolutionStage, number> = {
    genesis: 0,
    custom_built: 0,
    product: 0,
    commodity: 0,
  };
  const components: WardleyPlottedComponent[] = sig.components.map((c) => {
    stageCounts[c.stage]++;
    const x = Math.max(0, Math.min(1, STAGE_BASE_X[c.stage] + seededOffset(c.id)));
    return { ...c, x, y: c.visibility };
  });
  return { components, stageCounts };
}
