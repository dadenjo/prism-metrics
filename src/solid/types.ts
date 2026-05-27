/**
 * SOLID — type definitions for the pure scoring function.
 *
 * The scorer takes pre-computed signals (you walk the filesystem; the
 * scorer does the math). This keeps the package zero-I/O and lets
 * callers feed signals from any source (filesystem, language server,
 * git history, etc.).
 */

export type PrincipleStrength = "strong" | "moderate" | "needs_work";

export type PrincipleCode = "S" | "O" | "L" | "I" | "D";

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
}

export interface SolidScoreResult {
  overallScore: number;
  grade: string;
  principles: PrincipleResult[];
  /**
   * True when no source files were analyzed (every signal is zero
   * because nothing was scanned). Consumers should treat the score as
   * undefined / N/A and surface a "no data" state instead of the
   * default-bucket fallback.
   */
  noData: boolean;
}
