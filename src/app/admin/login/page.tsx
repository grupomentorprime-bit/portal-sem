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
            {bootstrap ? "Configurar administrador" : "Ingresar al CMS"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {bootstrap
              ? "Crea la primera cuenta de administrador del tenant."
              : "Identity Core — AprendeHoy Learning OS"}
          </p>
          {!isIdentityEnforced() ? (
            <p className="mt-2 text-xs text-amber-700">
              Modo compatibilidad: el admin sigue accesible sin login hasta activar IDENTITY_ENFORCE=true.
            </p>
          ) : null}
        </div>
        <LoginForm bootstrap={bootstrap} />
      </div>
    </div>
  );
}
