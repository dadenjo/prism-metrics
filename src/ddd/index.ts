export {
  analyzeDdd,
  classifyContext,
  extractUbiquitousLanguage,
  inferRelationshipPattern,
  GENERIC_KEYWORDS,
  CORE_BUSINESS_KEYWORDS,
} from "./score.js";
export { DDD_METHODOLOGY } from "./methodology.js";
export type {
  DddSignals,
  DddResult,
  DddBoundedContext,
  DddContextRelation,
  ContextType,
  RelationshipPattern,
  ClassifyContextInput,
  InferRelationshipInput,
} from "./types.js";
