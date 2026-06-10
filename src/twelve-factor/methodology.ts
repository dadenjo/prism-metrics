import type { Methodology } from "../core/methodology.js";

export const TWELVE_FACTOR_METHODOLOGY: Methodology = {
  definition:
    "Twelve principles for building software-as-a-service apps that are portable, scalable, and operationally clean. Adam Wiggins (Heroku), CC-BY 3.0.",
  referenceUrl: "https://12factor.net",
  referenceLabel: "12factor.net",
  signals: [
    "Per-factor status evaluations (pass / warn / unknown / fail / n/a) supplied by the caller",
    "Optional deploymentTarget hint (vm / paas / serverless / edge / unknown) — informs which factors are platform-owned",
  ],
  formula: {
    description:
      "Per-factor points: pass=8, warn=4, fail=0. 'n/a' (platform-owned) AND 'unknown' (not measured) both DROP OUT of the denominator — they don't penalise the score. score = sum(measuredPoints) / (measuredCount × 8) × 100. confidence = measuredCount / applicableCount (0-1). noData=true when nothing was measured.",
    codeRef: "src/twelve-factor/score.ts",
    snippet: "applicable = total - na; measured = applicable - unknown; score = round((rawPoints / (measured*8)) * 100)",
  },
  honestGap:
    "Most factors map to binary file-existence proxies upstream — not deep validations. The score is conservative: an all-pass set caps at 100 but partial compliance has a low ceiling. 'n/a' relies on the caller correctly identifying which factors the deployment platform owns; the PLATFORM_OWNED_FACTORS reference mapping is a default, not a guarantee. 'unknown' factors lower confidence but don't penalise — this is intentional: we don't grade what we can't measure.",
};
