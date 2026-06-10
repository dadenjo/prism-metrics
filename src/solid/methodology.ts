import type { Methodology } from "../core/methodology.js";

export const SOLID_METHODOLOGY: Methodology = {
  definition:
    "Five object-oriented design principles (SRP, OCP, LSP, ISP, DIP) for keeping software easy to change. Robert C. Martin, Agile Software Development: Principles, Patterns, and Practices (2003).",
  referenceUrl: "https://en.wikipedia.org/wiki/SOLID",
  referenceLabel: "SOLID (Wikipedia)",
  signals: [
    "Sample of source files. The default expected extensions are .ts/.tsx/.js/.jsx; the optional `language` field on SolidSignals widens this to Java/Go/Rust/Python/Ruby/C#/other.",
    "Callers MUST filter their input via src/core/scanner-exclusions.ts BEFORE computing counts (node_modules, .next, dist, build, .claude/, __tests__/, *.test.*, *.spec.*, *.mock.*). The scorer is zero-I/O — it cannot enforce exclusions, but `excludedPaths` carries the disclosure into the result for audit.",
    "SRP: file size + export count buckets",
    "OCP: switch/case density per file",
    "LSP: tiered signal — STRONG `confirmedLspViolations` (parser/AST-confirmed: precondition strengthening, contravariant params, return-type narrowing) when the caller supplies one, else WEAK substring scan for 'not implemented' / 'TODO: implement' normalised by inheritanceFiles. Confidence 0.85 with strong, 0.65 with weak.",
    "ISP: interface member count (fat-interface ratio = fatInterfaces / totalInterfaces)",
    "DIP: DI-container imports from package.json deps AND positive abstraction signals (named interfaces, abstraction patterns)",
  ],
  formula: {
    description:
      "Per principle, signals bucket into strong (90) / moderate (65) / needs_work (35). Bucket constants chosen so each maps to the centre of a letter-grade band (A+, C, F) and the discrete buckets do not over-claim precision from coarse heuristic signals. Overall = mean of the scored principles, rounded. Principles whose idiom is absent in the source language (e.g. LSP in Go/Rust/Python) return an InsufficientSignalResult with reason 'missing_language' and are excluded from the mean. DIP is awarded 'strong' ONLY when there are zero direct-infra imports AND at least one positive abstraction signal (DI container, abstraction patterns, or named interfaces) — bare zero-violation input drops to moderate with reduced confidence to prevent vacuous-truth strong/A on buggy-detector input. SRP/OCP ratios use absolute cliffs (<0.08/<0.20 and <0.05/<0.15); LSP/ISP ratios normalise by inheritanceFiles / totalInterfaces respectively so the cliffs are scale-invariant. Confidence drops to 0.50 when analyzed file count is <= 10.",
    codeRef: "src/solid/score.ts",
    snippet:
      "perPrinciple = strengthToScore(bucket(signals))\noverall      = round(mean(perPrinciple where applicable))",
  },
  coverage:
    "Bucketed strength values mean overall score can only take a handful of distinct values; small refactors often don't move the needle.",
  honestGap:
    "LSP detection has a tiered signal contract (solid-lsp-ast): callers WITHOUT an AST analyser provide only `narrowingStubFiles` (substring scan, confidence 0.65). Callers WITH an AST analyser also provide `confirmedLspViolations` (parser-confirmed contract violations, confidence 0.85). The scorer prefers the strong signal when present. Layer/role inference depends on heuristics applied by the caller before signals reach the scorer. The scorer cannot enforce file-exclusions itself — callers MUST pre-filter through src/core/scanner-exclusions.ts; the `excludedPaths` field round-trips the contract for audit but does not affect the math.",
};
