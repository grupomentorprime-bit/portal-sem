import { NextResponse } from "next/server";
import { findInvitationByToken } from "@/lib/identity/invitations";
import { findRolesByIds } from "@/lib/identity/roles";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";
import { findUserByEmail } from "@/lib/identity/users";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const invitation = await findInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { ok: false, error: "Invitación inválida o expirada." },
        { status: 404 }
      );
    }

    const existingUser = await findUserByEmail(invitation.email);
    const roles = await findRolesByIds(invitation.tenantId, invitation.roleIds);

    return NextResponse.json({
      ok: true,
      invitation: {
        email: invitation.email,
        displayName: invitation.displayName,
        expiresAt: invitation.expiresAt,
        existingUser: Boolean(existingUser),
        roles: roles.map((r) => ({
          name: r.name,
          label: getInstitutionalRoleLabel(r.name),
        })),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
