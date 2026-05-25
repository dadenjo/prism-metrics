/**
 * EDA detection — mirrors prism0x2A dashboard's `analyzeEDA`:
 *   hasEda     = ANY of producers/consumers/brokers/cqrs/sagas > 0
 *   confidence = 0.3·prod + 0.2·con + 0.3·broker + 0.15·cqrs
 *                + 0.15·saga + 0.1·eventStore, capped at 1.
 */

import { clamp } from "../core/methodology.js";
import type { EdaPattern, EdaResult, EdaSignals } from "./types.js";

export function analyzeEda(sig: EdaSignals): EdaResult {
  const hasEda =
    sig.publisherFiles > 0 ||
    sig.consumerFiles > 0 ||
    sig.brokerFiles > 0 ||
    sig.cqrsFiles > 0 ||
    sig.sagaFiles > 0;

  let confidence = 0;
  if (sig.publisherFiles > 0) confidence += 0.3;
  if (sig.consumerFiles > 0) confidence += 0.2;
  if (sig.brokerFiles > 0) confidence += 0.3;
  if (sig.cqrsFiles > 0) confidence += 0.15;
  if (sig.sagaFiles > 0) confidence += 0.15;
  if (sig.eventStoreFiles > 0) confidence += 0.1;
  confidence = clamp(Math.round(confidence * 100) / 100, 0, 1);

  const patternsDetected: EdaPattern[] = [];
  if (sig.publisherFiles > 0 || sig.consumerFiles > 0) {
    patternsDetected.push("event_notification");
  }
  if (sig.eventStoreFiles > 0) patternsDetected.push("event_sourcing");
  if (sig.cqrsFiles > 0) patternsDetected.push("cqrs");
  if (sig.sagaFiles > 0) patternsDetected.push("saga");
  if (sig.hasStateCarryingEvent) {
    patternsDetected.push("event_carried_state_transfer");
  }

  return {
    hasEda,
    confidence,
    patternsDetected,
    couplingIssueCount: sig.couplingIssueCount,
  };
}
