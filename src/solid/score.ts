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
 *   - Per-principle "missing_language" gating: when the source language
 *     doesn't have the idiom for a principle (e.g. Go has no classical
 *     inheritance hierarchy, so LSP is N/A), that principle returns an
 *     {@link InsufficientSignalResult} instead of a moderate default,
 *     and is excluded from the overall mean.
 *
 * Bucket constant rationale (solid-3):
 *   The strong/moderate/needs_work buckets map to 90/65/35. These
 *   midpoints land in the middle of each letter-grade band (A+, C, F)
 *   so a principle's bucket reads off as the corresponding grade.
 *   They are deliberately discrete to avoid over-claiming precision
 *   from coarse heuristic signals (file-size cuts, regex matches).
 *
 *   The ratio cliffs (SRP <0.08/<0.20, OCP <0.05/<0.15) come from the
 *   prism0x2A reference impl and reflect "fewer than 1-in-12 files
 *   are oversized" (strong) vs "more than 1-in-5" (needs_work).
 *
 *   ISP/LSP previously used absolute thresholds (`fatInterfaces <= 2`,
 *   `narrowingStubFiles <= 2`) which penalised large codebases and
 *   under-detected small ones. We now normalise both by their
 *   denominator (`totalInterfaces` or `analyzedFiles`) so the cliffs
 *   are scale-invariant.
 */

import { insufficient, isInsufficient } from "../core/insufficient.js";
import type { InsufficientSignalResult } from "../core/insufficient.js";
import { roundScore, scoreToGrade } from "../core/methodology.js";
import type {
  PrincipleCode,
  PrincipleResult,
  PrincipleResultOrNA,
  PrincipleStrength,
  SolidLanguage,
  SolidScoreResult,
  SolidSignals,
} from "./types.js";

function strengthToScore(s: PrincipleStrength): number {
  if (s === "strong") return 90;
  if (s === "moderate") return 65;
  return 35;
}

/**
 * Per-principle idiom availability per language. `true` ⇒ the language
 * has the construct the principle measures; `false` ⇒ the principle
 * returns `InsufficientSignalResult` (reason: "missing_language").
 *
 * Rationale (solid-2):
 *   - Go: no classical inheritance ⇒ LSP N/A. Interfaces are
 *     structural but the `totalInterfaces` signal as the scorer
 *     defines it (named interface declarations) IS produced, so ISP
 *     stays in scope.
 *   - Rust: no classical inheritance ⇒ LSP N/A. Traits play the role
 *     of interfaces but are not what the ISP signal counts (the
 *     scorer's `totalInterfaces` is named-interface declarations).
 *   - Python / Ruby: duck-typed, no classical class-hierarchy
 *     contracts to verify ⇒ LSP weak; treat as N/A. ISP N/A — no
 *     declared interface members to count fatness of.
 *   - "other" disables gating: every principle is scored.
 */
const PRINCIPLE_APPLICABILITY: Record<SolidLanguage, Record<PrincipleCode, boolean>> = {
  ts:     { S: true,  O: true,  L: true,  I: true,  D: true  },
  java:   { S: true,  O: true,  L: true,  I: true,  D: true  },
  csharp: { S: true,  O: true,  L: true,  I: true,  D: true  },
  go:     { S: true,  O: true,  L: false, I: true,  D: true  },
  rust:   { S: true,  O: true,  L: false, I: true,  D: true  },
  python: { S: true,  O: true,  L: false, I: false, D: true  },
  ruby:   { S: true,  O: true,  L: false, I: false, D: true  },
  other:  { S: true,  O: true,  L: true,  I: true,  D: true  },
};

const PRINCIPLE_NAMES: Record<PrincipleCode, string> = {
  S: "Single Responsibility",
  O: "Open/Closed",
  L: "Liskov Substitution",
  I: "Interface Segregation",
  D: "Dependency Inversion",
};

function languageGap(code: PrincipleCode, language: SolidLanguage): InsufficientSignalResult | null {
  if (PRINCIPLE_APPLICABILITY[language][code]) return null;
  return insufficient(
    "missing_language",
    `${PRINCIPLE_NAMES[code]} (${code}) has no canonical idiom in ${language}; skipping rather than falling back to a moderate default.`,
    `Pass language: "other" to score every principle regardless of idiom fit.`,
  );
}

