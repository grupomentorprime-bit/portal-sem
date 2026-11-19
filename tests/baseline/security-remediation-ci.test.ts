import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { DEPLOY_GATE } from "../../src/core/security/deploy-gate";
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

  it("un job rojo no bloquea el despliegue: Dokploy no está en el repositorio", () => {
    assert.equal(DEPLOY_GATE.dokployDefinedInRepo, false);
    assert.equal(DEPLOY_GATE.failedCiBlocksDeploy, false);
    assert.equal(DEPLOY_GATE.branchProtectionChanged, false);
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
