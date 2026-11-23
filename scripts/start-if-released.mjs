import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const gatePath = process.env.RELEASE_GATE_PATH?.trim() || "release-gate.json";

let record;
try {
  record = JSON.parse(readFileSync(gatePath, "utf8"));
} catch {
  console.error("Despliegue bloqueado: no hay una verificación aprobada.");
  process.exit(1);
}

const allowed =
  record.conclusion === "success" &&
  record.deployAllowedByThisRepo === true &&
  record.enforced === true;

if (!allowed) {
  console.error("Despliegue bloqueado: la verificación obligatoria no está aprobada.");
  process.exit(1);
}

const command = process.env.START_COMMAND?.trim() || "npm run start:next";
const child = spawn(command, {
  shell: true,
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", () => process.exit(1));
