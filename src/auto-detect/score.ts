/**
 * Framework auto-detection — mirrors the prism0x2A dashboard's
 * `frameworkDetector.ts` signature catalog, hand-calibrated
 * confidence values, and architecture-style precedence.
 *
 * Recommendation TEXT generation (UI copy) intentionally stays
 * dashboard-side; this package emits only spec-level detections.
 */

import type {
  ArchitectureStyle,
  ArchitectureStyleResult,
  AutoDetectResult,
  AutoDetectSignals,
  FrameworkCategory,
  FrameworkDetection,
} from "./types.js";

// ─── Version extraction helpers ───────────────────────────────────────────────

function extractVersion(
  deps: Record<string, string> | undefined,
  pkg: string,
): string | undefined {
  const v = deps?.[pkg];
  if (!v) return undefined;
  // auto-1 (pass-2): strip ALL leading range / comparator characters, not
  // just the first one. Pre-fix `>=1.0.0` became `=1.0.0` and `~>1.2`
  // became `>1.2`. Now produces clean semver-ish strings.
  return v.replace(/^[\^~>=<\s]+/, "");
}

function checkDep(
  deps: Record<string, string> | undefined,
  devDeps: Record<string, string> | undefined,
  name: string,
): string | undefined {
  return extractVersion(deps, name) ?? extractVersion(devDeps, name);
}

// ─── Dependency-driven signatures ─────────────────────────────────────────────
// Each entry: dep names → emitted framework name, confidence, category.

interface DepSig {
  id: string;
  name: string;
  category: FrameworkCategory;
  confidence: number;
  /** Returns the version string if any of the listed deps are present. */
  pkgs: string[];
  signalLabel: string;
}

const DEP_SIGS: DepSig[] = [
  // frontend
  {
    id: "nextjs",
    name: "Next.js",
    category: "frontend",
    confidence: 0.97,
    pkgs: ["next"],
    signalLabel: "package.json: next",
  },
  {
    id: "react",
    name: "React",
    category: "frontend",
    confidence: 0.95,
    pkgs: ["react"],
    signalLabel: "package.json: react",
  },
  {
    id: "vue",
    name: "Vue.js",
    category: "frontend",
    confidence: 0.95,
    pkgs: ["vue"],
    signalLabel: "package.json: vue",
  },
  {
    id: "angular",
    name: "Angular",
    category: "frontend",
    confidence: 0.97,
    pkgs: ["@angular/core"],
    signalLabel: "package.json: @angular/core",
  },
  // backend
  {
    id: "nestjs",
    name: "NestJS",
    category: "backend",
    confidence: 0.97,
    pkgs: ["@nestjs/core"],
    signalLabel: "package.json: @nestjs/core",
  },
  {
    id: "express",
    name: "Express.js",
    category: "backend",
    confidence: 0.9,
    pkgs: ["express"],
    signalLabel: "package.json: express",
  },
  {
    id: "fastify",
    name: "Fastify",
    category: "backend",
    confidence: 0.95,
    pkgs: ["fastify"],
    signalLabel: "package.json: fastify",
  },
  // ORM / data
  {
    id: "typeorm",
    name: "TypeORM (Repository Pattern)",
    category: "architecture_pattern",
    confidence: 0.8,
    pkgs: ["typeorm"],
    signalLabel: "package.json: typeorm",
  },
  {
    id: "prisma",
    name: "Prisma (Repository Pattern)",
    category: "architecture_pattern",
    confidence: 0.85,
    pkgs: ["@prisma/client", "prisma"],
    signalLabel: "package.json: prisma",
  },
  // EDA / messaging
  {
    id: "kafka",
    name: "Kafka (Event-Driven)",
    category: "architecture_pattern",
    confidence: 0.92,
    pkgs: ["kafkajs", "kafka-node"],
    signalLabel: "package.json: kafkajs or kafka-node",
  },
  {
    id: "bull",
    name: "Bull/BullMQ (Message Queue)",
    category: "architecture_pattern",
    confidence: 0.85,
    pkgs: ["bull", "bullmq"],
    signalLabel: "package.json: bull or bullmq",
  },
  {
    id: "nest_cqrs",
    name: "CQRS Pattern",
    category: "architecture_pattern",
    confidence: 0.9,
    pkgs: ["@nestjs/cqrs"],
    signalLabel: "package.json: @nestjs/cqrs",
  },
  // testing
  {
    id: "jest",
    name: "Jest",
    category: "testing",
    confidence: 0.97,
    pkgs: ["jest"],
    signalLabel: "package.json: jest",
  },
  {
    id: "vitest",
    name: "Vitest",
    category: "testing",
    confidence: 0.97,
    pkgs: ["vitest"],
    signalLabel: "package.json: vitest",
  },
];

// ─── Main detector ────────────────────────────────────────────────────────────

