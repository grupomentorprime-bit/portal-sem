import Link from "next/link";
import { isIdentityEnforced } from "@/core/identity";
import { loadSessionContext } from "@/lib/identity/sessions";
import { LogoutButton } from "@/components/identity/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = isIdentityEnforced() ? await loadSessionContext() : null;

  return (
    <>
      {session ? (
        <div className="flex items-center justify-end gap-4 border-b border-border bg-background px-4 py-2 text-xs text-muted">
          <span>{session.user.displayName || session.user.email}</span>
          <Link href="/admin/settings/team" className="underline">
            Equipo
          </Link>
          <LogoutButton />
        </div>
      ) : null}
      {children}
    </>
  );
}
