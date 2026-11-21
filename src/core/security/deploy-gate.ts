/**
 * El despliegue de esta rama arranca solo con la verificación aprobada.
 * La API de Dokploy no se llama y el proyecto remoto no se modifica.
 */
export const DEPLOY_GATE = {
  workflow: ".github/workflows/branding.yml",
  dokployDefinedInRepo: false,
  failedCiBlocksDeploy: true,
  branchProtectionChanged: false,
  integrationPrepared: true,
  dokployApiCalled: false,
  productionConfigChanged: false,
  releaseGateJob: "release-gate",
  imageStart: "scripts/start-if-released.mjs",
  mandatoryChecks: "scripts/run-mandatory-checks.ts",
  reason:
    "release-gate termina en error si branding no está en success. La imagen solo arranca con ese resultado. No se llama a Dokploy ni se cambia su proyecto.",
} as const;

export function releaseGateRecord(conclusion: string) {
  const approved = conclusion === "success";
  return {
    job: "branding" as const,
    conclusion,
    deployAllowedByThisRepo: approved,
    dokployCalled: false,
    enforced: true,
    productionConfigChanged: false,
  };
}

export function deployRecordAllowsStart(record: {
  conclusion?: string;
  deployAllowedByThisRepo?: boolean;
  enforced?: boolean;
}): boolean {
  return (
    record.conclusion === "success" &&
    record.deployAllowedByThisRepo === true &&
    record.enforced === true
  );
}
