/**
 * Enterprise Integration Patterns detection — mirrors the prism0x2A
 * dashboard's `analyzeEnterpriseIntegrationPatterns`.
 *
 * Two entry points:
 *   - `detectEipPatterns(candidates)` — run the 18-pattern regex catalog
 *     against lowercased filename/capability strings; returns per-pattern
 *     status + a few example matched candidates.
 *   - `analyzeEip(patterns)`         — combine per-pattern results into
 *     overall counts, architecture-type label, and a list of
 *     missing-pattern suggestions.
 *
 * Exclusion contract — IMPORTANT: `detectEipPatterns` runs raw regex
 * tests over caller-supplied strings with no production/test/fixture
 * distinction. A file `event-bus.mock.ts` will match Message Bus + Saga
 * trivially. Callers MUST pre-filter their candidate list against
 * test/fixture/mock paths BEFORE invoking this function. The shared
 * primitives in `src/core/scanner-exclusions.ts` (`shouldScanFile`,
 * `IGNORE_DIRS`, `TEST_FILE_PATTERNS`) are the supported way to do this.
 */

import type {
  EipArchitectureType,
  EipPatternDef,
  EipPatternResult,
  EipResult,
} from "./types.js";

// ─── Pattern catalog (18 patterns) ────────────────────────────────────────────

