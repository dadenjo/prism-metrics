/**
 * EIP detection — derive per-pattern status and an inferred
 * architecture-type label. No 0-100 score is emitted.
 */

import type {
  EipArchitectureType,
  EipPattern,
  EipPatternResult,
  EipPatternStatus,
  EipResult,
  EipSignals,
} from "./types.js";

const MESSAGE_DRIVEN_PATTERNS: EipPattern[] = [
  "message_channel",
  "message_router",
  "publish_subscribe",
  "command_message",
];

function statusFor(filenameMatches: number, capabilityMatches: number): EipPatternStatus {
  if (filenameMatches > 0 && capabilityMatches > 0) return "present";
  if (filenameMatches > 0 || capabilityMatches > 0) return "possible";
  return "absent";
}

export function analyzeEip(sig: EipSignals): EipResult {
  const patterns: EipPatternResult[] = sig.patterns.map((p) => ({
    pattern: p.pattern,
    status: statusFor(p.filenameMatches, p.capabilityMatches),
  }));
  const presentCount = patterns.filter((p) => p.status === "present").length;
  const possibleCount = patterns.filter((p) => p.status === "possible").length;

  const messageDrivenPresent = patterns.filter(
    (p) => p.status === "present" && MESSAGE_DRIVEN_PATTERNS.includes(p.pattern),
  ).length;
  const requestReplyPresent = patterns.find((p) => p.pattern === "request_reply")?.status === "present";

  let architectureType: EipArchitectureType;
  if (presentCount === 0) architectureType = "unclassified";
  else if (messageDrivenPresent >= 2 && requestReplyPresent) architectureType = "mixed";
  else if (messageDrivenPresent >= 1) architectureType = "message_driven";
  else if (requestReplyPresent) architectureType = "request_response";
  else architectureType = "unclassified";

  return { patterns, presentCount, possibleCount, architectureType };
}
