import type { Methodology } from "../core/methodology.js";

export const DORA_PREDICTED_METHODOLOGY: Methodology = {
  definition:
    "DORA's four key delivery metrics — Deployment Frequency, Lead Time for Changes, Change Failure Rate, and Mean Time to Restore — published in the State of DevOps reports and the book Accelerate (Forsgren, Humble, Kim, 2018). This module PREDICTS the four levels from architectural signals; it does not MEASURE them.",
  referenceUrl: "https://dora.dev/research/",
  referenceLabel: "dora.dev",
  signals: [
    "Coherence score (computed upstream from the cross-layer snapshot)",
    "Import cycle count between capabilities",
    "Drift count + a boolean `criticalDrifted` (any drifted capability flagged critical)",
    "Average cognitive load + per-capability outliers > 60",
    "Optional totalCapabilities (dora-1: 0 → insufficient state)",
  ],
  formula: {
    description:
      "Deterministic level assignment per metric, matching prism0x2A dashboard. Deployment Frequency keys on coherence+cycles. Lead Time uses cognitive load + driftRiskLevel=floor(drift/3) buckets. Change Failure Rate combines cycles AND drift thresholds with a criticalDrifted shortcut → low. MTTR keys on drift+cognitive-load with a criticalDrifted+highCog shortcut → low. Overall = mean of the 4 level-ranks (elite=3..low=0) bucketed via 2.5/1.5/0.75 thresholds. **dora-1**: when all signals are at default-zero (or totalCapabilities=0), every level returns 'insufficient' and overallRank is null — empty repos are NOT graded as elite by coincidence. **dora-3**: result fields are named `predicted*` (was deploymentFrequency, …) so downstream UIs can't strip the prediction nature, plus `predictionConfidence: 0.6` baseline (0 in insufficient state).",
    codeRef: "src/dora-predicted/score.ts",
    snippet:
      "if (allZeroSignals) return { overallLevel: 'insufficient', insufficient: true, predictionConfidence: 0 }\n\ndf  = coherence>80 && cycles==0 ? elite : coherence>=60 && cycles<=2 ? high : coherence>=40 ? medium : low\nlt  = cog<30 && drift/3==0 ? elite : cog<50 && drift/3<=1 ? high : cog<70 && drift/3<=2 ? medium : low\ncfr = criticalDrifted ? low : (cycles==0 && drift==0 ? elite : cycles<=2 && drift<=3 ? high : cycles<=5 && drift<=8 ? medium : low)\nmttr = drift==0 && cog<40 ? elite : drift<=3 && cog<55 ? high : (criticalDrifted || (drift>8 && cog>65)) ? low : medium",
  },
  coverage:
    "Predicts the architectural drivers of DORA outcomes — not the deploy logs themselves. Compare side-by-side with measured values for the full picture.",
  honestGap:
    "These are PREDICTIONS from architectural signals — not measurements of real deploy frequency / lead time / MTTR / change-failure-rate. A real DORA assessment needs operational data (CI/CD logs, incident tickets). Predictions correlate with, but do not measure, the canonical DORA outcomes. The 0.6 predictionConfidence baseline reflects this — these are proxies, not direct measurements.",
};
