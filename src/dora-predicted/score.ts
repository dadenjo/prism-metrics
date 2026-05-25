/**
 * DORA-predicted scoring — deterministic stepwise thresholds per metric.
 * These predict the architectural _drivers_ of DORA outcomes, not the
 * outcomes themselves (which need CI/CD logs and incident data).
 */

import type { DoraLevel, DoraScoreResult, DoraSignals } from "./types.js";

const LEVEL_RANK: Record<DoraLevel, number> = {
  elite: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const RANK_TO_LEVEL: DoraLevel[] = ["low", "low", "medium", "high", "elite"];

function deploymentFrequency(sig: DoraSignals): DoraLevel {
  if (sig.coherenceScore > 80 && sig.importCycles === 0) return "elite";
  if (sig.coherenceScore >= 60 && sig.importCycles <= 2) return "high";
  if (sig.coherenceScore >= 40) return "medium";
  return "low";
}

function leadTimeForChanges(sig: DoraSignals): DoraLevel {
  if (sig.coherenceScore > 80 && sig.averageCognitiveLoad < 40) return "elite";
  if (sig.coherenceScore >= 60 && sig.averageCognitiveLoad < 55) return "high";
  if (sig.coherenceScore >= 40) return "medium";
  return "low";
}

function changeFailureRate(sig: DoraSignals): DoraLevel {
  if (sig.criticalDriftCount > 0) return "low";
  if (sig.driftCount === 0 && sig.coherenceScore > 80) return "elite";
  if (sig.driftCount <= 2 && sig.coherenceScore >= 60) return "high";
  if (sig.driftCount <= 5) return "medium";
  return "low";
}

function meanTimeToRestore(sig: DoraSignals): DoraLevel {
  if (sig.coherenceScore > 80 && sig.highCogLoadCapabilities === 0) return "elite";
  if (sig.coherenceScore >= 60 && sig.highCogLoadCapabilities <= 1) return "high";
  if (sig.coherenceScore >= 40) return "medium";
  return "low";
}

export function analyzeDoraPredicted(sig: DoraSignals): DoraScoreResult {
  const df = deploymentFrequency(sig);
  const lt = leadTimeForChanges(sig);
  const cfr = changeFailureRate(sig);
  const mttr = meanTimeToRestore(sig);
  const overallRank = (LEVEL_RANK[df] + LEVEL_RANK[lt] + LEVEL_RANK[cfr] + LEVEL_RANK[mttr]) / 4;
  const rounded = Math.round(overallRank);
  const overallLevel = RANK_TO_LEVEL[rounded] ?? "low";
  return {
    deploymentFrequency: df,
    leadTimeForChanges: lt,
    changeFailureRate: cfr,
    meanTimeToRestore: mttr,
    overallRank,
    overallLevel,
  };
}
