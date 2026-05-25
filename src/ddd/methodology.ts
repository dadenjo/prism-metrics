import type { Methodology } from "../core/methodology.js";

export const DDD_METHODOLOGY: Methodology = {
  definition:
    "Domain-Driven Design — strategic patterns for tackling complex software domains: Bounded Contexts, Ubiquitous Language, Context Maps, Aggregates, Domain Events. Eric Evans, Domain-Driven Design (Addison-Wesley, 2003).",
  referenceUrl: "https://www.domainlanguage.com/ddd/",
  referenceLabel: "domainlanguage.com",
  signals: [
    "Capability id + name + optional criticality (for classifyContext → generic / core_domain / supporting)",
    "Name + description (for extractUbiquitousLanguage)",
    "Per-relation flags: fromDependsOnTo, toDependsOnFrom, toFanIn, toType, fromType (for inferRelationshipPattern)",
    "Counts of ubiquitous-language terms and inferred domain events",
  ],
  formula: {
    description:
      "No 0-100 score. classifyContext walks generic keywords first, then core-business keywords or criticality=critical, else supporting. extractUbiquitousLanguage capitalises and dedupes up to 12 non-stopword tokens from name+description. inferRelationshipPattern returns partnership (mutual deps), open_host_service (toFanIn ≥ 3), conformist (toType=generic), anticorruption_layer (core → supporting), else upstream_downstream. analyzeDdd aggregates subdomain + relationship counts + isolated-context count.",
    codeRef: "src/ddd/score.ts",
    snippet:
      "classifyContext: generic-words first → core (critical || core-words) → supporting\ninferRelationshipPattern: mutual → partnership\n  | fanIn>=3 → open_host_service\n  | toType=generic → conformist\n  | core→supporting → anticorruption_layer\n  | else → upstream_downstream",
  },
  honestGap:
    "Classifications are keyword-based: a custom-built solution whose name contains 'auth' will be classified generic. No Evans text is reproduced.",
};
