import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "out/**",
    "dist/**",
    "coverage/**",
    "next-env.d.ts",
    "check-auth.js",
    "check-data.js",
    "check_users.js",
    "debug_users.js",
    "diag_test.js",
    "test_auth.js",
  ]),
]);
