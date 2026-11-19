/**
 * El workflow puede ponerse rojo. Eso no es, por sí solo, un freno de despliegue:
 * Dokploy no está definido en este repositorio y esta rama no cambia su política.
 */
export const DEPLOY_GATE = {
  workflow: ".github/workflows/branding.yml",
  dokployDefinedInRepo: false,
  failedCiBlocksDeploy: false,
  branchProtectionChanged: false,
  reason:
    "Un job rojo marca GitHub Actions. No impide el despliegue mientras Dokploy siga publicando al margen de ese resultado. Cambiar esa política requiere autorización aparte.",
} as const;
