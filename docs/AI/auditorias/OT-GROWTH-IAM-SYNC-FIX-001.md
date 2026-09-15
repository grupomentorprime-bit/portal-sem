# OT-GROWTH-IAM-SYNC-FIX-001 — Sincronización evolutiva de permisos por Espacio

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-IAM-SYNC-FIX-001 |
| Tipo | Fix / operatividad |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-15 |
| Entrada | [OT-GROWTH-NAV-AUDIT-001](./OT-GROWTH-NAV-AUDIT-001.md) (H1–H2 · sync `permissionMap` stale) |
| Estado | **CERRADA · APTO** |
| Alcance | `ensureTenantRoles` · `sync:tenant-roles` · función única de evolución · sync local SEM/ADL · prueba de regresión evolutiva |
| Fuera de alcance | Producción · hardcodes SEM/ADL · bypass IAM en sidebar · cambios a `nav-domains.ts` · menú por tenant · otra OT |

**Restricciones cumplidas:** una sola lógica de sync; no reset de personalizaciones; distinción de rol plataforma por `system === true` (no por nombre); sin hardcode de Espacio; sin tocar seguridad fuera de la sincronización.

---

## Gate final

# APTO

Los roles `system` administrados por plataforma evolucionan con el catálogo: claves nuevas se incorporan desde la plantilla vigente; claves ya persistidas se preservan. SEM y ADL locales quedan alineados (Super Admin con Growth completo; roles limitados siguen limitados). Sync repetido idempotente.

---

## 1. Causa y corrección

El sidebar es universal. El menú distinto entre Espacios venía de `permissionMap` viejo: el resolver prioriza el map, así que actualizar solo `permissionIds` no bastaba.

| Antes | Después |
| --- | --- |
| `ensureTenantRoles` / sync solo sembraban map si **faltaba** | Evolucionan claves **ausentes** desde la plantilla |
| Lógicas duplicadas y divergentes | Una función: `syncSystemRolePermissionState` |
| Riesgo de “sync OK” sin Growth | SEM Super Admin: 9/9 `growth.*` true post-sync |

### Regla evolutiva (no reset)

1. Map vacío/ausente → plantilla completa.
2. Clave **ausente** en el map persistido → valor de la plantilla vigente (evolución de plataforma).
3. Clave **presente** → se conserva (personalización del cliente).
4. `permissionIds` se recalculan siempre desde el map evolucionado (coherencia).

### Gate de rol plataforma (no inferir por nombre)

| Criterio | Decisión |
| --- | --- |
| Discriminador seguro | Campo persistido `IdentityRole.system === true` vía `isPlatformManagedSystemRole` |
| Nombre / código | **No** bastan: un rol custom puede llamarse igual |
| `system` ausente / `false` | **No** se evolucionan permisos (seguro; no se inventa distinción) |
| ¿Hay bloqueo de modelo? | **No** — el modelo ya expone `system: boolean` |

El login sigue llamando `ensureTenantRoles`, pero **no** reescribe permisos ya personalizados ni toca roles no-system.

---

## 2. Cambios realizados

| Pieza | Cambio |
| --- | --- |
| `src/core/identity/permissions/sync-system-role.ts` | **Nuevo** — `isPlatformManagedSystemRole` + `evolveSystemRolePermissionMap` + `syncSystemRolePermissionState` |
| `src/lib/identity/roles.ts` | `ensureTenantRoles` usa la función única; gate `system === true` antes de actualizar |
| `scripts/sync-tenant-roles.ts` | Misma función + mismo gate; deja de sembrar map solo si vacío |
| `src/core/identity/permissions/resolver.ts` | Limpieza: import muerto `getRoleCode` |
| `src/core/identity/index.ts` | Reexport del módulo de sync |
| `tests/baseline/iam-sync-system-role.test.ts` | **Nuevo** — evolución / personalización / idempotencia / roles limitados / gate system / unicidad de lógica / provision |

`provisionTenantFoundation` **no** se alteró: sigue creando roles nuevos con `getDefaultRolePermissionTemplate` (tenant nuevo nace actualizado).

---

## 3. Operación local (no producción) — 2026-09-15

```text
npx tsx --env-file=.env scripts/sync-tenant-roles.ts seminario-ipn
npx tsx --env-file=.env scripts/sync-tenant-roles.ts adl
```

