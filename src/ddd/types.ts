/**
 * Domain-Driven Design — bounded-context classification + relationship
 * inference. No 0-100 score; outputs subdomain classification +
 * relationship counts + per-context relationship inference.
 *
 * Vocabulary mirrors the prism0x2A dashboard's `dddMapper`:
 *   - ContextType        : core_domain | supporting | generic
 *   - RelationshipPattern: upstream_downstream | shared_kernel
 *                          | anticorruption_layer | open_host_service
 *                          | conformist | partnership
 */

export type ContextType = "core_domain" | "supporting" | "generic";

export type RelationshipPattern =
  | "upstream_downstream"
  | "shared_kernel"
  | "anticorruption_layer"
  | "open_host_service"
  | "conformist"
  | "partnership";

/** Inputs for classifyContext. */
export interface ClassifyContextInput {
  id: string;
  name: string;
  criticality?: string;
}

/** Inputs for inferRelationshipPattern. */
export interface InferRelationshipInput {
  /** True iff `from` has `to` in its depends_on list. */
  fromDependsOnTo: boolean;
  /** True iff `to` has `from` in its depends_on list. */
  toDependsOnFrom: boolean;
  /** Fan-in count for the `to` context (number of upstream dependents). */
  toFanIn: number;
  toType: ContextType;
  fromType: ContextType;
}

export interface DddBoundedContext {
  id: string;
  type: ContextType;
  /** Number of inbound dependencies from other contexts. */
  inboundDeps: number;
  /** Number of outbound dependencies to other contexts. */
  outboundDeps: number;
}

export interface DddContextRelation {
  from: string;
  to: string;
  pattern: RelationshipPattern;
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
  subdomainCounts: Record<ContextType, number>;
  relationshipCounts: Record<RelationshipPattern, number>;
  ubiquitousTermCount: number;
  inferredDomainEvents: number;
  /** Contexts with no in- or outbound deps. */
  isolatedContexts: number;
}
