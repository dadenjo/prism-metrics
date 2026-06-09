/**
 * Wardley map classification + plotting.
 *
 * Three exported pieces, mirroring the prism0x2A dashboard's
 * `wardleyMap.ts` heuristics:
 *
 *   - classifyEvolution(input)    → {stage, score, confidence, disputed, signals}
 *   - classifyValueChain(name,id) → 0..1 visibility position
 *   - analyzeWardley(signals)     → plotted components + stage counts,
 *                                   with deterministic FNV-1a X-jitter
 *
 * Diagram rendering (SVG) is a UI concern and stays out of the package.
 */

import type {
  ClassifyEvolutionInput,
  ClassifyEvolutionResult,
  EvolutionStage,
  WardleyMapResult,
  WardleyPlottedComponent,
  WardleySignals,
} from "./types.js";
import {
  CORROBORATED_BASE,
  CORROBORATED_RANGE,
  CRITICALITY_BASE,
  CRITICALITY_RANGE,
  DEFAULT_CUSTOM_BASE,
  DEFAULT_CUSTOM_RANGE,
  FILECOUNT_ONLY_BASE,
  FILECOUNT_ONLY_RANGE,
  JITTER_HALF_WIDTH,
  LIFECYCLE_BASE,
  LIFECYCLE_RANGE,
  SINGLE_SIGNAL_BASE,
  SINGLE_SIGNAL_RANGE,
  STAGE_BASE_X,
} from "./constants.js";

// ─── Classification regexes (lifted verbatim from dashboard) ──────────────────

const GENESIS_SIGNALS = [
  /experiment/i,
  /poc/i,
  /prototype/i,
  /research/i,
  /\bml\b/i,
  /\bai\b/i,
  /pilot/i,
  /spike/i,
  /sandbox/i,
  /lab/i,
];

const COMMODITY_SIGNALS = [
  /\bauth\b/i,
  /\blogging\b/i,
  /\bmonitoring\b/i,
  /\bcache\b/i,
  /\bcaching\b/i,
  /\bdatabase\b/i,
  /\bcdn\b/i,
  /\bstorage\b/i,
  /\bqueue\b/i,
  /\bmetrics\b/i,
  /\btracer\b/i,
  /\btracing\b/i,
  /\bdeployment\b/i,
  /\bci\b/i,
  /\bcd\b/i,
  /\bconfig\b/i,
  /\bsecrets?\b/i,
  /\bvault\b/i,
  /\benv\b/i,
];

const PRODUCT_SIGNALS = [
  /email.?service/i,
  /\bnotification/i,
  /pdf.?gen/i,
  /image.?proc/i,
  /\bsms\b/i,
  /\bsearch\b/i,
  /\bcms\b/i,
  /\banalytics\b/i,
  /\breport/i,
  /\bscheduler\b/i,
  /\bjob.?queue/i,
  /\bworkflow\b/i,
  /\bfull.?text/i,
];

const VALUE_CHAIN_MAP: Array<{ pattern: RegExp; position: number }> = [
  { pattern: /checkout|cart|basket/i, position: 0.95 },
  { pattern: /onboard/i, position: 0.92 },
  { pattern: /dashboard|ui|frontend/i, position: 0.9 },
  { pattern: /search|discover/i, position: 0.88 },
  { pattern: /recommend/i, position: 0.85 },
  { pattern: /payment|billing|invoice/i, position: 0.78 },
  { pattern: /notification|alert/i, position: 0.75 },
  { pattern: /order|booking|reserv/i, position: 0.72 },
  { pattern: /profile|account|user.?mgmt/i, position: 0.7 },
  { pattern: /subscription/i, position: 0.68 },
  { pattern: /review|rating|feedback/i, position: 0.65 },
  { pattern: /pricing|price/i, position: 0.58 },
  { pattern: /inventory|stock/i, position: 0.55 },
  { pattern: /scheduling|calendar/i, position: 0.52 },
  { pattern: /analytic/i, position: 0.48 },
  { pattern: /reporting/i, position: 0.45 },
  { pattern: /\bauth\b|authentication|authz|authorization/i, position: 0.25 },
  { pattern: /\bdatabase\b|db\b/i, position: 0.18 },
  { pattern: /\bcache\b/i, position: 0.2 },
  { pattern: /\blogging\b|\blog\b/i, position: 0.15 },
  { pattern: /\bqueue\b|message.?broker|event.?bus/i, position: 0.22 },
  { pattern: /storage|s3|blob/i, position: 0.17 },
  { pattern: /deployment|ci|cd\b|devops/i, position: 0.1 },
  { pattern: /monitoring|metrics|tracing/i, position: 0.13 },
  { pattern: /\bcdn\b/i, position: 0.12 },
  { pattern: /config|secrets?/i, position: 0.08 },
];

