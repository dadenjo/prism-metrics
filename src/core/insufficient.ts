/**
 * @public
 * Result type for scorers that lack sufficient signal to grade.
 *
 * Empirical trigger: across the 13 prism-metrics frameworks, scorers
 * silently fall back to misleading defaults on empty/missing input —
 * ISO-25010 returns "D" on a brand-new repo, Clean-Arch returns "A+"
 * on an empty registry, Conway's Law returns "D" verdict "undefined"
 * for a solo developer. All three shapes are user-hostile: the user
 * sees a definite grade rendered on every dashboard for a state where
 * no grade is meaningful.
 *
 * `InsufficientSignalResult` is the explicit "we cannot grade this"
 * return shape. Callers MUST handle it before treating any scorer
 * output as a grade. The `scoreToGrade()` helper throws if called on
 * one of these values, so accidentally rendering "D" for an empty
 * dataset becomes a compile-time-style runtime error.
 */
export interface InsufficientSignalResult {
  readonly ok: false;
  readonly reason:
    | "no_input"          // signals object is null/undefined/empty
    | "too_young"         // project too new to have meaningful metrics
    | "single_team"       // Conway-style: org structure proxy is undefined
    | "missing_language"  // SOLID-style: language idiom not present
    | "missing_signal";   // generic — a required signal field is null
  readonly detail: string;
  readonly hint?: string;
}

/** Construct an InsufficientSignalResult. */
export function insufficient(
  reason: InsufficientSignalResult["reason"],
  detail: string,
  hint?: string,
): InsufficientSignalResult {
  return { ok: false, reason, detail, ...(hint !== undefined ? { hint } : {}) };
}

/** Type guard for narrowing union results. */
export function isInsufficient<T>(
  r: T | InsufficientSignalResult,
): r is InsufficientSignalResult {
  return (
    typeof r === "object" &&
    r !== null &&
    "ok" in r &&
    (r as { ok: unknown }).ok === false &&
    "reason" in r
  );
}
