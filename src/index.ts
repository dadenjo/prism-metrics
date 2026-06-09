/**
 * Root entry. Prefer the per-framework subpath imports
 * (e.g. `prism-metrics/solid`) for tree-shaking and clarity.
 */
export type { Methodology } from "./core/methodology.js";
export type { InsufficientSignalResult } from "./core/insufficient.js";
export { insufficient, isInsufficient } from "./core/insufficient.js";
export {
  IGNORE_DIRS,
  TEST_FILE_PATTERNS,
  stripComments,
  shouldScanFile,
} from "./core/scanner-exclusions.js";
