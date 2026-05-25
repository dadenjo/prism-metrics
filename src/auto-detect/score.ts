/**
 * Auto-detect — small built-in table of framework signatures. Each
 * entry has a primary dependency, optional supporting dependencies,
 * and an optional directory marker. Detection confidence is fixed per
 * combination of matched signals.
 */

import type {
  AutoDetectResult,
  AutoDetectSignals,
  FrameworkDetection,
} from "./types.js";

interface Signature {
  id: string;
  name: string;
  primary: string;
  supporting?: string[];
  directory?: string;
}

const SIGNATURES: Signature[] = [
  { id: "nextjs", name: "Next.js", primary: "next", directory: "app" },
  { id: "react", name: "React", primary: "react" },
  { id: "vue", name: "Vue", primary: "vue" },
  { id: "angular", name: "Angular", primary: "@angular/core", directory: "src" },
  { id: "svelte", name: "Svelte", primary: "svelte" },
  { id: "nestjs", name: "NestJS", primary: "@nestjs/core" },
  { id: "express", name: "Express", primary: "express" },
  { id: "fastify", name: "Fastify", primary: "fastify" },
  { id: "hono", name: "Hono", primary: "hono" },
  { id: "prisma", name: "Prisma", primary: "prisma", supporting: ["@prisma/client"] },
  { id: "drizzle", name: "Drizzle", primary: "drizzle-orm" },
  { id: "trpc", name: "tRPC", primary: "@trpc/server" },
  { id: "remix", name: "Remix", primary: "@remix-run/react" },
  { id: "astro", name: "Astro", primary: "astro" },
  { id: "vite", name: "Vite", primary: "vite" },
];

function confidenceFor(sig: Signature, deps: Record<string, string>, dirs: Set<string>): { value: number; reasons: string[] } | null {
  const reasons: string[] = [];
  if (!(sig.primary in deps)) return null;
  reasons.push(`dependency: ${sig.primary}`);
  const supportingMatches = (sig.supporting ?? []).filter((d) => d in deps);
  reasons.push(...supportingMatches.map((d) => `supporting: ${d}`));
  const dirMatched = sig.directory ? dirs.has(sig.directory) : false;
  if (dirMatched) reasons.push(`directory: ${sig.directory ?? ""}/`);

  let value = 0.55;
  if (sig.directory) {
    if (dirMatched) value = supportingMatches.length > 0 ? 0.97 : 0.92;
    else value = supportingMatches.length > 0 ? 0.78 : 0.7;
  } else {
    value = supportingMatches.length > 0 ? 0.85 : 0.78;
  }
  return { value, reasons };
}

export function analyzeAutoDetect(sig: AutoDetectSignals): AutoDetectResult {
  const dirs = new Set(sig.topLevelDirs);
  const detected: FrameworkDetection[] = [];
  for (const s of SIGNATURES) {
    const c = confidenceFor(s, sig.dependencies, dirs);
    if (c === null) continue;
    detected.push({ id: s.id, name: s.name, confidence: c.value, reasons: c.reasons });
  }
  // Deterministic order: confidence desc, id asc.
  detected.sort((a, b) => (b.confidence - a.confidence) || a.id.localeCompare(b.id));
  return { detected };
}
