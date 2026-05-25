import type { Methodology } from "../core/methodology.js";

export const WARDLEY_METHODOLOGY: Methodology = {
  definition:
    "Wardley Mapping: plot capabilities along an X axis of evolution (genesis → custom-built → product → commodity) against a Y axis of value-chain position. Simon Wardley, CC-BY-SA 4.0.",
  referenceUrl: "https://learnwardleymapping.com/",
  referenceLabel: "learnwardleymapping.com",
  signals: [
    "Per-component evolution stage + Y visibility (classification supplied by caller)",
    "Per-component confidence supplied by caller",
  ],
  formula: {
    description:
      "X-position is computed deterministically via a seeded FNV-1a hash of the component id (no Math.random — same input always plots in the same place). Y-position is supplied by the caller. Stage center X-positions: genesis 0.125, custom_built 0.375, product 0.625, commodity 0.875. Jitter is ± 0.10.",
    codeRef: "src/wardley/score.ts",
    snippet: "x = stageBaseX(stage) + seededOffset(id)  // ±0.10",
  },
  honestGap:
    "Classification of components into evolution stages is upstream of this scorer and is typically a name-pattern match — a custom-built solution whose name contains 'auth' may be mis-classified as commodity. The seededOffset only jitters X; the stage itself can be visually disputed.",
};
