/**
 * DORA-predicted scoring — deterministic level assignment per metric,
 * mirroring the prism0x2A dashboard's `analyzeDORA` logic.
 *
 * Note: these predict the _architectural drivers_ of DORA outcomes,
 * not the outcomes themselves (which need CI/CD logs and incident data).
 *
 * Audit fixes:
 *   dora-1 — empty signals (every value zero) no longer fall through to
 *     'elite' / 'high overall'. Returns 'insufficient' explicitly so a
 *     zero-signal repo isn't rewarded as a high-DORA team.
 *   dora-3 — predictionConfidence: number added; per-metric fields
 *     renamed to predicted* so downstream UIs can't strip the
 *     prediction nature.
 */

import type { DoraLevel, DoraScoreResult, DoraSignals } from "./types.js";

const LEVEL_RANK: Record<DoraLevel, number> = {
  elite: 3,
  high: 2,
  medium: 1,
  low: 0,
  insufficient: 0,
};

function rankToLevel(avg: number): DoraLevel {
  if (avg >= 2.5) return "elite";
  if (avg >= 1.5) return "high";
  if (avg >= 0.75) return "medium";
  return "low";
}

function deploymentFrequency(sig: DoraSignals): DoraLevel {
  if (sig.coherenceScore > 80 && sig.importCycles === 0) return "elite";
  if (sig.coherenceScore >= 60 && sig.importCycles <= 2) return "high";
  if (sig.coherenceScore >= 40) return "medium";
  return "low";
}

function leadTimeForChanges(sig: DoraSignals): DoraLevel {
  const driftRiskLevel = Math.floor(sig.driftCount / 3);
  const cog = sig.averageCognitiveLoad;
  if (cog < 30 && driftRiskLevel === 0) return "elite";
  if (cog < 50 && driftRiskLevel <= 1) return "high";
  if (cog < 70 && driftRiskLevel <= 2) return "medium";
  return "low";
}

function changeFailureRate(sig: DoraSignals): DoraLevel {
  if (sig.criticalDrifted) return "low";
  if (sig.importCycles === 0 && sig.driftCount === 0) return "elite";
  if (sig.importCycles <= 2 && sig.driftCount <= 3) return "high";
  if (sig.importCycles <= 5 && sig.driftCount <= 8) return "medium";
  return "low";
}

function meanTimeToRestore(sig: DoraSignals): DoraLevel {
  const cog = sig.averageCognitiveLoad;
  if (sig.driftCount === 0 && cog < 40) return "elite";
  if (sig.driftCount <= 3 && cog < 55) return "high";
  if (sig.criticalDrifted || (sig.driftCount > 8 && cog > 65)) return "low";
  return "medium";
}

/**
 * dora-1 — detect the zero-signal state. Trigger when:
 *   - totalCapabilities is provided and === 0, OR
 *   - all signals are at default-zero (coherenceScore=0, no cycles,
 *     no drift, no cog load, no critical drift)
 */
function isInsufficientSignal(sig: DoraSignals): boolean {
  if (sig.totalCapabilities === 0) return true;
  return (
    sig.coherenceScore === 0 &&
    sig.importCycles === 0 &&
    sig.driftCount === 0 &&
    !sig.criticalDrifted &&
    sig.averageCognitiveLoad === 0 &&
    sig.highCogLoadCapabilities === 0
  );
}

export function analyzeDoraPredicted(sig: DoraSignals): DoraScoreResult {
  if (isInsufficientSignal(sig)) {
    return {
      predictedDeploymentFrequency: "insufficient",
      predictedLeadTimeForChanges: "insufficient",
      predictedChangeFailureRate: "insufficient",
      predictedMeanTimeToRestore: "insufficient",
      overallRank: null,
      overallLevel: "insufficient",
      predictionConfidence: 0,
      insufficient: true,
    };
  }
  const df = deploymentFrequency(sig);
  const lt = leadTimeForChanges(sig);
  const cfr = changeFailureRate(sig);
  const mttr = meanTimeToRestore(sig);
  const overallRank =
    (LEVEL_RANK[df] + LEVEL_RANK[lt] + LEVEL_RANK[cfr] + LEVEL_RANK[mttr]) / 4;
  return {
    predictedDeploymentFrequency: df,
    predictedLeadTimeForChanges: lt,
    predictedChangeFailureRate: cfr,
    predictedMeanTimeToRestore: mttr,
    overallRank,
    overallLevel: rankToLevel(overallRank),
    // 0.6 baseline — these are architectural proxies for DORA outcomes,
    // not measurements. Future iteration could scale by signal
    // completeness.
    predictionConfidence: 0.6,
    insufficient: false,
  };
}