| Tenant | Corrida (post-fix) | 2.ª corrida |
| --- | --- | --- |
| `seminario-ipn` | **0** creados · **0** actualizados · **0** maps evolucionados (ya alineado) | **0** cambios |
| `adl` | **0** creados · **0** actualizados · **0** maps evolucionados (ya alineado) | **0** cambios |

Nota: la primera evolución efectiva de SEM/ADL ocurrió en la pasada previa de esta OT (roles `system` con claves `growth.*` ausentes). En esta verificación los datos ya estaban al día; el sync confirma **idempotencia**.

---

## 4. Validación A–K

| ID | Criterio | Resultado |
| --- | --- | --- |
| A | SEM Super Admin → Growth completo | **PASS** — 9/9 `growth.*` en map + resolver |
| B | ADL Super Admin → Growth completo | **PASS** — 9/9 |
| C | Mismos permisos → mismo menú | **PASS** — `superAdminGrowthEqual=true` SEM/ADL |
| D | Institution Admin / Support / Admissions según plantilla | **PASS** — 9/9 growth; `growthMatchTemplate=true` |
| E | Roles limitados siguen limitados | **PASS** — Guest/Reviewer/Student Affairs/Communications: 0 growth |
| F | `permissionMap` ↔ `permissionIds` coherentes | **PASS** — `idsCoherent=true` en roles system verificados |
| G | Sync repetido idempotente | **PASS** — corridas consecutivas 0 updates |
| H | Tenant A no modifica tenant B | **PASS** — sync por `tenantId`; sin hardcode SEM/ADL en código |
| I | Tenant nuevo nace actualizado | **PASS** — provision siembra plantilla (test estructural) |
| J | Rol antiguo + permiso nuevo → evoluciona | **PASS** — test baseline dedicado |
| K | Regresiones IAM + Shell + Equipo | **PASS** — 64/64 |

### Evidencia Mongo (resumen Growth true)

| Rol | SEM | ADL | Plantilla |
| --- | --- | --- | --- |
| Super Admin | 9 | 9 | 9 |
| Institution Admin | 9 | 9 | 9 |
| Support | 9 | 9 | 9 |
| Admissions | 9 | 9 | 9 |
| Guest / Reviewer / Student Affairs / Communications | 0 | 0 | 0 |

Claves Growth Super Admin (ambos Espacios):  
`growth.analytics.view`, `growth.automations.manage`, `growth.automations.view`, `growth.campaigns.manage`, `growth.campaigns.view`, `growth.people.manage`, `growth.people.view`, `growth.sales.operate`, `growth.sales.view`.

### Suites ejecutadas (K) — 2026-09-15

- `iam-sync-system-role` — **7/7**
- `ensure-write-on-get` — **6/6**
- `growth-os-admin-shell-002` / `002a` — **8/8**
- `growth-team-003` / `growth-ux-team-004` — **13/13**
- `growth-personas-003` — **15/15**
- `saas-singletons` / `saas-isolation` — **9/9**

**Total: 64 pass / 0 fail**

---

## 5. Qué no se hizo (a propósito)

- No hardcode SEM/ADL en producto
- No bypass IAM ni menú por tenant
- No cambios a `nav-domains.ts`
- No sync en producción
- No conceder permisos a roles sin `system === true`
- No se abrió otra OT

---

## 6. Archivos

| Archivo | Rol |
| --- | --- |
| `src/core/identity/permissions/sync-system-role.ts` | Motor único de evolución + gate `system` |
| `src/lib/identity/roles.ts` | Login / bootstrap |
| `scripts/sync-tenant-roles.ts` | Sync operativo manual |
| `tests/baseline/iam-sync-system-role.test.ts` | Antirregresión evolutiva |
| `docs/AI/auditorias/OT-GROWTH-IAM-SYNC-FIX-001.md` | Esta acta |

---

## 7. Resultado

| Pregunta | Respuesta |
| --- | --- |
| ¿SEM ve menú Growth como ADL? | **Sí** (Super Admin / Institution Admin / Support / Admissions según plantilla) |
| ¿El login resetea permisos custom? | **No** — solo incorpora claves nuevas ausentes en roles `system` |
| ¿Se infiere rol plataforma solo por nombre? | **No** — `isPlatformManagedSystemRole` exige `system === true` |
| ¿Queda cubierta la próxima capacidad Growth? | **Sí** — test J + sync evolutivo en ensure + script |

**Resultado: APTO**
