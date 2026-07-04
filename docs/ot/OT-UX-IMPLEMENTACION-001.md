# OT-UX-IMPLEMENTACION-001 — Shell Administrativo V2 y Experience Kit (AprendeHoy)

| Atributo | Valor |
| --- | --- |
| Código | OT-UX-IMPLEMENTACION-001 |
| Estado | **Fase 2 implementada — pendiente QA** |
| Prioridad | Crítica |
| Tipo | UX / UI / Frontend / Design System |
| Dependencias | [OT-UX-AUDITORIA-001](../audits/OT-UX-AUDITORIA-001.md) · [OT-UX-BLUEPRINT-001](../audits/OT-UX-BLUEPRINT-001.md) · [OT-UX-PROTOTIPO-001](../audits/OT-UX-PROTOTIPO-001.md) |
| Feature flag | `ADMIN_SHELL_V2` |
| Fecha autorización | 2026-07-03 |
| Alcance | Rediseño BackOffice · adopción AEK · **cero cambios de negocio** |

---

## Objetivo

Implementar el **Shell Administrativo oficial de AprendeHoy**: multi-tenant, consistente y escalable, reemplazando gradualmente el chrome legacy del BackOffice sin alterar lógica de negocio, APIs, permisos ni datos.

El SEM (`seminario-ipn`) es el **primer tenant** en validar el shell; el código debe servir a cualquier tenant de la plataforma.

---

## Principios de implementación (acta de aprobación)

| # | Principio | Implicación técnica |
| ---: | --- | --- |
| 1 | **Plataforma, no solo SEM** | Sin strings ni assets hardcodeados del SEM en el shell; branding desde tenant |
| 2 | **Sidebar por dominios** | Nav declarativa por dominio funcional AprendeHoy (Blueprint §4.7) |
| 3 | **Layout Maestro único** | Toda pantalla admin usa el mismo esqueleto; excepciones solo documentadas |
| 4 | **AEK como única fuente UI** | Ningún módulo crea componentes paralelos tras Fase 2 |
| 5 | **Migración gradual** | `ADMIN_SHELL_V2` + fases secuenciales; V1 operativo hasta retiro final |

---

## Restricciones (prohibido durante toda la OT)

- Modificar lógica de negocio
- Modificar APIs
- Modificar permisos o roles
- Modificar modelos de datos o Base de Datos
- Alterar procesos funcionales existentes

**Permitido:** composición visual, layout, componentes presentacionales, CSS/tokens admin, feature flag, redirects visuales internos.

---

## Feature flag `ADMIN_SHELL_V2`

| Aspecto | Especificación |
| --- | --- |
| Activación | Env `ADMIN_SHELL_V2=true` o flag en runtime config |
| Comportamiento OFF | `AdminShell` + `AdminInstitutionalHeader` actuales (sin cambio) |
| Comportamiento ON | `AdminShellV2` + sidebar + topbar AEK |
| Rollback | Desactivar flag — retorno inmediato a V1 |
| Retiro V1 | Solo tras Fase 4 y QA sign-off |

```text
src/app/admin/layout.tsx
  └─ if (ADMIN_SHELL_V2) → AdminShellV2
     else                 → AdminShell (legacy)
```

---

## Arquitectura de código objetivo

```text
src/components/admin/
├── shell-v2/                    # Fase 1
│   ├── AdminShellV2.tsx
│   ├── AdminLayoutMaster.tsx    # Layout Maestro composable
│   └── useAdminShell.ts
├── kit/                         # Fase 2 — Experience Kit Administrativo (AEK)
│   ├── navigation/
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminTopBar.tsx
│   │   ├── AdminBreadcrumb.tsx
│   │   └── ModuleHeader.tsx
│   ├── data/
│   │   ├── DataTable.tsx
│   │   ├── FilterBar.tsx
│   │   ├── SearchBar.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingState.tsx
│   ├── dashboard/
│   │   ├── KpiCard.tsx
│   │   └── QuickActions.tsx
│   ├── feedback/
│   │   ├── AdminBadge.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── AdminToast.tsx
│   ├── layout/
│   │   ├── RightPanel.tsx
│   │   └── AdminCard.tsx
│   └── index.ts                 # API pública única del AEK
└── [módulos existentes]         # Fase 3 — migran a importar desde kit/
```

