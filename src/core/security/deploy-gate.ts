/**
 * El workflow puede ponerse rojo. Eso no es, por sí solo, un freno de despliegue:
 * Dokploy no está definido en este repositorio y esta rama no cambia su política.
 */
export const DEPLOY_GATE = {
  workflow: ".github/workflows/branding.yml",
  dokployDefinedInRepo: false,
  failedCiBlocksDeploy: false,
  branchProtectionChanged: false,
  integrationPrepared: true,
  dokployApiCalled: false,
  productionConfigChanged: false,
  releaseGateJob: "release-gate",
  reason:
    "El job release-gate deja por escrito el resultado de branding. No llama a Dokploy ni cambia su proyecto. El despliegue sigue por su cuenta hasta que operaciones use ese resultado.",
} as const;

export function releaseGateRecord(conclusion: string) {
  return {
    job: "branding",
    conclusion,
    deployAllowedByThisRepo: conclusion === "success",
    dokployCalled: false,
    enforced: false,
    productionConfigChanged: false,
  };
}
