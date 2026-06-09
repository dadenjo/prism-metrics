/**
 * Wardley map plotting constants.
 *
 * Extracted from `score.ts` so the magic numbers are auditable in one
 * place and can be asserted against in tests. The values mirror the
 * prism0x2A dashboard's `wardleyMap.ts` heuristics — changing them
 * here without updating the dashboard breaks visual cross-comparison.
 */

import type { EvolutionStage } from "./types.js";

/**
 * Center X for each evolution stage on the 0..1 evolution axis.
 *
 * Rationale: the axis is divided into four equal-width stage bands
 * (0–0.25 genesis, 0.25–0.5 custom_built, 0.5–0.75 product,
 * 0.75–1.0 commodity). Each center sits at the midpoint of its band
 * so symmetric jitter stays within the band when |offset| ≤ 0.125.
 */
export const STAGE_BASE_X: Record<EvolutionStage, number> = {
  genesis: 0.125,
  custom_built: 0.375,
  product: 0.625,
  commodity: 0.875,
};

/**
 * Maximum absolute jitter applied to a component's X coordinate.
 *
 * Each band is 0.25 wide and centers are at the midpoint, so the
 * maximum jitter that keeps a component strictly inside its own
 * band is 0.125. We use 0.10 to leave a 0.025 safety margin on each
 * side and to avoid components touching the visual stage divider.
 * Tests assert that the jittered X never crosses a stage boundary.
 */
export const JITTER_HALF_WIDTH = 0.1;

// ─── Confidence bands for classifyEvolution ───────────────────────────────────
//
// The historical implementation emitted single-regex commodity matches
// at confidence 0.82-0.97. That is the bug class the multi-agent audit
// flagged as "Atomar Security 10/F"-shaped: a bespoke in-house auth
// service whose name happens to contain `auth` was rendered as a
// commodity at near-certainty, leading dashboards to recommend
// "outsource it". The bands below honor what a single keyword can
// actually tell you (weak signal, 0.5 ± 0.15) vs what corroborating
// lifecycle/criticality evidence raises it to (0.82 ± 0.15).

/** Base confidence when ONLY a single signal (e.g. a regex name match) fires. */
export const SINGLE_SIGNAL_BASE = 0.5;
export const SINGLE_SIGNAL_RANGE = 0.15;

/** Base confidence when a second signal corroborates the first. */
export const CORROBORATED_BASE = 0.82;
export const CORROBORATED_RANGE = 0.15;

/** Confidence for lifecycle=experimental falling back to genesis. */
export const LIFECYCLE_BASE = 0.7;
export const LIFECYCLE_RANGE = 0.1;

/** Confidence when fileCount alone bumps a capability to custom_built. */
export const FILECOUNT_ONLY_BASE = 0.4;
export const FILECOUNT_ONLY_RANGE = 0.15;

/** Confidence when criticality=critical drives custom_built. */
export const CRITICALITY_BASE = 0.7;
export const CRITICALITY_RANGE = 0.15;

/** Default custom_built (no signals at all) — barely a guess. */
export const DEFAULT_CUSTOM_BASE = 0.35;
export const DEFAULT_CUSTOM_RANGE = 0.2;
