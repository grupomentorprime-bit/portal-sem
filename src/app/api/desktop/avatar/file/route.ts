import { NextResponse } from "next/server";
import { hasPlatformOperatorCapability, requireAuth } from "@/core/identity";
import { readAvatarPhoto } from "@/lib/desktop/avatar-file";
import { listMembershipsByUser } from "@/lib/identity/memberships";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  const userId = new URL(request.url).searchParams.get("userId")?.trim() || ctx.user._id;
  if (userId !== ctx.user._id && !hasPlatformOperatorCapability(ctx.user)) {
    const [viewerMemberships, targetMemberships] = await Promise.all([
      listMembershipsByUser(ctx.user._id),
      listMembershipsByUser(userId),
    ]);
    const viewerTenantIds = new Set(viewerMemberships.map((membership) => membership.tenantId));
    const sharesTenant = targetMemberships.some((membership) => viewerTenantIds.has(membership.tenantId));
    if (!sharesTenant) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
  }

  const file = await readAvatarPhoto(userId);
  if (!file) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
