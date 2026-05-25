/**
 * Monorepo scoring — per-capability healthScore = max(0, 100 - 10 *
 * crossTargetDeps). Each cross-capability build-target dep is a
 * Conway's-Law-style coupling signal.
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
  const averageHealth = capabilities.length === 0
    ? 0
    : roundScore(capabilities.reduce((s, c) => s + c.healthScore, 0) / capabilities.length);
  const unhealthyCount = capabilities.filter((c) => c.healthScore < UNHEALTHY_THRESHOLD).length;
  return {
    buildSystem: sig.buildSystem,
    capabilities,
    averageHealth,
    unhealthyCount,
  };
}
