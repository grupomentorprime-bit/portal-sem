import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();

    const sitio = await db
      .collection<{ _id: string }>("cms_config")
      .findOne({ _id: "site" });

    return NextResponse.json({
      ok: true,
      database: db.databaseName,
      sitio,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}