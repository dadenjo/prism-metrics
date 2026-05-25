/**
 * Hexagonal scoring — start at 100, subtract 12 per dependency-rule
 * violation and 20 when adapters exist without any ports. Empty
 * registry returns 100; missingCore is surfaced as a separate flag.
 */

import { clamp, scoreToGrade } from "../core/methodology.js";
import type { HexagonalScoreResult, HexagonalSignals } from "./types.js";

const VIOLATION_DEDUCTION = 12;
const NO_PORTS_DEDUCTION = 20;

export function analyzeHexagonal(sig: HexagonalSignals): HexagonalScoreResult {
  const empty = sig.coreCount === 0 && sig.adapterCount === 0 && sig.portCount === 0;
  const adaptersWithoutPorts = sig.adapterCount > 0 && sig.portCount === 0;
  const raw = empty
    ? 100
    : 100
      - VIOLATION_DEDUCTION * sig.dependencyViolations
      - (adaptersWithoutPorts ? NO_PORTS_DEDUCTION : 0);
  const score = clamp(raw, 0, 100);
  return {
    score,
    grade: scoreToGrade(score),
    adaptersWithoutPorts,
    missingCore: sig.coreCount === 0 && !empty,
  };
}
