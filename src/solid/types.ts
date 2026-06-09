/**
 * SOLID — type definitions for the pure scoring function.
 *
 * The scorer takes pre-computed signals (you walk the filesystem; the
 * scorer does the math). This keeps the package zero-I/O and lets
 * callers feed signals from any source (filesystem, language server,
 * git history, etc.).
 */

import type { InsufficientSignalResult } from "../core/insufficient.js";

export type PrincipleStrength = "strong" | "moderate" | "needs_work";

export type PrincipleCode = "S" | "O" | "L" | "I" | "D";

/**
 * Source language hint. Several SOLID principles only have a concrete
 * idiom in some languages (LSP requires classical inheritance; ISP
 * requires named interfaces). When the language doesn't have the
 * idiom, the affected principle returns an InsufficientSignalResult
 * (reason: "missing_language") instead of silently falling back to a
 * moderate default.
 *
 * "other" disables idiom-based gating — every principle is scored.
 * "ts" is the default for backwards compatibility.
 */
export type SolidLanguage =
  | "ts"
  | "java"
  | "go"
  | "rust"
  | "python"
  | "ruby"
  | "csharp"
  | "other";

export interface SolidSignals {
  /** How many source files contributed to the signals below. */
  analyzedFiles: number;

  // SRP signals
  /** Files exceeding the SRP large-file threshold (default 500 LOC). */
  largeFiles: number;
  /** Files with > 10 top-level exports. */
  heavyExportFiles: number;

  // OCP signals
  /** Files containing >= 6 `case` statements. */
  largeSwitchFiles: number;
  /** Files containing >= 8 cascading `else if` branches. */
  cascadingIfFiles: number;
  /** Files using extension-point patterns (strategy / abstract / impl / union). */
  strategyPatternFiles: number;

  // LSP signals
  /** Files using `extends` or `implements`. */
  inheritanceFiles: number;
  /** Inheriting files containing "not implemented" / "TODO: implement" stubs. */
  narrowingStubFiles: number;

  // ISP signals
  totalInterfaces: number;
  /** Interfaces with >= 15 members. */
  fatInterfaces: number;

  // DIP signals
  /** True if a DI container dependency was found in package.json. */
  hasDiContainer: boolean;
  /** Files using Repository/Service/Port interfaces or constructor injection. */
  abstractionPatternFiles: number;
  /** High-level modules directly importing low-level infrastructure. */
  directInfraImportFiles: number;

  /**
   * Optional source language. Drives per-principle "missing_language"
   * gating: principles whose idiom is absent in the language emit an
   * InsufficientSignalResult instead of a moderate default. Defaults
   * to "ts" if omitted (backwards compatible).
   */
  language?: SolidLanguage;

  /**
   * Optional audit-only field. The list of filesystem paths the caller
   * excluded before counting signals (typically derived from
   * `src/core/scanner-exclusions.ts`). Does NOT affect the score —
   * this is a disclosure channel so consumers can verify what was and
   * wasn't measured.
   */
  excludedPaths?: string[];
}

export interface PrincipleResult {
  principle: PrincipleCode;
  name: string;
  strength: PrincipleStrength;
  score: number;
  confidence: number;
  /**
   * Actionable, count-aware recommendation. Recommendations that would
   * bake a literal "0 …" count into their text (e.g. "Replace 0 large
   * switch/if chains") are suppressed and a maintenance-style hint is
   * emitted instead.
   */
  recommendation: string;
  /**
   * Optional structured warning when the input is internally
   * inconsistent (e.g. `largeFiles > analyzedFiles`). Does not affect
   * the score by itself; flagged so callers can surface a data-quality
   * issue rather than silently scoring on impossible counts.
   */
  warning?: string;
}

/**
 * Per-principle result — either a normal {@link PrincipleResult} or an
 * {@link InsufficientSignalResult} with `reason: "missing_language"`
 * when the principle's idiom does not exist in the source language
 * (e.g. LSP for Go, ISP for Rust). Narrow with
 * {@link import("../core/insufficient.js").isInsufficient} before
 * reading score/strength.
 */
export type PrincipleResultOrNA = PrincipleResult | InsufficientSignalResult;

export interface SolidScoreResult {
  overallScore: number;
  grade: string;
  principles: PrincipleResultOrNA[];
  /**
   * True when no source files were analyzed (every signal is zero
   * because nothing was scanned). Consumers should treat the score as
   * undefined / N/A and surface a "no data" state instead of the
   * default-bucket fallback.
   */
  noData: boolean;
}
