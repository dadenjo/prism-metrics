import type { Methodology } from "../core/methodology.js";

export const CONWAYS_LAW_METHODOLOGY: Methodology = {
  definition:
    "Conway's Law: 'Any organization that designs a system will produce a design whose structure is a copy of the organization's communication structure.' Mel Conway, How Do Committees Invent? (1968). This module computes an alignment proxy rather than the law itself — the proxy depends on a verified org chart that the package cannot infer from code alone.",
  referenceUrl: "https://www.melconway.com/Home/Committees_Paper.html",
  referenceLabel: "Conway, How Do Committees Invent?",
  signals: [
    "Team / capability count",
    "Cross-team dependency edge count",
    "Unowned-capability count",
    "CODEOWNERS file presence",
  ],
  formula: {
    description:
      "Single-team repos (totalTeams <= 1) return an InsufficientSignalResult (reason=\"single_team\") — Conway's Law is undefined when there is no inter-team coupling to measure, and emitting a letter grade for that case has been the source of false-positive \"D\" verdicts on solo repos. Multi-team repos start at 100. Subtract up to 35 for cross-team coupling, up to 30 for unowned capabilities, plus a CODEOWNERS bonus of +5. Floor at 0. The result also surfaces `requiresHumanVerification: true` and `structuralProxy` to keep callers honest about what the number means.",
    codeRef: "src/conways-law/score.ts",
    snippet:
      "if (totalTeams <= 1) return insufficient(\"single_team\", ...)\nscore = clamp(\n  100\n  - min(35, couplingRatio*35)\n  - min(30, unownedRatio*30)\n  + (hasCodeowners ? 5 : 0),\n  0, 100)",
  },
  honestGap:
    "Solo / single-team repos return InsufficientSignalResult rather than a number — Conway's Law cannot be measured there. The verdict is a STRUCTURAL PROXY: it derives only from ownership tags and dependency edges. Mis-tagged ownership skews the score, and the org chart itself must be verified out-of-band — hence `requiresHumanVerification: true` on every result. The `verdict` and `structuralProxy` fields carry the same value; consumers building new integrations should prefer `structuralProxy` because the name does not over-promise.",
};
