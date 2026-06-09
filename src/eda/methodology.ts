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
    "Exclusion contract: every count above MUST exclude test/fixture/mock paths — see src/core/scanner-exclusions.ts (`shouldScanFile`)",
  ],
  formula: {
    description:
      "hasEda requires a corroboration floor: ≥2 distinct categories present, OR producerFiles + consumerFiles ≥ 3. Below the floor the scorer returns an InsufficientSignalResult ({ ok: false, reason: 'missing_signal', detail, hint }) rather than inventing hasEda=true from a single weak signal. Above the floor, confidence is a SATURATING weighted sum: each category contributes weight · (1 − exp(−count / N)) with N=3, so one publisher file ≠ a thousand. Weights: 0.3·prod + 0.2·con + 0.3·brk + 0.15·cqrs + 0.15·saga + 0.1·store, capped at 1. The 0..1 confidence is also surfaced as a banded confidenceBand: <0.3 'low', <0.6 'med', otherwise 'high'.",
    codeRef: "src/eda/score.ts",
    snippet:
      "floor = categoriesPresent >= 2 || (publisherFiles + consumerFiles) >= 3\nif !floor → InsufficientSignalResult(reason='missing_signal')\nproportional(c, w) = w * (1 - exp(-c / 3))\nconfidence = min(1, Σ proportional(count_i, weight_i))\nconfidenceBand = confidence<0.3 'low' | <0.6 'med' | 'high'",
  },
  honestGap:
    "Detection signals are typically filename-only and miss event-emitter usage written inline (e.g. EventBus.emit() in a file named generic 'service.ts'). The banded `confidenceBand` and the InsufficientSignalResult escape hatch are meant to manage expectations honestly. Callers are responsible for excluding test/fixture/mock paths from their counts — analyzeEda cannot distinguish them.",
};
