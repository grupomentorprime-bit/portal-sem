/**
 * Comprobaciones de Conversion Engine fases 0 y 1 sobre Espacios temporales.
 * No lee ni escribe oportunidades de Espacios existentes.
 * Uso: node --require ./scripts/_stub-server-only.cjs ./node_modules/tsx/dist/cli.mjs --env-file=.env scripts/verify-conversion-engine-pending.ts
 */
import { chromium, type Browser, type Page } from "playwright";
import { granularToLegacyPermissions } from "../src/core/identity/permissions/resolver";
import { getDefaultRolePermissionTemplate } from "../src/core/identity/permissions/role-templates";
import { ROLE_CODES, type RoleCode } from "../src/core/identity/roles/codes";
import { roleIdForTenant } from "../src/core/identity/roles/defaults";
import { openGrowthFunnelDirectory } from "../src/core/growth/funnel-mongo";
import {
  createGrowthFunnel,
  makeDefaultGrowthFunnel,
} from "../src/core/growth/funnels";
import { projectGrowthFromSignal } from "../src/core/growth/ingest";
import {
  openGrowthMessagingStore,
  openGrowthOpportunityStore,
  openGrowthPersonaStore,
} from "../src/core/growth";
import { createMongoGrowthOpportunityWorkflow } from "../src/lib/growth/opportunity-workflow";
import { ensureLiveGrowthFunnels } from "../src/lib/growth/funnels-live";
import { createGrowthEventBusAdapter } from "../src/lib/growth/event-bus";
import { getDatabase } from "../src/lib/mongodb";
import { createMemoryGrowthWhatsAppConnectionStore } from "../src/core/growth/whatsapp/memory-store";
import { signWhatsAppHubBody } from "../src/core/growth/whatsapp/crypto";
import { receiveWhatsAppCloudWebhook } from "../src/core/growth/whatsapp/receive";

const PREFIX = `ce-verify-${Date.now().toString(36)}`;
const BASE = process.env.CAPTURE_URL?.trim() || "http://localhost:3000";
const TENANT_A = `${PREFIX}-a`;
const TENANT_B = `${PREFIX}-b`;

type Check = {
  id: string;
  via: "navegador" | "automatico" | "no verificado";
  result: "pasa" | "falla" | "limitacion" | "no verificado";
  evidence: string;
};

const checks: Check[] = [];

function record(check: Check) {
  checks.push(check);
  console.log(`${check.result.toUpperCase()} [${check.via}] ${check.id}: ${check.evidence}`);
}

async function html5Drop(page: Page, name: string, column: string, id: string) {
  const card = page.locator("li", { hasText: name }).first();
  const target = page.locator(`section[aria-label="${column}"]`).first();
  const src = await card.boundingBox();
  const dst = await target.boundingBox();
  if (!src || !dst) return { ok: false as const, reason: "no está la tarjeta o la columna", id: "" };
  const client = await page.context().newCDPSession(page);
  const data = {
    items: [
      { mimeType: "text/plain", data: id },
      { mimeType: "text/opportunity-id", data: id },
    ],
    dragOperationsMask: 16,
  };
  const x = dst.x + dst.width / 2;
  const y = dst.y + Math.min(80, dst.height / 2);
  for (const type of ["dragEnter", "dragOver", "drop"] as const) {
    await client.send("Input.dispatchDragEvent", { type, x, y, data });
  }
  await client.detach();
  return { ok: true as const, reason: "", id };
}

