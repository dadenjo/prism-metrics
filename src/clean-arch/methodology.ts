import type { Methodology } from "../core/methodology.js";

export const CLEAN_ARCH_METHODOLOGY: Methodology = {
  definition:
    "Concentric architectural layers (Entities → Use Cases → Interface Adapters → Frameworks & Drivers) governed by the Dependency Rule: source code dependencies point only inward. Robert C. Martin, Clean Architecture (2017).",
  referenceUrl: "https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html",
  referenceLabel: "The Clean Architecture (Uncle Bob)",
  signals: [
    "Capability list classified into 4 layers (entities / use_cases / interface_adapters / frameworks_drivers) or unknown",
    "depends_on graph: each edge tagged by the layer-distance it skips",
  ],
  formula: {
    description:
      "Start at 100. For each violating edge: subtract 15 (critical / inner depends on outermost), 8 (medium / 2-layer skip), 4 (adjacent / 1-layer skip). Floor at 0. When > 30% of capabilities are 'unknown', surface an explicit insight.",
    codeRef: "src/clean-arch/score.ts",
    snippet:
      "score = max(0, 100 - 15*critical - 8*medium - 4*adjacent)",
  },
  honestGap:
    "Layer classification typically depends on capability-name heuristics (e.g. a name containing 'user-service' becomes use_cases). Mis-named or unconventional components silently mis-classify; the > 30% unknown insight catches the egregious cases.",
};
