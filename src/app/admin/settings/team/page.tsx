import { TeamSettingsClient } from "@/components/identity/TeamSettingsClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function TeamSettingsPage() {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Equipo e identidad</h1>
            <p className="text-sm text-muted">Miembros, roles, invitaciones y auditoría</p>
          </div>
          <Link href="/admin/config" className="text-sm text-muted underline">
            Volver al CMS
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <TeamSettingsClient />
      </main>
    </div>
  );
}