// ─── Deterministic FNV-1a hash (used for both jitter and seeded offsets) ──────

function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Mirrors dashboard's `seededOffset`: returns [0,1). */
function seededOffset01(seed: string): number {
  return (fnv1a(seed) % 10000) / 10000;
}

// ─── classifyEvolution + classifyValueChain ───────────────────────────────────

/**
 * Classify a capability's evolution stage from name + id + lifecycle +
 * criticality + fileCount. Mirrors dashboard's classifyEvolution
 * exactly (including signal precedence and score bands per stage).
 *
 * The result includes `confidence` (0..1) and `disputed` (boolean):
 *
 *  - A single keyword match (e.g. `name="Auth"`) with no corroborating
 *    lifecycle/criticality signal returns `confidence ≈ 0.5` and
 *    `disputed: true`. The historical 0.82-0.97 confidence on a single
 *    regex match was the source of the "bespoke auth → commodity →
 *    outsource it" false positive.
 *  - The same keyword match WITH `lifecycle=stable` or `=deprecated`
 *    (or `criticality=low` for commodity-shaped names) raises
 *    confidence to 0.82+ and clears `disputed`.
 *  - For genesis: `lifecycle=experimental` is itself a strong signal,
 *    so a name-match + lifecycle still corroborates.
 *  - For custom_built via fileCount alone: `confidence ≈ 0.4` and the
 *    stage is returned but flagged so dashboards do not promote a
 *    nascent capability to "core custom" on file-count signal alone.
 */
