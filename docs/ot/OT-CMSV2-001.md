# OT-CMSV2-001 — Centro de Administración Institucional

| Atributo | Valor |
| --- | --- |
| OT | OT-CMSV2-001 |
| Épica | EP-001 — Portal Institucional Premium |
| Versión | 1.0.0 |
| Prioridad | Alta |
| Estado | En progreso — Fase 1 completada; ver [OT-CMSV2-001A](./OT-CMSV2-001A.md) (Shell unificado) |
| Fecha inicio | 2026-07-01 |

## Objetivo

Transformar el panel administrativo del SEM desde un panel técnico a una **plataforma institucional premium**, comparable en claridad y consistencia con productos SaaS empresariales (Notion, Webflow CMS, HubSpot, Shopify Admin), y reutilizable como base del futuro CMS multiinstitución de AprendeHoy.

## Alcance

### Fase 1 — Implementada en código

| Ítem | Entregable |
| --- | --- |
| Header institucional | `AdminInstitutionalHeader` — Inicio, Portal, Institución, Comunicaciones, Personas, Medios, Administración |
| Menú de usuario corporativo | `AdminUserMenuPanel` — perfil, actividad, notificaciones, usuarios, ayuda, cerrar sesión |
| Avatar institucional | `AdminUserAvatar` — isotipo SEM con degradado (sin círculo amarillo) |
| Estado del sistema | `AdminStatusBadges` — Portal, CMS, Accesos |
| Búsqueda global (shell) | `AdminGlobalSearch` — paleta ⌘K con acceso rápido a secciones |
| Drawer responsive | `AdminNavDrawer` — menú lateral en móvil |
| Dashboard | `/admin` — bienvenida, estadísticas, actividad reciente |
| Usuarios CMS | `/admin/settings/users` — tarjetas, filtros, wizard de invitación |
| Perfil profesional | `/admin/settings/profile` — ficha con cargo, teléfono, zona horaria, idioma |
| Seguridad | `/admin/settings/security` — contraseña + placeholders 2FA/sesiones |
| Actividad | `/admin/settings/activity` — timeline legible |
| Lenguaje institucional | `src/lib/admin/institutional.ts` — mapeo de roles internos |
| Redirect legacy | `/admin/settings/team` → `/admin/settings/users` |

### Fase 2 — Pendiente

- Búsqueda global con indexación de contenido (noticias, programas, biblioteca)
- Notificaciones en tiempo real
- 2FA, sesiones abiertas, dispositivos, cerrar todas las sesiones
- Foto de perfil desde biblioteca de medios
- Permisos granulares visibles por módulo en invitación (paso 3 real)
- Unificación visual de Configuration Hub y Content Hub bajo el nuevo shell
- Eliminación completa de términos técnicos en APIs expuestas al cliente

## Arquitectura

- [ADR-004 — Identity Core](../architecture/ADR-004.md) — roles y permisos (capa interna, no visible)
- [IDENTITY.md](../core/IDENTITY.md) — persistencia de usuarios
- Capa de presentación: `src/lib/admin/institutional.ts` desacopla UI de nombres técnicos

### Mapeo de roles (interno → institucional)

| Interno (no visible) | Institucional |
| --- | --- |
| Tenant Owner | Director General |
| Institution Admin | Administrador |
| Editor | Editor / Comunicaciones |
| Reviewer | Revisor |
| Admissions | Admisiones |
| Guest | Solo lectura |

## UX

- Navegación orientada a tareas institucionales, no a módulos técnicos
- Tarjetas en lugar de tablas para usuarios
- Timeline en lugar de códigos de auditoría
- Wizard de 4 pasos para invitaciones
- Drawer en viewport &lt; lg

## Diseño

- [DESIGN-SYSTEM.md](../design/DESIGN-SYSTEM.md)
- [MANUAL-DE-MARCA.md](../design/MANUAL-DE-MARCA.md) — isotipo SEM en avatares
- [EDITORIAL-ART-DIRECTION.md](../design/EDITORIAL-ART-DIRECTION.md) — tono institucional premium

## APIs

| Método | Ruta | Uso |
| --- | --- | --- |
| GET/PATCH | `/api/identity/me` | Perfil profesional ampliado |
| GET | `/api/identity/team` | Usuarios, invitaciones, auditoría con nombres legibles |
| PATCH | `/api/identity/members/[id]` | Cambio de rol |
| POST | `/api/identity/invitations` | Wizard de invitación |

## Base de datos

Campos opcionales en `identity_users`: `jobTitle`, `phone`, `timezone`, `locale`.

## Componentes

```
src/components/admin/
├── AdminInstitutionalHeader.tsx
├── AdminNavDrawer.tsx
├── AdminUserMenuPanel.tsx
├── AdminUserAvatar.tsx
├── AdminStatusBadges.tsx
├── AdminGlobalSearch.tsx
├── AdminPageFrame.tsx
├── AdminDashboardClient.tsx
├── UsuariosCmsClient.tsx
├── UserCmsCard.tsx
├── InviteUserWizard.tsx
├── AuditTimeline.tsx
├── ProfileProfessionalClient.tsx
├── SecuritySettingsClient.tsx
└── ActivityClient.tsx

src/lib/admin/
├── institutional.ts
└── audit-labels.ts
```

## Seguridad

- Perfil y contraseña requieren sesión real (`requireSession`)
- Roles internos nunca se muestran en UI
- `Tenant Owner` no editable desde tarjetas de usuario

## Validaciones

- Nombre obligatorio en perfil
- Contraseña mínimo 8 caracteres
- Invitación requiere email y rol institucional válido

## Documentación

| Documento | Acción |
| --- | --- |
| OT-CMSV2-001.md | Creado |
| Manual UX CMS | [CMS-UX-GUIDELINES.md](../design/CMS-UX-GUIDELINES.md) | **Creado** en OT-CMSV2-001A |
| Visual Experience Builder | [VISUAL-EXPERIENCE-BUILDER.md](../design/VISUAL-EXPERIENCE-BUILDER.md) | **Diseño** OT-CMSV2-DESIGN-001 |
| [PORTAL-CMS-AUDIT.md](../audits/PORTAL-CMS-AUDIT.md) | Referencia de gaps |

## Criterios de aceptación

| Criterio | Fase | Estado |
| --- | --- | --- |
| Header con navegación institucional | 1 | ✅ |
| Menú de usuario corporativo | 1 | ✅ |
| Avatar con isotipo SEM | 1 | ✅ |
| Usuarios CMS con tarjetas (no tablas) | 1 | ✅ |
| Roles con etiquetas institucionales | 1 | ✅ |
| Wizard de invitación 4 pasos | 1 | ✅ |
| Timeline de auditoría legible | 1 | ✅ |
| Perfil profesional ampliado | 1 | ✅ |
| Drawer responsive | 1 | ✅ |
| Búsqueda global de contenido | 2 | ⚪ |
| 2FA y sesiones | 2 | ⚪ |
| Sin términos técnicos en toda la UI | 2 | ⚪ |

## Restricciones

- No renombrar roles en base de datos (solo capa de presentación)
- No romper APIs de Identity Core existentes
- "Equipo" en portal público sigue siendo docentes (`content_people`)

## Resultado esperado

El administrador del SEM gestiona el portal con lenguaje institucional, navegación clara y experiencia premium — sin exponer conceptos de plataforma (tenant, membership, identity core, workflow engine).
