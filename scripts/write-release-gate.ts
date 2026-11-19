import { writeFileSync } from "node:fs";
import { releaseGateRecord } from "../src/core/security/deploy-gate";

const conclusion = process.env.GATE_CONCLUSION?.trim() || "unknown";
const record = releaseGateRecord(conclusion);
writeFileSync("release-gate.json", `${JSON.stringify(record, null, 2)}\n`, "utf8");
console.log(JSON.stringify(record));
