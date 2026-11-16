import { NextResponse } from "next/server";
import { logoutCurrentSession } from "@/core/identity";
import { DESK_ENTERED_COOKIE } from "@/lib/desktop/catalog";

export async function POST() {
  try {
    await logoutCurrentSession();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(DESK_ENTERED_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
