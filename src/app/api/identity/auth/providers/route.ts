import { NextResponse } from "next/server";
import { isEmailAuthEnabled, isKeycloakOnlyAuth } from "@/core/identity/auth/config";
import { isKeycloakEnabled } from "@/core/identity/auth/keycloak";

export async function GET() {
  const keycloak = isKeycloakEnabled();
  const keycloakOnly = isKeycloakOnlyAuth();

  return NextResponse.json({
    ok: true,
    providers: {
      local: isEmailAuthEnabled(),
      institutional: keycloak,
      institutionalOnly: keycloakOnly,
    },
  });
}
