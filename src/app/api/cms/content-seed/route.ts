import { NextResponse } from "next/server";
import { seedContentCollections } from "@/lib/content/seed";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { tenant?: string };
    if (!body.tenant?.trim()) {
      return NextResponse.json({ ok: false, error: "tenant es obligatorio." }, { status: 400 });
    }
    const result = await seedContentCollections(body.tenant.trim());
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
