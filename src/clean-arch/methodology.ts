import type { Methodology } from "../core/methodology.js";

export const CLEAN_ARCH_METHODOLOGY: Methodology = {
  definition:
    "Concentric architectural layers (Entities → Use Cases → Interface Adapters → Frameworks & Drivers) governed by the Dependency Rule: source code dependencies point only inward. Robert C. Martin, Clean Architecture (2017).",
  referenceUrl: "https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html",
  referenceLabel: "The Clean Architecture (Uncle Bob)",
  signals: [
    "Capability list classified into 4 layers (entities / use_cases / interface_adapters / frameworks_drivers) or unknown",
    "depends_on graph: each edge tagged by the layer-distance it skips",
    "Callers MUST filter capabilities and depends_on edges through src/core/scanner-exclusions.ts BEFORE counting (the scorer is zero-I/O and cannot enforce filtering; excludedPaths round-trips for audit).",
  ],
  formula: {
    description:
      "Start at 100. For each violating edge: subtract 15 (critical / inner depends on outermost), 8 (medium / 2-layer skip), 4 (adjacent / 1-layer skip). Each severity bucket is capped (critical 45, medium 32, adjacent 24) so a single severity cannot peg the score at 0 — 7 critical violations used to flatten to 0/F; they now cap at 45 off, leaving 55/D. Floor at 0. When > 30% of capabilities are 'unknown', surface an explicit insight. An empty capability registry (totalCapabilities === 0) returns an InsufficientSignalResult — symmetric counterpart of the ISO-25010 empty-input bug; returning A+ for no data is just as misleading as returning D. Counts are absolute, not normalised by graph size; the per-bucket cap already softens the small-vs-large-repo unfairness, and a normalisation knob would be a second arbitrary parameter to justify.",
    codeRef: "src/clean-arch/score.ts",
    snippet:
      "score = max(0, 100 - min(45, 15*critical) - min(32, 8*medium) - min(24, 4*adjacent))",
  },
  honestGap:
    "Layer classification typically depends on capability-name heuristics (e.g. a name containing 'user-service' becomes use_cases). Mis-named or unconventional components silently mis-classify; the > 30% unknown insight catches the egregious cases. The scorer is zero-I/O and cannot enforce file-exclusion; callers MUST pre-filter through src/core/scanner-exclusions.ts.",
};
