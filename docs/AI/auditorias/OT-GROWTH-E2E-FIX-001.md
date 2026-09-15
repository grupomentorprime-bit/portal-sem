# OT-GROWTH-E2E-FIX-001 — Implementación Captura → Qué hacer ahora

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-E2E-FIX-001 |
| Tipo | Implementación funcional (cierre H1) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-14 |
| Entrada | [OT-GROWTH-NEXT-ACTION-AUDIT-001](./OT-GROWTH-NEXT-ACTION-AUDIT-001.md) · [OT-GROWTH-E2E-AUDIT-001](./OT-GROWTH-E2E-AUDIT-001.md) H1 · opción B |
| Estado | **CERRADA · APTO** |
| Alcance | Seed Automatización de arranque por Espacio + higiene nextAction en estados finales + defensa de lectura |
| Fuera de alcance | Segundo motor · hardcodes por cliente · rediseño UI · WhatsApp→Oportunidad (H2) · tocar producción a mano · abrir otra OT |

**Restricciones cumplidas:** Automation Runtime existente; `GrowthOpportunityOpened` → `salesSetNextAction`; unicidad `tenantId + seedKey`; ensure no recrea/reactiva; sin if SEM/ADL.

---

## Gate final

# APTO

El viaje **Formulario / Admisión → Persona → Oportunidad → nextAction → Inicio / Personas / Ventas** queda cerrado con el playbook de plataforma sembrado por Espacio, sobre el Runtime y sales-ops existentes.

---

## 1. Qué cambió

### 1.1 Playbook de arranque

| Pieza | Detalle |
| --- | --- |
| Función | `ensureGrowthStartupNextActionAutomation(tenantId)` |
| `seedKey` | `growth.startup.next_action_on_opportunity` |
| Unicidad | Índice parcial unique `{ tenantId, seedKey }` |
| Estado inicial | `active` + versión `published` (vía `createGrowthAutomation` + `publishGrowthAutomation`) |
| Actor seed | `growth-platform` |
| Nombre humano | «Primera acción al crear oportunidad» |
| Trigger | `GrowthOpportunityOpened` |
| Condición | `nextAction` **absent** |
| Acción | `salesSetNextAction` · summary «Contactar a la persona» · `kind: contact` |

Si la Automatización **ya existe** (por `seedKey`): el ensure la **devuelve sin mutar** — respeta edición, renombre y desactivación.

### 1.2 Enganches (idempotentes)

| Momento | Dónde |
| --- | --- |
| Espacio nuevo | `createPlatformSpace` tras `provisionTenantFoundation` |
| Captura live | `live-ingest` antes de proyectar (Form / Admisión) |
| Acceso Automatizaciones | `automationsList` |
| Espacios existentes | Migración `024-growth-startup-next-action` (índice + backfill por tenant) |

No se tocó producción manualmente desde esta OT.

### 1.3 Ciclo de vida nextAction

| Cambio | Comportamiento |
| --- | --- |
| Transición a `won` / `lost` / `handed_off` / `archived` | `clearGrowthNextAction` si había próxima acción |
| `pickPrimaryNextAction` | **Ignora** oportunidades en estado final (defensa legacy) |

### 1.4 Modelo

- Campo opcional `seedKey` en `GrowthAutomation`.
- `findAutomationBySeedKey` en store (Mongo + memoria).
- `createGrowthAutomation` acepta `seedKey` y rechaza duplicados (`conflict`).

---

## 2. Qué se reutilizó

| Pieza | Uso |
| --- | --- |
| Automation Runtime | Ejecución del playbook al evento |
| `GrowthOpportunityOpened` | Trigger natural al crear Oportunidad |
| `salesSetNextAction` / `salesClearNextAction` | Única vía operativa |
| `createGrowthAutomation` + `publishGrowthAutomation` | Nacimiento versionado |
| Condición `nextAction` absent | Idempotencia blanda (no sobrescribe) |
| Inicio / Personas / Ventas | Misma SSOT `oportunidad.nextAction` |
| Event Bus in-process | Sin cola ni segundo runner |

**No** se creó motor nuevo. **No** se hardcodeó política en `openGrowthOpportunity`. **No** se rediseñó UI.

---

## 3. Archivos

### Creados

| Archivo | Rol |
| --- | --- |
| `src/core/growth/automations/startup-seed.ts` | ensure + backfill |
| `src/core/migrations/024-growth-startup-next-action.ts` | índice + backfill Espacios existentes |
| `tests/baseline/growth-e2e-fix-001.test.ts` | Seed + ciclo de vida (A–L) |
| `docs/AI/auditorias/OT-GROWTH-E2E-FIX-001.md` | Esta acta |

### Modificados

| Archivo | Cambio |
| --- | --- |
| `automations/types.ts` | `seedKey` + constantes de seed |
| `automations/store.ts` / `memory-store.ts` / `repository.ts` | `findAutomationBySeedKey` + anti-duplicado |
| `automations/service.ts` | `seedKey` en create |
| `automations/indexes.ts` | unique parcial `tenantId_seedKey` |
| `automations/index.ts` | Reexports |
| `transition-opportunity.ts` | Clear nextAction en finales |
| `persona-view.ts` | `pickPrimaryNextAction` ignora finales |
| `create-platform-space.ts` | Seed fail-soft al provisionar |
| `live-ingest.ts` | Ensure antes de proyectar |
| `automations.ts` (lib) | Ensure al listar |
| `migrations/registry.ts` | Registro 024 |

---

## 4. Pruebas

### Suite nueva

`tests/baseline/growth-e2e-fix-001.test.ts`

| Caso | Validación |
| --- | --- |
| A/B | Ensure crea una; segunda no duplica |
| Definición | Trigger / absent / salesSetNextAction contact |
| C/E/F/G | Opp → nextAction; Inicio/Personas misma SSOT |
| H | Desactivada → no setea |
| I | nextAction previa → no sobrescribe |
| J | won/lost → nextAction limpio |
| K | Tenant A ≠ B; ensure no reactiva A |
| L | Editada/renombrada/desactivada → ensure respeta |
| Defensa | Solo finales con nextAction → `pickPrimaryNextAction` null |

### Suites reejecutadas (PASS)

| Suite | Resultado |
| --- | --- |
| `growth-e2e-fix-001.test.ts` | PASS |
| `growth-automation-002.test.ts` | PASS |
| `growth-automation-003.test.ts` | PASS |
| `growth-sales-001.test.ts` | PASS |
| `growth-oportunidades.test.ts` | PASS |
| `growth-personas-ui.test.ts` | PASS |
| `platform-create-space.test.ts` | PASS |

---

## 5. Resultado

- H1 cerrado: captación fresca produce «Qué hacer ahora» real sin configuración previa del cliente.
- El playbook es visible/editable/desactivable en Automatizaciones.
- Un solo motor (Runtime + sales-ops).
- Espacios nuevos y existentes tienen camino idempotente de seed.
- Estados finales no dejan tareas obsoletas; la lectura ignora legacy.

---

## 6. Veredicto

# APTO

**No** se abre otra OT automáticamente desde este documento.
