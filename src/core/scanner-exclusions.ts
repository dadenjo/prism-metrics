/**
 * Shared scanner-exclusion primitives.
 *
 * Every production-quality scanner in prism-metrics (ISO 25010 Security,
 * Clean Architecture violation hunts, SOLID heuristics, DDD layer checks,
 * …) walks a filesystem and counts regex hits. Without a shared exclusion
 * contract each scanner reinvents its own — and the same false-positive
 * class recurs:
 *
 *  - Hits inside `__tests__/` or `*.test.ts` files (fixtures with dummy
 *    credentials, magic numbers, hard-coded URLs).
 *  - Hits inside agent-tool worktrees (`.claude/worktrees/`, `.amber/`).
 *  - Hits inside comments (`// in dev this is localhost:3000`).
 *
 * Empirical trigger: Atomar's ISO 25010 Security score landed at 10/F
 * because the scanner counted hits from `.test.ts` files and the
 * `.claude/worktrees/` directory. Real production source was clean.
 *
 * Because prism-metrics is the public reference implementation, these
 * exclusions live here as a reusable module — methodology, not scanner
 * internals. A scorer that silently scans `.claude/worktrees/` is going
 * to lie to its user. See `docs/scanner-exclusions.md` for the
 * disclosure rationale.
 */

/**
 * @public
 * Directories the scanners skip. Tests, fixtures, build output, IDE
 * artefacts, agent-tool worktrees. Each entry is a literal directory
 * name (no globs) — callers match by name component when walking the
 * tree. Empirical trigger: Atomar Security 10/F was driven by hits in
 * .claude/worktrees/ and __tests__/ which are not production code.
 */
export const IGNORE_DIRS: ReadonlySet<string> = new Set<string>([
  // Build / cache / vendor.
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".cache",
  "__pycache__",
  ".vercel",
  ".turbo",
  "out",
  "tmp",
  ".storybook",
  "storybook-static",
  // Agent / tool worktrees.
  ".claude",
  ".amber",
  ".mcs",
  ".prism",
  // Test layout.
  "__tests__",
  "__mocks__",
  "test",
  "tests",
  "spec",
  "fixtures",
]);

/**
 * @public
 * Filename patterns that mark a file as test/fixture/mock and should
 * be skipped by production-quality scanners. Test fixtures legitimately
 * contain dummy credentials, magic numbers, and other patterns that
 * would otherwise trigger false positives.
 */
export const TEST_FILE_PATTERNS: ReadonlyArray<RegExp> = [
  /\.test\.(?:ts|tsx|js|jsx|py)$/,
  /\.spec\.(?:ts|tsx|js|jsx|py)$/,
  /\.e2e\.(?:ts|tsx|js|jsx|py)$/,
  /\.fixture\.(?:ts|tsx|js|jsx|py)$/,
  /\.mock\.(?:ts|tsx|js|jsx|py)$/,
  /^test_.*\.py$/i,
];

/**
 * @public
 * Strip single-line, block, and Python/shell comments from `content`
 * BEFORE the scanner regex tests run. Without this, a doc line like
 * `// in dev this lives at localhost:3000` fires the hardcoded-host
 * pattern even though no production code uses the URL.
 *
 * Naive line-based strip — does not handle nested comments or strings
 * containing `//` etc. Sufficient for regex-based scanners; insufficient
 * for AST-based analysis.
 */
export function stripComments(content: string): string {
  return (
    content
      // Block comments  /* ... */  (DOTALL via [\s\S])
      .replace(/\/\*[\s\S]*?\*\//g, "")
      // Single-line // comments — guard against `://` (URL scheme) and
      // escaped `\//`. Keep the preceding char.
      .replace(/(^|[^:\\])\/\/[^\n]*/g, "$1")
      // Python / shell # comments — guard against `#` inside a string
      // literal (best-effort: skip when preceded by a quote or `$`).
      .replace(/(^|[^"'$])#[^\n]*/g, "$1")
  );
}

/**
 * @public
 * Convenience: should this filepath be scanned at all? Combines the
 * directory exclusion check with the test-file pattern check. Pass
 * `filepath` either absolute or relative; the helper checks each
 * component independently.
 */
export function shouldScanFile(filepath: string): boolean {
  if (!filepath) return false;
  // Split on both POSIX and Windows separators so the helper works on
  // either platform without callers having to normalise first.
  const parts = filepath.split(/[\\/]/).filter((p) => p.length > 0);
  if (parts.length === 0) return false;
  // Any component matching an ignored directory disqualifies the path.
  for (let i = 0; i < parts.length - 1; i++) {
    if (IGNORE_DIRS.has(parts[i]!)) return false;
  }
  // Final component (the filename) gets the test-pattern check.
  const basename = parts[parts.length - 1]!;
  // The basename itself could ALSO be a directory name in IGNORE_DIRS
  // (e.g. a path like `foo/tests` referring to the directory). Treat
  // that as a skip too — scanners pass us file paths, so a bare dir
  // name is a degenerate case but worth handling consistently.
  if (IGNORE_DIRS.has(basename)) return false;
  if (TEST_FILE_PATTERNS.some((re) => re.test(basename))) return false;
  return true;
}
