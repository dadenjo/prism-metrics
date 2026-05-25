/**
 * Enterprise Integration Patterns — detection only. Each pattern
 * status is present (both filename and capability match), possible
 * (one match), or absent.
 */

export type EipPatternStatus = "present" | "possible" | "absent";

export type EipPattern =
  | "message_channel"
  | "message_router"
  | "message_translator"
  | "message_endpoint"
  | "publish_subscribe"
  | "command_message"
  | "request_reply"
  | "process_manager";

export interface EipPatternMatches {
  pattern: EipPattern;
  /** How many filenames matched. */
  filenameMatches: number;
  /** How many capability names matched. */
  capabilityMatches: number;
}

export interface EipSignals {
  patterns: EipPatternMatches[];
}

export interface EipPatternResult {
  pattern: EipPattern;
  status: EipPatternStatus;
}

export type EipArchitectureType =
  | "message_driven"
  | "request_response"
  | "mixed"
  | "unclassified";

export interface EipResult {
  patterns: EipPatternResult[];
  presentCount: number;
  possibleCount: number;
  architectureType: EipArchitectureType;
}
