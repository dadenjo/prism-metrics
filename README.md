# prism-metrics

Open methodology and pure scoring implementations for the architecture frameworks used by prism0x2A.

## Install

```bash
npm install prism-metrics
```

## Usage

```ts
import { analyzeSolid, SOLID_METHODOLOGY } from "prism-metrics/solid";

const result = analyzeSolid({
  analyzedFiles: 142,
  largeFiles: 6,
  heavyExportFiles: 3,
  largeSwitchFiles: 1,
  cascadingIfFiles: 0,
  strategyPatternFiles: 18,
  inheritanceFiles: 4,
  narrowingStubFiles: 0,
  totalInterfaces: 22,
  fatInterfaces: 1,
  hasDiContainer: false,
  abstractionPatternFiles: 9,
  directInfraImportFiles: 0,
});

console.log(result.overallScore, result.grade);
```

Every framework exports the same three things:

- a pure `analyze*` scoring function (no filesystem, network, or env access)
- a typed signal input interface
- a `*_METHODOLOGY` constant describing the definition, signals, formula, and any honest gaps

See `src/<framework>/methodology.ts` for the human-readable specs.

## Frameworks in v0.2.0

| Subpath | Description |
| --- | --- |
| `prism-metrics/solid` | SOLID principles (SRP, OCP, LSP, ISP, DIP) — file/interface heuristics |
| `prism-metrics/clean-arch` | Clean Architecture dependency-rule violations |
| `prism-metrics/hexagonal` | Ports & Adapters violations |
| `prism-metrics/c4` | C4 model coverage (L1–L3, no headline score) |
| `prism-metrics/twelve-factor` | Twelve-Factor App per-factor scoring |
| `prism-metrics/dora-predicted` | DORA four key metrics predicted from architectural signals (not measured) |
| `prism-metrics/conways-law` | Team/code coupling alignment |
| `prism-metrics/wardley` | Wardley map evolution-stage classification |
| `prism-metrics/iso-25010` | ISO/IEC 25010 — 6 of 8 characteristics |
| `prism-metrics/eip` | Enterprise Integration Patterns detection |
| `prism-metrics/ddd` | DDD bounded-context inference |
| `prism-metrics/eda` | Event-driven pattern detection |
| `prism-metrics/monorepo` | Monorepo per-capability isolation health |
| `prism-metrics/auto-detect` | Framework auto-detection from manifest signals |

## Verify on your own data

Every scorer ships with `input.json` / `expected.json` fixture pairs under `src/<framework>/__tests__/__fixtures__/`. To reproduce scores locally:

```bash
git clone https://github.com/dadenjo/prism-metrics
cd prism-metrics
npm install
npm test
```

104 fixture-backed assertions cover every scorer. Same input, same output, no I/O — the scorers are pure functions.

Inside your own project:

```ts
import { analyzeCleanArch } from "prism-metrics/clean-arch";

const result = analyzeCleanArch({
  totalCapabilities: 24,
  unknownCapabilities: 2,
  adjacentViolations: 0,
  mediumViolations: 0,
  criticalViolations: 0,
});

// { score: 100, grade: 'A+', totalViolations: 0, ... }
```

## What's new in 0.2.0

This release aligns every scorer with the prism0x2A dashboard reference implementation, so the public package can serve as the single source of truth for framework scoring. Highlights:

- **iso-25010** — six LOCKED_FORMULA per-characteristic sub-formulas (functional_suitability, performance_efficiency, reliability, security, maintainability, portability) now match the dashboard exactly. Adds `hardcodedConfigHits` and rebases `averageChurn` to a per-capability raw count.
- **dora-predicted** — level assignment for Lead Time (driftRiskLevel buckets), Change Failure Rate (cycles AND drift), and MTTR (criticalDrifted + cog-load shortcut) now mirrors the dashboard. `criticalDriftCount` renamed to boolean `criticalDrifted`.
- **eda** — `hasEda` is ANY-of-five (producers OR consumers OR brokers OR cqrs OR sagas), confidence is the weighted file-category sum the dashboard uses.
- **eip** — pattern catalog expanded from 8 to **18 patterns** across 5 categories; new `detectEipPatterns(candidates)` runs the regex catalog; `architectureType` now produces dashboard's 5 labels (event_driven_saga, event_driven_pubsub, message_based, content_based_routing, point_to_point) and emits `missingPatternSuggestions`.
- **c4** — exports `containerGroup(id, name)` and `isPersonCap(name)` from the dashboard's `buildC4Model` heuristics. Diagram rendering remains a UI concern.
- **wardley** — exports `classifyEvolution(input)` and `classifyValueChain(name, id)` so callers can derive stage/visibility from raw signals.
- **ddd** — exports `classifyContext`, `extractUbiquitousLanguage`, `inferRelationshipPattern`; vocabulary aligned with dashboard (`ContextType` = core_domain/supporting/generic; `RelationshipPattern` = upstream_downstream/shared_kernel/anticorruption_layer/open_host_service/conformist/partnership).
- **auto-detect** — primary export renamed to `detectFrameworks` (`analyzeAutoDetect` kept as alias); 14 dep-driven detectors + 6 file/dir-driven detectors with hand-calibrated dashboard confidence; new `architectureStyle` inference (1 of 8 styles).

Breaking changes affect signal/result shapes for the scorers above — see each module's TypeScript types for the new contract.

## Honest gaps

The methodology constants spell out where signals are weak (heuristic naming, sample caps, predictive-not-measured for DORA, 6-of-8 for ISO 25010). Read the `honestGap` field before using a score in production.

## License

MIT
