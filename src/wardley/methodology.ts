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
      "Three deterministic pieces: classifyEvolution(input) walks commodity → genesis → product signal sets, then lifecycle, then criticality/fileCount fallbacks, producing {stage, score 0..1, confidence 0..1, disputed: boolean, signals}. Single-regex matches return confidence ≈ 0.5 with `disputed: true`; corroborating lifecycle / criticality evidence raises confidence to ≥0.82 and clears the flag. A commodity-keyword name with criticality=critical is OVERRIDDEN to custom_built (the bespoke-auth false positive). fileCount > 3 alone returns custom_built at confidence ≈ 0.4 with `disputed: true`. classifyValueChain(name, id) keyword-matches against a 26-entry map for Y-position, defaulting to a mid-band [0.40, 0.55] seeded by id. analyzeWardley jitters X around the stage center (genesis 0.125, custom_built 0.375, product 0.625, commodity 0.875) by ±0.10 via FNV-1a hash so same id → same X. Jitter half-width is strictly less than half a stage band (0.125), so jitter cannot cross a stage boundary — asserted in tests.",
    codeRef: "src/wardley/score.ts",
    snippet:
      "stage      = classifyEvolution({name,id,lifecycle,criticality,fileCount}).stage\nconfidence = single-signal 0.5 ± 0.15 | corroborated 0.82 ± 0.15\ndisputed   = true when only one signal contributed\nvisibility = classifyValueChain(name, id)\nx          = stageBaseX(stage) + seededOffset(id)  // ±0.10",
  },
  honestGap:
    "Classification is keyword-based. The `disputed: true` flag and the SINGLE_SIGNAL_BASE confidence (≈0.5) are how the package admits that a name-only match is a weak signal. Dashboards SHOULD render disputed classifications as candidates needing review, not as settled stages — otherwise a custom-built solution whose name contains 'auth' will be mis-rendered as commodity and the org will be advised to outsource it. The X jitter only nudges position within a stage; the stage itself can be visually disputed.",
};