async function openKanban(page: Page, cookie: string) {
  await page.context().addCookies([
    {
      name: "ah_session",
      value: cookie,
      url: BASE,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.goto(`${BASE}/admin/ventas?vista=kanban`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.getByRole("button", { name: "Kanban" }).waitFor({ timeout: 30000 });
}

async function moveToResult(page: Page, name: string, label: string) {
  const card = page.locator("li", { hasText: name }).first();
  await card.getByLabel(`Mover ${name}`).selectOption({ label });
  const response = page.waitForResponse(
    (item) => item.url().includes("/transition") && item.request().method() === "POST",
    { timeout: 30000 }
  );
  await card.getByRole("button", { name: "Mover" }).click();
  await page.locator("dialog").getByRole("button", { name: label, exact: true }).click();
  const result = await response;
  return result.ok();
}

async function main() {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const userIds = {
    adminA: `${PREFIX}-user-admin-a`,
    operatorA: `${PREFIX}-user-operator-a`,
    adminB: `${PREFIX}-user-admin-b`,
  };
  const sessions = {
    adminA: `${PREFIX}-sess-admin-a`,
    operatorA: `${PREFIX}-sess-operator-a`,
    adminB: `${PREFIX}-sess-admin-b`,
  };
  const names = {
    drag: `${PREFIX} Mover`,
    won: `${PREFIX} Ganar`,
    lost: `${PREFIX} Perder`,
    archived: `${PREFIX} ArchivarOpp`,
    handoff: `${PREFIX} Traspasar`,
    other: `${PREFIX} OtroEspacio`,
    form: `${PREFIX} Formulario`,
    whatsapp: `${PREFIX} WhatsApp`,
  };

  const createdOpportunityIds: string[] = [];

  async function cleanup() {
    const tenants = [TENANT_A, TENANT_B];
    if (tenants.some((id) => !id.startsWith("ce-verify-"))) {
      throw new Error("Limpieza abortada: el identificador no es temporal.");
    }
    const scoped = [
      "identity_roles",
      "identity_memberships",
      "identity_sessions",
      "growth_personas",
      "growth_oportunidades",
      "growth_actividades",
      "growth_funnels",
      "growth_space_config",
      "growth_conversaciones",
      "growth_mensajes",
      "growth_automations",
      "growth_automation_versions",
      "growth_automation_runs",
      "workflow_definitions",
      "workflow_instances",
      "workflow_history",
      "core_events",
    ];
    for (const name of scoped) {
      await db.collection(name).deleteMany({ tenantId: { $in: tenants } });
    }
    await db.collection("tenants").deleteMany({
      $or: [{ _id: { $in: tenants } }, { tenantId: { $in: tenants } }],
    });
    await db.collection("identity_users").deleteMany({
      _id: { $in: Object.values(userIds) },
    });
    await db.collection("identity_sessions").deleteMany({
      _id: { $in: Object.values(sessions) },
    });
  }

  let browser: Browser | null = null;
  try {
    for (const tenantId of [TENANT_A, TENANT_B]) {
      const existing = await db.collection("tenants").findOne({ tenantId });
      if (existing) throw new Error(`El Espacio ${tenantId} ya existe.`);
      await db.collection("tenants").insertOne({
        _id: tenantId,
        tenantId,
        code: tenantId.slice(-12),
        name: tenantId.endsWith("-a") ? "CE Verify A" : "CE Verify B",
        slug: tenantId,
        status: "active",
        type: "other",
        defaultSiteId: tenantId,
        createdAt: now,
        updatedAt: now,
      });
    }

    async function seedRole(tenantId: string, code: RoleCode) {
      const permissionMap = getDefaultRolePermissionTemplate(code);
      await db.collection("identity_roles").insertOne({
        _id: roleIdForTenant(tenantId, code),
        tenantId,
        code,
        name: code,
        description: "temporal",
        permissionIds: granularToLegacyPermissions(permissionMap),
        permissionMap,
        system: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    await seedRole(TENANT_A, ROLE_CODES.INSTITUTION_ADMIN);
    await seedRole(TENANT_A, ROLE_CODES.ADMISSIONS);
    await seedRole(TENANT_B, ROLE_CODES.INSTITUTION_ADMIN);

    const users = [
      { id: userIds.adminA, name: "Admin A", tenantId: TENANT_A, role: ROLE_CODES.INSTITUTION_ADMIN },
      { id: userIds.operatorA, name: "Operador A", tenantId: TENANT_A, role: ROLE_CODES.ADMISSIONS },
      { id: userIds.adminB, name: "Admin B", tenantId: TENANT_B, role: ROLE_CODES.INSTITUTION_ADMIN },
    ];
    for (const user of users) {
      await db.collection("identity_users").insertOne({
        _id: user.id,
        email: `${user.id}@example.invalid`,
        emailVerified: true,
        displayName: user.name,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      await db.collection("identity_memberships").insertOne({
        _id: `${user.id}-mem`,
        tenantId: user.tenantId,
        userId: user.id,
        roleIds: [roleIdForTenant(user.tenantId, user.role)],
        status: "active",
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
    const sessionRows = [
      { id: sessions.adminA, userId: userIds.adminA, tenantId: TENANT_A },
      { id: sessions.operatorA, userId: userIds.operatorA, tenantId: TENANT_A },
      { id: sessions.adminB, userId: userIds.adminB, tenantId: TENANT_B },
    ];
    for (const session of sessionRows) {
      await db.collection("identity_sessions").insertOne({
        _id: session.id,
        userId: session.userId,
        tenantId: session.tenantId,
        createdAt: now,
        expiresAt: expires,
        lastActivity: now,
      });
    }

    await ensureLiveGrowthFunnels(TENANT_A);
    await ensureLiveGrowthFunnels(TENANT_B);
    const personas = await openGrowthPersonaStore(db);
    const oportunidades = await openGrowthOpportunityStore(db);
    const workflow = createMongoGrowthOpportunityWorkflow();
    const funnels = await openGrowthFunnelDirectory(db);
    const eventBus = createGrowthEventBusAdapter();

    async function seedForm(tenantId: string, fullName: string, email: string, phone: string) {
      const result = await projectGrowthFromSignal(
        { personas, oportunidades, workflow, eventBus, funnels },
        {
          kind: "form",
          tenantId,
          submissionId: `${PREFIX}-${email}`,
          formId: "contact",
          destination: "contact",
          data: { fullName, email, phone },
          capturedAt: now,
        }
      );
      if (!result.ok || result.outcome !== "projected") {
        throw new Error(`No se pudo abrir la oportunidad temporal de ${fullName}.`);
      }
      createdOpportunityIds.push(result.oportunidad._id);
      await db.collection("growth_oportunidades").updateOne(
        { _id: result.oportunidad._id, tenantId },
        {
          $set: {
            nextAction: { summary: "Llamar", kind: "contact", setAt: now },
          },
        }
      );
      return result.oportunidad._id;
    }

    const ids = {
      drag: await seedForm(TENANT_A, names.drag, "mover@example.invalid", "+56 9 7100 0001"),
      won: await seedForm(TENANT_A, names.won, "ganar@example.invalid", "+56 9 7100 0002"),
      lost: await seedForm(TENANT_A, names.lost, "perder@example.invalid", "+56 9 7100 0003"),
      archived: await seedForm(TENANT_A, names.archived, "archivar@example.invalid", "+56 9 7100 0004"),
      handoff: await seedForm(TENANT_A, names.handoff, "traspasar@example.invalid", "+56 9 7100 0005"),
      other: await seedForm(TENANT_B, names.other, "otro@example.invalid", "+56 9 7100 0006"),
    };

    browser = await chromium.launch({ headless: true });
    const adminContext = await browser.newContext();
    const admin = await adminContext.newPage();
    await openKanban(admin, sessions.adminA);

    const dropResponse = admin.waitForResponse(
      (item) => item.url().includes("/transition") && item.request().method() === "POST",
      { timeout: 8000 }
    );
    const drop = await html5Drop(admin, names.drag, "En seguimiento", ids.drag);
    const dropHttp = await dropResponse.then((item) => item.ok()).catch(() => false);
    if (!drop.ok) {
      record({
        id: "kanban-arrastre",
        via: "navegador",
        result: "falla",
        evidence: drop.reason,
      });
    } else {
      await admin.reload({ waitUntil: "domcontentloaded" });
      await admin.getByRole("button", { name: "Kanban" }).click();
      const inColumn = await admin
        .locator('section[aria-label="En seguimiento"]')
        .getByText(names.drag)
        .count();
      const saved = await db.collection("growth_oportunidades").findOne({
        _id: ids.drag,
        tenantId: TENANT_A,
      });
      if (dropHttp && drop.id === ids.drag && inColumn > 0 && saved?.status === "active") {
        record({
          id: "kanban-arrastre",
          via: "navegador",
          result: "pasa",
          evidence: `Tarjeta ${ids.drag} soltada en En seguimiento; status=${saved.status}.`,
        });
      } else {
        record({
          id: "kanban-arrastre",
          via: "navegador",
          result: "falla",
          evidence: `http=${dropHttp} dropId=${drop.id || "vacío"} columna=${inColumn} status=${String(saved?.status)}.`,
        });
      }
    }

    const resultTargets = [
      { name: names.won, label: "Ganada", status: "won", id: ids.won },
      { name: names.lost, label: "Perdida", status: "lost", id: ids.lost },
      { name: names.archived, label: "Archivada", status: "archived", id: ids.archived },
      { name: names.handoff, label: "Traspasada", status: "handed_off", id: ids.handoff },
    ];
    const resultNotes: string[] = [];
    let resultsOk = true;
    for (const target of resultTargets) {
      const httpOk = await moveToResult(admin, target.name, target.label);
      const oportunidad = await db.collection("growth_oportunidades").findOne({
        _id: target.id,
        tenantId: TENANT_A,
      });
      const activities = await db
        .collection("growth_actividades")
        .find({ tenantId: TENANT_A, oportunidadId: target.id })
        .toArray();
      const history = await db
        .collection("workflow_history")
        .find({ tenantId: TENANT_A, entityId: target.id, toState: target.status })
        .toArray();
      const instance = oportunidad
        ? await db.collection("workflow_instances").findOne({
            _id: oportunidad.workflowInstanceId,
            tenantId: TENANT_A,
          })
        : null;
      const kinds = activities.map((item) => item.kind);
      const handoffOk =
        target.status !== "handed_off" || kinds.includes("handoff");
      const ok =
        httpOk &&
        oportunidad?.status === target.status &&
        Boolean(oportunidad?.closedAt) &&
        oportunidad?.nextAction == null &&
        kinds.includes("opportunity_transitioned") &&
        history.length > 0 &&
        instance?.status === "completed" &&
        handoffOk;
      if (!ok) resultsOk = false;
      resultNotes.push(
        `${target.status}: http=${httpOk} status=${oportunidad?.status} closed=${Boolean(oportunidad?.closedAt)} next=${oportunidad?.nextAction == null} activity=${kinds.includes("opportunity_transitioned")} handoffActivity=${kinds.includes("handoff")} history=${history.length} workflow=${instance?.status}`
      );
    }
    record({
      id: "transiciones-resultado",
      via: "navegador",
      result: resultsOk ? "pasa" : "falla",
      evidence: resultNotes.join(" | "),
    });

    const operatorContext = await browser.newContext();
    const operator = await operatorContext.newPage();
    await openKanban(operator, sessions.operatorA);
    const operatorCanMove = await operator.getByLabel(`Mover ${names.drag}`).count();
    const embudosNav = await operator.getByRole("link", { name: "Embudos" }).count();
    await operator.goto(`${BASE}/admin/ventas/embudos`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await operator.waitForTimeout(500);
    const operatorUrl = operator.url();
    const adminEmbudos = await browser.newContext();
    const adminFunnelPage = await adminEmbudos.newPage();
    await adminFunnelPage.context().addCookies([
      {
        name: "ah_session",
        value: sessions.adminA,
        url: BASE,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await adminFunnelPage.goto(`${BASE}/admin/ventas/embudos`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    const adminSeesEmbudos = await adminFunnelPage.getByRole("button", { name: "Crear embudo" }).count();
    const permissionsOk =
      operatorCanMove > 0 &&
      embudosNav === 0 &&
      !operatorUrl.includes("/embudos") &&
      adminSeesEmbudos > 0;
    record({
      id: "permisos",
      via: "navegador",
      result: permissionsOk ? "pasa" : "falla",
      evidence: `operador mueve=${operatorCanMove} navEmbudos=${embudosNav} url=${operatorUrl} adminCrear=${adminSeesEmbudos}`,
    });

    const spaceB = await browser.newContext();
    const pageB = await spaceB.newPage();
    await openKanban(pageB, sessions.adminB);
    const bodyB = await pageB.locator("body").innerText();
    const bodyA = await admin.locator("body").innerText();
    const isolated =
      !bodyB.includes(names.drag) &&
      !bodyB.includes(names.won) &&
      bodyB.includes(names.other) &&
      !bodyA.includes(names.other);
    const foreignFunnel = await db.collection("growth_funnels").countDocuments({
      tenantId: TENANT_B,
      key: { $in: ["archivo-ui", "campana-ui"] },
    });
    record({
      id: "aislamiento",
      via: "navegador",
      result: isolated && foreignFunnel === 0 ? "pasa" : "falla",
      evidence: `B ve otro=${bodyB.includes(names.other)} B ve A=${bodyB.includes(names.drag)} A ve B=${bodyA.includes(names.other)} embudos ajenos en B=${foreignFunnel}`,
    });

    await adminFunnelPage.getByLabel("Clave del embudo").fill("archivo-ui");
    await adminFunnelPage.getByLabel("Nombre del embudo").fill("Archivo UI");
    await adminFunnelPage.getByRole("button", { name: "Crear embudo" }).click();
    const section = adminFunnelPage.locator("section", { hasText: "archivo-ui" });
    await section.getByRole("button", { name: "Archivar" }).click();
    await adminFunnelPage.locator("dialog").getByRole("button", { name: "Archivar", exact: true }).click();
    await section.getByText("Archivado").waitFor({ timeout: 20000 });
    const archivedDoc = await db.collection("growth_funnels").findOne({
      tenantId: TENANT_A,
      key: "archivo-ui",
    });
    const defaultStill = await db.collection("growth_funnels").findOne({
      tenantId: TENANT_A,
      key: "default",
    });
    const defaultHasArchive = await adminFunnelPage
      .locator("section", { hasText: "default" })
      .getByRole("button", { name: "Archivar" })
      .count();
    record({
      id: "archivar-embudo",
      via: "navegador",
      result:
        archivedDoc?.status === "archived" &&
        defaultStill?.status === "active" &&
        defaultStill?.isDefault === true &&
        defaultHasArchive === 0
          ? "pasa"
          : "falla",
      evidence: `archivo-ui=${archivedDoc?.status} default=${defaultStill?.status} isDefault=${defaultStill?.isDefault} botonDefault=${defaultHasArchive}`,
    });

    const campana = await createGrowthFunnel(funnels, {
      tenantId: TENANT_A,
      key: "campana-ui",
      name: "Campaña UI",
    });
    if (!campana.ok) throw new Error("No se pudo crear el embudo temporal de captación.");
    const made = await makeDefaultGrowthFunnel(funnels, {
      tenantId: TENANT_A,
      key: "campana-ui",
    });
    if (!made.ok) throw new Error("No se pudo marcar el embudo temporal como predeterminado.");

    const form = await projectGrowthFromSignal(
      { personas, oportunidades, workflow, eventBus, funnels },
      {
        kind: "form",
        tenantId: TENANT_A,
        submissionId: `${PREFIX}-form-default`,
        formId: "contact",
        destination: "contact",
        data: {
          fullName: names.form,
          email: "formulario@example.invalid",
          phone: "+56 9 7100 0007",
        },
        capturedAt: new Date().toISOString(),
      }
    );
    if (!form.ok || form.outcome !== "projected") {
      throw new Error("La captación de formulario temporal no proyectó.");
    }
    createdOpportunityIds.push(form.oportunidad._id);

    const phoneId = `${PREFIX}-phone`;
    const connections = createMemoryGrowthWhatsAppConnectionStore();
    await connections.upsert({
      _id: `${PREFIX}-wa`,
      tenantId: TENANT_A,
      phoneNumberId: phoneId,
      verifyToken: "verify-temporal",
      appSecret: "secret-temporal",
      enabled: true,
      createdAt: now,
      updatedAt: now,
    });
    const rawBody = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [
        {
          id: "waba-temporal",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "56911110000", phone_number_id: phoneId },
                contacts: [{ profile: { name: names.whatsapp }, wa_id: "56933334444" }],
                messages: [
                  {
                    from: "56933334444",
                    id: `${PREFIX}-wamid`,
                    timestamp: "1757260800",
                    type: "text",
                    text: { body: "hola" },
                  },
                ],
              },
            },
          ],
        },
      ],
    });
    const messaging = await openGrowthMessagingStore(db);
    const received = await receiveWhatsAppCloudWebhook(
      {
        connections,
        personas,
        messaging,
        oportunidades,
        workflow,
        eventBus,
        funnels,
        platformAppSecret: "secret-temporal",
      },
      { rawBody, signatureHeader: signWhatsAppHubBody(rawBody, "secret-temporal") }
    );
    const whatsappId = received.ok ? received.processed[0]?.oportunidadId : undefined;
    if (!received.ok || !whatsappId) {
      console.log("whatsapp-debug", JSON.stringify(received));
    }
    const formDoc = await db.collection("growth_oportunidades").findOne({
      _id: form.oportunidad._id,
      tenantId: TENANT_A,
    });
    const whatsappDoc = whatsappId
      ? await db.collection("growth_oportunidades").findOne({
          _id: whatsappId,
          tenantId: TENANT_A,
        })
      : null;
    await admin.reload({ waitUntil: "domcontentloaded" });
    await admin.getByRole("button", { name: "Kanban" }).click();
    await admin.getByText(names.form).waitFor({ timeout: 30000 });
    const campaignLane = admin.locator("section", { hasText: "Campaña UI" }).first();
    const formVisible = await campaignLane.getByText(names.form).count();
    const whatsappVisible = await campaignLane.getByText(names.whatsapp).count();
    const captureOk =
      formDoc?.funnelKey === "campana-ui" &&
      formDoc.status === "open" &&
      whatsappDoc?.funnelKey === "campana-ui" &&
      whatsappDoc.status === "open" &&
      formVisible > 0 &&
      whatsappVisible > 0;
    record({
      id: "captacion-predeterminado",
      via: "navegador",
      result: captureOk ? "pasa" : "falla",
      evidence: `form=${formDoc?.funnelKey}/${formDoc?.status} visible=${formVisible} whatsapp=${whatsappDoc?.funnelKey}/${whatsappDoc?.status} visible=${whatsappVisible} receive=${received.ok}`,
    });

    await adminContext.close();
    await operatorContext.close();
    await adminEmbudos.close();
    await spaceB.close();
  } finally {
    await browser?.close();
    await cleanup();
    const leftover = await db.collection("growth_oportunidades").countDocuments({
      tenantId: { $in: [TENANT_A, TENANT_B] },
    });
    const leftoverUsers = await db.collection("identity_users").countDocuments({
      _id: { $in: Object.values(userIds) },
    });
    console.log(
      JSON.stringify(
        {
          prefix: PREFIX,
          leftoverOpportunities: leftover,
          leftoverUsers,
          createdOpportunityIds,
          checks,
        },
        null,
        2
      )
    );
    if (leftover !== 0 || leftoverUsers !== 0) {
      throw new Error("Quedaron datos temporales después de la limpieza.");
    }
    process.exit(checks.some((check) => check.result !== "pasa") ? 1 : 0);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
