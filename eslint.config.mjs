import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored third-party bundles served verbatim (tesseract.js wasm glue +
    // worker). Not our source, never hand-edited — linting them is noise.
    "public/**",
    // Throwaway output from the _probe-*/_raster-* scripts (already in
    // .gitignore). A one-off render script left here turned `npm run check`
    // red on an unused loop index, which is a gate failure about nothing.
    "scratch/**",
  ]),
]);

export default eslintConfig;
