import type { Methodology } from "../core/methodology.js";

export const EIP_METHODOLOGY: Methodology = {
  definition:
    "Enterprise Integration Patterns — a vocabulary for asynchronous messaging architectures (channels, routers, transformers, endpoints, orchestrators). Gregor Hohpe & Bobby Woolf, Addison-Wesley 2003.",
  referenceUrl: "https://www.enterpriseintegrationpatterns.com/",
  referenceLabel: "enterpriseintegrationpatterns.com",
  signals: [
    "Lowercased filename and capability-name candidates (supplied by caller)",
    "Per-pattern presentSignals / possibleSignals regex catalog (18 patterns across 5 categories)",
    "Exclusion contract: callers MUST pre-strip __tests__, __fixtures__, *.mock.*, *.spec.*, *.test.* paths before invoking detectEipPatterns — see src/core/scanner-exclusions.ts",
  ],
  formula: {
    description:
      "Detection only — no 0-100 score. Each of the 18 patterns is matched against the candidate list: status = present (a presentSignals regex hit), possible (a possibleSignals regex hit), or absent. architectureType is inferred from the present pattern mix: unknown (presentCount === 0 — no opinion), event_driven_saga (Process Manager / Saga literal present + ≥2 messaging-infra present), event_driven_pubsub (Publish-Subscribe Channel literal present + ≥2 messaging-infra present), message_based (≥2 messaging-infra present), content_based_routing (≥2 routing present), point_to_point otherwise. Missing-pattern suggestions are gated on detectedCount ≥ 3 — below that floor no suggestions are emitted (avoids 'recommend Dead Letter because we found one bus file' noise).",
    codeRef: "src/eip/score.ts",
    snippet:
      "presentCount === 0           → architectureType = 'unknown'\nhasSaga = names.includes('Process Manager / Saga')   // literal, not regex on 'workflow'\nhasMsgInfra = present(category='messaging_infrastructure') >= 2\nhasPubSub = names.includes('Publish-Subscribe Channel') // literal\nbus regex tightened: /event[_-]?bus|service[_-]?bus|message[_-]?bus|(^|[/_-])bus(\\.|$|[/_-])/i\nMessage Filter present requires message_filter/event_filter (\\bfilter\\b demoted to possible)\nEvent-Driven Consumer drops generic on[A-Z][a-z]+\\., scoped to onMessage/onEvent\nmissingPatternSuggestions only emitted when presentCount >= 3",
  },
  coverage:
    "Detects 18 patterns across 5 categories (messaging infrastructure, routing, transformation, endpoints, orchestration). Because there is no headline score, refining the pattern set later won't shift anyone's published number.",
  honestGap:
    "Detection is regex-over-strings — it cannot tell production code apart from test fixtures. Callers are responsible for pre-filtering test/fixture/mock paths (see src/core/scanner-exclusions.ts). Tightened patterns (bus, filter, on*) reduce false positives but cannot eliminate them entirely.",
};
