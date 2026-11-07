/** Si Keycloak no responde, el reenvío sigue con el enlace para entrar. */
export const ACCESS_PASSWORD_CHECK_MS = 7_000;

/**
 * Espera la consulta de contraseña solo un momento.
 * Si no hay respuesta, devuelve false: la persona ya está en el Equipo
 * y recibe el enlace de acceso en lugar de dejar la petición colgada.
 */
export function accessPasswordCheck(
  lookup: Promise<boolean>,
  timeoutMs = ACCESS_PASSWORD_CHECK_MS
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (needsPassword: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(needsPassword);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    lookup.then(
      (needsPassword) => finish(needsPassword),
      () => finish(false)
    );
  });
}
