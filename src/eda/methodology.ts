import type { Methodology } from "../core/methodology.js";

export const EDA_METHODOLOGY: Methodology = {
  definition:
    "Event-Driven Architecture — components communicate via published events rather than direct synchronous calls. Patterns include event notification, event-carried state transfer, event sourcing, CQRS, and saga.",
  referenceUrl: "https://martinfowler.com/articles/201701-event-driven.html",
  referenceLabel: "Fowler — What do you mean by 'Event-Driven'?",
  signals: [
    "Publisher / consumer / broker file counts (supplied by caller)",
    "Per-pattern file-match counts (event notification / event-carried state / event sourcing / CQRS / saga)",
    "Coupling-issue count from publisher↔consumer pairs that share a synchronous-coupling smell",
  ],
  formula: {
    description:
      "hasEda when total publisher+consumer+broker >= 2 with at least one publisher and one consumer. Confidence aggregates side-coverage and detected-pattern count, capped at 1.",
    codeRef: "src/eda/score.ts",
  },
  honestGap:
    "Detection signals are typically filename-only and miss event-emitter usage written inline (e.g. EventBus.emit() in a file named generic 'service.ts'). The explicit confidence field is meant to manage expectations.",
};
