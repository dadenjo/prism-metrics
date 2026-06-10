import type { Methodology } from "../core/methodology.js";

export const MONOREPO_METHODOLOGY: Methodology = {
  definition:
    "Monorepo intelligence — detect the build system in use (Bazel / Turborepo / Nx / Lerna / pnpm / Go workspaces / Cargo workspaces / Pants / Buck2 / Gradle / none / unknown) and score per-capability isolation health based on cross-target dependencies.",
  referenceUrl: "https://monorepo.tools/",
  referenceLabel: "monorepo.tools",
  signals: [
    "Build-system identifier (supplied by caller after inspecting marker files)",
    "Per-capability cross-target dependency count",
  ],
  formula: {
    description:
      "Per capability: healthScore = max(0, 100 - 10 * crossTargetDeps). Slope rationale: 0 violations → 100, 5 → 50, 10+ → 0. averageHealth = mean across capabilities. noData=true when capabilities is empty OR buildSystem is 'none' / 'unknown' — polyrepo or unanalysable project; the score is not trustworthy in that state and averageHealth is null.",
    codeRef: "src/monorepo/score.ts",
    snippet: "noData = (capabilities.length === 0) || buildSystem in {none, unknown}; healthScore = max(0, 100 - 10 * crossTargetDeps)",
  },
  honestGap:
    "The -10/violation slope is chosen for legibility, not derived from empirical data. A monorepo with healthy modular sharing can legitimately have 10+ cross-target deps — context matters and the score doesn't capture intent. The 'unknown' build system is honest about what we don't know; 'none' is honest about absence of a build system. Both trigger noData rather than a misleading 0 / A+.",
};
