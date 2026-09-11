import "server-only";

import { NextResponse } from "next/server";
import { logServerError } from "@/core/security/redact";

export const PUBLIC_INTERNAL_ERROR = "No se pudo completar la operación.";

export function publicInternalError(scope: string, error: unknown): NextResponse {
  logServerError(scope, error);
  return NextResponse.json({ ok: false, error: PUBLIC_INTERNAL_ERROR }, { status: 500 });
}
