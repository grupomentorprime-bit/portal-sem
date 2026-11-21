import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DEPLOY_GATE, deployRecordAllowsStart, releaseGateRecord } from "../../src/core/security/deploy-gate";
import { formatSecretFindings, scanTextForSecrets } from "../../src/core/security/secret-scan";

describe("gate de CI preparado", () => {
  it("el workflow corre lint, pruebas, audit y secretos, y un fallo no es continue-on-error", () => {
    const workflow = readFileSync(DEPLOY_GATE.workflow, "utf8");
    assert.match(workflow, /npm run lint/);
    assert.match(workflow, /npm run test:baseline/);
    assert.match(workflow, /npm audit --audit-level=high/);
    assert.match(workflow, /scripts\/scan-secrets\.ts/);
    assert.doesNotMatch(workflow, /continue-on-error/);
  });

  it("un job rojo bloquea el arranque y no llama a Dokploy", () => {
    assert.equal(DEPLOY_GATE.dokployDefinedInRepo, false);
    assert.equal(DEPLOY_GATE.failedCiBlocksDeploy, true);
    assert.equal(DEPLOY_GATE.branchProtectionChanged, false);
    assert.equal(DEPLOY_GATE.integrationPrepared, true);
    assert.equal(DEPLOY_GATE.dokployApiCalled, false);
    assert.equal(DEPLOY_GATE.productionConfigChanged, false);
    const workflow = readFileSync(DEPLOY_GATE.workflow, "utf8");
    assert.match(workflow, /release-gate:/);
    assert.match(workflow, /write-release-gate\.ts/);
    assert.doesNotMatch(workflow, /dokploy/i);
    const dockerfile = readFileSync("Dockerfile", "utf8");
    assert.match(dockerfile, /run-mandatory-checks\.ts/);
    assert.match(dockerfile, /start-if-released\.mjs/);
    const success = releaseGateRecord("success");
    const failure = releaseGateRecord("failure");
    assert.equal(success.deployAllowedByThisRepo, true);
    assert.equal(success.dokployCalled, false);
    assert.equal(success.enforced, true);
    assert.equal(deployRecordAllowsStart(success), true);
    assert.equal(failure.deployAllowedByThisRepo, false);
    assert.equal(failure.enforced, true);
    assert.equal(deployRecordAllowsStart(failure), false);

    const dir = mkdtempSync(path.join(tmpdir(), "nelzuri-gate-"));
    const sentinel = path.join(dir, "started");
    const starter = path.join(dir, "start.mjs");
    const failedGate = path.join(dir, "failed.json");
    const passedGate = path.join(dir, "passed.json");
    writeFileSync(starter, "import { writeFileSync } from 'node:fs'; writeFileSync(process.env.SENTINEL, 'ran');\n");
    const env = {
      ...process.env,
      SENTINEL: sentinel,
      START_COMMAND: `node "${starter}"`,
    };
    const tsx = path.join("node_modules", "tsx", "dist", "cli.mjs");
    const blocked = spawnSync(process.execPath, [tsx, "scripts/write-release-gate.ts"], {
      env: { ...process.env, GATE_CONCLUSION: "failure", GATE_RECORD_PATH: failedGate },
      encoding: "utf8",
    });
    assert.notEqual(blocked.status, 0);
    const approved = spawnSync(process.execPath, [tsx, "scripts/write-release-gate.ts"], {
      env: { ...process.env, GATE_CONCLUSION: "success", GATE_RECORD_PATH: passedGate },
      encoding: "utf8",
    });
    assert.equal(approved.status, 0);
    assert.equal(deployRecordAllowsStart(JSON.parse(readFileSync(passedGate, "utf8"))), true);
    const blockedStart = spawnSync(process.execPath, ["scripts/start-if-released.mjs"], {
      env: { ...env, RELEASE_GATE_PATH: failedGate },
      encoding: "utf8",
    });
    assert.notEqual(blockedStart.status, 0);
    assert.equal(existsSync(sentinel), false);
    const started = spawnSync(process.execPath, ["scripts/start-if-released.mjs"], {
      env: { ...env, RELEASE_GATE_PATH: passedGate },
      encoding: "utf8",
    });
    assert.equal(started.status, 0);
    assert.equal(readFileSync(sentinel, "utf8"), "ran");
    rmSync(dir, { recursive: true, force: true });
  });

  it("el escáner informa la regla y no el secreto", () => {
    const secret = ["AKIA", "1234567890ABCDEF"].join("");
    const findings = scanTextForSecrets(`token=${secret}\n`);
    assert.equal(findings.length, 1);
    assert.equal(findings[0]?.rule, "aws-access-key");
    const report = formatSecretFindings("fixture.txt", findings);
    assert.equal(report.includes(secret), false);
    assert.match(report, /fixture\.txt:1 aws-access-key/);
  });
});
