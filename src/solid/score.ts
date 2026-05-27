/**
 * SOLID scoring — pure function from signals to per-principle and
 * overall scores. Bucketing matches the prism0x2A reference impl:
 * strong=90, moderate=65, needs_work=35.
 *
 * Special cases:
 *   - When `analyzedFiles === 0` the input carries no signal and the
 *     result is flagged as `noData` with grade "N/A". Consumers should
 *     surface a "nothing scanned" state instead of treating the moderate
 *     defaults as a real verdict.
 *   - Per-principle recommendations are gated on their underlying
 *     counts: a template that would otherwise emit "Replace 0 large
 *     switch/if chains…" is replaced with a maintenance-style hint.
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
  const offenders = sig.largeFiles + sig.heavyExportFiles;
  const recommendation = offenders > 0
    ? `Decompose ${offenders} oversized / heavy-export files. Aim for one reason to change per module.`
    : "Maintain file size discipline. Split when a file exceeds 500 lines or serves more than one role.";
  return {
    principle: "S",
    name: "Single Responsibility",
    strength,
    score: strengthToScore(strength),
    confidence: sig.analyzedFiles > 10 ? 0.75 : 0.5,
    recommendation,
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
  const offenders = sig.largeSwitchFiles + sig.cascadingIfFiles;
  const recommendation = offenders > 0
    ? `Replace ${offenders} large switch/if chains with strategy maps, plugin patterns, or union type dispatch.`
    : "Continue using polymorphism / strategy patterns for new behaviour.";
  return {
    principle: "O",
    name: "Open/Closed",
    strength,
    score: strengthToScore(strength),
    confidence: sig.analyzedFiles > 10 ? 0.65 : 0.45,
    recommendation,
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
  const recommendation = sig.narrowingStubFiles > 0
    ? `Audit ${sig.narrowingStubFiles} narrowing stubs ("not implemented" / "TODO: implement") — subclasses must honour their parent's contract.`
    : sig.inheritanceFiles === 0
      ? "No inheritance hierarchies present — LSP is not actively tested."
      : "Subtypes appear to honour their base contracts. Keep an eye on optional/null narrowing in overrides.";
  return {
    principle: "L",
    name: "Liskov Substitution",
    strength,
    score: strengthToScore(strength),
    confidence: sig.inheritanceFiles > 0 ? 0.65 : 0.5,
    recommendation,
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
  const recommendation = sig.fatInterfaces > 0
    ? `Split ${sig.fatInterfaces} fat interfaces (>= 15 members) into role-specific contracts.`
    : sig.totalInterfaces === 0
      ? "No interfaces declared — consider extracting contracts where clients depend on concrete classes."
      : "Interfaces appear role-focused. Keep them small as new collaborators are added.";
  return {
    principle: "I",
    name: "Interface Segregation",
    strength,
    score: strengthToScore(strength),
    confidence: sig.totalInterfaces > 5 ? 0.75 : 0.5,
    recommendation,
  };
}

function scoreDip(sig: SolidSignals): PrincipleResult {
  let strength: PrincipleStrength;
  // Strong when *any* of these hold:
  //   - a DI container is declared,
  //   - abstraction patterns are visible and there are no direct infra imports,
  //   - there are no direct infra import violations at all (plenty of
  //     fine codebases use plain constructor injection without inversify
  //     or tsyringe — penalising them for that was bug #2 in 0.3.1).
  if (
    sig.hasDiContainer ||
    (sig.abstractionPatternFiles > 3 && sig.directInfraImportFiles === 0) ||
    sig.directInfraImportFiles === 0
  ) {
    strength = "strong";
  } else if (sig.directInfraImportFiles <= 3) {
    strength = "moderate";
  } else {
    strength = "needs_work";
  }
  const recommendation = sig.directInfraImportFiles > 0
    ? `Invert ${sig.directInfraImportFiles} direct infrastructure imports behind a port / repository / service interface.`
    : "Dependencies flow through abstractions. Keep high-level modules free of concrete infra imports as new features land.";
  return {
    principle: "D",
    name: "Dependency Inversion",
    strength,
    score: strengthToScore(strength),
    confidence: sig.analyzedFiles > 10 ? 0.7 : 0.5,
    recommendation,
  };
}

/**
 * Compute SOLID per-principle and overall scores from pre-computed signals.
 */
export function analyzeSolid(signals: SolidSignals): SolidScoreResult {
  // No data — nothing was scanned, every signal is zero. Surface this
  // as a structured "N/A" instead of falling back to the moderate
  // defaults (which would lie a "70 / B" verdict for an empty repo).
  if (signals.analyzedFiles === 0) {
    const principles: PrincipleResult[] = [
      { principle: "S", name: "Single Responsibility", strength: "moderate", score: 0, confidence: 0, recommendation: "No source files analyzed." },
      { principle: "O", name: "Open/Closed", strength: "moderate", score: 0, confidence: 0, recommendation: "No source files analyzed." },
      { principle: "L", name: "Liskov Substitution", strength: "moderate", score: 0, confidence: 0, recommendation: "No source files analyzed." },
      { principle: "I", name: "Interface Segregation", strength: "moderate", score: 0, confidence: 0, recommendation: "No source files analyzed." },
      { principle: "D", name: "Dependency Inversion", strength: "moderate", score: 0, confidence: 0, recommendation: "No source files analyzed." },
    ];
    return {
      overallScore: 0,
      grade: "N/A",
      principles,
      noData: true,
    };
  }

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
    noData: false,
  };
}
