# Scanner exclusions

prism-metrics ships pure scoring functions, but the framework also exposes
a small set of **scanner-exclusion primitives** under `prism-metrics/core`.
Every production-quality scanner that walks a filesystem and counts regex
hits — ISO 25010 Security, Clean Architecture violation hunts, SOLID
heuristics, DDD layer checks — must use these primitives or it will
silently disagree with the published methodology.

This page documents **what gets skipped, and why**. Hidden exclusions look
like cheating; transparent exclusions are methodology.

## What's exported

From `prism-metrics/core` (also re-exported from the root entry):

- `IGNORE_DIRS: ReadonlySet<string>` — directory names skipped during the
  walk. Match by name component, not by glob.
- `TEST_FILE_PATTERNS: ReadonlyArray<RegExp>` — filename patterns that
  mark a file as a test/fixture/mock and exclude it from production scans.
- `stripComments(content: string): string` — strip JS/TS line + block
  comments and Python/shell `#` comments before regex tests run.
- `shouldScanFile(filepath: string): boolean` — convenience that combines
  the directory and filename checks.

## What gets skipped, and why

### Directories (`IGNORE_DIRS`)

| Category | Entries | Why |
| --- | --- | --- |
| Build / cache / vendor | `node_modules`, `.git`, `.next`, `dist`, `build`, `coverage`, `.cache`, `__pycache__`, `.vercel`, `.turbo`, `out`, `tmp`, `.storybook`, `storybook-static` | Generated or third-party output. Hits here measure dependencies, not the user's code. |
| Agent / tool worktrees | `.claude`, `.amber`, `.mcs`, `.prism` | Ephemeral agent workspaces (claude-code worktrees, scratch dirs). Empirical trigger: Atomar scored ISO Security **10 / F** because the scanner counted hits inside `.claude/worktrees/` while real production source was clean. |
| Test layout | `__tests__`, `__mocks__`, `test`, `tests`, `spec`, `fixtures` | Fixtures legitimately contain dummy credentials, magic numbers, and hardcoded URLs. Flagging them is a false positive the user cannot action. |

### Filenames (`TEST_FILE_PATTERNS`)

The directory list catches whole subtrees. Filename patterns catch the
common JS/TS shape where `foo.ts` and `foo.test.ts` live in the same
directory:

```
*.test.{ts,tsx,js,jsx,py}
*.spec.{ts,tsx,js,jsx,py}
*.e2e.{ts,tsx,js,jsx,py}
*.fixture.{ts,tsx,js,jsx,py}
*.mock.{ts,tsx,js,jsx,py}
test_*.py
```

### Comments (`stripComments`)

A doc line like

```ts
// in dev this lives at localhost:3000
```

would otherwise fire the hardcoded-host pattern. The scanner runs
`stripComments` first so prose about production never gets scored as
production.

The strip is naive and line-based — it does not handle nested comments
or `//` inside string literals beyond a best-effort guard against URL
schemes (`://`) and quoted `#`. That is enough for regex-based scanners
and intentionally simpler than a full parser.

## Why this lives in prism-metrics

A scorer that grades a repo while accidentally scanning
`.claude/worktrees/` is going to lie to the user — the same way the
Atomar Security 10/F result lied until W78 landed. Centralising the
exclusion contract in the published methodology package means:

1. Every framework scorer that ships here uses the same skip list.
2. Downstream scorers can import the exact same primitives and stay
   consistent with the published grade.
3. Anyone auditing the methodology can read this page instead of
   reverse-engineering scanner internals.

If you ship a new scanner that ignores `IGNORE_DIRS` /
`TEST_FILE_PATTERNS` / `stripComments`, you are publishing a different
methodology than the one this package documents. Use the shared module.
