# prism-metrics changelog

## 0.5.0

Audit follow-ups from the 2026-06-09 multi-agent review across all
14 frameworks. Closes 6 cross-cutting bugs and ships the long-form
Fachkonzept + audit handbook.

### twelve-factor (`src/twelve-factor/score.ts` + `types.ts`)

- **`FactorStatus` extended with `"n/a"`** so factors caller-owned on
  Heroku/VM but platform-owned on Vercel/Lambda/Workers can be
  excluded from the denominator. A correctly-built Next.js app no
  longer gets dinged on port_binding / processes / concurrency /
  disposability / admin_processes — those are the platform's job.
- **`"unknown"` no longer awards 25% credit.** Pre-fix, an all-unknown
  repo scored 25/F (active penalty for things we can't measure).
  Unknown factors now drop OUT of the denominator and lower the new
  `confidence` field instead.
- **New `confidence`, `noData`, `naCount` fields** on the result.
  noData=true when nothing was measurable; result returns score=0,
  grade='N/A', readiness=null in that state.
- **New `PLATFORM_OWNED_FACTORS` reference mapping** so callers can use
  defaults for vm / paas / serverless / edge deployments.

### monorepo (`src/monorepo/score.ts` + `types.ts`)

- **`noData` flag added** — capabilities.length === 0 OR buildSystem is
  'none' / 'unknown' returns `noData:true, averageHealth:null` so a
  polyrepo / unanalysable project is distinguishable from a
  maximally-coupled monorepo.
- **`BuildSystem` extended** to cover Go workspaces, Cargo workspaces,
  Pants, Buck2, Gradle composite, pnpm + an explicit 'unknown' distinct
  from 'none'. Closes the polyglot blind spot.

### dora-predicted (`src/dora-predicted/score.ts` + `types.ts`)

- **`"insufficient"` DoraLevel added.** Pre-fix, an empty repo
  (every signal at zero) hit the elite branches by coincidence and
  returned overallLevel='high'. Zero signal is now explicit:
  every metric is 'insufficient', overallRank is null, the new
  `insufficient: true` flag is set, predictionConfidence is 0.
- **Result fields renamed to `predicted*`** (was `deploymentFrequency`,
  …). UIs printing 'Deployment Frequency: elite' can't accidentally
  pass it off as a measured DORA report.
- **New `predictionConfidence: number` field** (0-1). 0.6 baseline for
  normal predictions reflects architectural-proxy uncertainty.

### docs

- **New `docs/handbook.html` + `docs/handbook.evidence.json`** — Fachkonzept
  + implementation audit covering all 14 frameworks. Every claim
  sourced; navigable single-page HTML.

## 0.3.1

Bug fixes lifted from the dashboard wrapper layer so external consumers
of the package benefit too.

### SOLID (`src/solid/score.ts` + `types.ts`)

- **Zero-signals input now returns a structured `noData` result with
  grade `"N/A"`.** Previously, an empty input (e.g. nothing was
  scanned) fell through to the moderate-default buckets and surfaced a
  misleading `70 / B` verdict.
- **DIP no longer dings repos for "no DI container" when there are
  zero direct infra-import violations.** Plenty of healthy codebases
  use plain constructor injection without `inversify` / `tsyringe`;
  they now score `strong` (90) instead of `moderate` (65).
- **Per-principle recommendations are count-aware.** A new
  `recommendation` field is emitted on every `PrincipleResult`, and
  templates that would have read "Replace 0 large switch/if chains…"
  / "Decompose 0 oversized files…" are suppressed in favour of a
  maintenance-style hint.

### Conway's Law (`src/conways-law/score.ts` + `types.ts`)

- **Single-team repos are now hard-clamped to score 50** with a new
  `verdict: "undefined"` field. Previously, the unowned-capability
  penalty was applied on top of the 50 baseline and could push the
  score below 50, surfacing a misleading "Misaligned" verdict on a
  repo that simply has no team split. Multi-team repos additionally
  receive a banded `verdict` of `aligned` / `partially_aligned` /
  `misaligned` / `fragmented`.

### Migration

Patch release — no breaking API changes. `SolidScoreResult` gains a
`noData: boolean` field, `PrincipleResult` gains `recommendation:
string`, and `ConwaysLawScoreResult` gains `verdict:
ConwaysLawVerdict`. All additive.

## 0.3.0 and earlier

See `git log` for prior history.
