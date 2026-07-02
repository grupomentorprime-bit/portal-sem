import { isKeycloakOnlyAuth } from "@/core/identity/auth/config";
import { AcceptInviteForm } from "@/components/identity/AcceptInviteForm";
import { getAppBaseUrl } from "@/lib/app-url";
import { keycloakUserNeedsPassword } from "@/lib/identity/keycloak-admin";
import { findInvitationByToken } from "@/lib/identity/invitations";
import { findUserByEmail } from "@/lib/identity/users";

export const dynamic = "force-dynamic";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invitation = await findInvitationByToken(token);

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-background p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Invitación no válida</h1>
          <p className="mt-2 text-sm text-muted">
            El enlace expiró o ya fue utilizado. Solicita una nueva invitación al administrador.
          </p>
          <a
            href={`${getAppBaseUrl()}/admin/login`}
            className="mt-6 inline-block text-sm font-medium text-primary underline"
          >
            Ir al inicio de sesión
          </a>
        </div>
      </div>
    );
  }

  const existingUserRecord = await findUserByEmail(invitation.email);
  const needsPassword = isKeycloakOnlyAuth()
    ? await keycloakUserNeedsPassword(invitation.email)
    : !existingUserRecord;
  const existingUser = isKeycloakOnlyAuth() ? !needsPassword : Boolean(existingUserRecord);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Completa tu acceso</h1>
          <p className="mt-1 text-sm text-muted">
            {existingUser
              ? "Acepta la invitación para ingresar al CMS."
              : "Crea tu contraseña para activar tu cuenta."}
          </p>
          <p className="mt-2 text-xs text-muted">
            Este enlace expira el{" "}
            {new Date(invitation.expiresAt).toLocaleString("es-CL", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        </div>
        <AcceptInviteForm
          token={token}
          email={invitation.email}
          displayName={invitation.displayName || invitation.email}
          existingUser={existingUser}
        />
      </div>
    </div>
  );
}
