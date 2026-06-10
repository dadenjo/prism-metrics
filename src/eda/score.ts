/**
 * EDA detection — mirrors prism0x2A dashboard's `analyzeEDA` but with
 * the false-positive class fixed:
 *
 *   - Binary "any-count > 0" confidence weights replaced with
 *     proportional `weight · (1 - exp(-count / N))` curves. One file
 *     no longer counts the same as a thousand.
 *
 *   - `hasEda` requires a corroboration floor — ≥2 distinct categories
 *     OR producerFiles + consumerFiles ≥ 3. Below the floor we return
 *     an `InsufficientSignalResult` instead of inventing a verdict.
 *
 *   - `confidence` (raw 0..1 number) is preserved AND surfaced as a
 *     banded `confidenceBand` ("low" / "med" / "high") so downstream
 *     UIs don't reinvent their own thresholds.
 */

import { clamp } from "../core/methodology.js";
import {
  insufficient,
  type InsufficientSignalResult,
} from "../core/insufficient.js";
import type {
  EdaConfidenceBand,
  EdaPattern,
  EdaResult,
  EdaSignals,
} from "./types.js";

/**
 * Saturation constant for the proportional confidence curve. With N=3,
 * a category contributes ~63% of its weight at 3 files, ~86% at 6,
 * ~95% at 9. Documented in methodology.ts. Starting calibration —
 * revisit when we have empirical telemetry on observed file counts.
 */
const SATURATION_N = 3;

/** Weights per category (unchanged from dashboard parity). */
const WEIGHTS = {
  publisher: 0.3,
  consumer: 0.2,
  broker: 0.3,
  cqrs: 0.15,
  saga: 0.15,
  eventStore: 0.1,
} as const;

function proportional(count: number, weight: number): number {
  if (count <= 0) return 0;
  return weight * (1 - Math.exp(-count / SATURATION_N));
}

/**
 * Banding cuts: <0.3 low, <0.6 med, otherwise high. Documented in
 * EdaConfidenceBand JSDoc and in methodology.ts.
 */
export function bandConfidence(confidence: number): EdaConfidenceBand {
  if (confidence < 0.3) return "low";
  if (confidence < 0.6) return "med";
  return "high";
}

/**
 * Run the EDA classifier over file-category counts.
 *
 * Returns either an `EdaResult` (signal floor met) or an
 * `InsufficientSignalResult` (below floor). Callers MUST narrow via
 * `isInsufficient()` before treating the result as a verdict.
 *
 * Signal floor: at least one of
 *   - ≥2 distinct categories with count > 0, OR
 *   - publisherFiles + consumerFiles ≥ 3.
 */
export function analyzeEda(
  sig: EdaSignals,
): EdaResult | InsufficientSignalResult {
  const categoriesPresent = [
    sig.publisherFiles,
    sig.consumerFiles,
    sig.brokerFiles,
    sig.cqrsFiles,
    sig.sagaFiles,
    sig.eventStoreFiles,
  ].filter((c) => c > 0).length;

  const producerConsumer = sig.publisherFiles + sig.consumerFiles;
  const floorMet = categoriesPresent >= 2 || producerConsumer >= 3;

  if (!floorMet) {
    return insufficient(
      "missing_signal",
      `EDA signal floor not met: only ${categoriesPresent} category(s) populated and producerFiles + consumerFiles = ${producerConsumer} (< 3). One file in one category is not enough to claim event-driven architecture.`,
      "Pass at least two non-empty categories (e.g. publisherFiles + brokerFiles) or ≥3 producer/consumer files combined.",
    );
  }

  const rawConfidence =
    proportional(sig.publisherFiles, WEIGHTS.publisher) +
    proportional(sig.consumerFiles, WEIGHTS.consumer) +
    proportional(sig.brokerFiles, WEIGHTS.broker) +
    proportional(sig.cqrsFiles, WEIGHTS.cqrs) +
    proportional(sig.sagaFiles, WEIGHTS.saga) +
    proportional(sig.eventStoreFiles, WEIGHTS.eventStore);

  const confidence = clamp(
    Math.round(rawConfidence * 100) / 100,
    0,
    1,
  );

  const patternsDetected: EdaPattern[] = [];
  if (sig.publisherFiles > 0 || sig.consumerFiles > 0) {
    patternsDetected.push("event_notification");
  }
  if (sig.eventStoreFiles > 0) patternsDetected.push("event_sourcing");
  if (sig.cqrsFiles > 0) patternsDetected.push("cqrs");
  if (sig.sagaFiles > 0) patternsDetected.push("saga");
  // eda-6 (pass-2): event_carried_state_transfer is a flag MODIFIER
  // on top of producer activity, not a standalone floor signal. Without
  // the `publisherFiles > 0` guard, a caller could pass
  // { brokerFiles:1, cqrsFiles:1, hasStateCarryingEvent:true } and the
  // pattern would emit even though there are no publishers shipping
  // state-carrying events.
  if (sig.hasStateCarryingEvent && sig.publisherFiles > 0) {
    patternsDetected.push("event_carried_state_transfer");
  }

  return {
    hasEda: true,
    confidence,
    confidenceBand: bandConfidence(confidence),
    patternsDetected,
    couplingIssueCount: sig.couplingIssueCount,
  };
}
