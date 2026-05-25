import type { Methodology } from "../core/methodology.js";

export const TWELVE_FACTOR_METHODOLOGY: Methodology = {
  definition:
    "Twelve principles for building software-as-a-service apps that are portable, scalable, and operationally clean. Adam Wiggins (Heroku), CC-BY 3.0.",
  referenceUrl: "https://12factor.net",
  referenceLabel: "12factor.net",
  signals: [
    "Per-factor status evaluations (pass / warn / unknown / fail) supplied by the caller",
  ],
  formula: {
    description:
      "pass=8, warn=4, unknown=2, fail=0 points per factor. Sum across all 12 factors then linearly scale to 0-100. An all-unknown repo scores ~25 (12 * 2 / 96 * 100).",
    codeRef: "src/twelve-factor/score.ts",
    snippet: "score = round((sum(factorPoints) / 96) * 100)",
  },
  honestGap:
    "Most factors map to binary file-existence proxies upstream — not deep validations. The formula is conservative: an all-pass app maxes out, but partial compliance has a low ceiling.",
};