/** Optional invariant check — returns a warning string when input is malformed. */
function dataQualityWarning(sig: SolidSignals): string | undefined {
  if (sig.largeFiles > sig.analyzedFiles) {
    return `Inconsistent input: largeFiles (${sig.largeFiles}) > analyzedFiles (${sig.analyzedFiles}). Counts treated as-is; consumers should treat this as a data-quality issue.`;
  }
  if (sig.heavyExportFiles > sig.analyzedFiles) {
    return `Inconsistent input: heavyExportFiles (${sig.heavyExportFiles}) > analyzedFiles (${sig.analyzedFiles}).`;
  }
  if (sig.fatInterfaces > sig.totalInterfaces) {
    return `Inconsistent input: fatInterfaces (${sig.fatInterfaces}) > totalInterfaces (${sig.totalInterfaces}).`;
  }
  if (sig.narrowingStubFiles > sig.inheritanceFiles) {
    return `Inconsistent input: narrowingStubFiles (${sig.narrowingStubFiles}) > inheritanceFiles (${sig.inheritanceFiles}).`;
  }
  return undefined;
}

function withWarning(result: PrincipleResult, warning: string | undefined): PrincipleResult {
  return warning ? { ...result, warning } : result;
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
    name: PRINCIPLE_NAMES.S,
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
    name: PRINCIPLE_NAMES.O,
    strength,
    score: strengthToScore(strength),
    confidence: sig.analyzedFiles > 10 ? 0.65 : 0.45,
    recommendation,
  };
}

/**
 * LSP — normalised cliffs (solid-3).
 *
 * Previous: `narrowingStubFiles <= 2` was an absolute cliff. A 1000-
 * file project with 3 narrowing stubs got the same treatment as a
 * 10-file one with 3 stubs.
 * Now: ratio = narrowingStubFiles / inheritanceFiles.
 *   - ratio < 0.05 ⇒ strong (≈ "< 5% of inheriting files cheat")
 *   - ratio < 0.20 ⇒ moderate
 *   - otherwise   ⇒ needs_work
 * No inheritance at all ⇒ moderate (idiom not exercised) for TS/Java/
 * C#. Languages without classical inheritance bail earlier via
 * languageGap().
 */
function scoreLsp(sig: SolidSignals): PrincipleResult {
  let strength: PrincipleStrength;
  if (sig.inheritanceFiles === 0) {
    strength = "moderate";
  } else {
    const ratio = sig.narrowingStubFiles / sig.inheritanceFiles;
    if (ratio < 0.05) strength = "strong";
    else if (ratio < 0.20) strength = "moderate";
    else strength = "needs_work";
  }
  const recommendation = sig.narrowingStubFiles > 0
    ? `Audit ${sig.narrowingStubFiles} narrowing stubs ("not implemented" / "TODO: implement") — subclasses must honour their parent's contract.`
    : sig.inheritanceFiles === 0
      ? "No inheritance hierarchies present — LSP is not actively tested."
      : "Subtypes appear to honour their base contracts. Keep an eye on optional/null narrowing in overrides.";
  return {
    principle: "L",
    name: PRINCIPLE_NAMES.L,
    strength,
    score: strengthToScore(strength),
    confidence: sig.inheritanceFiles > 0 ? 0.65 : 0.5,
    recommendation,
  };
}

/**
 * ISP — normalised cliffs (solid-3).
 *
 * Previous: `fatInterfaces <= 2` was an absolute cliff. Scaled badly.
 * Now: ratio = fatInterfaces / totalInterfaces.
 *   - ratio < 0.05 ⇒ strong
 *   - ratio < 0.20 ⇒ moderate
 *   - otherwise   ⇒ needs_work
 * Zero interfaces ⇒ moderate (idiom not exercised).
 */
function scoreIsp(sig: SolidSignals): PrincipleResult {
  let strength: PrincipleStrength;
  if (sig.totalInterfaces === 0) {
    strength = "moderate";
  } else {
    const ratio = sig.fatInterfaces / sig.totalInterfaces;
    if (ratio < 0.05) strength = "strong";
    else if (ratio < 0.20) strength = "moderate";
    else strength = "needs_work";
  }
  const recommendation = sig.fatInterfaces > 0
    ? `Split ${sig.fatInterfaces} fat interfaces (>= 15 members) into role-specific contracts.`
    : sig.totalInterfaces === 0
      ? "No interfaces declared — consider extracting contracts where clients depend on concrete classes."
      : "Interfaces appear role-focused. Keep them small as new collaborators are added.";
  return {
    principle: "I",
    name: PRINCIPLE_NAMES.I,
    strength,
    score: strengthToScore(strength),
    confidence: sig.totalInterfaces > 5 ? 0.75 : 0.5,
    recommendation,
  };
}

