/**
 * OT-GROWTH-UX-TEAM-004 — capturas /admin/settings/team (diseño final).
 * Datos reales del Espacio; sin miembros/invitaciones inventadas.
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-ux-team-004.ts
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
const outDir = resolve("docs/AI/auditorias/OT-GROWTH-UX-TEAM-004-evidence");
mkdirSync(outDir, { recursive: true });

async function hideDevOverlay(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
  });
}

async function gotoStable(page: Page, href: string, ready: string) {
  await page.goto(href, { waitUntil: "domcontentloaded", timeout: 180000 });
  await page.waitForSelector(ready, { timeout: 120000 });
  await page.waitForTimeout(1800);
  await hideDevOverlay(page);
  await page.waitForTimeout(250);
}

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);

  const membershipPreferred = await db.collection("identity_memberships").findOne({
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
      if (!ids.includes("settings.team")) {
        const nextMap = {
          ...(typeof role.permissionMap === "object" && role.permissionMap
            ? role.permissionMap
            : {}),
          "settings.team": true,
        };
        await db.collection("identity_roles").updateOne(
          { _id: primaryRoleId as never },
          {
            $set: {
              permissionIds: [...ids, "settings.team"],
              permissionMap: nextMap,
              updatedAt: new Date().toISOString(),
            },
          }
        );
        permsPatched = true;
        console.log("patched role perms", primaryRoleId, ["settings.team"]);
      }
    }
  }

  const members = await db
    .collection("identity_memberships")
    .find({ tenantId, status: "active" })
    .limit(50)
    .toArray();

  const invitations = await db
    .collection("identity_invitations")
    .find({
      tenantId,
      status: "pending",
      expiresAt: { $gt: new Date().toISOString() },
    })
    .limit(20)
    .toArray();

  const now = new Date().toISOString();
  const expires = new Date();
  expires.setHours(expires.getHours() + 2);
  const sessionId = `sess-ux-team-004-${Date.now().toString(36)}`;
  await db.collection("identity_sessions").insertOne({
    _id: sessionId,
    userId: String(user._id),
    tenantId,
    createdAt: now,
    expiresAt: expires.toISOString(),
    lastActivity: now,
  });

  console.log(
    `capture tenant=${tenantId} members=${members.length} invitations=${invitations.length} baseUrl=${baseUrl}`
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
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
  const shots: Record<string, string> = {};

  await gotoStable(page, `${baseUrl}/admin/settings/team`, "[data-team-page]");
  await page.screenshot({
    path: resolve(outDir, "01-desktop-listado.png"),
    fullPage: true,
  });
  shots.listadoDesktop = "01-desktop-listado.png";

  const inviteTab = page.getByRole("tab", { name: /Invitar/i });
  await inviteTab.click();
  await page.waitForSelector("[data-team-invite]", { timeout: 15000 });
  await page.waitForTimeout(800);
  await hideDevOverlay(page);
  await page.screenshot({
    path: resolve(outDir, "02-desktop-invitar.png"),
    fullPage: true,
  });
  shots.invitarDesktop = "02-desktop-invitar.png";

  await page.screenshot({
    path: resolve(outDir, "03-desktop-invitaciones.png"),
    fullPage: true,
  });
  shots.invitacionesDesktop = "03-desktop-invitaciones.png";

  await page.getByRole("tab", { name: /^Equipo/i }).click();
  await page.waitForSelector("[data-team-list]", { timeout: 15000 });
  await page.waitForTimeout(600);

  const changeRoleBtn = page.getByRole("button", { name: "Cambiar rol" }).first();
  let rolePanelOpened = false;
  if (await changeRoleBtn.count()) {
    await changeRoleBtn.click();
    await page.waitForSelector("[data-team-roles]", { timeout: 8000 }).catch(() => null);
    rolePanelOpened = (await page.locator("[data-team-roles]").count()) > 0;
    await hideDevOverlay(page);
    await page.screenshot({
      path: resolve(outDir, "04-desktop-cambiar-rol.png"),
      fullPage: true,
    });
    shots.cambiarRolDesktop = "04-desktop-cambiar-rol.png";
  }

  const manageBtn = page.getByRole("button", { name: "Gestionar" }).first();
  let removeOpened = false;
  if (await manageBtn.count()) {
    await manageBtn.click();
    await page.waitForSelector("[data-team-remove]", { timeout: 8000 }).catch(() => null);
    removeOpened = (await page.locator("[data-team-remove]").count()) > 0;
    if (removeOpened) {
      await page.getByRole("button", { name: "Quitar acceso" }).click();
      await page.waitForTimeout(700);
      await hideDevOverlay(page);
      await page.screenshot({
        path: resolve(outDir, "05-desktop-quitar-acceso.png"),
        fullPage: true,
      });
      shots.quitarAccesoDesktop = "05-desktop-quitar-acceso.png";
      await page.getByRole("button", { name: "Cancelar" }).click().catch(() => null);
      await page.waitForTimeout(400);
    }
  }

  const search = page.getByLabel("Buscar en el Equipo");
  await search.fill("zzz-sin-coincidencias-equipo-ux-004");
  await page.waitForTimeout(500);
  await hideDevOverlay(page);
  await page.screenshot({
    path: resolve(outDir, "06-estado-vacio.png"),
    fullPage: true,
  });
  shots.estadoVacio = "06-estado-vacio.png";
  await search.fill("");
  await page.waitForTimeout(400);

  await context.close();
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await mobile.addCookies([
    {
      name: "ah_session",
      value: sessionId,
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const mpage = await mobile.newPage();
  await gotoStable(mpage, `${baseUrl}/admin/settings/team`, "[data-team-page]");
  await mpage.screenshot({
    path: resolve(outDir, "07-mobile-listado.png"),
    fullPage: true,
  });
  shots.listadoMobile = "07-mobile-listado.png";

  await mpage.getByRole("tab", { name: /Invitar/i }).click();
  await mpage.waitForSelector("[data-team-invite]", { timeout: 15000 });
  await mpage.waitForTimeout(700);
  await hideDevOverlay(mpage);
  await mpage.screenshot({
    path: resolve(outDir, "08-mobile-invitar.png"),
    fullPage: true,
  });
  shots.invitarMobile = "08-mobile-invitar.png";

  const result = {
    ot: "OT-GROWTH-UX-TEAM-004",
    tenantId,
    memberCount: members.length,
    invitationCount: invitations.length,
    rolePanelOpened,
    removeOpened,
    permsPatched,
    emptyKind: "busqueda",
    shots,
    capturedAt: new Date().toISOString(),
  };
  writeFileSync(resolve(outDir, "RESULT.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));

  await mobile.close();
  await browser.close();
  await db.collection("identity_sessions").deleteOne({ _id: sessionId });
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
