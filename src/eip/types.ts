/**
 * Enterprise Integration Patterns — detection only. No 0-100 score.
 *
 * Pattern set (18) and detection regexes mirror the prism0x2A dashboard's
 * `enterpriseIntegrationPatterns` module. The pattern vocabulary itself
 * (Message Channel, Aggregator, Saga, …) is from Hohpe & Woolf,
 * "Enterprise Integration Patterns" (Addison-Wesley, 2003).
 */

export type EipPatternStatus = "present" | "possible" | "absent";

export type EipCategory =
  | "messaging_infrastructure"
  | "routing"
  | "transformation"
  | "endpoints"
  | "orchestration";

export interface EipPatternDef {
  /** Human-readable pattern name (e.g. "Message Channel"). */
  name: string;
  description: string;
  category: EipCategory;
  /** Regex signals strong enough to mark the pattern "present". */
  presentSignals: RegExp[];
  /** Weaker signals that mark the pattern "possible". */
  possibleSignals: RegExp[];
}

export interface EipPatternResult {
  name: string;
  category: EipCategory;
  status: EipPatternStatus;
  /** Up to 5 candidate strings that triggered detection. */
  signals: string[];
}

/**
 * Inferred high-level architecture style derived from the present
 * pattern mix. Mirrors dashboard's `inferArchitectureType` output.
 */
/**
 * Inferred high-level architecture style.
 *
 * `"unknown"` is returned when zero patterns are present — we do not
 * silently fall through to `"point_to_point"` because that is an
 * opinionated default that misrepresents "no signal" as "we measured
 * point-to-point". Callers should render `"unknown"` as N/A.
 */
export type EipArchitectureType =
  | "event_driven_saga"
  | "event_driven_pubsub"
  | "message_based"
  | "content_based_routing"
  | "point_to_point"
  | "unknown";

export interface EipResult {
  patterns: EipPatternResult[];
  presentCount: number;
  possibleCount: number;
  absentCount: number;
  architectureType: EipArchitectureType;
  missingPatternSuggestions: string[];
}
