# Evidencia 03 — Colecciones MongoDB usadas por el Portal

Conexión: `src/lib/mongodb.ts` → un `MONGODB_DB` por proceso.  
No hay acceso a otra base de datos de producto (Aprende Hoy) en código.

Campo institucional típico: `tenant` (CMS/contenido/forms) o `tenantId` (identity/events).

## Inventario

| Colección | Propósito | Clave | Campo tenant | Índices conocidos en repo |
|-----------|-----------|-------|--------------|---------------------------|
| `cms_config` | Config única de instancia | `_id: "site"` | `institution.tenant` | singleton |
| `cms_pages` | Páginas + bloques + versions | `_id` | `tenant` | slug+tenant en query publicada |
| `cms_menus` | Menús | `_id` | `tenant` (opcional; filtro leaky) | — |
| `cms_blocks` | Registry persistido (fallback a defaults) | `_id` = BlockType | no | — |
| `cms_templates` | Plantillas de página | `_id` | no / implícito | — |
| `cms_media` | Biblioteca | `_id` `media-…` | `tenant` | lookup core sí; `getMediaById` no |
| `cms_migrations` | Framework migraciones | — | — | — |
| `platform_integrations` | Secrets S3 cifrados | `_id` storage | **no** (instancia) | — |
| `academy_programs` | Catálogo público | `_id` | `tenant` | Content Engine |
| `academy_categories` | Categorías programas | `_id` | `tenant` | |
| `academy_teachers` | Legacy docentes | `_id` | `tenant` | |
| `academy_team` | Equipo | `_id` | `tenant` | |
| `academy_testimonials` | Testimonios | `_id` | `tenant` | |
| `academy_gallery` | Galería | `_id` | `tenant` | |
| `content_news` | Noticias | `_id` | `tenant` | |
| `content_news_categories` | Categorías noticias | `_id` | `tenant` | |
| `content_events` | Eventos editoriales | `_id` | `tenant` | |
| `content_academic_agenda` | Agenda | `_id` | `tenant` | |
| `content_institutional_notices` | Avisos | `_id` | `tenant` | |
| `content_library` | Biblioteca | `_id` | `tenant` | |
| `content_people` | Personas | `_id` | `tenant` | |
| `experience_forms` | Definiciones de formularios | `_id` string | `tenant` | |
| `experience_form_submissions` | Envíos, check-in, justificaciones | ObjectId | `tenant` | `tenant+formId+createdAt`; studentId; email (`scripts/ensure-mongodb-indexes.ts`) |
| `experience_form_suppressions` | Forms purgados (anti-reseed) | tenant+formId | `tenant` | |
| `experience_form_experience` | Apariencia/SEO del form | formId | `tenant` | |
| `convocatoria_rosters` | Audiencia invitados | tenant+slug | `tenant` | unique `{tenant, convocatoriaSlug}` |
| `student_affairs_form_operations` | Estado operativo jornada | tenant+formId | `tenant` | |
| `portal_admission_config` | CMS centro de admisión | tenant | `tenant` | |
| `portal_interesados` | Postulaciones / handoff | `_id` | `tenant` | |
| `identity_users` | Personas globales | `_id` | **no** (global) | |
| `identity_credentials` | password / providers | `_id` | no (via userId) | |
| `identity_memberships` | user↔tenant + roles + scope | `_id` | `tenantId` | |
| `identity_roles` | Roles por tenant | `_id` | `tenantId` | |
| `identity_sessions` | Sesiones | `_id` | `tenantId` | |
| `identity_audit` | Auditoría IAM | `_id` | `tenantId` | |
| `identity_invitations` | Invitaciones | `_id` | tenant en doc | |
| `identity_notifications` | Notificaciones UI | `_id` | `tenantId` | |
| `workflow_definitions` | Definiciones | `_id` | PARTIAL | |
| `workflow_instances` | Instancias | `_id` | PARTIAL | |
| `workflow_history` | Historial | `_id` | PARTIAL | |
| `core_events` | Event bus | `id` | `tenantId` | |
| `core_event_dead_letter` | DLQ | — | — | |
| `core_scheduled_events` | Programados | — | — | |

## Mapa conceptual

```
cms_config (1 por DB)
    └── institution.tenant  ─────────────────────────────┐
identity_users (global)                                   │
    └── identity_memberships.tenantId ───────────────────┤
cms_pages.tenant  / cms_media.tenant / content_*.tenant ─┤
experience_forms.tenant                                   │
    ├── experience_form_submissions.tenant                │
    ├── experience_form_experience                        │
    └── convocatoria_rosters (slug ↔ form convocatoria)   │
            └── student_affairs_form_operations           │
portal_admission_config.tenant                            │
portal_interesados.tenant ──adapter──► AprendeHoy (no DB) │
platform_integrations (1 por DB, no tenant) ──────────────┘
```

## Relación crítica para SaaS

Hoy **tenant es un campo de documento**, no un selector de instancia.  
`cms_config` y `platform_integrations` son **singletons de proceso**.  
Dos instituciones en la misma DB colisionarían en config, storage y en lookups por `_id` sin `tenant`.
