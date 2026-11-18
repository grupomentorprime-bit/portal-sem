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
  const invited = input.invitationName?.trim() ?? "";
  const identity = input.identityName.trim();
  const current = input.currentName?.trim() ?? "";

  if (invited) return invited;
  if (current && current.toLowerCase() !== email.toLowerCase() && current !== identity) {
    return current;
  }
  return identity || current || email;
}
