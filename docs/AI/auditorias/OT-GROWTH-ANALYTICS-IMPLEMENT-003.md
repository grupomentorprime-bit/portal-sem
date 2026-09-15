# OT-GROWTH-ANALYTICS-IMPLEMENT-003 — Implementación Read Model + API Analítica V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-ANALYTICS-IMPLEMENT-003 |
| Tipo | Implementación (READ-ONLY) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-11 |
| Entrada | [OT-GROWTH-ANALYTICS-CONTRACT-002](./OT-GROWTH-ANALYTICS-CONTRACT-002.md) |
| Estado | **CERRADA · APTO CON AJUSTES** |
| Alcance | Read model, `GET /api/growth/analytics`, permiso, índices, `/admin/analitica` funcional mínima, nav, pruebas |
| Fuera de alcance | Diseño visual final · warehouse · Event Bus · motores Growth Core / Ventas / Mensajes / Campañas / Automatizaciones / Actividad / Shell / Inicio · deploy / push |

**Restricciones cumplidas:** sin segundo motor analítico; sin materialización; sin `growth.analytics.manage`; multi-tenant en toda lectura; sin modificar `deriveCampaignMetrics`; sin diseño final.

---

## Gate final

**APTO CON AJUSTES**

Analítica V1 queda operativa como capa READ-ONLY sobre SSOT Growth existentes, con contrato de respuesta estable, permiso, índices y superficie funcional mínima. El diseño visual final sigue pendiente (OT AGENTE 1). Typecheck/build fallan por **baseline preexistente** ajeno a esta OT (documentado abajo). Analítica V1 **no** se declara cerrada de producto.

---

## 1. Qué encontró antes de implementar

| Hallazgo | Evidencia |
| --- | --- |
| Sin `/admin/analitica` ni API analytics Growth | Auditoría + repo |
| Nav «Analítica» con `href: null` | `nav-domains.ts`, `master-nav.ts` |
| Sin permiso `growth.analytics.view` | `registry.ts` / `catalog.ts` |
| Sin índices `createdAt` / `openedAt` / `closedAt` / `origin.campaign` | `src/core/growth/indexes.ts` |
| Patrones reutilizables: `*-read.ts`, `requirePermission`, labels, `deriveCampaignMetrics` (no tocar) | Campañas / Actividad / Ventas |

---

## 2. Archivos creados / modificados

### Creado

| Archivo | Rol |
| --- | --- |
| `src/lib/growth/analytics-period.ts` | Resolución de presets / custom UTC `[start,end)` |
| `src/lib/growth/analytics-aggregate.ts` | Agregación pura + contrato `AnalyticsV1Response` |
| `src/lib/growth/analytics-read.ts` | Adaptador Mongo tenant-scoped |
| `src/app/api/growth/analytics/route.ts` | `GET` JSON |
| `src/app/admin/analitica/page.tsx` | Superficie mínima (SSR + permiso) |
| `src/components/admin/growth/AnaliticaClient.tsx` | Selector de período + secciones funcionales |
| `src/core/migrations/022-growth-analytics.ts` | Migración índices Analítica |
| `tests/baseline/growth-analytics-003.test.ts` | Casos A–AB |
| `docs/AI/auditorias/OT-GROWTH-ANALYTICS-IMPLEMENT-003.md` | Esta acta |

### Modificado

| Archivo | Cambio |
| --- | --- |
| `src/core/growth/indexes.ts` | Índices Analítica V1 (personas + oportunidades) |
| `src/core/migrations/registry.ts` | Registro `022-growth-analytics` |
| `src/core/identity/permissions/registry.ts` | `growth.analytics.view` |
| `src/core/identity/permissions/catalog.ts` | Catálogo + `impliesLegacy` |
| `src/core/identity/permissions/role-templates.ts` | INSTITUTION_ADMIN / SUPPORT / ADMISSIONS |
| `src/core/identity/roles/defaults.ts` | Mismos roles + SUPER_ADMIN |
| `src/lib/admin/nav-domains.ts` | `href: /admin/analitica` + permiso |
| `src/components/admin/preview/growth-os-master/master-nav.ts` | Href preview |
| `src/lib/growth/labels.ts` | Copy mínimo Analítica |
| `src/lib/growth/index.ts` | Reexports read model |

