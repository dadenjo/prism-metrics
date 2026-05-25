/**
 * Event-Driven Architecture detection. No 0-100 score.
 */

export type EdaPattern =
  | "event_notification"
  | "event_carried_state_transfer"
  | "event_sourcing"
  | "cqrs"
  | "saga";

export interface EdaSignals {
  publisherFiles: number;
  consumerFiles: number;
  brokerFiles: number;
  /** Aggregate counts of files matching each pattern signal. */
  patternHits: Record<EdaPattern, number>;
  /** Publisher↔consumer pairs that share a synchronous coupling smell. */
  couplingIssueCount: number;
}

export interface EdaResult {
  hasEda: boolean;
  /** 0..1 aggregate confidence in the EDA classification. */
  confidence: number;
  patternsDetected: EdaPattern[];
  couplingIssueCount: number;
}
