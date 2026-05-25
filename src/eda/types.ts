/**
 * Event-Driven Architecture detection. No 0-100 score — returns
 * hasEda, a 0..1 confidence, and the list of detected patterns.
 *
 * Signal shape mirrors the prism0x2A dashboard's `analyzeEDA`
 * file-category counts (producers, consumers, brokers, CQRS, sagas,
 * event-stores), each of which independently contributes to hasEda
 * and confidence.
 */

export type EdaPattern =
  | "event_notification"
  | "event_carried_state_transfer"
  | "event_sourcing"
  | "cqrs"
  | "saga";

export interface EdaSignals {
  /** Files matching producer/event-source heuristics. */
  publisherFiles: number;
  /** Files matching consumer/handler/listener/subscriber heuristics. */
  consumerFiles: number;
  /** Files matching broker/bus heuristics (Kafka, SNS/SQS, EventBridge, …). */
  brokerFiles: number;
  /** Files matching CQRS heuristics (*.Query.ts, *.Command.ts, /queries/, /commands/). */
  cqrsFiles: number;
  /** Files matching saga/orchestrator heuristics. */
  sagaFiles: number;
  /** Files matching event-store / EventStore heuristics. */
  eventStoreFiles: number;
  /** Producer→consumer pairs with no broker in between. */
  couplingIssueCount: number;
  /** True iff any producer file's name implies state-carrying (State/Snapshot). */
  hasStateCarryingEvent?: boolean;
}

export interface EdaResult {
  hasEda: boolean;
  /** 0..1 aggregate confidence in the EDA classification. */
  confidence: number;
  patternsDetected: EdaPattern[];
  couplingIssueCount: number;
}