### No tocado (motores congelados)

`deriveCampaignMetrics` · Ventas write paths · Mensajes write · Automatizaciones runtime · Actividad schema · Growth Core ingest · Shell layout · Inicio · Platform Admin · Meta/WhatsApp · DNS/infra.

---

## 3. Read model implementado

Arquitectura:

```text
/admin/analitica
      ↓
GET /api/growth/analytics
      ↓
analytics-read.ts  (Mongo tenant-scoped)
      ↓
analytics-aggregate.ts  (puro)
      ↓
SSOT: growth_personas | growth_oportunidades | growth_conversaciones
      | growth_mensajes | growth_campaigns
```

Ubicación: `src/lib/growth/analytics-{period,aggregate,read}.ts` (mismo patrón que Actividad/Campañas).

---

## 4. Contrato del endpoint

| Campo | Valor |
| --- | --- |
| Método | `GET /api/growth/analytics` |
| Auth | Espacio activo (`requirePermission`) |
| Permiso | `growth.analytics.view` |
| Query | `preset` (`last_7d` \| `last_30d` \| `this_month` \| `previous_month` \| `custom`) + `from`/`to` si custom |
| Default | `last_30d` |
| Respuesta OK | `{ ok: true, period, summary, acquisition, sales, campaigns, messages }` |
| Error validación | `400` + mensaje (sin truncar rangos) |
| Error permiso | `403` |
| Escritura | **Ninguna** (solo GET) |

No acepta `tenantId` del navegador para cambiar de Espacio.

---

## 5. Semántica de métricas (congelada)

| KPI | Semántica |
| --- | --- |
| Personas nuevas | `createdAt` ∈ período; excluye `merged`/`archived` |
| Oportunidades generadas | `openedAt` ∈ período; excluye `archived` |
| En seguimiento (Resumen) | Snapshot `status === active` (**sin** período) |
| Ganadas / Perdidas (Resumen) | `closedAt` ∈ período + status `won`/`lost` |
| Conversión | `won` actual / cohorte `openedAt`; `handed_off` en denom, no en numerador; denom 0 → `rate: null` |
| Cierres | Familia A por `closedAt` (ganadas/perdidas/traspasadas) |
| Captación | Primer origen de Persona; labels humanos |
| Campañas | Periodizado por `openedAt`; no toca `deriveCampaignMetrics` |
| Mensajes | Conversaciones `createdAt`; msgs `occurredAt`; sin respuesta = snapshot último inbound |
| Pérdidas | `lost` + `closedAt`; byType / byOrigin / byCampaign |

Timezone V1: **UTC**. Intervalo: **`[start, end)`**.

---

## 6. Permiso

| Código | Copy | Roles |
| --- | --- | --- |
| `growth.analytics.view` | Ver Analítica del Espacio | SUPER_ADMIN, INSTITUTION_ADMIN, SUPPORT, ADMISSIONS |

**No** se creó `growth.analytics.manage`.

Sync: vía plantillas / `PORTAL_TENANT_ROLES` existentes (`sync:tenant-roles` cuando se ejecute en el entorno).

---

## 7. Índices

### Ya existían (no duplicados)

| Colección | Índice |
| --- | --- |
| `growth_personas` | `tenantId+emailNormalized`, `tenantId+phoneNormalized`, `tenantId+updatedAt` |
| `growth_oportunidades` | `tenantId+personaId+status`, `tenantId+personaId+typeKey+subject` |
| `growth_mensajes` | `tenantId+conversationId+occurredAt`, `tenantId+occurredAt` |
| `growth_conversaciones` | `tenantId+updatedAt`, persona/canal |

### Agregados en esta OT

| Colección | Índice | Nombre |
| --- | --- | --- |
| `growth_personas` | `{ tenantId: 1, createdAt: -1 }` | `tenantId_createdAt` |
| `growth_oportunidades` | `{ tenantId: 1, openedAt: -1 }` | `tenantId_openedAt` |
| `growth_oportunidades` | `{ tenantId: 1, status: 1, openedAt: -1 }` | `tenantId_status_openedAt` |
| `growth_oportunidades` | `{ tenantId: 1, closedAt: -1 }` sparse | `tenantId_closedAt` |
| `growth_oportunidades` | `{ tenantId: 1, "origin.campaign": 1, openedAt: -1 }` sparse | `tenantId_originCampaign_openedAt` |

