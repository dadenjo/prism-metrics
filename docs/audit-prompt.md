# prism-metrics audit prompt template

Reproducible recipe for the multi-agent audit that produced
`docs/handbook.html`. The first audit ran on 2026-06-09 and surfaced
57 findings across 14 frameworks. Re-running the audit on a future
version of `prism-metrics` should produce a diff against the published
handbook — that diff is the next audit's input.

## Pre-requisites

- One LLM coding agent with file-read + web-fetch capability
  (Claude Code, Cursor, or equivalent). Multi-agent fan-out is a
  cost optimisation, not a correctness requirement — a single
  agent running the per-framework template 14 times produces the
  same results.
- Read access to:
  - `prism-metrics` source (this repo, `src/<framework>/` per
    framework)
  - The primary methodology source for each framework (book,
    standard, canonical author website). The handbook's existing
    Citations section per framework lists them.
  - The prism dashboard reference implementation, when present,
    for cross-validation that the published scorer behaves the
    same as the dashboard it was extracted from.

## Spawn one agent per framework

For each framework `F` in the list below, spawn an agent with the
**Per-framework template** further down, substituting `<F>` with
the framework directory name.

Frameworks (14):
```
iso-25010    solid          clean-arch    hexagonal
eip          eda            conways-law   wardley
twelve-factor monorepo      dora-predicted ddd
c4           auto-detect
```

Plus 1 cross-cutting pass for the `core/` foundation (scanner
exclusions + `InsufficientSignalResult`).

## Per-framework template

````md
You are a senior software architect performing a read-only audit of
one framework in the open-source npm package `prism-metrics`. Your
deliverable is a structured Markdown report on ONE framework.

Framework under audit: <F>
Source path: src/<F>/

Inputs:
1. Read `src/<F>/methodology.ts`, `src/<F>/score.ts`, `src/<F>/types.ts`
   in full.
2. Read `src/<F>/__tests__/score.test.ts` + all `__fixtures__/*.json`.
3. Fetch the primary methodology source(s) cited in the handbook for
   framework <F>. Verify the URL is reachable AND the cited claim is
   present in the source as stated.

For each input source, log:
- URL, accessed timestamp
- The exact sentence(s) being relied on
- Whether the implementation's claim is supported (verified /
  unsupported / partially-supported)

Output sections (use these exact headings):

### 1. Concept summary

3-5 paragraphs. What is the framework, who published it, what does
it claim to measure, what are its known limitations. Cite at least
3 primary sources.

### 2. Expected results

Given the methodology, what OUGHT the scorer return for:
- A canonical "clean" input (best-case)
- A canonical "violation" input (worst-case)
- An "ambiguous" input (boundary case)
- An "adversarial" input (deliberately constructed to surface bugs)

Be specific: state the expected score, grade, and any boolean flags.

### 3. Implementation audit

Walk the source line by line. For each finding, produce:
- Stable ID: `<F>-<N>` (e.g. `iso-3`)
- Severity: CRITICAL | HIGH | MEDIUM | LOW
- Location: file path + line number
- Description: one-paragraph explanation of the divergence
- Recommendation: minimal fix

A finding is one of:
1. The scorer's output diverges from the methodology source in
   a measurable way (e.g. step cliffs the methodology says should
   be continuous).
2. The scorer has an empty / malformed / boundary input that
   produces a misleading grade (e.g. zero-signal-input returns
   A+ on a vacuous-truth path).
3. A claim in `methodology.ts` is contradicted by `score.ts`.
4. A claim in `methodology.ts` is not testable from outside the
   package (caller-trust requirement that should be in
   honestGap).

### 4. Empirical verification

Run the existing test suite for `src/<F>/`. Report:
- Tests existing: count + file count
- Tests passing: count
- Coverage: lines % + branches % (from `npx vitest run --coverage`
  filtered to `src/<F>/`)
- For each new finding above, propose ONE regression test that
  would have caught it. State the test name, the input signal it
  uses, and the assertion.

### 5. Conformance verdict

One pill:
- **Conformant** — no findings or only LOW severity. The scorer
  matches its published methodology.
- **Conformant with caveats** — MEDIUM findings present, all
  acknowledged in `honestGap`.
- **Drift** — at least one HIGH finding. The published methodology
  text needs an update, or the scorer behaviour needs a fix.
- **Divergent** — at least one CRITICAL finding. The scorer is
  producing materially wrong results for inputs the methodology
  promises to handle.

### 6. Citations

Bulleted list of every URL fetched + the cited claim. Failed
fetches noted explicitly. Mark each as "verified" (URL reachable
AND cited claim present) or "unverified" (URL reachable but
cited claim NOT present in source).

Constraints:
- Use the exact `<F>-<N>` ID scheme for findings (so the
  handbook merge can match against the existing IDs and detect
  whether a finding was new, modified, or already closed).
- Do NOT modify source files. Read-only.
- Do NOT make claims you cannot cite. If unsure, write "unable
  to verify" rather than inventing.
````

## Combining into a handbook update

After all per-framework reports return:

1. Diff each report's findings against the current
   `docs/handbook.html` "Implementation audit" subsection per
   framework.
2. Classify each finding as:
   - **NEW** — not previously identified
   - **OPEN** — previously identified, still unresolved
   - **CLOSED** — previously identified, now fixed (a passing
     test now covers it)
   - **REGRESSION** — previously CLOSED, now broken again
3. Produce a single Pull Request to `docs/handbook.html` that:
   - Adds the NEW findings to the right framework section
   - Marks the CLOSED ones with their resolving PR number
   - Flags any REGRESSIONs in a top-level callout (these are the
     most actionable items)
4. Update `docs/handbook.evidence.json` with the new citation
   verification results.

## Cost / time estimate

- Per-framework audit: ~5-15 minutes of wall-clock + ~50k tokens
  for a thorough pass (reading source + fetching + writing
  structured report).
- 14 frameworks + 1 cross-cutting = 15 agent runs.
- Total: ~1.5h wall-clock if run in parallel, ~6-8h serial.
- Token cost @ Claude Sonnet 4.6 rates as of 2026-06: ~$3-5 per
  full audit pass.

## When to re-run

A new audit pass is justified when:
- A new methodology source is published (e.g. ISO 25010:2023
  added "Safety" as the 9th characteristic — that's a new
  audit's input)
- A scorer's signal shape changes (TypeScript type breakage
  caught at compile time; behavioural change needs an audit)
- A consumer reports a result that doesn't match their
  expectations (a "Should I trust this?" ticket is a signal
  that the handbook needs to address whatever they hit)

The previous audit's pass-id is recorded in the handbook cover
(`audit-2026-06-10-pass-1`). The next pass increments to
`pass-2`.
