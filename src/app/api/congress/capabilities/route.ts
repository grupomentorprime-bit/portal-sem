import { NextResponse } from "next/server";
import { congressCapabilities, requireCongressView } from "@/app/api/congress/guard";

export async function GET() {
  try {
    const ctx = await requireCongressView();
    if (ctx instanceof NextResponse) return ctx;
    return NextResponse.json({ ok: true, capabilities: congressCapabilities(ctx) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