Migración: `022-growth-analytics` (idempotente).

---

## 8. Navegación mínima

| Pieza | Cambio |
| --- | --- |
| Shell nav | `nav-analitica` → `/admin/analitica` + `growth.analytics.view` |
| Preview master-nav | `href: /admin/analitica` |
| Página | Superficie funcional (selector + secciones Resumen/Captación/Ventas/Campañas/Mensajes) |

Sin rediseño de sidebar ni movimiento de otros ítems.

---

## 9. Pruebas ejecutadas

```text
npx tsx --test tests/baseline/growth-analytics-003.test.ts
→ 25 pass / 0 fail (A–AB)

Regresiones:
npx tsx --test tests/baseline/growth-campaigns-003.test.ts
               tests/baseline/growth-os-admin-shell-002.test.ts
               tests/baseline/growth-activity-001.test.ts
→ 39 pass / 0 fail
```

---

## 10. Typecheck

```text
npx tsc --noEmit
```

| Resultado | Detalle |
| --- | --- |
| Fallos | **Baseline preexistente** (no introducidos por esta OT) |
| Evidencia | `src/lib/growth/actividad-view.ts` — `ActivityFeedSourceProps` / `MessageFeedSourceProps` |
| | `tests/baseline/growth-campaigns-003.test.ts` — `createdAt` en fixture |
| | `tests/baseline/platform-host-isolation.test.ts` — `ObjectId` |
| Analítica | **0 errores** en archivos de esta OT |

---

## 11. Build

```text
npm run build  → falla en check:branding (baseline: platform/page, ChannelsSettings, Mensajes, HomeMaster)
npx next build → Compiled successfully; falla TypeScript en actividad-view.ts (mismo baseline)
```

Ningún fallo de branding/compilación atribuible a `/admin/analitica` ni al read model.

---

## 12. Regresiones

| Área | Resultado |
| --- | --- |
| Campañas V1 (`deriveCampaignMetrics`, CRUD, bridge) | OK |
| Actividad V1 | OK |
| Shell nav | OK |
| Growth Core / Ventas / Mensajes write | No modificados |

---

## 13. Evidencia multi-tenant

Prueba **Z**: fixtures tenant A + B en el mismo input; agregación con `tenantId: "A"` solo cuenta A (personas, cierres, campañas, mensajes, sin respuesta). Joins de campaña / conversación siempre filtran por el mismo `tenantId`.

---

## 14. Riesgos / pendientes reales

| Ítem | Nota |
| --- | --- |
| Diseño visual final | Pendiente OT AGENTE 1 |
| Sync de roles en entornos ya desplegados | Ejecutar `sync:tenant-roles` / migración de permisos según mecanismo existente |
| Migración índices `022` | Ejecutar `migrate` en cada entorno |
| Lectura de oportunidades | Hoy carga opps del tenant y filtra en agregador (correcto; índices listos para afinar queries) |
| Typecheck/build baseline | Ajenos; no bloquean la semántica Analítica |

---

## 15. Confirmación motores congelados

| Motor | ¿Modificado funcionalmente? |
| --- | --- |
| Growth Core ingest / upsert | **No** |
| Ventas / transitions | **No** |
| Mensajes / WhatsApp | **No** |
| Campañas `deriveCampaignMetrics` | **No** |
| Automatizaciones | **No** |
| Actividad feed | **No** |
| Shell layout / Inicio | **No** (solo href Analítica) |

---

## Referencias

- Contrato: [OT-GROWTH-ANALYTICS-CONTRACT-002](./OT-GROWTH-ANALYTICS-CONTRACT-002.md)
- Auditoría: [OT-GROWTH-ANALYTICS-AUDIT-001](./OT-GROWTH-ANALYTICS-AUDIT-001.md)

---

## Cierre

| Pregunta | Respuesta |
| --- | --- |
| ¿Read model + API listos? | **Sí** |
| ¿Diseño final? | **No** (OT separada) |
| ¿Analítica V1 producto cerrada? | **No todavía** |
| ¿Abrir OT diseño automáticamente? | **No** |
| ¿Gate? | **APTO CON AJUSTES** |
