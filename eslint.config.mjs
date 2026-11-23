import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/nelzuri/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/lib/growth",
                "@/lib/growth/**",
                "@/core/growth",
                "@/core/growth/**",
                "@/app/api/growth",
                "@/app/api/growth/**",
                "@/app/admin",
                "@/app/admin/**",
                "@/core/congress",
                "@/core/congress/**",
                "@/app/congreso",
                "@/app/congreso/**",
                "@/core/tenant",
                "@/core/tenant/**",
                "@/lib/connect",
                "@/lib/connect/**",
                "@/lib/desktop",
                "@/lib/desktop/**",
                "@/lib/mongodb",
                "@/lib/mongodb/**",
                "@/sites",
                "@/sites/**",
                "**/admision/**",
                "**/congreso/**",
                "**/congress/**",
                "mongodb",
              ],
              message:
                "NELZURI no importa Growth OS, Connect, el escritorio ni una funcionalidad de cliente.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