export function detectFrameworks(
  sig: AutoDetectSignals,
): AutoDetectResult {
  const frameworks: FrameworkDetection[] = [];
  const detectionSignals: string[] = [];
  const deps = sig.dependencies;
  const devDeps = sig.devDependencies ?? {};
  const topDirs = new Set(sig.topLevelDirs);
  const srcDirs = new Set(sig.srcDirs ?? []);
  const allDirs = new Set([...sig.topLevelDirs, ...(sig.srcDirs ?? [])]);
  const topFiles = new Set(sig.topLevelFiles ?? []);

  // 1. Dependency-driven signatures
  for (const s of DEP_SIGS) {
    let version: string | undefined;
    for (const p of s.pkgs) {
      version = checkDep(deps, devDeps, p);
      if (version) break;
    }
    if (version === undefined) continue;
    frameworks.push({
      id: s.id,
      name: s.name,
      category: s.category,
      confidence: s.confidence,
      signals: [s.signalLabel],
      version,
    });
    detectionSignals.push(s.signalLabel);
  }

  // 1b. Script-driven signatures (node:test built-in runner)
  const scripts = sig.scripts;
  if (scripts) {
    const nodeTestPattern = /\b(?:node|tsx)\s+[^"']*--test\b/;
    for (const cmd of Object.values(scripts)) {
      if (typeof cmd === "string" && nodeTestPattern.test(cmd)) {
        frameworks.push({
          id: "node-test",
          name: "node:test",
          category: "testing",
          confidence: 0.96,
          signals: ["package.json: scripts contain 'node --test' or 'tsx --test'"],
        });
        detectionSignals.push("package.json: scripts contain 'node --test' or 'tsx --test'");
        break;
      }
    }
  }

  // 2. File / directory signals

  // Hexagonal Architecture: ports/ + adapters/ (top-level or src/)
  const hasPorts = topDirs.has("ports") || srcDirs.has("ports");
  const hasAdapters = topDirs.has("adapters") || srcDirs.has("adapters");
  if (hasPorts && hasAdapters) {
    frameworks.push({
      id: "hexagonal",
      name: "Hexagonal Architecture",
      category: "architecture_pattern",
      confidence: 0.88,
      signals: ["directory: ports/", "directory: adapters/"],
    });
    detectionSignals.push("directory: ports/");
    detectionSignals.push("directory: adapters/");
  } else if (hasPorts || hasAdapters) {
    const label = hasPorts ? "directory: ports/" : "directory: adapters/";
    frameworks.push({
      id: "hexagonal_partial",
      name: "Hexagonal Architecture (partial)",
      category: "architecture_pattern",
      confidence: 0.55,
      signals: [label],
    });
    detectionSignals.push(label);
  }

  // Clean Architecture: ≥2 of {domain, application, infrastructure}
  const hasDomain = allDirs.has("domain");
  const hasApplication = allDirs.has("application");
  const hasInfrastructure = allDirs.has("infrastructure");
  const cleanSignalCount = [hasDomain, hasApplication, hasInfrastructure].filter(
    Boolean,
  ).length;
  if (cleanSignalCount >= 2) {
    const cleanSignals = [
      hasDomain ? "directory: domain/" : null,
      hasApplication ? "directory: application/" : null,
      hasInfrastructure ? "directory: infrastructure/" : null,
    ].filter(Boolean) as string[];
    frameworks.push({
      id: "clean_architecture",
      name: "Clean Architecture",
      category: "architecture_pattern",
      confidence: cleanSignalCount === 3 ? 0.85 : 0.6,
      signals: cleanSignals,
    });
    detectionSignals.push(...cleanSignals);
  }

  // DDD: bounded-contexts/ or contexts/
  // auto-6 (pass-2): use the directory name that actually matched in the
  // emitted signal label (was hard-coded "bounded-contexts/" even when
  // "contexts/" triggered the detection).
  const matchedDddDir = allDirs.has("bounded-contexts")
    ? "bounded-contexts/"
    : allDirs.has("contexts")
      ? "contexts/"
      : null;
  if (matchedDddDir !== null) {
    frameworks.push({
      id: "ddd",
      name: "Domain-Driven Design",
      category: "architecture_pattern",
      confidence: 0.82,
      signals: [`directory: ${matchedDddDir}`],
    });
    detectionSignals.push(`directory: ${matchedDddDir}`);
  }

  // Build systems
  const hasBazel =
    topFiles.has("BUILD") ||
    topFiles.has("BUILD.bazel") ||
    topFiles.has("WORKSPACE");
  if (hasBazel) {
    frameworks.push({
      id: "bazel",
      name: "Bazel",
      category: "build_system",
      confidence: 0.97,
      signals: ["file: BUILD or BUILD.bazel or WORKSPACE"],
    });
    detectionSignals.push("file: BUILD.bazel");
  }
  const hasTurbo = topFiles.has("turbo.json");
  if (hasTurbo) {
    frameworks.push({
      id: "turborepo",
      name: "Turborepo",
      category: "build_system",
      confidence: 0.97,
      signals: ["file: turbo.json"],
    });
    detectionSignals.push("file: turbo.json");
  }
  const hasNx = topFiles.has("nx.json");
  if (hasNx) {
    frameworks.push({
      id: "nx",
      name: "Nx",
      category: "build_system",
      confidence: 0.97,
      signals: ["file: nx.json"],
    });
    detectionSignals.push("file: nx.json");
  }

  // Microservices: docker-compose + services/microservices/packages dir
  const hasDockerCompose =
    topFiles.has("docker-compose.yml") || topFiles.has("docker-compose.yaml");
  const hasServicesDir =
    topDirs.has("services") ||
    topDirs.has("microservices") ||
    topDirs.has("packages");
  if (hasDockerCompose && hasServicesDir) {
    frameworks.push({
      id: "microservices",
      name: "Microservices",
      category: "architecture_pattern",
      confidence: 0.7,
      signals: [
        "file: docker-compose.yml",
        "directory: services/ or packages/",
      ],
    });
    detectionSignals.push("file: docker-compose.yml");
  }

  // 3. Architecture style determination — precedence matches dashboard.
  // auto-4 (pass-2): gate lowered from 0.7 to 0.6 so that partial
  // detections (Hexagonal partial = 0.55 stays out; Clean 2-of-3 = 0.60
  // now passes) are consistent with the detection catalogue. Pre-fix
  // a 2-of-3 clean-layer project emitted clean_architecture at
  // confidence 0.6 but architectureStyle.primary fell to
  // layered_traditional/unknown because the gate demanded 0.7.
  const hasHexagonal = frameworks.some(
    (f) => f.name.startsWith("Hexagonal") && f.confidence >= 0.6,
  );
  const hasClean = frameworks.some(
    (f) => f.name === "Clean Architecture" && f.confidence >= 0.6,
  );
  const hasDDD = frameworks.some((f) => f.name === "Domain-Driven Design");
  const hasEDA = frameworks.some((f) =>
    [
      "Kafka (Event-Driven)",
      "Bull/BullMQ (Message Queue)",
      "CQRS Pattern",
    ].includes(f.name),
  );
  const hasMicroservices = frameworks.some(
    (f) => f.name === "Microservices",
  );
  const hasNestJS = frameworks.some((f) => f.name === "NestJS");
  const hasMonolith =
    !hasMicroservices &&
    !hasDDD &&
    !hasHexagonal &&
    !hasClean &&
    topDirs.has("src");

  let architectureStyle: ArchitectureStyleResult;
  if (hasHexagonal) {
    architectureStyle = {
      primary: "hexagonal",
      confidence: 0.88,
      rationale:
        "ports/ and adapters/ directories follow the Ports & Adapters pattern (Alistair Cockburn).",
    };
  } else if (hasClean) {
    architectureStyle = {
      primary: "clean",
      confidence: 0.82,
      rationale:
        "domain/, application/, and infrastructure/ layers follow Robert C. Martin's Clean Architecture Dependency Rule.",
    };
  } else if (hasDDD) {
    architectureStyle = {
      primary: "ddd",
      confidence: 0.8,
      rationale:
        "Bounded contexts directory structure follows Eric Evans' DDD tactical patterns.",
    };
  } else if (hasEDA) {
    architectureStyle = {
      primary: "event_driven",
      confidence: 0.75,
      rationale:
        "Kafka/BullMQ/CQRS packages indicate event-driven messaging patterns.",
    };
  } else if (hasMicroservices) {
    architectureStyle = {
      primary: "microservices",
      confidence: 0.7,
      rationale:
        "docker-compose.yml + service directories suggest a microservices deployment topology.",
    };
  } else if (hasNestJS) {
    architectureStyle = {
      primary: "layered_nestjs",
      confidence: 0.75,
      rationale:
        "NestJS follows a layered module architecture with controllers, services, and providers.",
    };
  } else if (hasMonolith) {
    architectureStyle = {
      primary: "layered_traditional",
      confidence: 0.55,
      rationale:
        "Single src/ directory with no strong architectural signals — likely a traditional layered monolith.",
    };
  } else {
    architectureStyle = {
      primary: "unknown",
      confidence: 0.3,
      rationale:
        "Insufficient signals to determine architecture style. Add architecture directories or dependency markers.",
    };
  }

  frameworks.sort((a, b) => b.confidence - a.confidence);

  return {
    detected: frameworks,
    architectureStyle,
    detectionSignals,
  };
}

/**
 * Back-compat alias for the previous public name. Prefer
 * `detectFrameworks` going forward.
 */
export const analyzeAutoDetect = detectFrameworks;