**Dependencia:** AEK compone primitivos de `src/components/ui/*`; no los reemplaza.

---

## Multi-tenant y branding

| Elemento chrome | Fuente |
| --- | --- |
| Logo / isotipo | Branding CMS del tenant (`cms_branding` / media) |
| Nombre institución | Config tenant / branding |
| Colores | `--brand-*` inyectados en layout → tokens `--color-*` |
| Wordmark TopBar | Nombre configurable; default «Centro [institución]» |
| Estado sistema | Health checks existentes; sin lógica nueva |

**Prohibido en shell-v2:** `logo-sem-*` hardcodeado, «Seminario Eclesiástico Mayor» fijo, colores hex fuera de tokens.

---

## Layout Maestro (obligatorio)

Orden vertical en **toda** pantalla admin con flag V2:

```text
① AdminTopBar          — fijo 56px
② AdminSidebar         — fijo 248px / 72px colapsado
③ AdminBreadcrumb
④ ModuleHeader         — H1 único + descripción + acciones
⑤ ModuleDashboard      — opcional (KPIs, QuickActions)
⑥ FilterBar / SearchBar — opcional
⑦ MainContent          — obligatorio
⑧ RightPanel           — opcional (drawer en <1024px)
```

### Excepciones técnicas justificadas (únicas permitidas)

| Pantalla | Excepción | Justificación |
| --- | --- | --- |
| `/admin/login` | Sin chrome | Flujo auth aislado |
| `/admin/pages/[id]` | Sin sidebar; toolbar builder | Canvas 3 columnas — `VISUAL-EXPERIENCE-BUILDER.md` |
| `/admin/experience-studio` | MainContent full-bleed | Editor visual |
| Cualquier otra | **Requiere addendum en Blueprint** | — |

---

## Sidebar — dominios funcionales

Configuración declarativa (objetivo Fase 1):

```typescript
// src/lib/admin/nav-domains.ts (nuevo)
type NavDomain =
  | "workspace" | "institution" | "portal" | "academic"
  | "admissions" | "students" | "communications" | "directory"
  | "media" | "platform" | "support";

interface AdminNavItemV2 {
  id: string;
  domain: NavDomain;
  label: string;
  href: string;
  icon: LucideIcon;
  requiredAnyPermission?: string[];
  children?: AdminNavItemV2[];
  phase?: "current" | "erp";  // ocultar ERP si no habilitado
}
```

**Fase 1:** mapear `ADMIN_PRIMARY_NAV` actual a estructura por dominios sin cambiar permisos ni rutas.

**Filtrado:** reutilizar `filterAdminNav` / `nav-access.ts` — sin modificar reglas IAM.

---

## Experience Kit Administrativo (AEK) — catálogo obligatorio Fase 2

Ningún módulo en Fase 3 puede mergearse sin usar estos componentes cuando aplique:

| Componente | Responsabilidad |
| --- | --- |
| `AdminSidebar` | Nav lateral dominios + estados colapsado/responsive |
| `AdminTopBar` | Logo tenant, estado, ⌘K placeholder, notificaciones, perfil |
| `ModuleHeader` | Breadcrumb implícito + H1 + acciones |
| `AdminBreadcrumb` | Migas independientes cuando profundidad ≥2 |
| `AdminCard` | Superficie estándar de contenido |
| `KpiCard` | Métrica numérica + delta opcional |
| `DataTable` | Tablas con sort, acciones fila, empty, skeleton |
| `FilterBar` | Filtros + reset |
| `SearchBar` | Búsqueda contextual con debounce |
| `AdminBadge` | Estados semánticos unificados |
| `ConfirmDialog` | Reemplazo de `window.confirm` (7 usos actuales) |
| `RightPanel` / `Drawer` | Panel lateral / overlay móvil |
| `EmptyState` | Cero resultados + CTA |
| `LoadingState` | Skeleton inicial |
| `QuickActions` | Grid accesos en hubs |

