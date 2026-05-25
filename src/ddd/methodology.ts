import type { Methodology } from "../core/methodology.js";

export const DDD_METHODOLOGY: Methodology = {
  definition:
    "Domain-Driven Design — strategic patterns for tackling complex software domains: Bounded Contexts, Ubiquitous Language, Context Maps, Aggregates, Domain Events. Eric Evans, Domain-Driven Design (2003).",
  referenceUrl: "https://www.domainlanguage.com/ddd/",
  referenceLabel: "domainlanguage.com",
  signals: [
    "Capability list classified into core / supporting / generic subdomains (by caller)",
    "Inter-capability dependency relationships labelled as one of the seven DDD context-map kinds",
    "Counts of ubiquitous-language terms and inferred domain events",
  ],
  formula: {
    description:
      "No 0-100 score. Tabulates subdomain counts, relationship counts, isolated-context count, and surfaces the upstream ubiquitous-term and domain-event totals.",
    codeRef: "src/ddd/score.ts",
  },
  honestGap:
    "Classifications are heuristic and supplied by the caller. No Evans text is reproduced — derivations come from applying internal vocabulary to capability names + dependency patterns.",
};
