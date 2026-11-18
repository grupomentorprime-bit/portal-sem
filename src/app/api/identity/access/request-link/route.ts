import { NextResponse } from "next/server";
import { requestAccessLink } from "@/lib/identity/request-access-link";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientKey = `${forwarded || "unknown"}|${(body.email ?? "").trim().toLowerCase()}`;
    const result = await requestAccessLink({
      email: body.email ?? "",
      clientKey,
    });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.status }
      );
    }
    return NextResponse.json({ ok: true, message: result.message });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "No se pudo procesar la solicitud." },
      { status: 500 }
    );
  }
}
