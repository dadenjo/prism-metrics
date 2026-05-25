/**
 * Twelve-Factor App scoring. Caller evaluates each factor and
 * provides its status; the scorer sums the points and rescales to 0-100.
 */

export type FactorStatus = "pass" | "warn" | "unknown" | "fail";

export type FactorId =
  | "codebase"
  | "dependencies"
  | "config"
  | "backing_services"
  | "build_release_run"
  | "processes"
  | "port_binding"
  | "concurrency"
  | "disposability"
  | "dev_prod_parity"
  | "logs"
  | "admin_processes";

export interface FactorEvaluation {
  factor: FactorId;
  status: FactorStatus;
}

export interface TwelveFactorSignals {
  factors: FactorEvaluation[];
}

export interface TwelveFactorScoreResult {
  score: number;
  grade: string;
  /** Sum of per-factor points (max 96 = 12 * 8). */
  rawPoints: number;
  passCount: number;
  warnCount: number;
  unknownCount: number;
  failCount: number;
  /** "cloud-ready" | "mostly-ready" | "early-stage" | "not-ready". */
  readiness: "cloud-ready" | "mostly-ready" | "early-stage" | "not-ready";
}
