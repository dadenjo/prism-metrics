import type { Methodology } from "../core/methodology.js";

export const CONWAYS_LAW_METHODOLOGY: Methodology = {
  definition:
    "Conway's Law: 'Any organization that designs a system will produce a design whose structure is a copy of the organization's communication structure.' Mel Conway, How Do Committees Invent? (1968). This module computes an alignment proxy rather than the law itself.",
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
      "Single-team repos (totalTeams <= 1) start at baseline 50. Multi-team repos start at 100. Subtract up to 30 for cross-team coupling, up to 20 for unowned capabilities, plus a CODEOWNERS bonus of +5. Floor at 0.",
    codeRef: "src/conways-law/score.ts",
    snippet:
      "score = clamp(\n  (singleTeam ? 50 : 100)\n  - min(30, couplingRatio*30)\n  - min(20, unownedRatio*20)\n  + (hasCodeowners ? 5 : 0),\n  0, 100)",
  },
  honestGap:
    "Single-team / solo-dev repos are explicitly dampened to baseline 50 — there is no inter-team coupling to measure. Coupling and unowned counts depend on the upstream owner field being accurate; mis-tagged ownership skews the score.",
};
