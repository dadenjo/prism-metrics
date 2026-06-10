/**
 * Twelve-Factor App scoring. Caller evaluates each factor and
 * provides its status; the scorer sums the points and rescales to 0-100.
 */

/**
 * tf-1 — Added "n/a" so factors caller-owned on Heroku/VM but
 * platform-owned on Vercel/Lambda/Workers can be excluded from the
 * denominator. A correctly-built Next.js app shouldn't get dinged on
 * port_binding / processes / concurrency / disposability /
 * admin_processes — those are the platform's job.
 */
export type FactorStatus = "pass" | "warn" | "unknown" | "fail" | "n/a";

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

/**
 * Deployment target hint. Lets the caller communicate which factors
 * are platform-owned (and therefore n/a from the app's perspective).
 *   vm          — traditional VM / dedicated host, app owns everything
 *   paas        — Heroku / Render / Fly — app owns most, some delegated
 *   serverless  — Vercel / Lambda / Cloud Run — port_binding / processes
 *                 / concurrency / disposability / admin_processes are
 *                 the platform's job
 *   edge        — Cloudflare Workers / Deno Deploy — same as serverless
 *                 but stricter
 *   unknown     — caller hasn't determined; everything stays on app side
 */
export type DeploymentTarget = "vm" | "paas" | "serverless" | "edge" | "unknown";

export interface TwelveFactorSignals {
  factors: FactorEvaluation[];
  /** tf-1 — optional hint for what factors are platform-owned. */
  deploymentTarget?: DeploymentTarget;
}

export interface TwelveFactorScoreResult {
  score: number;
  grade: string;
  /** Sum of per-factor points (max = 8 × applicable factors). */
  rawPoints: number;
  passCount: number;
  warnCount: number;
  unknownCount: number;
  failCount: number;
  /** tf-1 — count of factors marked n/a (excluded from denominator). */
  naCount: number;
  /** tf-2 — 1 - unknownCount/(TOTAL - naCount). 1 = fully measured. */
  confidence: number;
  /** True when ALL applicable factors are n/a or unknown — no signal. */
  noData: boolean;
  /** "cloud-ready" | "mostly-ready" | "early-stage" | "not-ready". null when noData. */
  readiness: "cloud-ready" | "mostly-ready" | "early-stage" | "not-ready" | null;
}

/**
 * tf-1 — reference mapping: which factors are typically PLATFORM-owned
 * for each deployment target. Callers can use this as a default and
 * override per-app.
 */
export const PLATFORM_OWNED_FACTORS: Record<DeploymentTarget, ReadonlyArray<FactorId>> = {
  vm:         [],
  paas:       ["port_binding", "processes"],
  serverless: ["port_binding", "processes", "concurrency", "disposability", "admin_processes"],
  edge:       ["port_binding", "processes", "concurrency", "disposability", "admin_processes"],
  unknown:    [],
};
