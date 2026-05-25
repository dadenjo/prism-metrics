import type { Methodology } from "../core/methodology.js";

export const EDA_METHODOLOGY: Methodology = {
  definition:
    "Event-Driven Architecture — components communicate via published events rather than direct synchronous calls. Patterns include event notification, event-carried state transfer, event sourcing, CQRS, and saga.",
  referenceUrl: "https://martinfowler.com/articles/201701-event-driven.html",
  referenceLabel: "Fowler — What do you mean by 'Event-Driven'?",
  signals: [
    "Publisher / consumer / broker / CQRS / saga / event-store file counts (supplied by caller)",
    "Optional `hasStateCarryingEvent` flag (true when a producer file name implies State/Snapshot)",
    "Coupling-issue count from publisher→consumer pairs lacking a broker in between",
  ],
  formula: {
    description:
      "hasEda when ANY file-category > 0 (producer OR consumer OR broker OR CQRS OR saga). Confidence is a weighted sum: 0.3·producer + 0.2·consumer + 0.3·broker + 0.15·cqrs + 0.15·saga + 0.1·eventStore, capped at 1.",
    codeRef: "src/eda/score.ts",
    snippet:
      "hasEda = producers>0 || consumers>0 || brokers>0 || cqrs>0 || sagas>0\nconfidence = min(1, 0.3·prod + 0.2·con + 0.3·brk + 0.15·cqrs + 0.15·saga + 0.1·store)",
  },
  honestGap:
    "Detection signals are typically filename-only and miss event-emitter usage written inline (e.g. EventBus.emit() in a file named generic 'service.ts'). The explicit confidence field is meant to manage expectations.",
};
