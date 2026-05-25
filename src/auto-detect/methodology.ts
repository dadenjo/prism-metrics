import type { Methodology } from "../core/methodology.js";

export const AUTO_DETECT_METHODOLOGY: Methodology = {
  definition:
    "Meta-detector that inspects dependency lists and top-level directory names to classify which web/back-end frameworks (Next.js, React, Vue, Angular, NestJS, Express, Prisma, etc.) are present in a project.",
  referenceUrl: "https://github.com/dadenjo/prism-metrics",
  referenceLabel: "prism-metrics source",
  signals: [
    "Dependencies + devDependencies map (supplied by caller after reading package.json)",
    "Top-level directory names (e.g. app/, pages/, src/)",
  ],
  formula: {
    description:
      "No 0-100 score. For each detected framework, surfaces a hand-calibrated confidence value. e.g. 0.97 when 'next' is a dependency AND app/ exists; 0.55 for weaker single-signal matches.",
    codeRef: "src/auto-detect/score.ts",
  },
  honestGap:
    "Confidence values look more precise than they really are — they're calibrated by hand, not from a labelled dataset. The no-score design means there's no headline number to defend.",
};
