import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ROLE_CODES } from "../../src/core/identity/roles/codes";
import { granularToLegacyPermissions } from "../../src/core/identity/permissions/resolver";
import { ROLE_PERMISSION_TEMPLATES } from "../../src/core/identity/permissions/role-templates";
import { authorize } from "../../src/core/identity/policies/engine";
import { createMemoryFunnelDirectory } from "../../src/core/growth/funnel-memory";
import {
  archiveGrowthFunnel,
  createGrowthFunnel,
  ensureGrowthFunnelsForTenant,
  listGrowthFunnelStages,
  makeDefaultGrowthFunnel,
} from "../../src/core/growth/funnels";
import { projectGrowthFromSignal } from "../../src/core/growth/ingest";
import { createMemoryGrowthIngestStores } from "../../src/core/growth/ingest-memory";
import { createMemoryGrowthMessagingStore } from "../../src/core/growth/messaging/memory-store";
import { createMemoryGrowthPersonaStore } from "../../src/core/growth/memory-store";
import { createMemoryGrowthOpportunityWorkflow } from "../../src/core/growth/opportunity-workflow-port";
import { transitionGrowthOpportunity } from "../../src/core/growth/transition-opportunity";
import { createMemoryGrowthWhatsAppConnectionStore } from "../../src/core/growth/whatsapp/memory-store";
import { signWhatsAppHubBody } from "../../src/core/growth/whatsapp/crypto";
import { receiveWhatsAppCloudWebhook } from "../../src/core/growth/whatsapp/receive";
import type { AuthContext } from "../../src/types/identity";

function auth(permissions: string[]): AuthContext {
  return {
    user: {
      _id: "user",
      email: "user@example.com",
      emailVerified: true,
      displayName: "User",
      status: "active",
      createdAt: "2026-10-18T00:00:00.000Z",
      updatedAt: "2026-10-18T00:00:00.000Z",
    },
    session: {
      _id: "sess",
      userId: "user",
      tenantId: "espacio",
      createdAt: "2026-10-18T00:00:00.000Z",
      expiresAt: "2026-10-19T00:00:00.000Z",
      lastActivity: "2026-10-18T00:00:00.000Z",
    },
    membership: {
      _id: "mem",
      tenantId: "espacio",
      userId: "user",
      roleIds: ["role"],
      status: "active",
      joinedAt: "2026-10-18T00:00:00.000Z",
      createdAt: "2026-10-18T00:00:00.000Z",
      updatedAt: "2026-10-18T00:00:00.000Z",
    },
    permissions,
    tenantId: "espacio",
    platformRoles: [],
    compatMode: false,
  };
}

