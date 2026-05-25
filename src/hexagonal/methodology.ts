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
  ],
  formula: {
    description:
      "Start at 100. Subtract 12 per dependency-rule violation. Subtract 20 if adapters exist with zero ports defined. Empty registry scores 100. coreCount === 0 (with non-empty registry) surfaces a missingCore flag.",
    codeRef: "src/hexagonal/score.ts",
    snippet: "score = max(0, 100 - 12*violations - 20*(adaptersWithoutPorts))",
  },
  honestGap:
    "Same naming-heuristic limitation as Clean Architecture — hex elements are inferred upstream from capability names + file paths. Unconventional naming can mis-classify components.",
};
