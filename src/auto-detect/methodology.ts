import type { Methodology } from "../core/methodology.js";

export const AUTO_DETECT_METHODOLOGY: Methodology = {
  definition:
    "Meta-detector that inspects package.json deps + top-level dir / file structure to classify the frameworks and architecture style of a project. Mirrors the prism0x2A dashboard's frameworkDetector.",
  referenceUrl: "https://github.com/dadenjo/prism-metrics",
  referenceLabel: "prism-metrics source",
  signals: [
    "dependencies + devDependencies (supplied by caller after reading package.json)",
    "topLevelDirs (project root) + srcDirs (under src/) + topLevelFiles (project root)",
  ],
  formula: {
    description:
      "No 0-100 score. Three layers: (1) dep-driven signatures emit per-framework detections with hand-calibrated confidence (Next.js 0.97, React 0.95, NestJS 0.97, Kafka 0.92, etc.) plus 1 script-driven signature (node:test 0.96, detected via 'node --test' or 'tsx --test' in package.json scripts); (2) directory/file signals add architecture-pattern detections (Hexagonal 0.88 with ports+adapters / 0.55 partial, Clean Architecture 0.85 with all 3 layer dirs / 0.6 with 2, DDD 0.82, Bazel/Turbo/Nx 0.97, Microservices 0.7 on docker-compose+services); (3) architectureStyle precedence: hexagonal → clean → ddd → event-driven → microservices → layered_nestjs → layered_traditional → unknown.",
    codeRef: "src/auto-detect/score.ts",
  },
  coverage:
    "Detects 15 library signatures (dependency-driven) + 1 script-driven (node:test) + 6 file/directory-driven patterns and infers 1 of 8 architecture styles. Recommendation-text generation (UI copy) is intentionally out of scope and stays in the dashboard.",
  honestGap:
    "Confidence values look more precise than they really are — they're calibrated by hand, not from a labelled dataset. The no-score design means there's no headline number to defend.",
};
