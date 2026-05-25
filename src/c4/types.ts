/**
 * C4 model — coverage report. There is no 0-100 score; the
 * scorer reports which of the four levels have generated diagrams.
 */

export type C4Level = "context" | "container" | "component" | "code";

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
