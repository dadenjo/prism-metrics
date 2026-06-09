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

/**
 * @public
 * Counts of files matching each EDA file-category heuristic.
 *
 * Exclusion contract — IMPORTANT: every count below MUST exclude paths
 * matching `__tests__`, `__fixtures__`, `*.mock.*`, `*.spec.*`,
 * `*.test.*`, and any IGNORE_DIRS component. Test fixtures legitimately
 * use words like `producer`, `consumer`, `event-bus` for setup code
 * that does not represent production architecture. Use the shared
 * `shouldScanFile()` helper in `src/core/scanner-exclusions.ts` to
 * enforce the contract upstream.
 *
 * `analyzeEda` cannot itself tell test fixtures apart from production
 * — it only sees the integer counts you pass in.
 */
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

/**
 * Banded view of the 0..1 confidence number.
 *
 * Downstream UIs were inventing their own ad-hoc thresholds (>0.5 means
 * "real EDA", >0.7 means "strong", …). Surface a documented banding
 * here so the band is part of the methodology, not a consumer guess.
 *
 * Cuts: confidence < 0.3 → "low", < 0.6 → "med", otherwise "high".
 */
export type EdaConfidenceBand = "low" | "med" | "high";

export interface EdaResult {
  /**
   * True only when there is enough corroborating signal:
   * `≥2 distinct categories present` OR `publisherFiles + consumerFiles >= 3`.
   * Below that floor the scorer returns an `InsufficientSignalResult`
   * instead of an `EdaResult` — see `analyzeEda`'s return type.
   */
  hasEda: boolean;
  /** 0..1 aggregate confidence in the EDA classification. */
  confidence: number;
  /**
   * Banded confidence (low / med / high) with documented cuts. See
   * {@link EdaConfidenceBand}. Use this for UI badges rather than
   * reinventing thresholds against `confidence`.
   */
  confidenceBand: EdaConfidenceBand;
  patternsDetected: EdaPattern[];
  couplingIssueCount: number;
}
