# prism-metrics changelog

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