**Eliminar progresivamente:** `StatusPill` ×3, tablas `<table>` raw ×4, heroes CSS triplicados, `admin-ui.ts` clases ad-hoc en módulos migrados.

---

# Fases de implementación

Cada fase = **PR independiente**, QA manual, flag activable en staging. **No iniciar fase N+1 hasta cerrar fase N.**

---

## Fase 1 — Shell Administrativo (sin migrar módulos)

**Duración estimada:** 2–3 semanas

### Entregables

- [ ] `ADMIN_SHELL_V2` en env y layout admin
- [ ] `AdminShellV2` + `AdminLayoutMaster`
- [ ] `AdminSidebar` (estructura + dominios + permisos actuales)
- [ ] `AdminTopBar` (branding dinámico tenant)
- [ ] `AdminBreadcrumb` + `ModuleHeader` (mínimo viable)
- [ ] Responsive: desktop / notebook / tablet drawer / mobile
- [ ] Persistencia `localStorage` colapso sidebar
- [ ] **Children actuales** renderizados dentro del layout maestro sin refactor de módulos

### Criterios de aceptación Fase 1

- [ ] Flag OFF → sistema idéntico a producción actual
- [ ] Flag ON → sidebar + topbar visibles en todas las rutas admin (excepto excepciones)
- [ ] Branding correcto para `seminario-ipn` y verificable con tenant mock
- [ ] Sin regresión en login, permisos ni rutas
- [ ] Responsive validado en 4 breakpoints del prototipo

### Fuera de alcance Fase 1

- Migrar contenido de módulos a AEK
- DataTable, ConfirmDialog, etc.
- Eliminar `AdminInstitutionalHeader`

---

## Fase 2 — Experience Kit Administrativo completo

**Duración estimada:** 2–3 semanas

### Entregables

- [ ] Todos los componentes AEK listados arriba en `src/components/admin/kit/`
- [ ] Página showcase interna `/admin/design-system` o story interna actualizada
- [ ] `ConfirmDialog` integrado en al menos 1 flujo piloto (sin migrar todos)
- [ ] Documentación API del kit en comentarios JSDoc + README kit

### Criterios de aceptación Fase 2

- [ ] Export único desde `kit/index.ts`
- [ ] Cero dependencias circulares módulo → shell
- [ ] Componentes usan tokens `--color-*` / spacing oficial
- [ ] EmptyState y LoadingState en DataTable
- [ ] Drawer RightPanel funcional en viewport <1024px

### Fuera de alcance Fase 2

- Migración masiva de módulos
- Búsqueda ⌘K con índice real (mejora futura)

---

## Fase 3 — Migración progresiva de módulos

**Duración estimada:** 4–5 semanas

Un módulo por PR. Orden recomendado (menor → mayor riesgo):

| Orden | Módulo | Rutas principales | Riesgo |
| ---: | --- | --- | --- |
| 1 | Dashboard | `/admin` | Bajo |
| 2 | Medios | `/admin/media` | Bajo |
| 3 | Personas | `/admin/content/people` | Bajo |
| 4 | Institución | `/admin/config` | Medio |
| 5 | Comunicaciones | `/admin/content/*` | Medio |
| 6 | Programas | `/admin/content/programs` | Medio |
| 7 | Portal | `/admin/pages`, `/admin/menus` | Medio |
| 8 | Formularios | `/admin/portal/forms/*` | Alto |
| 9 | Admisión | `/admin/portal/admission` | Alto |
| 10 | Asuntos estudiantiles | `/admin/portal/asuntos-estudiantiles/*` | Alto |
| 11 | Administración | `/admin/settings/*`, workflows, events | Medio |