/**
 * DIP — strong only with a positive abstraction signal (solid-1).
 *
 * Previous bug: `directInfraImportFiles === 0` alone awarded
 * strong/90. A buggy detector returning 0 for everything got a free
 * 90/A on DIP regardless of evidence.
 *
 * Now strong requires BOTH zero direct-infra imports AND at least one
 * positive abstraction signal (DI container, abstraction patterns,
 * OR named interfaces). Without that, we drop to moderate (with a
 * low-confidence note baked in via the score formula).
 */
function scoreDip(sig: SolidSignals): PrincipleResult {
  const hasPositiveAbstraction =
    sig.hasDiContainer ||
    sig.abstractionPatternFiles > 0 ||
    sig.totalInterfaces > 0;
  let strength: PrincipleStrength;
  let lowConfidenceVacuous = false;
  if (sig.directInfraImportFiles === 0 && hasPositiveAbstraction) {
    strength = "strong";
  } else if (sig.directInfraImportFiles === 0 && !hasPositiveAbstraction) {
    // No violations, but also no positive evidence — vacuous truth.
    // Award moderate, not strong, with reduced confidence.
    strength = "moderate";
    lowConfidenceVacuous = true;
  } else if (sig.directInfraImportFiles <= 3) {
    strength = "moderate";
  } else {
    strength = "needs_work";
  }
  const recommendation = sig.directInfraImportFiles > 0
    ? `Invert ${sig.directInfraImportFiles} direct infrastructure imports behind a port / repository / service interface.`
    : lowConfidenceVacuous
      ? "No direct-infra imports detected, but also no positive abstraction signal (DI container, ports, or named interfaces). Treat as undetermined and verify upstream signal collection."
      : "Dependencies flow through abstractions. Keep high-level modules free of concrete infra imports as new features land.";
  const baseConfidence = sig.analyzedFiles > 10 ? 0.7 : 0.5;
  return {
    principle: "D",
    name: PRINCIPLE_NAMES.D,
    strength,
    score: strengthToScore(strength),
    confidence: lowConfidenceVacuous ? 0.3 : baseConfidence,
    recommendation,
  };
}

/**
 * Compute SOLID per-principle and overall scores from pre-computed signals.
 *
 * Per-principle entries can be either {@link PrincipleResult} or
 * {@link InsufficientSignalResult} (for principles the source language
 * doesn't have an idiom for). Use `isInsufficient` to narrow.
 *
 * `excludedPaths` is an audit-only field — it does NOT affect the
 * score. The contract is that callers MUST filter their input file
 * list through {@link import("../core/scanner-exclusions.js")} before
 * computing the counted signals. We carry the field forward so
 * consumers can verify what was excluded.
 */
export function analyzeSolid(signals: SolidSignals): SolidScoreResult {
  // No data — nothing was scanned, every signal is zero. Surface this
  // as a structured "N/A" instead of falling back to the moderate
  // defaults (which would lie a "70 / B" verdict for an empty repo).
  if (signals.analyzedFiles === 0) {
    const principles: PrincipleResultOrNA[] = (["S", "O", "L", "I", "D"] as PrincipleCode[]).map(
      (code) => ({
        principle: code,
        name: PRINCIPLE_NAMES[code],
        strength: "moderate" as PrincipleStrength,
        score: 0,
        confidence: 0,
        recommendation: "No source files analyzed.",
      }),
    );
    return {
      overallScore: 0,
      grade: "N/A",
      principles,
      noData: true,
    };
  }

  const language: SolidLanguage = signals.language ?? "ts";
  const warning = dataQualityWarning(signals);

  const scorers: Record<PrincipleCode, (s: SolidSignals) => PrincipleResult> = {
    S: scoreSrp,
    O: scoreOcp,
    L: scoreLsp,
    I: scoreIsp,
    D: scoreDip,
  };

  const principles: PrincipleResultOrNA[] = (["S", "O", "L", "I", "D"] as PrincipleCode[]).map(
    (code) => {
      const gap = languageGap(code, language);
      if (gap) return gap;
      return withWarning(scorers[code](signals), warning);
    },
  );

  // Mean over SCORED principles only — InsufficientSignalResult
  // entries are excluded from the denominator so a language with
  // fewer applicable principles isn't artificially penalised.
  const scored = principles.filter(
    (p): p is PrincipleResult => !isInsufficient(p),
  );
  const total = scored.reduce((sum, p) => sum + p.score, 0);
  const overallScore = scored.length > 0 ? roundScore(total / scored.length) : 0;
  return {
    overallScore,
    grade: scored.length > 0 ? scoreToGrade(overallScore) : "N/A",
    principles,
    noData: scored.length === 0,
  };
}