export const EIP_PATTERN_DEFS: EipPatternDef[] = [
  // ── Messaging Infrastructure ────────────────────────────────────────────
  {
    name: "Message Channel",
    description:
      "A typed conduit through which two applications connect and communicate",
    category: "messaging_infrastructure",
    presentSignals: [
      /channel/i,
      /\bqueue\b/i,
      /message[_-]?bus/i,
      /event[_-]?bus/i,
      /broker/i,
      /kafka/i,
      /rabbitmq/i,
      /sqs/i,
      /pubsub/i,
    ],
    possibleSignals: [/topic/i, /stream/i, /pipe/i],
  },
  {
    name: "Message Bus",
    description:
      "Shared communication channel enabling many applications to send and receive messages",
    category: "messaging_infrastructure",
    // eip-2: `\bbus\b` matched `business`, `omnibus`, `busy`. Anchor to a
    // qualified bus identifier: event_bus / message_bus / service_bus / a
    // bare `bus` only when followed by end / dot / slash (filename or
    // property access). `\bbus\b` alone is too generic for production scans.
    presentSignals: [
      /event[_-]?bus(?![a-z])/i,
      /service[_-]?bus(?![a-z])/i,
      /message[_-]?bus(?![a-z])/i,
      /(^|[/_-])bus(\.|$|[/_-])/i,
    ],
    possibleSignals: [/dispatcher/i, /mediator/i],
  },
  {
    name: "Publish-Subscribe Channel",
    description:
      "Producer sends a message to all interested consumers simultaneously",
    category: "messaging_infrastructure",
    presentSignals: [
      /pubsub/i,
      /publish/i,
      /subscribe/i,
      /\bemit\b/i,
      /event[_-]?emitter/i,
      /\blistener/i,
    ],
    possibleSignals: [/broadcast/i, /fanout/i, /\btopic\b/i],
  },
  {
    name: "Dead Letter Channel",
    description: "Channel for messages that cannot be delivered or processed",
    category: "messaging_infrastructure",
    presentSignals: [
      /dead[_-]?letter/i,
      /dlq/i,
      /dead[_-]?queue/i,
      /poison[_-]?message/i,
    ],
    possibleSignals: [/retry[_-]?queue/i, /failed[_-]?message/i],
  },

  // ── Routing ──────────────────────────────────────────────────────────────
  {
    name: "Message Router",
    description:
      "Routes each message to the correct receiver based on conditions",
    category: "routing",
    presentSignals: [/router/i, /dispatcher/i, /\broute\b/i, /message[_-]?router/i],
    possibleSignals: [/handler[_-]?map/i, /switch.*message/i],
  },
  {
    name: "Content-Based Router",
    description: "Routes messages to different channels based on message content",
    category: "routing",
    presentSignals: [
      /content[_-]?router/i,
      /conditional[_-]?router/i,
      /rule[_-]?engine/i,
    ],
    possibleSignals: [/\bfilter\b/i, /message[_-]?filter/i],
  },
  {
    name: "Message Filter",
    description: "Eliminates undesired messages from a channel based on criteria",
    category: "routing",
    // eip-2: `\bfilter\b` alone is too generic (matches every UI filter,
    // array filter, search filter). Require message_filter / event_filter
    // or filter co-occurring with explicit messaging context.
    presentSignals: [/message[_-]?filter/i, /event[_-]?filter/i],
    possibleSignals: [/\bfilter\b/i, /predicate/i, /guard/i, /interceptor/i],
  },
  {
    name: "Splitter",
    description:
      "Breaks up a composite message into a series of individual messages",
    category: "routing",
    presentSignals: [/splitter/i, /\bsplit\b/i, /\bpartition\b/i, /batch[_-]?split/i],
    possibleSignals: [/chunk/i, /slice/i, /segment/i],
  },
  {
    name: "Aggregator",
    description:
      "Combines multiple related messages into a single composite message",
    category: "routing",
    presentSignals: [/aggregator/i, /\baggregate\b/i, /collector/i, /gather/i],
    possibleSignals: [/combiner/i, /merger/i, /\bmerge\b/i],
  },

  // ── Transformation ───────────────────────────────────────────────────────
  {
    name: "Message Translator",
    description: "Translates one data format to another",
    category: "transformation",
    presentSignals: [
      /translator/i,
      /transformer/i,
      /\btransform\b/i,
      /\bmap[_-]?to\b/i,
      /\bnormalize\b/i,
      /\benrich\b/i,
    ],
    possibleSignals: [/converter/i, /mapper/i, /adapter/i],
  },
  {
    name: "Content Enricher",
    description: "Augments a message with additional data from external sources",
    category: "transformation",
    presentSignals: [/enricher/i, /\benrich\b/i, /augment/i, /decorate/i],
    possibleSignals: [/lookup/i, /hydrat/i, /expand/i],
  },
  {
    name: "Content Filter",
    description: "Removes unimportant data items from a message",
    category: "transformation",
    presentSignals: [/content[_-]?filter/i, /\bstrip\b/i, /sanitiz/i, /\bpurge\b/i],
    possibleSignals: [/\bclean\b/i, /\bscrub\b/i, /\bremove[_-]?field/i],
  },
  {
    name: "Normalizer",
    description:
      "Routes messages through different transformers to produce an equivalent format",
    category: "transformation",
    presentSignals: [/normaliz/i, /canonicali/i, /standardiz/i],
    possibleSignals: [/\bformat\b/i, /\bconvert\b/i, /\bparse\b/i],
  },

  // ── Endpoints ─────────────────────────────────────────────────────────────
  {
    name: "Polling Consumer",
    description: "Application periodically checks for messages",
    category: "endpoints",
    presentSignals: [
      /poller/i,
      /polling/i,
      /poll[_-]?consumer/i,
      /\bcron\b/i,
      /scheduled[_-]?job/i,
      /scheduler/i,
    ],
    possibleSignals: [/\bscan\b/i, /periodic/i, /\binterval\b/i],
  },
  {
    name: "Event-Driven Consumer",
    description: "Receives messages as they arrive, automatically",
    category: "endpoints",
    // eip-3: `on[A-Z][a-z]+\.` matched `onClick.something`, making every
    // React app present. Scope to message/event handlers only.
    presentSignals: [
      /event[_-]?handler/i,
      /event[_-]?consumer/i,
      /\bwebhook\b/i,
      /\blistener\b/i,
      /\bsubscriber\b/i,
      /\bonMessage\b/,
      /\bonEvent\b/,
    ],
    possibleSignals: [/callback/i, /\bhook\b/i],
  },
  {
    name: "Idempotent Receiver",
    description: "Handles duplicate messages safely",
    category: "endpoints",
    presentSignals: [
      /idempotent/i,
      /dedup/i,
      /deduplicate/i,
      /idempotency[_-]?key/i,
    ],
    possibleSignals: [/message[_-]?id/i, /\bnonce\b/i, /\bonce\b/i],
  },

  // ── Orchestration ─────────────────────────────────────────────────────────
  {
    name: "Process Manager / Saga",
    description:
      "Manages a complex multi-step business transaction with compensation",
    category: "orchestration",
    presentSignals: [
      /\bsaga\b/i,
      /process[_-]?manager/i,
      /orchestrat/i,
      /\bworkflow\b/i,
      /choreograph/i,
      /compensat/i,
    ],
    possibleSignals: [/\bstate[_-]?machine\b/i, /\bfsm\b/i, /\blong[_-]?running/i],
  },
  {
    name: "Scatter-Gather",
    description: "Broadcasts to multiple recipients and re-aggregates their replies",
    category: "orchestration",
    presentSignals: [
      /scatter[_-]?gather/i,
      /fan[_-]?out.*fan[_-]?in/i,
      /broadcast.*collect/i,
    ],
    possibleSignals: [/parallel.*aggregate/i, /\bfork.*join\b/i],
  },
];

// ─── Detection from raw candidate strings ─────────────────────────────────────

function testSignals(candidates: string[], patterns: RegExp[]): string[] {
  const matched: string[] = [];
  for (const candidate of candidates) {
    for (const p of patterns) {
      if (p.test(candidate)) {
        matched.push(candidate);
        break;
      }
    }
  }
  return [...new Set(matched)].slice(0, 5);
}

