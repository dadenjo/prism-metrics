import type { Methodology } from "../core/methodology.js";

export const C4_METHODOLOGY: Methodology = {
  definition:
    "C4 Model — a hierarchical way to describe software architecture using four diagram levels: System Context, Container, Component, and Code. Simon Brown.",
  referenceUrl: "https://c4model.com",
  referenceLabel: "c4model.com",
  signals: [
    "Capability registry grouped into systems / containers / components",
    "Capability id + name for container-group and person/actor classification",
  ],
  formula: {
    description:
      "No 0-100 score. analyzeC4 reports which of the four C4 levels have content (Code/L4 always false). containerGroup(id, name) classifies a capability into one of {API Service, Database, Web App, Background Worker, Application} via word-boundary regex matches on the combined id+name. isPersonCap(name) returns true when the name contains user/customer/admin/client/operator/viewer/member/guest. Diagram rendering (SVG / Mermaid / Structurizr DSL) is a UI concern and lives outside this package.",
    codeRef: "src/c4/score.ts",
  },
  coverage: "3 of the 4 C4 levels (Context, Container, Component). Code-level diagrams are not generated.",
};
