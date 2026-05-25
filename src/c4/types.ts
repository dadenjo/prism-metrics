/**
 * C4 model — coverage report + capability-classification spec. There
 * is no 0-100 score; the scorer reports which of the four levels have
 * generated diagrams.
 *
 * Classification helpers (`containerGroup`, `isPersonCap`) mirror the
 * prism0x2A dashboard's `buildC4Model` heuristics so anyone deriving a
 * C4 diagram from AMBER-style capability data produces the same
 * container groupings and person/actor detection.
 *
 * Diagram rendering (SVG, Mermaid, Structurizr DSL) is intentionally
 * NOT in this package — it is a dashboard/UI concern.
 */

export type C4Level = "context" | "container" | "component" | "code";

export type C4ContainerGroup =
  | "API Service"
  | "Database"
  | "Web App"
  | "Background Worker"
  | "Application";

export interface C4Signals {
  /** Number of distinct systems in the context diagram. */
  systemCount: number;
  /** Number of containers grouped under those systems. */
  containerCount: number;
  /** Number of components inside containers. */
  componentCount: number;
}

export interface C4CoverageResult {
  hasContext: boolean;
  hasContainer: boolean;
  hasComponent: boolean;
  hasCode: false;
  levelsCovered: number;
  /** Stable identifier for the highest level produced. */
  highestLevel: C4Level | "none";
}
