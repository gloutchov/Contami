import { build } from "esbuild";

const shared = {
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  sourcemap: false,
  packages: "external",
  external: ["electron"],
};

await Promise.all([
  build({
    ...shared,
    entryPoints: ["src/main/index.ts"],
    outfile: "dist-electron/main.cjs",
  }),
  build({
    ...shared,
    entryPoints: ["src/preload/index.ts"],
    outfile: "dist-electron/preload.cjs",
  }),
]);
