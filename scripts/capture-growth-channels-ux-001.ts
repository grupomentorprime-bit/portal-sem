/**
 * OT-GROWTH-CHANNELS-UX-001 — capturas Centro de Canales (rediseño visual).
 * Preferencia: Espacio ADL (`adl`).
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-channels-ux-001.ts
 *
 * Entrega: desktop · conectado · incompleto · modal · móvil.
 * No declara APTO VISUAL.
 */
import { mkdirSync } from "fs";
import { resolve } from "path";
import { createCipheriv, randomBytes, scryptSync } from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import { chromium } from "playwright";
import { getDefaultRolePermissionTemplate } from "../src/core/identity/permissions/role-templates";
import { granularToLegacyPermissions } from "../src/core/identity/permissions/resolver";
import type { RoleCode } from "../src/core/identity/roles/codes";
import { LEGACY_ROLE_NAME_TO_CODE } from "../src/core/identity/roles/codes";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI / MONGODB_DB");
  process.exit(1);
}

function encryptSecret(plaintext: string): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) throw new Error("SESSION_SECRET es obligatorio.");
  const key = scryptSync(secret, "portal-sem-integration-secrets", 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

const preferredTenant = process.env.CAPTURE_TENANT_ID?.trim() || "adl";
const baseUrl = process.env.CAPTURE_URL?.trim() || "http://localhost:3000";
const outDir = resolve("docs/validation/OT-GROWTH-CHANNELS-UX-001");
mkdirSync(outDir, { recursive: true });

const CAPTURE_TAG = "capture-channels-ux-001";
const stamp = Date.now().toString(36);

async function ensureIntegrationsPermissions(
  db: ReturnType<MongoClient["db"]>,
  tenantId: string,
  roleIds: string[]
) {
  for (const roleId of roleIds) {
    const role = await db.collection("identity_roles").findOne({
      _id: roleId,
      tenantId,
    });
    if (!role) continue;
    const code =
      (role.code as RoleCode | undefined) ??
      LEGACY_ROLE_NAME_TO_CODE[String(role.name)] ??
      null;
    if (!code) continue;
    const permissionMap = getDefaultRolePermissionTemplate(code);
    permissionMap["settings.integrations.manage"] = true;
    const permissionIds = granularToLegacyPermissions(permissionMap);
    await db.collection("identity_roles").updateOne(
      { _id: roleId },
      {
        $set: {
          permissionMap,
          permissionIds,
          updatedAt: new Date().toISOString(),
        },
      }
    );
  }
}

async function upsertCaptureConnection(
  db: ReturnType<MongoClient["db"]>,
  tenantId: string,
  opts: {
    enabled: boolean;
    hasAccessToken: boolean;
    displayPhoneNumber: string;
    phoneNumberId: string;
  }
) {
  const now = new Date().toISOString();
  const existing = await db.collection("growth_whatsapp_connections").findOne({
    tenantId,
  });
  const doc: Record<string, unknown> = {
    _id: existing?._id ?? new ObjectId().toString(),
    tenantId,
    phoneNumberId: opts.phoneNumberId,
    displayPhoneNumber: opts.displayPhoneNumber,
    verifyTokenEncrypted: encryptSecret(`${CAPTURE_TAG}-verify`),
    appSecretEncrypted: encryptSecret(`${CAPTURE_TAG}-secret`),
    enabled: opts.enabled,
    createdAt: (existing?.createdAt as string | undefined) ?? now,
    updatedAt: now,
    captureTag: CAPTURE_TAG,
  };
  if (opts.hasAccessToken) {
    doc.accessTokenEncrypted = encryptSecret(`${CAPTURE_TAG}-access`);
  }
  await db.collection("growth_whatsapp_connections").replaceOne(
    { tenantId },
    Object.fromEntries(
      Object.entries(doc).filter(([, v]) => v !== undefined)
    ),
    { upsert: true }
  );
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
  console.log(`capture tenant=${tenantId} baseUrl=${baseUrl}`);

  const previousConnection = await db
    .collection("growth_whatsapp_connections")
    .findOne({ tenantId });
  const previousSnapshot = previousConnection
    ? { ...previousConnection }
    : null;

  await ensureIntegrationsPermissions(
    db,
    tenantId,
    Array.isArray(membership.roleIds) ? membership.roleIds.map(String) : []
  );

  const user = await db.collection("identity_users").findOne({
    _id: membership.userId,
    status: "active",
  });
  if (!user) {
    console.error("Usuario de membresía no encontrado");
    process.exit(1);
  }

  const sessionNow = new Date().toISOString();
  const expires = new Date();
  expires.setHours(expires.getHours() + 2);
  const sessionId = `sess-${CAPTURE_TAG}-${stamp}`;

  await db.collection("identity_sessions").insertOne({
    _id: sessionId,
    userId: String(user._id),
    tenantId,
    createdAt: sessionNow,
    expiresAt: expires.toISOString(),
    lastActivity: sessionNow,
  });

  const browser = await chromium.launch({ headless: true });

  const hideOverlayScript = () => {
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
  };

  const hideDevOverlay = async (
    page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>["newPage"]>>
  ) => {
    await page.evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    });
  };

  // —— Desktop: conectado + modal ——
  {
    await upsertCaptureConnection(db, tenantId, {
      enabled: true,
      hasAccessToken: true,
      displayPhoneNumber: "+56 9 8765 4321",
      phoneNumberId: `capture-pn-${tenantId}-ok`,
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
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
    await page.addInitScript(hideOverlayScript);

    await page.goto(`${baseUrl}/admin/settings/channels`, {
      waitUntil: "load",
      timeout: 180000,
    });
    await hideDevOverlay(page);
    await page.waitForSelector("[data-channels-settings]", { timeout: 60000 });
    await page.waitForSelector('[data-status="connected"]', { timeout: 30000 });
    await page.waitForTimeout(600);

    await page.screenshot({
      path: resolve(outDir, "admin-channels-desktop.png"),
      fullPage: true,
    });
    await page.screenshot({
      path: resolve(outDir, "admin-channels-whatsapp-connected.png"),
      fullPage: true,
    });
    console.log("saved desktop + connected");

    await page.getByRole("button", { name: "Administrar" }).click();
    await page.waitForSelector("dialog[open]", { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: resolve(outDir, "admin-channels-whatsapp-modal.png"),
      fullPage: true,
    });
    console.log("saved modal");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Incompleto
    await upsertCaptureConnection(db, tenantId, {
      enabled: true,
      hasAccessToken: false,
      displayPhoneNumber: "+56 9 2222 0000",
      phoneNumberId: `capture-pn-${tenantId}-incomplete`,
    });
    await page.reload({ waitUntil: "load", timeout: 180000 });
    await hideDevOverlay(page);
    await page.waitForSelector('[data-status="incomplete"]', { timeout: 30000 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: resolve(outDir, "admin-channels-whatsapp-incomplete.png"),
      fullPage: true,
    });
    console.log("saved incomplete");

    await context.close();
  }

  // —— Mobile: conectado ——
  {
    await upsertCaptureConnection(db, tenantId, {
      enabled: true,
      hasAccessToken: true,
      displayPhoneNumber: "+56 9 8765 4321",
      phoneNumberId: `capture-pn-${tenantId}-ok`,
    });

    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
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
    await page.addInitScript(hideOverlayScript);

    await page.goto(`${baseUrl}/admin/settings/channels`, {
      waitUntil: "load",
      timeout: 180000,
    });
    await hideDevOverlay(page);
    await page.waitForSelector("[data-channels-settings]", { timeout: 60000 });
    await page.waitForSelector('[data-status="connected"]', { timeout: 30000 });
    await page.waitForTimeout(600);

    await page.screenshot({
      path: resolve(outDir, "admin-channels-mobile.png"),
      fullPage: true,
    });
    console.log("saved mobile");

    await context.close();
  }

  await browser.close();
  await db.collection("identity_sessions").deleteOne({ _id: sessionId });

  if (previousSnapshot && previousSnapshot.captureTag !== CAPTURE_TAG) {
    await db
      .collection("growth_whatsapp_connections")
      .replaceOne({ tenantId }, previousSnapshot, { upsert: true });
    console.log("restaurada conexión WhatsApp previa del Espacio");
  } else if (!previousSnapshot) {
    await db.collection("growth_whatsapp_connections").deleteOne({
      tenantId,
      captureTag: CAPTURE_TAG,
    });
    console.log("eliminada conexión de captura (no había previa)");
  }

  await client.close();
  console.log(`capturas en ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
