import type { Methodology } from "../core/methodology.js";

export const SOLID_METHODOLOGY: Methodology = {
  definition:
    "Five object-oriented design principles (SRP, OCP, LSP, ISP, DIP) for keeping software easy to change. Robert C. Martin, Agile Software Development: Principles, Patterns, and Practices (2003).",
  referenceUrl: "https://en.wikipedia.org/wiki/SOLID",
  referenceLabel: "SOLID (Wikipedia)",
  signals: [
    "Sample of source files (.ts/.tsx/.js/.jsx, skipping node_modules / .next / dist / build / tests)",
    "SRP: file size + export count buckets",
    "OCP: switch/case density per file",
    "LSP: substring scan for 'not implemented' / 'TODO: implement'",
    "ISP: interface member count (fat-interface bucket)",
    "DIP: DI-container imports from package.json deps",
  ],
  formula: {
    description:
      "Per principle, files bucket into strong (90) / moderate (65) / needs_work (35). Overall = mean of the five principle scores, rounded. Confidence drops to 0.50 when analyzed file count is <= 10.",
    codeRef: "src/solid/score.ts",
    snippet:
      "perPrinciple = strengthToScore(bucket(signals))\noverall      = round(mean(perPrinciple))",
  },
  coverage:
    "Bucketed strength values mean overall score can only take a handful of distinct values; small refactors often don't move the needle.",
  honestGap:
    "LSP detection is the weakest signal (substring match for 'not implemented'). Layer/role inference depends on heuristics applied by the caller before signals reach the scorer.",
};
