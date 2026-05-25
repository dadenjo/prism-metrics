import type { Methodology } from "../core/methodology.js";

export const DORA_PREDICTED_METHODOLOGY: Methodology = {
  definition:
    "DORA's four key delivery metrics — Deployment Frequency, Lead Time for Changes, Change Failure Rate, and Mean Time to Restore — published in the State of DevOps reports and the book Accelerate (Forsgren, Humble, Kim, 2018). This module predicts the four levels from architectural signals.",
  referenceUrl: "https://dora.dev/research/",
  referenceLabel: "dora.dev",
  signals: [
    "Coherence score (computed upstream from the cross-layer snapshot)",
    "Import cycle count between capabilities",
    "Drift count (and a separate criticalDriftCount for security/contract drifts)",
    "Average cognitive load + per-capability outliers > 60",
  ],
  formula: {
    description:
      "Deterministic stepwise thresholds per metric. Examples: Deployment Frequency = elite if coherence > 80 AND cycles == 0; high if coherence >= 60 AND cycles <= 2; medium if coherence >= 40; else low. Change Failure Rate immediately drops to 'low' on any critical drift. Overall = rounded mean of the 4 level-ranks (elite=4..low=1).",
    codeRef: "src/dora-predicted/score.ts",
    snippet:
      "df = coherence>80 && cycles==0 ? elite\n   : coherence>=60 && cycles<=2 ? high\n   : coherence>=40              ? medium\n   :                              low",
  },
  coverage:
    "Predicts the architectural drivers of DORA outcomes — not the deploy logs themselves. Compare side-by-side with measured values for the full picture.",
  honestGap:
    "These are predictions from architectural signals — not measurements of real deploy frequency / lead time / MTTR / change-failure-rate. A real DORA assessment needs operational data (CI/CD logs, incident tickets). Predictions correlate with, but do not measure, the canonical DORA outcomes.",
};
