/**
 * Monorepo scoring — per-capability healthScore = max(0, 100 - 10 *
 * crossTargetDeps). Each cross-capability build-target dep is a
 * Conway's-Law-style coupling signal.
 *
 * Audit fixes:
 *
 *   mono-1 — empty input no longer scores 0. capabilities.length === 0
 *   OR buildSystem === 'none' OR buildSystem === 'unknown' returns
 *   { noData: true, averageHealth: null } so a polyrepo / unanalysable
 *   project is distinguishable from a maximally-coupled monorepo.
 *
 *   mono-2 — BuildSystem extended to cover Go workspaces, Cargo
 *   workspaces, Pants, Buck2, Gradle composite, pnpm + an explicit
 *   'unknown' distinct from 'none'. Closes the polyglot blind spot.
 *   'none' AND 'unknown' both trigger noData.
 */

import { clamp, roundScore } from "../core/methodology.js";
import type {
  MonorepoCapabilityScore,
  MonorepoResult,
  MonorepoSignals,
} from "./types.js";

const SLOPE = 10;
const UNHEALTHY_THRESHOLD = 50;

export function analyzeMonorepo(sig: MonorepoSignals): MonorepoResult {
  const capabilities: MonorepoCapabilityScore[] = sig.capabilities.map((c) => ({
    id: c.id,
    crossTargetDeps: c.crossTargetDeps,
    healthScore: clamp(100 - SLOPE * c.crossTargetDeps, 0, 100),
  }));
  // mono-1: empty caps OR no/unknown build system → noData rather than 0.
  const noData =
    capabilities.length === 0 ||
    sig.buildSystem === "none" ||
    sig.buildSystem === "unknown";
  const averageHealth = noData
    ? null
    : roundScore(
        capabilities.reduce((s, c) => s + c.healthScore, 0) /
          capabilities.length,
      );
  const unhealthyCount = capabilities.filter(
    (c) => c.healthScore < UNHEALTHY_THRESHOLD,
  ).length;
  return {
    buildSystem: sig.buildSystem,
    capabilities,
    averageHealth,
    unhealthyCount,
    noData,
  };
}
