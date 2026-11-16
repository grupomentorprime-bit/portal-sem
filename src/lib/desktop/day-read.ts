import "server-only";

import { desktopClick } from "@/lib/desktop/contract";
import { desktopDayLines, growthDayLine, type DesktopDayLine } from "@/lib/desktop/day";
import type { MentorAppId } from "@/lib/desktop/catalog";
import { readCommercialPanel } from "@/lib/growth/commercial-read";

const ATTENTION = new Set(["overdue", "unfollowed", "stale"]);

/** El día de la empresa activa. Si Growth no se abre, o la lectura falla, la mesa sigue vacía de líneas. */
export async function readDesktopDay(input: {
  tenantId: string;
  userId: string;
  contracted: readonly MentorAppId[];
  authorizedApps?: readonly MentorAppId[] | null;
  aprendeHoyEntryUrl: string | null;
  cumpleOrigin: string | null;
}): Promise<DesktopDayLine[]> {
  const tenantId = input.tenantId.trim();
  const opens = desktopClick({
    appId: "growth-os",
    tenantId,
    contracted: input.contracted,
    authorized: input.authorizedApps ?? null,
    aprendeHoyEntryUrl: input.aprendeHoyEntryUrl,
    cumpleOrigin: input.cumpleOrigin,
  }).kind === "open";
  if (!opens || !tenantId) return [];

  try {
    const panel = await readCommercialPanel(tenantId, input.userId, true);
    const row = panel.rows.find((item) => item.band != null && ATTENTION.has(item.band));
    return desktopDayLines([
      growthDayLine({
        opens: true,
        matter: row
          ? { personaLabel: row.personaLabel, band: row.band, href: row.href }
          : null,
      }),
    ]);
  } catch {
    return [];
  }
}
