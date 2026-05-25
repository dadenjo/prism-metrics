import type { Methodology } from "../core/methodology.js";

export const EIP_METHODOLOGY: Methodology = {
  definition:
    "Enterprise Integration Patterns — a vocabulary for asynchronous messaging architectures (channels, routers, transformers, endpoints, orchestrators). Gregor Hohpe & Bobby Woolf, 2003.",
  referenceUrl: "https://www.enterpriseintegrationpatterns.com/",
  referenceLabel: "enterpriseintegrationpatterns.com",
  signals: [
    "Per-pattern filename and capability-name match counts (supplied by caller)",
  ],
  formula: {
    description:
      "No 0-100 score. Per pattern: present (filename + capability both match), possible (one of them), absent (neither). architectureType is inferred from how many message-driven patterns are present and whether request_reply is present.",
    codeRef: "src/eip/score.ts",
  },
  coverage: "Detection only — never claims compliance. Because there is no headline score, refining the pattern set later won't shift anyone's published number.",
};
