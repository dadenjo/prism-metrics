/**
 * DDD reporting — tabulates subdomain kinds, relationship kinds, and
 * isolated contexts. No headline score.
 */

import type {
  ContextRelationship,
  DddResult,
  DddSignals,
  SubdomainKind,
} from "./types.js";

const SUBDOMAIN_KINDS: SubdomainKind[] = ["core", "supporting", "generic"];
const RELATIONSHIP_KINDS: ContextRelationship[] = [
  "shared_kernel",
  "customer_supplier",
  "conformist",
  "anti_corruption_layer",
  "open_host",
  "published_language",
  "separate_ways",
];

export function analyzeDdd(sig: DddSignals): DddResult {
  const subdomainCounts = Object.fromEntries(
    SUBDOMAIN_KINDS.map((k) => [k, 0]),
  ) as Record<SubdomainKind, number>;
  for (const c of sig.contexts) subdomainCounts[c.kind]++;

  const relationshipCounts = Object.fromEntries(
    RELATIONSHIP_KINDS.map((k) => [k, 0]),
  ) as Record<ContextRelationship, number>;
  for (const r of sig.relationships) relationshipCounts[r.relationship]++;

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
