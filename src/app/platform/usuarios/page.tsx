import { redirect } from "next/navigation";
import { PLATFORM_ADMIN_HOME, PLATFORM_ROLE_CODES } from "@/core/identity/platform/codes";
import { readPlatformRoles } from "@/core/identity/platform/capability";
import { UserMaintainer } from "@/components/platform/UserMaintainer";
import { loadSessionContext } from "@/lib/identity/sessions";
import { listMaintainedUsers } from "@/lib/platform/user-maintainer";
import { listPlatformSpaceNames } from "@/lib/platform/spaces";

export const dynamic = "force-dynamic";

export default async function PlatformUsersPage() {
  const session = await loadSessionContext();
  if (!session) redirect(`/login?next=${encodeURIComponent("/platform/usuarios")}`);
  const roles = readPlatformRoles(session.user);
  if (!roles.includes(PLATFORM_ROLE_CODES.OWNER)) redirect(PLATFORM_ADMIN_HOME);

  const [users, spaces] = await Promise.all([listMaintainedUsers(), listPlatformSpaceNames()]);

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--gray-500)]">Dueño</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--gray-900)]">
        Mantenedor de usuarios
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--gray-600)]">
        Elige un cliente y ves solo sus cuentas. Las del administrador del ecosistema no entran en ningún cliente.
      </p>
      <div className="mt-6">
        <UserMaintainer users={users} spaces={spaces} />
      </div>
    </div>
  );
}
