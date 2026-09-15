/**
 * OT-GROWTH-UX-ANALYTICS-004 — capturas /admin/analitica (diseño final).
 * Datos reales del Espacio; sin inventar métricas.
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-ux-analytics-004.ts
 */
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { MongoClient } from "mongodb";
import { chromium, type Page } from "playwright";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI / MONGODB_DB");
  process.exit(1);
}

const preferredTenant = process.env.CAPTURE_TENANT_ID?.trim() || "adl";
const baseUrl = process.env.CAPTURE_URL?.trim() || "http://localhost:3000";
const outDir = resolve(
  "docs/AI/auditorias/OT-GROWTH-UX-ANALYTICS-004-evidence"
);
mkdirSync(outDir, { recursive: true });

const ANALYTICS_PERMS = ["growth.analytics.view"] as const;

async function hideDevOverlay(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
  });
}

async function gotoStable(page: Page, href: string, ready: string) {
  await page.goto(href, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForSelector(ready, { timeout: 60000 });
  await page.waitForTimeout(1800);
  await hideDevOverlay(page);
  await page.waitForTimeout(250);
}

async function shot(page: Page, name: string) {
  await hideDevOverlay(page);
  await page.screenshot({
    path: resolve(outDir, name),
    fullPage: true,
  });
  console.log("saved", name);
}

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);

  const membershipPreferred = await db
    .collection("identity_memberships")
    .findOne({
      tenantId: preferredTenant,
      status: "active",
    });
  const membership =
    membershipPreferred ??
    (await db.collection("identity_memberships").findOne({
      status: "active",
      tenantId: { $exists: true, $ne: "" },
    }));
  if (!membership?.userId || !membership.tenantId) {
    console.error("Sin membresía activa para captura");
    process.exit(1);
  }

  const tenantId = String(membership.tenantId);
  const user = await db.collection("identity_users").findOne({
    _id: membership.userId,
    status: "active",
  });
  if (!user) {
    console.error("Usuario de membresía no encontrado");
    process.exit(1);
  }

  const roleIds = Array.isArray(membership.roleIds)
    ? membership.roleIds.map(String)
    : [];
  const primaryRoleId = roleIds[0];
  let permsPatched = false;
  if (primaryRoleId) {
    const role = await db.collection("identity_roles").findOne({
      _id: primaryRoleId as never,
    });
    if (role) {
      const ids = Array.isArray(role.permissionIds)
        ? role.permissionIds.map(String)
        : [];
      const missing = ANALYTICS_PERMS.filter((p) => !ids.includes(p));
      if (missing.length > 0) {
        const nextIds = [...ids, ...missing];
        const nextMap = {
          ...(typeof role.permissionMap === "object" && role.permissionMap
            ? role.permissionMap
            : {}),
          "growth.analytics.view": true,
        };
        await db.collection("identity_roles").updateOne(
          { _id: primaryRoleId as never },
          {
            $set: {
              permissionIds: nextIds,
              permissionMap: nextMap,
              updatedAt: new Date().toISOString(),
            },
          }
        );
        permsPatched = true;
        console.log("patched role perms", primaryRoleId, missing);
      }
    }
  }

  const now = new Date().toISOString();
  const expires = new Date();
  expires.setHours(expires.getHours() + 2);
  const sessionId = `sess-ux-analytics-004-${Date.now().toString(36)}`;
  await db.collection("identity_sessions").insertOne({
    _id: sessionId,
    userId: String(user._id),
    tenantId,
    createdAt: now,
    expiresAt: expires.toISOString(),
    lastActivity: now,
  });

  console.log(`capture tenant=${tenantId} baseUrl=${baseUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
  });
  await context.addCookies([
    {
      name: "ah_session",
      value: sessionId,
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = `
      nextjs-portal,
      [data-next-badge-root],
      [data-nextjs-toast],
      #__next-build-watcher {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;
    document.documentElement.appendChild(style);
  });

  type AnalyticsPayload = {
    ok?: boolean;
    summary?: {
      personasNuevas: number;
      oportunidadesGeneradas: number;
    };
    sales?: { conversion?: { rate: number | null; cohort: number } };
    campaigns?: unknown[];
    messages?: {
      conversaciones: number;
      conversacionesSinRespuesta: number;
      byChannel?: unknown[];
    };
  };

  async function fetchAnalytics(preset: string): Promise<AnalyticsPayload> {
    const res = await page.request.get(
      `${baseUrl}/api/growth/analytics?preset=${preset}`
    );
    return (await res.json()) as AnalyticsPayload;
  }

  const meta: Record<string, unknown> = {
    tenantId,
    permsPatched,
    capturedAt: new Date().toISOString(),
  };

  // A — Desktop con datos (default last_30d)
  await gotoStable(
    page,
    `${baseUrl}/admin/analitica?preset=last_30d`,
    "[data-analitica-page]"
  );
  await page.waitForSelector(
    "[data-analitica-content], [data-analitica-error]",
    { timeout: 60000 }
  );
  const data30 = await fetchAnalytics("last_30d");
  meta.last30d = {
    personasNuevas: data30.summary?.personasNuevas ?? null,
    oportunidades: data30.summary?.oportunidadesGeneradas ?? null,
    conversionRate: data30.sales?.conversion?.rate ?? null,
    conversionCohort: data30.sales?.conversion?.cohort ?? null,
    campaigns: data30.campaigns?.length ?? 0,
    messages: data30.messages?.conversaciones ?? 0,
    unanswered: data30.messages?.conversacionesSinRespuesta ?? 0,
  };
  await shot(page, "01-desktop-con-datos.png");

  // D — Campañas (scroll / sección)
  if ((data30.campaigns?.length ?? 0) > 0) {
    await page.locator("#campanas").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await shot(page, "02-desktop-campanas.png");
  } else {
    meta.campaignsShot = "omitido-sin-campañas-en-período";
    console.warn("Sin campañas en período; se omite 02 (sin inventar).");
  }

  // E + F — Mensajes y sin respuesta
  await page.locator("#mensajes").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await shot(page, "03-desktop-mensajes.png");

  // B — Período vacío / pocos datos (mes anterior o previous)
  await gotoStable(
    page,
    `${baseUrl}/admin/analitica?preset=previous_month`,
    "[data-analitica-page]"
  );
  await page.waitForSelector(
    "[data-analitica-content], [data-analitica-error]",
    { timeout: 60000 }
  );
  const prev = await fetchAnalytics("previous_month");
  meta.previousMonth = {
    personasNuevas: prev.summary?.personasNuevas ?? null,
    oportunidades: prev.summary?.oportunidadesGeneradas ?? null,
    campaigns: prev.campaigns?.length ?? 0,
  };
  await shot(page, "04-desktop-periodo-vacio-o-bajo.png");

  // C — Conversión sin denominador (rate null)
  let conversionNullPreset: string | null = null;
  for (const preset of ["previous_month", "this_month", "last_7d", "last_30d"]) {
    const payload = await fetchAnalytics(preset);
    if (payload.sales?.conversion?.rate === null) {
      conversionNullPreset = preset;
      meta.conversionNull = {
        preset,
        cohort: payload.sales?.conversion?.cohort ?? 0,
      };
      await gotoStable(
        page,
        `${baseUrl}/admin/analitica?preset=${preset}`,
        "[data-analitica-page]"
      );
      await page.waitForSelector("[data-analitica-content]", {
        timeout: 60000,
      });
      await page.locator("#ventas").scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await shot(page, "05-desktop-conversion-sin-base.png");
      break;
    }
  }
  if (!conversionNullPreset) {
    meta.conversionNull = "omitido-todos-los-presets-tienen-cohorte";
    console.warn(
      "Ningún preset con conversión null; se omite 05 (sin inventar)."
    );
  }

  // Mobile — con datos
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoStable(
    page,
    `${baseUrl}/admin/analitica?preset=last_30d`,
    "[data-analitica-page]"
  );
  await page.waitForSelector(
    "[data-analitica-content], [data-analitica-error]",
    { timeout: 60000 }
  );
  await shot(page, "06-mobile-con-datos.png");

  // Mobile — mensajes / sin respuesta
  await page.locator("#mensajes").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await shot(page, "07-mobile-mensajes.png");

  // Mobile — vacío/bajo
  await gotoStable(
    page,
    `${baseUrl}/admin/analitica?preset=previous_month`,
    "[data-analitica-page]"
  );
  await page.waitForSelector(
    "[data-analitica-content], [data-analitica-error]",
    { timeout: 60000 }
  );
  await shot(page, "08-mobile-periodo-vacio-o-bajo.png");

  writeFileSync(resolve(outDir, "RESULT.json"), JSON.stringify(meta, null, 2));

  await browser.close();
  await client.close();
  console.log("done", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
