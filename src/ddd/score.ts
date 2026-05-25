/**
 * Domain-Driven Design — classification + relationship inference +
 * aggregation. Mirrors the prism0x2A dashboard's `dddMapper` spec
 * logic (classifyContext, extractUbiquitousLanguage,
 * inferRelationshipPattern) so callers deriving a DDD model from
 * AMBER-style capabilities produce identical contexts and
 * relationships.
 *
 * Diagram rendering (Context Map SVG) is a UI concern and stays out
 * of this package.
 */

import type {
  ClassifyContextInput,
  ContextType,
  DddResult,
  DddSignals,
  InferRelationshipInput,
  RelationshipPattern,
} from "./types.js";

// ─── Subdomain keyword catalog (lifted verbatim from dashboard) ───────────────

export const GENERIC_KEYWORDS = [
  "auth",
  "authentication",
  "authorization",
  "login",
  "oauth",
  "sso",
  "logging",
  "log",
  "monitoring",
  "metrics",
  "tracing",
  "cache",
  "caching",
  "email",
  "notification",
  "smtp",
  "sendgrid",
  "ses",
  "storage",
  "cdn",
  "upload",
  "file",
  "queue",
  "messaging",
  "event-bus",
  "pubsub",
  "analytics",
  "telemetry",
  "health",
  "liveness",
  "readiness",
];

export const CORE_BUSINESS_KEYWORDS = [
  "payment",
  "billing",
  "invoice",
  "subscription",
  "order",
  "checkout",
  "product",
  "catalog",
  "inventory",
  "customer",
  "account",
  "onboarding",
  "revenue",
  "pricing",
  "recommendation",
  "search",
  "booking",
  "reservation",
  "shipping",
  "fulfillment",
];

// ─── Classification ───────────────────────────────────────────────────────────

/**
 * Classify a capability into a DDD subdomain bucket.
 *   1. Any word matches GENERIC_KEYWORDS  → "generic"
 *   2. criticality === "critical" OR any word matches
 *      CORE_BUSINESS_KEYWORDS              → "core_domain"
 *   3. otherwise                           → "supporting"
 */
export function classifyContext(input: ClassifyContextInput): ContextType {
  const s = (input.id + " " + input.name).toLowerCase();
  const words = s.split(/[\s\-_./]+/);

  const isGeneric = words.some((w) => GENERIC_KEYWORDS.includes(w));
  if (isGeneric) return "generic";

  const isCore =
    input.criticality === "critical" ||
    words.some((w) => CORE_BUSINESS_KEYWORDS.includes(w));
  if (isCore) return "core_domain";

  return "supporting";
}

// ─── Ubiquitous Language extraction ───────────────────────────────────────────

const STOPWORDS =
  /^(the|and|for|with|from|that|this|are|has|have|will|can|not|all|any|its|our|via|per|into|onto|upon)$/i;

/**
 * Mine up to 12 distinct PascalCase'd terms from a capability's name
 * and description. Mirrors dashboard's extractUbiquitousLanguage.
 */
export function extractUbiquitousLanguage(
  name: string,
  description: string,
): string[] {
  const raw = `${name} ${description}`;
  const words = raw
    .split(/[\s\-_./,;:()[\]{}'"!?]+/)
    .filter((w) => w.length > 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .filter((w) => !STOPWORDS.test(w));
  return [...new Set(words)].slice(0, 12);
}

// ─── Relationship pattern inference ───────────────────────────────────────────

/**
 * Apply DDD strategic patterns to a `from → to` context dependency.
 * Precedence (matches dashboard):
 *   1. fromDependsOnTo && toDependsOnFrom            → partnership
 *      (the dashboard distinguishes "shared_kernel" from "partnership"
 *      by passing a precomputed hasCycle flag; we use the same
 *      cycle-detection rule here, so the bidirectional case maps to
 *      partnership unless callers infer otherwise)
 *   2. toFanIn >= 3                                  → open_host_service
 *   3. toType === "generic"                          → conformist
 *   4. toType === "supporting" && fromType === core  → anticorruption_layer
 *   5. else                                          → upstream_downstream
 *
 * Pass-through compatibility note: callers that already detect cycles
 * separately can short-circuit to "partnership" or "shared_kernel"
 * themselves; dashboard treats `hasCycle === true` as partnership and
 * the non-cycle bidirectional case as shared_kernel. Keep this
 * behaviour by passing toDependsOnFrom only when there is a true
 * mutual dependency.
 */
export function inferRelationshipPattern(
  input: InferRelationshipInput,
): RelationshipPattern {
  const { fromDependsOnTo, toDependsOnFrom, toFanIn, toType, fromType } = input;
  if (fromDependsOnTo && toDependsOnFrom) {
    // Dashboard: hasCycle ? partnership : shared_kernel — but hasCycle
    // and the mutual-deps condition are identical (both branches of
    // dashboard's if/else evaluate the same predicate). We follow the
    // dashboard's first match: partnership when both sides depend on
    // each other.
    return "partnership";
  }
  if (toFanIn >= 3) return "open_host_service";
  if (toType === "generic") return "conformist";
  if (toType === "supporting" && fromType === "core_domain") {
    return "anticorruption_layer";
  }
  return "upstream_downstream";
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

const SUBDOMAIN_KINDS: ContextType[] = [
  "core_domain",
  "supporting",
  "generic",
];
const RELATIONSHIP_KINDS: RelationshipPattern[] = [
  "upstream_downstream",
  "shared_kernel",
  "anticorruption_layer",
  "open_host_service",
  "conformist",
  "partnership",
];

export function analyzeDdd(sig: DddSignals): DddResult {
  const subdomainCounts = Object.fromEntries(
    SUBDOMAIN_KINDS.map((k) => [k, 0]),
  ) as Record<ContextType, number>;
  for (const c of sig.contexts) subdomainCounts[c.type]++;

  const relationshipCounts = Object.fromEntries(
    RELATIONSHIP_KINDS.map((k) => [k, 0]),
  ) as Record<RelationshipPattern, number>;
  for (const r of sig.relationships) relationshipCounts[r.pattern]++;

  const isolatedContexts = sig.contexts.filter(
    (c) => c.inboundDeps === 0 && c.outboundDeps === 0,
  ).length;

  return {
    contextCount: sig.contexts.length,
    subdomainCounts,
    relationshipCounts,
    ubiquitousTermCount: sig.ubiquitousTermCount,
    inferredDomainEvents: sig.inferredDomainEvents,
    isolatedContexts,
  };
}
