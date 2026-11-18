/** Si no confirmamos la contraseña, el reenvío incluye el enlace para crearla. */
export const ACCESS_PASSWORD_CHECK_MS = 2_500;

/**
 * Espera la consulta de contraseña solo un momento.
 * Si no hay respuesta, devuelve true: no afirmamos que la contraseña ya existe
 * y el correo lleva el enlace para crearla.
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
    const timer = setTimeout(() => finish(true), timeoutMs);
    lookup.then(
      (needsPassword) => finish(needsPassword),
      () => finish(true)
    );
  });
}
