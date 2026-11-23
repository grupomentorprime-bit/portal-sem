import { writeFileSync } from "node:fs";
import { releaseGateRecord } from "../src/core/security/deploy-gate";

const conclusion = process.env.GATE_CONCLUSION?.trim() || "unknown";
const record = releaseGateRecord(conclusion);
const target = process.env.GATE_RECORD_PATH?.trim() || "release-gate.json";
writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`, "utf8");
console.log(JSON.stringify(record));
if (!record.deployAllowedByThisRepo) {
  console.error("Despliegue bloqueado: la verificación obligatoria no está aprobada.");
  process.exit(1);
}
