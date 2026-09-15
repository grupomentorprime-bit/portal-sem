# OT-GROWTH-NAV-AUDIT-001 — Menú admin distinto entre Espacios (SEM vs ADL)

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-NAV-AUDIT-001 |
| Tipo | Auditoría (sin implementación) |
| Fecha | 2026-09-14 |
| Síntoma | Espacio **ADL** muestra menú Growth completo; Espacio **SEM** (`seminario-ipn`) solo Inicio + herramientas (Sitio web, Institución, Equipo, Ajustes) |
| Estado | **CERRADA · CAUSA RAÍZ CONFIRMADA EN MONGO** |
| Alcance | Sidebar V2 · IAM · provision de Espacios · sync de roles |
| Fuera de alcance | Fix de producto · rediseño de menú · `sync:tenant-roles` en producción |

**Restricciones:** diagnóstico + evidencia; sin hardcodes por tenant; sin cambiar código de producto en esta OT.

---

## Gate final

# CAUSA RAÍZ: IAM desfasado por Espacio — el menú es universal

El sidebar **no** se construye por `tenantId`. Es el mismo árbol para todos (`nav-domains.ts`). Lo que cambia es el **filtro por permisos** del rol del usuario en ese Espacio.

En Mongo local (2026-09-14):

| Espacio | `tenantId` | Rol del usuario (Marco) | ¿`growth.*` en Super Admin? | Menú Growth |
| --- | --- | --- | --- | --- |
| SEM | `seminario-ipn` | Super Admin | **No** (map e ids vacíos de growth) | Oculto |
| ADL | `adl` | Super Admin | **Sí** (map + ids completos) | Visible |

---

## 1. Resumen ejecutivo

Lo que se está construyendo **sí es para todo tipo de tenant**. No hay `if (tenant === "adl")` en el sidebar.

La diferencia visible (círculo rojo en SEM: hueco entre Inicio y Sitio web) es exactamente la zona **Core + Crecer** filtrada a cero porque faltan permisos `growth.*` en los roles persistidos de `seminario-ipn`.

**Nuevos Espacios** sembrados hoy con `provisionTenantFoundation` reciben plantillas actuales (con Growth) **solo al crear roles nuevos**. Roles que ya existen **no se actualizan** en el provision; el refresh depende de `ensureTenantRoles` / `sync:tenant-roles`, y ambos **no refrescan `permissionMap` si ya existe** → el resolver privilegia el map viejo → menú Growth sigue oculto.

---

## 2. Cómo se genera el menú (flujo)

```text
AdminSidebar
  → filterAdminNavGroups(permissions, compatMode, roleCodes)
    → getAllNavTreeItems()          // árbol único, todos los Espacios
    → filterNavItem(...)            // IAM: requiredAnyPermission
    → buildAdminNavGroups(...)
    → NAV_SIDEBAR_ZONES             // Core · Crecer · tools
```

| Zona | Ítems | Permiso mínimo (any-of) |
| --- | --- | --- |
| Core | Personas | `growth.people.view` / `manage` |
| Core | Ventas / Mensajes / Actividad | `growth.sales.read` / `operate` |
| Crecer | Campañas | `growth.campaigns.view` / `manage` |
| Crecer | Automatizaciones | `growth.automations.view` / `manage` |
| Crecer | Analítica | `growth.analytics.view` |
| Tools | Sitio web, Institución, Equipo, Ajustes | CMS / settings / team (sin growth) |

Fuentes:

- `src/lib/admin/nav-domains.ts` — definición universal
- `src/lib/admin/nav-access.ts` — filtro IAM (+ shell Asuntos Estudiantiles)
- `src/components/admin/kit/navigation/AdminSidebar.tsx` — render

**No hay feature-flag por tenant ni menú por cliente.**

---

## 3. Evidencia Mongo (local)

### 3.1 Tenants

| `_id` / `tenantId` | Nombre UI corto |
| --- | --- |
| `seminario-ipn` | SEM |
| `adl` | ADL |

### 3.2 Mismo usuario, distinto resultado

| Tenant | Email | Rol membership | Growth en rol |
| --- | --- | --- | --- |
| `seminario-ipn` | soporte@mentorprime.cl | Super Admin (`role-seminario-ipn-tenant-owner`) | **0** keys `growth.*` true en map; **0** en `permissionIds` |
| `adl` | soporte@mentorprime.cl | Super Admin (`role-adl-super-admin`) | **9** keys growth en map + ids |

### 3.3 Drift adicional en ADL

En `adl`, **solo** Super Admin tiene Growth. Institution Admin / Support / Admissions tienen `permissionMap` sin `growth.*` true — plantillas de código ya los incluyen, pero el map en BD quedó congelado al seed original.

Impacto: un Institution Admin en ADL vería el **mismo menú incompleto** que SEM hoy.

---

## 4. Cadena de causa raíz

