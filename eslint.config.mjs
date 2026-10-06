import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Next 16 removed `next lint`; this is the flat config `npm run lint` (eslint .)
// uses. Lint is informational and not part of `npm run test:all`.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", ".next-e2e/**", "src/generated/**", "tmp/**", "test-results/**", "playwright-report/**", "next-env.d.ts"]),
]);
