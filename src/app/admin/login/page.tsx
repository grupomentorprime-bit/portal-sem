import { LoginForm } from "@/components/identity/LoginForm";
import { getDatabase } from "@/lib/mongodb";
import { isIdentityEnforced } from "@/core/identity";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const db = await getDatabase();
  const userCount = await db.collection("identity_users").countDocuments();
  const bootstrap = userCount === 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">
            {bootstrap ? "Configurar administrador" : "Centro de Administración"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {bootstrap
              ? "Crea la primera cuenta de administrador del seminario."
              : "Acceso institucional al CMS del SEM"}
          </p>
          {!isIdentityEnforced() ? (
            <p className="mt-2 text-xs text-[var(--color-warning)]">
              Entorno de desarrollo: el acceso sin sesión está habilitado temporalmente.
            </p>
          ) : null}
        </div>
        <LoginForm bootstrap={bootstrap} />
      </div>
    </div>
  );
}
