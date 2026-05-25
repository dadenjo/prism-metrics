/**
 * SOLID scoring — pure function from signals to per-principle and
 * overall scores. Bucketing matches the prism0x2A reference impl:
 * strong=90, moderate=65, needs_work=35.
 */

import { roundScore, scoreToGrade } from "../core/methodology.js";
import type {
  PrincipleResult,
  PrincipleStrength,
  SolidScoreResult,
  SolidSignals,
} from "./types.js";

function strengthToScore(s: PrincipleStrength): number {
  if (s === "strong") return 90;
  if (s === "moderate") return 65;
  return 35;
}

function scoreSrp(sig: SolidSignals): PrincipleResult {
  const ratio = sig.analyzedFiles > 0
    ? (sig.largeFiles + sig.heavyExportFiles) / sig.analyzedFiles
    : 0;
  let strength: PrincipleStrength;
  if (ratio < 0.08) strength = "strong";
  else if (ratio < 0.20) strength = "moderate";
  else strength = "needs_work";
  return {
    principle: "S",
    name: "Single Responsibility",
    strength,
    score: strengthToScore(strength),
    confidence: sig.analyzedFiles > 10 ? 0.75 : 0.5,
  };
}

function scoreOcp(sig: SolidSignals): PrincipleResult {
  const ratio = sig.analyzedFiles > 0
    ? (sig.largeSwitchFiles + sig.cascadingIfFiles) / sig.analyzedFiles
    : 0;
  let strength: PrincipleStrength;
  if (ratio < 0.05 && sig.strategyPatternFiles > 0) strength = "strong";
  else if (ratio < 0.15) strength = "moderate";
  else strength = "needs_work";
  return {
    principle: "O",
    name: "Open/Closed",
    strength,
    score: strengthToScore(strength),
    confidence: sig.analyzedFiles > 10 ? 0.65 : 0.45,
  };
}

function scoreLsp(sig: SolidSignals): PrincipleResult {
  let strength: PrincipleStrength;
  if (sig.inheritanceFiles === 0) {
    strength = "moderate";
  } else if (sig.narrowingStubFiles === 0) {
    strength = "strong";
  } else if (sig.narrowingStubFiles <= 2) {
    strength = "moderate";
  } else {
    strength = "needs_work";
  }
  return {
    principle: "L",
    name: "Liskov Substitution",
    strength,
    score: strengthToScore(strength),
    confidence: sig.inheritanceFiles > 0 ? 0.65 : 0.5,
  };
}

function scoreIsp(sig: SolidSignals): PrincipleResult {
  let strength: PrincipleStrength;
  if (sig.totalInterfaces === 0) {
    strength = "moderate";
  } else if (sig.fatInterfaces === 0) {
    strength = "strong";
  } else if (sig.fatInterfaces <= 2) {
    strength = "moderate";
  } else {
    strength = "needs_work";
  }
  return {
    principle: "I",
    name: "Interface Segregation",
    strength,
    score: strengthToScore(strength),
    confidence: sig.totalInterfaces > 5 ? 0.75 : 0.5,
  };
}

function scoreDip(sig: SolidSignals): PrincipleResult {
  let strength: PrincipleStrength;
  if (sig.hasDiContainer || (sig.abstractionPatternFiles > 3 && sig.directInfraImportFiles === 0)) {
    strength = "strong";
  } else if (sig.directInfraImportFiles <= 3) {
    strength = "moderate";
  } else {
    strength = "needs_work";
  }
  return {
    principle: "D",
    name: "Dependency Inversion",
    strength,
    score: strengthToScore(strength),
    confidence: sig.analyzedFiles > 10 ? 0.7 : 0.5,
  };
}

/**
 * Compute SOLID per-principle and overall scores from pre-computed signals.
 */
export function analyzeSolid(signals: SolidSignals): SolidScoreResult {
  const principles: PrincipleResult[] = [
    scoreSrp(signals),
    scoreOcp(signals),
    scoreLsp(signals),
    scoreIsp(signals),
    scoreDip(signals),
  ];
  const total = principles.reduce((sum, p) => sum + p.score, 0);
  const overallScore = roundScore(total / principles.length);
  return {
    overallScore,
    grade: scoreToGrade(overallScore),
    principles,
  };
}
