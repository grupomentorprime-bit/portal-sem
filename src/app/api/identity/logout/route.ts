import { NextResponse } from "next/server";
import { logoutCurrentSession } from "@/core/identity";

export async function POST() {
  try {
    await logoutCurrentSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