export function classifyEvolution(
  input: ClassifyEvolutionInput,
): ClassifyEvolutionResult {
  const combined = `${input.name} ${input.id}`.toLowerCase();
  const signals: string[] = [];

  // Commodity check first
  if (COMMODITY_SIGNALS.some((p) => p.test(combined))) {
    signals.push("matches commodity service pattern");
    // Corroborate with lifecycle. `criticality=critical` actually
    // ARGUES AGAINST commodity (a critical bespoke auth service is
    // not a commodity even if its name contains "auth"), so we do
    // NOT count it as corroboration here.
    const lifecycleCorroborates =
      input.lifecycle === "stable" || input.lifecycle === "deprecated";
    const criticalityDisputes = input.criticality === "critical";
    if (lifecycleCorroborates) {
      signals.push(`lifecycle=${input.lifecycle}`);
    }
    if (criticalityDisputes) {
      signals.push("criticality=critical → bespoke custom_built, overriding name match");
      // Adversarial path: a critical capability whose name matches a
      // commodity keyword (e.g. "Custom Auth" with criticality=critical)
      // should NOT be commoditized. Route it to custom_built with
      // moderate confidence.
      return {
        stage: "custom_built",
        score: 0.32 + seededOffset01(`${combined}:critical-override`) * 0.18,
        confidence: CORROBORATED_BASE,
        disputed: false,
        signals,
      };
    }
    const corroborated = lifecycleCorroborates;
    return {
      stage: "commodity",
      score: corroborated
        ? CORROBORATED_BASE + seededOffset01(`${combined}:commodity-match`) * CORROBORATED_RANGE
        : SINGLE_SIGNAL_BASE + seededOffset01(`${combined}:commodity-match`) * SINGLE_SIGNAL_RANGE,
      confidence: corroborated ? CORROBORATED_BASE : SINGLE_SIGNAL_BASE,
      disputed: !corroborated,
      signals,
    };
  }

  // Genesis check
  if (GENESIS_SIGNALS.some((p) => p.test(combined))) {
    signals.push("matches genesis/experimental pattern");
    const corroborated = input.lifecycle === "experimental";
    if (corroborated) signals.push("lifecycle=experimental");
    return {
      stage: "genesis",
      score: 0.02 + seededOffset01(`${combined}:genesis-match`) * 0.15,
      confidence: corroborated ? CORROBORATED_BASE : SINGLE_SIGNAL_BASE,
      disputed: !corroborated,
      signals,
    };
  }

  // Product check
  if (PRODUCT_SIGNALS.some((p) => p.test(combined))) {
    signals.push("matches product/SaaS-available pattern");
    const corroborated =
      input.lifecycle === "stable" || input.criticality === "medium" || input.criticality === "low";
    return {
      stage: "product",
      score: 0.55 + seededOffset01(`${combined}:product-match`) * 0.2,
      confidence: corroborated ? CORROBORATED_BASE : SINGLE_SIGNAL_BASE,
      disputed: !corroborated,
      signals,
    };
  }

  // Lifecycle signals
  if (input.lifecycle === "experimental") {
    signals.push("lifecycle=experimental");
    return {
      stage: "genesis",
      score: 0.05 + seededOffset01(`${combined}:lifecycle-exp`) * 0.1,
      confidence: LIFECYCLE_BASE + seededOffset01(`${combined}:lifecycle-exp-conf`) * LIFECYCLE_RANGE,
      disputed: false,
      signals,
    };
  }
  if (input.lifecycle === "deprecated") {
    signals.push("lifecycle=deprecated → likely commoditized");
    return {
      stage: "commodity",
      score: 0.8 + seededOffset01(`${combined}:lifecycle-dep`) * 0.15,
      confidence: LIFECYCLE_BASE + seededOffset01(`${combined}:lifecycle-dep-conf`) * LIFECYCLE_RANGE,
      disputed: false,
      signals,
    };
  }

  // Criticality / file count heuristics for custom_built.
  // Split the cases: criticality=critical is a real signal; fileCount
  // alone is weak and previously promoted every young repo's nascent
  // capability to "core custom" (wardley-3).
  if (input.criticality === "critical") {
    signals.push("criticality=critical → core custom capability");
    return {
      stage: "custom_built",
      score: 0.32 + seededOffset01(`${combined}:critical`) * 0.18,
      confidence: CRITICALITY_BASE + seededOffset01(`${combined}:critical-conf`) * CRITICALITY_RANGE,
      disputed: false,
      signals,
    };
  }
  if ((input.fileCount ?? 0) > 3) {
    signals.push("fileCount > 3 → tentatively custom_built (weak signal)");
    return {
      stage: "custom_built",
      score: 0.32 + seededOffset01(`${combined}:filecount`) * 0.18,
      // fileCount alone is the wardley-3 trigger — flag as disputed.
      confidence: FILECOUNT_ONLY_BASE + seededOffset01(`${combined}:fc-conf`) * FILECOUNT_ONLY_RANGE,
      disputed: true,
      signals,
    };
  }

  // Default: custom_built with moderate score
  signals.push(
    "no commodity/product/genesis signals → assumed custom_built",
  );
  return {
    stage: "custom_built",
    score: 0.28 + seededOffset01(`${combined}:default`) * 0.22,
    confidence: DEFAULT_CUSTOM_BASE + seededOffset01(`${combined}:default-conf`) * DEFAULT_CUSTOM_RANGE,
    disputed: true,
    signals,
  };
}

/**
 * Y-axis (visibility) position 0..1 — keyword-driven, with a
 * deterministic mid-band fallback. Mirrors dashboard's
 * classifyValueChain.
 */
export function classifyValueChain(name: string, id: string): number {
  const combined = `${name} ${id}`;
  for (const { pattern, position } of VALUE_CHAIN_MAP) {
    if (pattern.test(combined)) return position;
  }
  return 0.4 + seededOffset01(`${combined}:value-chain-default`) * 0.15;
}

// ─── X-axis jitter + plotter ──────────────────────────────────────────────────

function symmetricSeededOffset(id: string): number {
  return ((fnv1a(id) / 0xffffffff) * 2 - 1) * JITTER_HALF_WIDTH;
}

export function analyzeWardley(sig: WardleySignals): WardleyMapResult {
  const stageCounts: Record<EvolutionStage, number> = {
    genesis: 0,
    custom_built: 0,
    product: 0,
    commodity: 0,
  };
  const components: WardleyPlottedComponent[] = sig.components.map((c) => {
    stageCounts[c.stage]++;
    const x = Math.max(
      0,
      Math.min(1, STAGE_BASE_X[c.stage] + symmetricSeededOffset(c.id)),
    );
    return { ...c, x, y: c.visibility };
  });
  return { components, stageCounts };
}

// Re-export constants for consumers that want to assert against them.
export { STAGE_BASE_X, JITTER_HALF_WIDTH } from "./constants.js";
