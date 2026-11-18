function cleanName(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function sameName(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

/** Nombre que queda guardado al entrar.
 *  El escrito en la invitación manda sobre el perfil de Google o Keycloak.
 *  Un nombre ya editado en el perfil se conserva.
 */
export function resolveLoginDisplayName(input: {
  email: string;
  identityName: string;
  invitationName?: string | null;
  currentName?: string | null;
}): string {
  const email = input.email.trim();
  const invited = cleanName(input.invitationName);
  const identity = input.identityName.trim();
  const current = cleanName(input.currentName);

  if (current && !sameName(current, email) && !sameName(current, identity)) {
    return current;
  }
  if (invited && !sameName(invited, identity)) return invited;
  return invited || identity || current || email;
}

/** La invitación más reciente que no sea la copia del perfil de Google o Keycloak. */
export function pickInvitationDisplayName(
  namesNewestFirst: Array<string | null | undefined>,
  identityName: string
): string {
  const identity = identityName.trim().toLowerCase();
  const names = namesNewestFirst.map((name) => cleanName(name)).filter(Boolean);
  if (!names.length) return "";
  if (!identity) return names[0];
  return names.find((name) => name.toLowerCase() !== identity) ?? names[0];
}

/** Nombre del correo de acceso. No vuelve a grabar el perfil de Google si ya había uno escrito. */
export function nameForMemberAccessEmail(
  accountName: string,
  namesNewestFirst: Array<string | null | undefined>
): string {
  const account = accountName.trim();
  const names = namesNewestFirst.map((name) => cleanName(name)).filter(Boolean);
  if (!account) return names[0] ?? "";
  if (!names.length) return account;

  const newest = names[0];
  const olderWritten = names
    .slice(1)
    .find((name) => !sameName(name, account));

  if (sameName(newest, account)) return olderWritten || account;
  if (names.slice(1).some((name) => sameName(name, account))) return account;
  return newest;
}
