import type { Methodology } from "../core/methodology.js";

export const WARDLEY_METHODOLOGY: Methodology = {
  definition:
    "Wardley Mapping: plot capabilities along an X axis of evolution (genesis → custom-built → product → commodity) against a Y axis of value-chain position. Simon Wardley, CC-BY-SA 4.0.",
  referenceUrl: "https://learnwardleymapping.com/",
  referenceLabel: "learnwardleymapping.com",
  signals: [
    "Capability name + id (for keyword-based stage and value-chain classification)",
    "Optional lifecycle (experimental | stable | deprecated) and criticality hints",
    "Optional fileCount for custom_built fallback",
  ],
  formula: {
    description:
      "Three deterministic pieces: classifyEvolution(input) walks commodity → genesis → product signal sets, then lifecycle, then criticality/fileCount fallbacks, producing {stage, score 0..1, signals}. classifyValueChain(name, id) keyword-matches against a 26-entry map for Y-position, defaulting to a mid-band [0.40, 0.55] seeded by id. analyzeWardley jitters X around the stage center (genesis 0.125, custom_built 0.375, product 0.625, commodity 0.875) by ±0.10 via FNV-1a hash so same id → same X.",
    codeRef: "src/wardley/score.ts",
    snippet:
      "stage   = classifyEvolution({name,id,lifecycle,criticality,fileCount}).stage\nvisibility = classifyValueChain(name, id)\nx       = stageBaseX(stage) + seededOffset(id)  // ±0.10",
  },
  honestGap:
    "Classification is keyword-based: a custom-built solution whose name contains 'auth' will be mis-classified as commodity. The X jitter only nudges position within a stage; the stage itself can be visually disputed.",
};
