/**
 * Hexagonal scoring — start at 100, subtract 12 per dependency-rule
 * violation and 20 when adapters exist without any ports.
 *
 * Empty handling (hex-1):
 *   Empty registry (coreCount + portCount + adapterCount === 0) and
 *   missingCore=true (non-empty registry with no core capability)
 *   both return an InsufficientSignalResult instead of a 100/A+. A
 *   structural break (missingCore) was previously decoupled from the
 *   grade — the registry would show grade A+ next to a structural
 *   "missing core" flag. Now grade and flag are coupled: if the
 *   registry can't actually be scored as a hexagon, the result is
 *   insufficient rather than a misleading grade.
 *
 * Violation bucket cap (hex-2):
 *   12-per-violation alone hit 0 at 9 violations. We cap the
 *   per-violation deduction at 60 (5 violations' worth) so additional
 *   violations beyond that are surfaced via the totalViolations
 *   account but don't single-handedly peg the score at 0. The
 *   adaptersWithoutPorts 20 stays additive on top of the cap because
 *   it's a different structural concern.
 */

import { clamp, scoreToGrade } from "../core/methodology.js";
import { insufficient, type InsufficientSignalResult } from "../core/insufficient.js";
import type { HexagonalScoreResult, HexagonalSignals } from "./types.js";

const VIOLATION_DEDUCTION = 12;
const VIOLATION_CAP = 60;
const NO_PORTS_DEDUCTION = 20;

export function analyzeHexagonal(
  sig: HexagonalSignals,
): HexagonalScoreResult | InsufficientSignalResult {
  const empty =
    sig.coreCount === 0 && sig.adapterCount === 0 && sig.portCount === 0;
  if (empty) {
    return insufficient(
      "no_input",
      "Empty hexagonal registry — no core, ports, or adapters to score.",
      "Pass a non-empty HexagonalSignals to score the dependency graph.",
    );
  }

  const missingCore = sig.coreCount === 0;
  if (missingCore) {
    // Grade and missingCore must be coupled. A registry with
    // adapters/ports but no core is not a hexagon — return
    // InsufficientSignalResult rather than handing back a 100/A+ that
    // disagrees with the structural flag.
    return insufficient(
      "no_input",
      "Hexagonal registry has no core capability — structural break, not scoreable as a hexagon.",
      "Identify and tag the domain core before scoring; until then, the hex shape is undefined.",
    );
  }

  const adaptersWithoutPorts = sig.adapterCount > 0 && sig.portCount === 0;
  const violationPenalty = Math.min(
    VIOLATION_CAP,
    VIOLATION_DEDUCTION * sig.dependencyViolations,
  );
  const raw = 100 - violationPenalty - (adaptersWithoutPorts ? NO_PORTS_DEDUCTION : 0);
  const score = clamp(raw, 0, 100);
  return {
    score,
    grade: scoreToGrade(score),
    adaptersWithoutPorts,
    missingCore: false,
  };
}
