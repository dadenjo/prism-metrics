import type { Methodology } from "../core/methodology.js";

export const C4_METHODOLOGY: Methodology = {
  definition:
    "C4 Model — a hierarchical way to describe software architecture using four diagram levels: System Context, Container, Component, and Code. Simon Brown.",
  referenceUrl: "https://c4model.com",
  referenceLabel: "c4model.com",
  signals: [
    "Capability registry grouped into systems / containers / components",
  ],
  formula: {
    description:
      "No 0-100 score. Reports which of the four C4 levels have content. Container grouping is name-based and deterministically sorted. Code-level (L4) is out of scope.",
    codeRef: "src/c4/score.ts",
  },
  coverage: "3 of the 4 C4 levels (Context, Container, Component). Code-level diagrams are not generated.",
};
