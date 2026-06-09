export type { Methodology, MethodologyFormula } from "./methodology.js";
export { scoreToGrade, clamp, roundScore } from "./methodology.js";
export type { InsufficientSignalResult } from "./insufficient.js";
export { insufficient, isInsufficient } from "./insufficient.js";
export {
  IGNORE_DIRS,
  TEST_FILE_PATTERNS,
  stripComments,
  shouldScanFile,
} from "./scanner-exclusions.js";