describe("conversion engine comprobaciones pendientes", () => {
  it("transiciones a los cuatro resultados dejan actividad, historial y handoff", async () => {
    const stores = createMemoryGrowthIngestStores();
    const workflow = createMemoryGrowthOpportunityWorkflow();
    const directory = createMemoryFunnelDirectory({
      opportunities: stores.oportunidades.oportunidades,
      workflow,
    });
    const tenantId = "espacio-resultados";
    await ensureGrowthFunnelsForTenant(directory, tenantId, "2026-10-18T00:00:00.000Z");
    const targets = ["won", "lost", "archived", "handed_off"] as const;

    for (const toState of targets) {
      const opened = await projectGrowthFromSignal(
        {
          personas: stores.personas,
          oportunidades: stores.oportunidades,
          workflow,
          funnels: directory,
        },
        {
          kind: "form",
          tenantId,
          submissionId: `sub-${toState}`,
          formId: "contact",
          destination: "contact",
          data: {
            fullName: `Persona ${toState}`,
            email: `${toState}@example.com`,
            phone: "+56 9 1111 2222",
          },
          capturedAt: "2026-10-18T01:00:00.000Z",
        }
      );
      assert.equal(opened.ok, true);
      if (!opened.ok || opened.outcome !== "projected") return;
      const moved = await transitionGrowthOpportunity(stores.oportunidades, workflow, {
        tenantId,
        oportunidadId: opened.oportunidad._id,
        toState,
        now: "2026-10-18T02:00:00.000Z",
        handoff:
          toState === "handed_off"
            ? { delivered: true, adapter: "academico", externalId: "ext-1" }
            : undefined,
      });
      assert.equal(moved.ok, true);
      if (!moved.ok) return;
      assert.equal(moved.activity.kind, "opportunity_transitioned");
      assert.equal(moved.oportunidad.status, toState);
      assert.equal(moved.oportunidad.closedAt, "2026-10-18T02:00:00.000Z");
      assert.equal(moved.oportunidad.nextAction, null);
      if (toState === "handed_off") {
        assert.equal(moved.handoffActivity?.kind, "handoff");
        assert.equal(moved.oportunidad.handoff?.adapter, "academico");
        assert.equal(moved.oportunidad.handoff?.externalId, "ext-1");
      }
      const instance = workflow.instances.get(moved.oportunidad.workflowInstanceId);
      assert.equal(instance?.status, "completed");
      assert.equal(instance?.history.at(-1)?.toState, toState);
      const again = await transitionGrowthOpportunity(stores.oportunidades, workflow, {
        tenantId,
        oportunidadId: opened.oportunidad._id,
        toState: "active",
      });
      assert.equal(again.ok, false);
    }
  });

  it("administrar embudos queda en admins; operar Ventas no alcanza para embudos", () => {
    const admin = granularToLegacyPermissions(
      ROLE_PERMISSION_TEMPLATES[ROLE_CODES.INSTITUTION_ADMIN]
    );
    const operator = granularToLegacyPermissions(
      ROLE_PERMISSION_TEMPLATES[ROLE_CODES.ADMISSIONS]
    );
    assert.equal(admin.includes("growth.funnels.manage"), true);
    assert.equal(admin.includes("growth.sales.operate"), true);
    assert.equal(operator.includes("growth.sales.operate"), true);
    assert.equal(operator.includes("growth.funnels.manage"), false);
    assert.equal(authorize(auth(admin), "growth.funnels.manage").ok, true);
    assert.equal(authorize(auth(operator), "growth.funnels.manage").ok, false);
    assert.equal(authorize(auth(operator), "growth.sales.operate").ok, true);
  });

  it("dos Espacios no comparten embudos, etapas ni oportunidades", async () => {
    const stores = createMemoryGrowthIngestStores();
    const workflow = createMemoryGrowthOpportunityWorkflow();
    const directory = createMemoryFunnelDirectory({
      opportunities: stores.oportunidades.oportunidades,
      workflow,
    });
    await ensureGrowthFunnelsForTenant(directory, "espacio-a");
    await ensureGrowthFunnelsForTenant(directory, "espacio-b");
    const created = await createGrowthFunnel(directory, {
      tenantId: "espacio-a",
      key: "campana",
      name: "Campaña A",
    });
    assert.equal(created.ok, true);
    const stagesA = await listGrowthFunnelStages(directory, "espacio-a", "campana");
    const stagesB = await listGrowthFunnelStages(directory, "espacio-b", "campana");
    assert.ok(stagesA && stagesA.length > 0);
    assert.equal(stagesB, null);
    const opened = await projectGrowthFromSignal(
      {
        personas: stores.personas,
        oportunidades: stores.oportunidades,
        workflow,
        funnels: directory,
      },
      {
        kind: "form",
        tenantId: "espacio-a",
        submissionId: "sub-a",
        formId: "contact",
        destination: "contact",
        data: { fullName: "Ana A", email: "ana-a@example.com", phone: "+56 9 1111 0001" },
        capturedAt: "2026-10-18T03:00:00.000Z",
      }
    );
    assert.equal(opened.ok, true);
    const visibleB = await directory.listOpportunities("espacio-b");
    assert.equal(visibleB.length, 0);
    const funnelsB = await directory.listFunnels("espacio-b");
    assert.equal(funnelsB.some((funnel) => funnel.key === "campana"), false);
  });

  it("formulario y WhatsApp entran al embudo predeterminado, aunque su clave no sea default", async () => {
    const stores = createMemoryGrowthIngestStores();
    const personas = createMemoryGrowthPersonaStore();
    const messaging = createMemoryGrowthMessagingStore();
    const workflow = createMemoryGrowthOpportunityWorkflow();
    const directory = createMemoryFunnelDirectory({
      opportunities: stores.oportunidades.oportunidades,
      workflow,
    });
    const tenantId = "espacio-captacion";
    await ensureGrowthFunnelsForTenant(directory, tenantId);
    const created = await createGrowthFunnel(directory, {
      tenantId,
      key: "campana",
      name: "Campaña",
    });
    assert.equal(created.ok, true);
    const made = await makeDefaultGrowthFunnel(directory, { tenantId, key: "campana" });
    assert.equal(made.ok, true);

    const form = await projectGrowthFromSignal(
      {
        personas: stores.personas,
        oportunidades: stores.oportunidades,
        workflow,
        funnels: directory,
      },
      {
        kind: "form",
        tenantId,
        submissionId: "sub-campana",
        formId: "contact",
        destination: "contact",
        data: {
          fullName: "Formulario Campaña",
          email: "form-campana@example.com",
          phone: "+56 9 2222 0001",
        },
        capturedAt: "2026-10-18T04:00:00.000Z",
      }
    );
    assert.equal(form.ok, true);
    if (!form.ok || form.outcome !== "projected") return;
    assert.equal(form.oportunidad.funnelKey, "campana");
    assert.equal(form.oportunidad.status, "open");

    const connections = createMemoryGrowthWhatsAppConnectionStore();
    await connections.upsert({
      _id: "wa-conn",
      tenantId,
      phoneNumberId: "pn-campana",
      verifyToken: "verify",
      appSecret: "secret",
      enabled: true,
      createdAt: "2026-10-18T04:00:00.000Z",
      updatedAt: "2026-10-18T04:00:00.000Z",
    });
    const rawBody = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [
        {
          id: "waba",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "56900000000", phone_number_id: "pn-campana" },
                contacts: [{ profile: { name: "WhatsApp Campaña" }, wa_id: "56933330001" }],
                messages: [
                  {
                    from: "56933330001",
                    id: "wamid-campana",
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
    const received = await receiveWhatsAppCloudWebhook(
      {
        connections,
        personas,
        messaging,
        oportunidades: stores.oportunidades,
        workflow,
        funnels: directory,
        platformAppSecret: "secret",
      },
      { rawBody, signatureHeader: signWhatsAppHubBody(rawBody, "secret") }
    );
    assert.equal(received.ok, true);
    if (!received.ok) return;
    const oportunidadId = received.processed[0]?.oportunidadId;
    assert.ok(oportunidadId);
    const saved = await stores.oportunidades.findById(tenantId, oportunidadId!);
    assert.equal(saved?.funnelKey, "campana");
    assert.equal(saved?.status, "open");
  });

  it("un embudo elegible se archiva y el predeterminado no", async () => {
    const directory = createMemoryFunnelDirectory();
    const tenantId = "espacio-archivo";
    await ensureGrowthFunnelsForTenant(directory, tenantId);
    await createGrowthFunnel(directory, { tenantId, key: "archivo", name: "Archivo" });
    const blocked = await archiveGrowthFunnel(directory, { tenantId, key: "default" });
    assert.equal(blocked.ok, false);
    const archived = await archiveGrowthFunnel(directory, { tenantId, key: "archivo" });
    assert.equal(archived.ok, true);
    if (!archived.ok) return;
    assert.equal(archived.funnel.status, "archived");
    const listed = await directory.findFunnel(tenantId, "archivo");
    assert.equal(listed?.status, "archived");
  });
});
