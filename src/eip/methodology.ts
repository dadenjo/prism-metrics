import type { Methodology } from "../core/methodology.js";

export const EIP_METHODOLOGY: Methodology = {
  definition:
    "Enterprise Integration Patterns — a vocabulary for asynchronous messaging architectures (channels, routers, transformers, endpoints, orchestrators). Gregor Hohpe & Bobby Woolf, Addison-Wesley 2003.",
  referenceUrl: "https://www.enterpriseintegrationpatterns.com/",
  referenceLabel: "enterpriseintegrationpatterns.com",
  signals: [
    "Lowercased filename and capability-name candidates (supplied by caller)",
    "Per-pattern presentSignals / possibleSignals regex catalog (18 patterns across 5 categories)",
  ],
  formula: {
    description:
      "Detection only — no 0-100 score. Each of the 18 patterns is matched against the candidate list: status = present (a presentSignals regex hit), possible (a possibleSignals regex hit), or absent. architectureType is inferred from the present pattern mix: event_driven_saga (saga + messaging), event_driven_pubsub (pub/sub + messaging), message_based (≥2 messaging-infra present), content_based_routing (≥2 routing present), point_to_point otherwise. Missing-pattern suggestions surface common gaps (Dead Letter Channel, Idempotent Receiver, Message Translator, Saga).",
    codeRef: "src/eip/score.ts",
  },
  coverage:
    "Detects 18 patterns across 5 categories (messaging infrastructure, routing, transformation, endpoints, orchestration). Because there is no headline score, refining the pattern set later won't shift anyone's published number.",
};