### Por cada módulo migrado

- [ ] Eliminar triple hero / headers duplicados
- [ ] Sustituir tablas raw por `DataTable`
- [ ] Sustituir `window.confirm` por `ConfirmDialog`
- [ ] Usar `ModuleHeader` + Layout Maestro
- [ ] QA manual del módulo con flag V2 ON
- [ ] Sin cambios en handlers, APIs ni permisos

### Criterios de aceptación Fase 3

- [ ] 100% rutas admin migradas visualmente (excepto excepciones documentadas)
- [ ] `AdminInstitutionalHeader` sin referencias en módulos migrados
- [ ] Paridad funcional verificada vs V1

---

## Fase 4 — Optimización y cierre

**Duración estimada:** 1–2 semanas

### Entregables

- [ ] Performance: lazy load sidebar, memoización nav filtrada
- [ ] Accesibilidad: WCAG 2.1 AA en shell (focus trap drawer, landmarks, aria)
- [ ] Auditoría consistencia visual (checklist Blueprint §13)
- [ ] Responsive QA en dispositivos reales
- [ ] Actualizar `docs/design/CMS-UX-GUIDELINES.md`
- [ ] Retirar shell V1 y flag (o flag default ON)
- [ ] Deprecar CSS huérfanos (`admin-programs-hub.css`, etc.)

### Criterios de aceptación Fase 4

- [ ] Lighthouse a11y ≥90 en dashboard admin
- [ ] Documentación alineada con código
- [ ] V1 eliminado o marcado deprecated con fecha

---

# Criterios de aceptación globales (OT completa)

- [ ] BackOffice AprendeHoy multi-tenant operativo con `ADMIN_SHELL_V2`
- [ ] AEK es la única fuente de componentes admin nuevos
- [ ] Layout Maestro en todas las pantallas (salvo excepciones)
- [ ] Cero cambios en APIs, permisos, roles, BD
- [ ] SEM en producción sin downtime durante migración
- [ ] Prototipo OT-UX-PROTOTIPO-001 reflejado en implementación ≥95% paridad visual

---

# Riesgos y mitigación

| ID | Riesgo | Mitigación |
| --- | --- | --- |
| R1 | Regresión formularios/convocatorias | Migrar al final Fase 3; QA dedicado |
| R2 | Branding roto en tenant sin CMS | Fallback tokens plataforma en `colorDefaults` |
| R3 | Sidebar incompatible con builder | Excepción fullscreen mantenida |
| R4 | Presión big-bang | Flag + fases estrictas; PO sign-off por fase |
| R5 | Componentes duplicados durante transición | Regla: PRs Fase 3 rechazados si no usan AEK |

---

# Referencias

| Documento | Uso |
| --- | --- |
| [OT-UX-AUDITORIA-001](../audits/OT-UX-AUDITORIA-001.md) | Baseline 33 rutas, deuda UX |
| [OT-UX-BLUEPRINT-001](../audits/OT-UX-BLUEPRINT-001.md) | Layout, AEK spec, dominios §4.7 |
| [OT-UX-PROTOTIPO-001](../audits/OT-UX-PROTOTIPO-001.md) | Referencia visual |
| [Prototipo HTML](../prototypes/ot-ux-prototipo-001/index.html) | Paridad mockups |
| `docs/design/CMS-UX-GUIDELINES.md` | Actualizar en Fase 4 |
| `src/lib/admin/institutional.ts` | Nav y permisos actuales |
| `src/lib/admin/nav-access.ts` | Filtrado IAM |

---

# Próximo paso inmediato

Iniciar **Fase 1** con PR:

1. Variable entorno `ADMIN_SHELL_V2`
2. `AdminShellV2` skeleton con branding tenant
3. Sidebar dominios mapeando nav actual
4. Layout maestro envolviendo `{children}` sin tocar páginas

---

*OT autorizada tras cierre de etapa Diseño (Auditoría + Blueprint + Prototipo) — 2026-07-03.*
