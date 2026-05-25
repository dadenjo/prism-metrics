import type { Methodology } from "../core/methodology.js";

export const MONOREPO_METHODOLOGY: Methodology = {
  definition:
    "Monorepo intelligence — detect the build system in use (Bazel / Turborepo / Nx / Lerna / none) and score per-capability isolation health based on cross-target dependencies.",
  referenceUrl: "https://monorepo.tools/",
  referenceLabel: "monorepo.tools",
  signals: [
    "Build-system identifier (supplied by caller after inspecting marker files)",
    "Per-capability cross-target dependency count",
  ],
  formula: {
    description:
      "Per capability: healthScore = max(0, 100 - 10 * crossTargetDeps). Slope rationale: 0 violations -> 100, 5 -> 50, 10+ -> 0.",
    codeRef: "src/monorepo/score.ts",
    snippet: "healthScore = max(0, 100 - 10 * crossTargetDeps)",
  },
  honestGap:
    "The -10/violation slope is chosen for legibility, not derived from empirical data. A monorepo with healthy modular sharing can legitimately have 10+ cross-target deps — context matters and the score doesn't capture intent.",
};