/**
 * Run the 18-pattern catalog against a list of lowercased filename
 * and capability-name candidates. Returns one EipPatternResult per
 * pattern, with status ∈ {present, possible, absent} and up to 5
 * matched candidate strings.
 *
 * Caller exclusion contract (see file-level docstring): callers MUST
 * pre-filter their candidate strings to exclude paths matching
 * `__tests__`, `__fixtures__`, `*.mock.*`, `*.spec.*`, `*.test.*`. The
 * shared `shouldScanFile()` helper in `src/core/scanner-exclusions.ts`
 * implements this contract. Without that pre-filter, a file named
 * `event-bus.mock.ts` will trip Message Bus / Process Manager / Saga
 * detection trivially.
 */
export function detectEipPatterns(candidates: string[]): EipPatternResult[] {
  return EIP_PATTERN_DEFS.map((def) => {
    const presentMatches = testSignals(candidates, def.presentSignals);
    if (presentMatches.length > 0) {
      return {
        name: def.name,
        category: def.category,
        status: "present" as const,
        signals: presentMatches,
      };
    }
    const possibleMatches = testSignals(candidates, def.possibleSignals);
    if (possibleMatches.length > 0) {
      return {
        name: def.name,
        category: def.category,
        status: "possible" as const,
        signals: possibleMatches,
      };
    }
    return {
      name: def.name,
      category: def.category,
      status: "absent" as const,
      signals: [],
    };
  });
}

// ─── Architecture-type inference ──────────────────────────────────────────────

function inferArchitectureType(patterns: EipPatternResult[]): EipArchitectureType {
  const presentResults = patterns.filter((p) => p.status === "present");
  const presentCount = presentResults.length;

  // eip-5: empty input no longer lands silently on "point_to_point" (an
  // opinionated default). With zero present patterns we genuinely don't
  // know — surface that as "unknown".
  if (presentCount === 0) return "unknown";

  const presentNames = presentResults.map((p) => p.name);

  const msgInfraPresent = patterns.filter(
    (p) => p.category === "messaging_infrastructure" && p.status === "present",
  );
  const hasMsgInfra = msgInfraPresent.length >= 2;

  // eip-4: workflow / orchestration keywords in OTHER capability names
  // ("Workflow Engine") used to trip hasSaga via /workflow/. Tighten to
  // the literal pattern name so Saga inference requires actual Saga.
  const hasSaga = presentNames.includes("Process Manager / Saga");
  const hasPubSub = presentNames.includes("Publish-Subscribe Channel");

  const hasRouting =
    patterns.filter((p) => p.category === "routing" && p.status === "present")
      .length >= 2;

  if (hasSaga && hasMsgInfra) return "event_driven_saga";
  if (hasPubSub && hasMsgInfra) return "event_driven_pubsub";
  if (hasMsgInfra) return "message_based";
  if (hasRouting) return "content_based_routing";
  return "point_to_point";
}

function buildMissingSuggestions(patterns: EipPatternResult[]): string[] {
  const suggestions: string[] = [];
  const detectedCount = patterns.filter((p) => p.status === "present").length;

  // eip-6: gate ALL missing-pattern suggestions on a meaningful
  // detection floor. Recommending Dead Letter / Idempotent Receiver
  // because we found one Message Bus hit is over-eager and noisy.
  if (detectedCount < 3) return suggestions;

  const hasMessaging = patterns.some(
    (p) => p.category === "messaging_infrastructure" && p.status === "present",
  );
  const hasRouting = patterns.some(
    (p) => p.category === "routing" && p.status === "present",
  );
  const hasSaga = patterns.some(
    (p) => p.name === "Process Manager / Saga" && p.status === "present",
  );
  const isPresent = (name: string) =>
    patterns.some((p) => p.name === name && p.status === "present");

  if (hasMessaging && !isPresent("Dead Letter Channel")) {
    suggestions.push(
      "Consider adding a Dead Letter Channel for undeliverable messages",
    );
  }
  if (hasMessaging && !isPresent("Idempotent Receiver")) {
    suggestions.push(
      "Idempotent Receiver is recommended when message delivery is at-least-once",
    );
  }
  if (hasRouting && !isPresent("Message Translator")) {
    suggestions.push(
      "Add a Message Translator if routing crosses system boundaries with different schemas",
    );
  }
  if (hasMessaging && !hasSaga && detectedCount >= 4) {
    suggestions.push(
      "A Saga / Process Manager pattern may help coordinate distributed transactions",
    );
  }
  return suggestions;
}

/**
 * Combine per-pattern detection results into the full EipResult:
 * status counts, architecture-type label, and missing-pattern
 * suggestions.
 */
export function analyzeEip(
  patterns: EipPatternResult[] | { candidates: string[] },
): EipResult {
  const resolved: EipPatternResult[] = Array.isArray(patterns)
    ? patterns
    : detectEipPatterns(patterns.candidates);

  const presentCount = resolved.filter((p) => p.status === "present").length;
  const possibleCount = resolved.filter((p) => p.status === "possible").length;
  const absentCount = resolved.filter((p) => p.status === "absent").length;

  return {
    patterns: resolved,
    presentCount,
    possibleCount,
    absentCount,
    architectureType: inferArchitectureType(resolved),
    missingPatternSuggestions: buildMissingSuggestions(resolved),
  };
}
