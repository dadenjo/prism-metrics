/**
 * Domain-Driven Design — bounded-context classification report.
 * No 0-100 score; outputs subdomain classification + relationship counts.
 */

export type SubdomainKind = "core" | "supporting" | "generic";

export type ContextRelationship =
  | "shared_kernel"
  | "customer_supplier"
  | "conformist"
  | "anti_corruption_layer"
  | "open_host"
  | "published_language"
  | "separate_ways";

export interface DddBoundedContext {
  id: string;
  kind: SubdomainKind;
  /** Number of inbound dependencies from other contexts. */
  inboundDeps: number;
  /** Number of outbound dependencies to other contexts. */
  outboundDeps: number;
}

export interface DddContextRelation {
  from: string;
  to: string;
  relationship: ContextRelationship;
}

export interface DddSignals {
  contexts: DddBoundedContext[];
  relationships: DddContextRelation[];
  /** Distinct domain terms mined from capability names. */
  ubiquitousTermCount: number;
  inferredDomainEvents: number;
}

export interface DddResult {
  contextCount: number;
  subdomainCounts: Record<SubdomainKind, number>;
  relationshipCounts: Record<ContextRelationship, number>;
  ubiquitousTermCount: number;
  inferredDomainEvents: number;
  /** Contexts with no in- or outbound deps. */
  isolatedContexts: number;
}
