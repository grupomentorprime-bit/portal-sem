import { NextResponse } from "next/server";
import { requireSession } from "@/core/identity";
import {
  countUnreadNotifications,
  listNotificationsByUser,
  markAllNotificationsRead,
} from "@/lib/identity/notifications";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const ctx = await requireSession();
    if (ctx instanceof NextResponse) return ctx;

    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 30) || 30, 100);

    const [notifications, unreadCount] = await Promise.all([
      listNotificationsByUser(ctx.tenantId, ctx.user._id, { limit, unreadOnly }),
      countUnreadNotifications(ctx.tenantId, ctx.user._id),
    ]);

    return NextResponse.json({ ok: true, notifications, unreadCount });
  } catch (error) {
    console.error("[identity/notifications GET]", error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const ctx = await requireSession();
    if (ctx instanceof NextResponse) return ctx;

    const updated = await markAllNotificationsRead(ctx.tenantId, ctx.user._id);
    return NextResponse.json({ ok: true, updated });
  } catch (error) {
    console.error("[identity/notifications PATCH]", error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
