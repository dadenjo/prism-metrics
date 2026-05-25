/**
 * C4 coverage — derived purely from input counts. Code-level (L4) is
 * intentionally out of scope and always false.
 */

import type { C4CoverageResult, C4Signals } from "./types.js";

export function analyzeC4(sig: C4Signals): C4CoverageResult {
  const hasContext = sig.systemCount > 0;
  const hasContainer = sig.containerCount > 0;
  const hasComponent = sig.componentCount > 0;
  const levelsCovered =
    (hasContext ? 1 : 0) + (hasContainer ? 1 : 0) + (hasComponent ? 1 : 0);
  const highestLevel = hasComponent
    ? "component"
    : hasContainer
      ? "container"
      : hasContext
        ? "context"
        : "none";
  return {
    hasContext,
    hasContainer,
    hasComponent,
    hasCode: false,
    levelsCovered,
    highestLevel,
  };
}
