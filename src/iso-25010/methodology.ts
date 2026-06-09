import type { Methodology } from "../core/methodology.js";

export const ISO_25010_METHODOLOGY: Methodology = {
  definition:
    "ISO/IEC 25010 Software Product Quality Model — eight top-level quality characteristics for evaluating software products. This module ships 6 of the 8 where static-code signals are strongest.",
  referenceUrl: "https://iso25000.com/index.php/en/iso-25000-standards/iso-25010",
  referenceLabel: "ISO/IEC 25010",
  signals: [
    "Coherence score (most recent + optional trend)",
    "Drift ratio (drifted capabilities / total)",
    "Average test coverage and average file churn (raw count per capability)",
    "File count + file-to-capability density",
    "Hardcoded-secret hit count and hardcoded host/port config hit count",
    "Portability markers: Dockerfile, K8s manifests, .env.example",
    "Orphan-capability count",
  ],
  formula: {
    description:
      "Six characteristics each get a custom 0-100 sub-formula combining the signals above. Overall = mean of the 6 scores, rounded.",
    codeRef: "src/iso-25010/score.ts",
    snippet:
      "overall = round(mean(scores[functional_suitability,\n                       performance_efficiency,\n                       reliability,\n                       security,\n                       maintainability,\n                       portability]))",
  },
  coverage:
    "Ships 6 of ISO 25010's 8 characteristics: Functional Suitability, Performance Efficiency, Reliability, Security, Maintainability, Portability.",
  honestGap:
    "Compatibility and Usability are intentionally excluded — Compatibility's static signal inverts the ISO definition (more integrations != better interoperability), and Usability genuinely requires runtime user feedback that static analysis cannot provide. Per-characteristic weights inside the kept 6 are hand-picked and locked at launch. Security's secret/config penalties use a log2 curve (15 × log2(1 + hits), capped at 60) rather than a linear 15 × hits multiplier — the linear form sent 4 hits to a guaranteed F regardless of whether the hits came from test fixtures, comments, or real code. The scorer also returns an explicit { ok: false, reason: 'no_input' } sentinel when every input signal is zero or absent, so brand-new or unscanned repos no longer render as 'D' by default.",
};