### 4.1 Resolución de permisos privilegia `permissionMap`

`resolveRolePermissionMap` (`src/core/identity/permissions/resolver.ts`):

1. Si el rol tiene `permissionMap` no vacío → **solo** ese map (normalizado; claves nuevas del catálogo quedan `false` si no estaban).
2. Si no → deriva de `permissionIds`.

Por eso actualizar solo `permissionIds` **no basta**.

### 4.2 Provision de Espacio nuevo: seed una sola vez

`provisionTenantFoundation` (`src/core/tenant/provision.ts`):

- Si el rol **no existe** → inserta con `PORTAL_TENANT_ROLES` + `getDefaultRolePermissionTemplate` (incluye Growth hoy).
- Si el rol **ya existe** → `rolesSkipped` (**no merge** de permisos nuevos).

`create-platform-space.ts` usa ese provision: Espacios **nuevos** salen bien **al nacer**. Espacios **viejos** no heredan Growth solos.

### 4.3 Sync incompleto (bug operativo)

| Mecanismo | Cuándo | ¿Refresca `permissionMap` existente? |
| --- | --- | --- |
| `ensureTenantRoles` | Login, invites, mutaciones de miembros | **No** — solo si el map **falta** |
| `scripts/sync-tenant-roles.ts` | Manual `npm run sync:tenant-roles -- <tenantId>` | **No** — solo si el map **falta o está vacío** |

Ambos pueden actualizar `permissionIds` cuando difieren de la plantilla, pero el resolver **ignora** esos ids si el map stale sigue presente → menú Growth sigue oculto.

### 4.4 Lecturas de API no sincronizan (by design SAAS-004)

GET roles/team ya no llaman `ensureTenantRoles`. Sync solo en login/bootstrap/migración. Cambiar de Espacio en sesión **no** repara roles viejos.

---

## 5. Qué pasa con tenants nuevos

| Caso | ¿Menú Growth completo para Super Admin / Institution Admin / Support / Admissions? |
| --- | --- |
| Espacio creado **después** de que Growth entró a plantillas | **Sí** al seed inicial |
| Espacio creado **antes** | **No**, hasta sync que refresque **también** `permissionMap` |
| Tras cada OT que agregue permisos nuevos al catálogo | Roles ya sembrados pueden quedar atrás otra vez (mismo patrón) |

Conclusión de producto: el menú **es** universal; la **garantía multi-tenant** se rompe en la **persistencia de roles**, no en la UI.

---

## 6. Hallazgos

| ID | Severidad | Hallazgo |
| --- | --- | --- |
| H1 | **P0** | SEM Super Admin sin ningún `growth.*` → oculta Personas/Ventas/Mensajes/Actividad/Campañas/Automatizaciones/Analítica |
| H2 | **P0** | `ensureTenantRoles` / `sync-tenant-roles` no refrescan `permissionMap` stale → sync “exitoso” puede no arreglar el menú |
| H3 | **P1** | En ADL, roles no–Super Admin también sin Growth en map → inconsistencia intra-tenant |
| H4 | **P2** | Provision idempotente salta roles existentes → no es vehículo de evolución de permisos |
| H5 | Info | Sin filtro por `tenantId` en sidebar; no es bug de “producto por cliente” |

---

## 7. Recomendaciones (siguiente OT — no hechas aquí)

1. **Operación inmediata (dev/local):** arreglar sync para que roles `system` reescriban `permissionMap` desde `getDefaultRolePermissionTemplate` (y `permissionIds` derivados), luego `npm run sync:tenant-roles -- seminario-ipn` y `-- adl`.
2. **Producto:** al login (`ensureTenantRoles`), same merge de map para roles system — o migración versionada de permisos Growth en todos los Espacios.
3. **Regla de plataforma:** toda OT que agregue permisos al catálogo debe incluir paso explícito de sync de `permissionMap` (no solo docs).
4. **Verificación:** tras sync, mismo usuario Super Admin en SEM y ADL debe ver zonas Core + Crecer idénticas (salvo shell Asuntos Estudiantiles u overrides).

**No** abrir menús hardcodeados por tenant. **No** bypass IAM en el sidebar.

---

## 8. Veredicto

| Pregunta | Respuesta |
| --- | --- |
| ¿El producto está pensado solo para ADL? | **No** — menú único |
| ¿Por qué SEM no muestra lo mismo? | Roles de `seminario-ipn` sin permisos Growth en BD |
| ¿Los nuevos tenants quedan bien? | Sí al crear; **no** garantizado en tenants ya existentes ni tras nuevas keys del catálogo |
| ¿Bloquea Growth multi-tenant? | **Sí**, hasta reparar sync de `permissionMap` |

**Siguiente paso sugerido:** OT de fix IAM (`ensureTenantRoles` + script sync) + sync local SEM/ADL; sin tocar el árbol de navegación.
