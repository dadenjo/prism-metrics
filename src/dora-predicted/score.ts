/**
 * DORA-predicted scoring — deterministic level assignment per metric,
 * mirroring the prism0x2A dashboard's `analyzeDORA` logic.
 *
 * Note: these predict the _architectural drivers_ of DORA outcomes,
 * not the outcomes themselves (which need CI/CD logs and incident data).
 */

import type { DoraLevel, DoraScoreResult, DoraSignals } from "./types.js";

const LEVEL_RANK: Record<DoraLevel, number> = {
  elite: 3,
  high: 2,
  medium: 1,
  low: 0,
};

function rankToLevel(avg: number): DoraLevel {
  if (avg >= 2.5) return "elite";
  if (avg >= 1.5) return "high";
  if (avg >= 0.75) return "medium";
  return "low";
}

// Dashboard: coherence > 80 && cycles === 0 → elite; ≥60 && ≤2 → high;
// ≥40 → medium; else low.
function deploymentFrequency(sig: DoraSignals): DoraLevel {
  if (sig.coherenceScore > 80 && sig.importCycles === 0) return "elite";
  if (sig.coherenceScore >= 60 && sig.importCycles <= 2) return "high";
  if (sig.coherenceScore >= 40) return "medium";
  return "low";
}

// Dashboard: driftRiskLevel = floor(driftCount / 3)
//   cogAvg < 30 && driftRisk === 0    → elite
//   cogAvg < 50 && driftRisk <= 1     → high
//   cogAvg < 70 && driftRisk <= 2     → medium
//   else                              → low
function leadTimeForChanges(sig: DoraSignals): DoraLevel {
  const driftRiskLevel = Math.floor(sig.driftCount / 3);
  const cog = sig.averageCognitiveLoad;
  if (cog < 30 && driftRiskLevel === 0) return "elite";
  if (cog < 50 && driftRiskLevel <= 1) return "high";
  if (cog < 70 && driftRiskLevel <= 2) return "medium";
  return "low";
}

// Dashboard: criticalDrifted shortcut → low.
//   cycles === 0 && drift === 0      → elite
//   cycles ≤ 2  && drift ≤ 3         → high
//   cycles ≤ 5  && drift ≤ 8         → medium
//   else                              → low
function changeFailureRate(sig: DoraSignals): DoraLevel {
  if (sig.criticalDrifted) return "low";
  if (sig.importCycles === 0 && sig.driftCount === 0) return "elite";
  if (sig.importCycles <= 2 && sig.driftCount <= 3) return "high";
  if (sig.importCycles <= 5 && sig.driftCount <= 8) return "medium";
  return "low";
}

// Dashboard:
//   drift === 0 && cog < 40           → elite
//   drift ≤ 3  && cog < 55            → high
//   criticalDrifted || (drift > 8 && cog > 65)  → low
//   else                              → medium
function meanTimeToRestore(sig: DoraSignals): DoraLevel {
  const cog = sig.averageCognitiveLoad;
  if (sig.driftCount === 0 && cog < 40) return "elite";
  if (sig.driftCount <= 3 && cog < 55) return "high";
  if (sig.criticalDrifted || (sig.driftCount > 8 && cog > 65)) return "low";
  return "medium";
}

export function analyzeDoraPredicted(sig: DoraSignals): DoraScoreResult {
  const df = deploymentFrequency(sig);
  const lt = leadTimeForChanges(sig);
  const cfr = changeFailureRate(sig);
  const mttr = meanTimeToRestore(sig);
  const overallRank =
    (LEVEL_RANK[df] + LEVEL_RANK[lt] + LEVEL_RANK[cfr] + LEVEL_RANK[mttr]) / 4;
  const overallLevel = rankToLevel(overallRank);
  return {
    deploymentFrequency: df,
    leadTimeForChanges: lt,
    changeFailureRate: cfr,
    meanTimeToRestore: mttr,
    overallRank,
    overallLevel,
  };
}
