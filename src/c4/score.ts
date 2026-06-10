/**
 * C4 coverage + capability classification. Mirrors the dashboard's
 * `buildC4Model` heuristics (containerGroup, isPersonCap) so callers
 * deriving C4 elements from capability data produce identical groupings.
 *
 * Code-level (L4) is intentionally out of scope and always false.
 */

import type {
  C4ContainerGroup,
  C4CoverageResult,
  C4Signals,
} from "./types.js";

/**
 * Classify a capability into one of the five C4 container groups
 * (API Service / Database / Web App / Background Worker / Application)
 * by name+id heuristics. Matches dashboard's `containerGroup`.
 */
export function containerGroup(
  capId: string,
  capName: string,
): C4ContainerGroup {
  const s = (capId + " " + capName).toLowerCase();
  if (/\b(api|service|endpoint|rest|graphql|grpc|rpc)\b/.test(s)) {
    return "API Service";
  }
  // c4-1 fix: `queue` no longer matches Database. Queues are backing
  // infrastructure for Background Worker capabilities, not databases.
  // Pre-fix the first-match-wins ordering labelled queues as
  // "Database" silently → mislabeled the whole architectural picture
  // for event-driven systems.
  if (
    /\b(db|data|store|storage|database|postgres|mysql|mongo|redis|cache)\b/.test(
      s,
    )
  ) {
    return "Database";
  }
  // c4-2 fix: `client` no longer matches Web App. 'Stripe client' /
  // 'API client' / 'Email client' are SDK integrations, not UIs.
  if (/\b(ui|frontend|web|react|next|vue|browser|page)\b/.test(s)) {
    return "Web App";
  }
  if (/\b(worker|job|queue|cron|scheduler|processor|consumer)\b/.test(s)) {
    return "Background Worker";
  }
  return "Application";
}

/**
 * True when a capability name contains person/actor hints
 * (user, customer, admin, operator, viewer, member, guest). Matches
 * dashboard's `isPersonCap`.
 *
 * c4-2 fix: removed `client` — too many false positives ('Stripe
 * client', 'API client', 'Email client'). The remaining tokens still
 * cover the genuine actor cases.
 */
export function isPersonCap(name: string): boolean {
  return /\b(user|customer|admin|operator|viewer|member|guest)\b/i.test(name);
}

export function analyzeC4(sig: C4Signals): C4CoverageResult {
  const hasContext = sig.systemCount > 0;
  const hasContainer = sig.containerCount > 0;
  const hasComponent = sig.componentCount > 0;
  const levelsCovered =
    (hasContext ? 1 : 0) + (hasContainer ? 1 : 0) + (hasComponent ? 1 : 0);
  const highestLevel = hasComponent
    ? "component"
    : hasContainer
      ? "container"
      : hasContext
        ? "context"
        : "none";
  return {
    hasContext,
    hasContainer,
    hasComponent,
    hasCode: false,
    levelsCovered,
    highestLevel,
  };
}
