import type { Methodology } from "../core/methodology.js";

export const HEXAGONAL_METHODOLOGY: Methodology = {
  definition:
    "Hexagonal (Ports & Adapters) architecture: a core domain surrounded by inbound/outbound ports that primary and secondary adapters plug into. Alistair Cockburn, 'Hexagonal architecture' (2005).",
  referenceUrl: "https://alistair.cockburn.us/hexagonal-architecture/",
  referenceLabel: "Hexagonal Architecture (Cockburn)",
  signals: [
    "Capabilities classified into 6 hex elements (core / inbound port / outbound port / primary adapter / secondary adapter / infrastructure)",
    "depends_on graph used to detect Dependency Rule violations (e.g. core depending on adapter)",
    "Presence/absence of ports when adapters exist",
    "Callers MUST filter through src/core/scanner-exclusions.ts BEFORE counting (excludedPaths round-trips for audit).",
  ],
  formula: {
    description:
      "Start at 100. Subtract `min(60, 12 * dependencyViolations)` — the per-violation deduction is capped so the score is not single-handedly pegged at 0 by violations alone (previously 9 violations ⇒ 0). Subtract 20 (additive on top of the cap) if adapters exist with zero ports defined. Empty registry (coreCount + portCount + adapterCount === 0) returns an InsufficientSignalResult — no data is not A+. coreCount === 0 with non-empty registry ALSO returns InsufficientSignalResult: missingCore is a structural break that means the registry is not a hexagon, and grading it 100/A+ alongside a missingCore=true flag is contradictory. Grade and structural flags must agree.",
    codeRef: "src/hexagonal/score.ts",
    snippet: "score = max(0, 100 - min(60, 12*violations) - 20*(adaptersWithoutPorts))",
  },
  honestGap:
    "Same naming-heuristic limitation as Clean Architecture — hex elements are inferred upstream from capability names + file paths. Unconventional naming can mis-classify components. The scorer is zero-I/O; callers MUST pre-filter through src/core/scanner-exclusions.ts.",
};
