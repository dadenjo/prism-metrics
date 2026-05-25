import { defineConfig } from "tsup";

const frameworks = [
  "solid",
  "clean-arch",
  "hexagonal",
  "c4",
  "twelve-factor",
  "dora-predicted",
  "conways-law",
  "wardley",
  "iso-25010",
  "eip",
  "ddd",
  "eda",
  "monorepo",
  "auto-detect",
];

const entry: Record<string, string> = {
  index: "src/index.ts",
  core: "src/core/index.ts",
};
for (const f of frameworks) {
  entry[f] = `src/${f}/index.ts`;
}

export default defineConfig({
  entry,
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: false,
  treeshake: true,
  target: "es2022",
});
