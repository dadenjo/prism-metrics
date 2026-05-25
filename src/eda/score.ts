/**
 * EDA detection — returns hasEda, a confidence value, and the list of
 * patterns whose hit count exceeded threshold.
 */

import { clamp } from "../core/methodology.js";
import type { EdaPattern, EdaResult, EdaSignals } from "./types.js";

const PATTERN_THRESHOLD = 1;

export function analyzeEda(sig: EdaSignals): EdaResult {
  const totalActors = sig.publisherFiles + sig.consumerFiles + sig.brokerFiles;
  const hasEda = totalActors >= 2 && sig.publisherFiles > 0 && sig.consumerFiles > 0;

  const patternsDetected = (Object.keys(sig.patternHits) as EdaPattern[]).filter(
    (k) => sig.patternHits[k] >= PATTERN_THRESHOLD,
  );

  // Confidence: 0.3 base if any actor, +0.2 per side covered (pub/con/broker),
  // +0.05 per detected pattern, capped at 1.
  let confidence = 0;
  if (totalActors > 0) confidence += 0.3;
  if (sig.publisherFiles > 0) confidence += 0.2;
  if (sig.consumerFiles > 0) confidence += 0.2;
  if (sig.brokerFiles > 0) confidence += 0.1;
  confidence += patternsDetected.length * 0.05;
  confidence = clamp(Number(confidence.toFixed(2)), 0, 1);

  return {
    hasEda,
    confidence,
    patternsDetected,
    couplingIssueCount: sig.couplingIssueCount,
  };
}
