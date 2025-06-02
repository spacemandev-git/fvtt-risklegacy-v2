import { build } from "bun";

await build({
  entrypoints: ["src/**/*.ts"],
  outdir: "dist",
  format: "esm",
});