import { NextResponse } from "next/server";
import { requireCongressImport } from "@/app/api/congress/guard";

/** Importación definitiva bloqueada hasta verificación explícita del operador. */
export async function POST() {
  const ctx = await requireCongressImport();
  if (ctx instanceof NextResponse) return ctx;

  return NextResponse.json(
    {
      ok: false,
      locked: true,
      error:
        "La importación definitiva está bloqueada. Use prepare-commit para revisar el plan; no se escriben fichas todavía.",
    },
    { status: 403 }
  );
}
