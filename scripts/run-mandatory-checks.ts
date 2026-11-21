import { spawnSync } from "node:child_process";

const checks: Array<{ name: string; command: string; args: string[] }> = [
  { name: "catalogo institucional", command: "npm", args: ["run", "build:institutional-media"] },
  { name: "marca", command: "npm", args: ["run", "check:branding"] },
  { name: "audit", command: "npm", args: ["audit", "--audit-level=high"] },
  { name: "secretos", command: "npx", args: ["tsx", "scripts/scan-secrets.ts"] },
  { name: "tsc", command: "npx", args: ["tsc", "--noEmit"] },
  {
    name: "controles de seguridad",
    command: "npx",
    args: [
      "tsx",
      "--test",
      "tests/baseline/security-remediation-media.test.ts",
      "tests/baseline/security-remediation-ci.test.ts",
      "tests/baseline/security-remediation-html.test.ts",
      "tests/baseline/security-remediation-roster.test.ts",
      "tests/baseline/security-rate-limit-shared.test.ts",
    ],
  },
];

for (const check of checks) {
  console.log(`\n[gate] ${check.name}`);
  const result = spawnSync(check.command, check.args, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    console.error(`[gate] falló: ${check.name}`);
    process.exit(result.status ?? 1);
  }
}

console.log("[gate] verificaciones obligatorias aprobadas");
