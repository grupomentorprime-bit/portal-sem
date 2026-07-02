# CORE EXPERIENCE FORMS v1.0

**Estado:** LOCKED

Motor oficial de formularios reutilizables del Portal AprendeHoy. Integrado con el Experience Actions Engine y preparado para CRM, Admisiones y automatizaciones.

## Principio

```
Experience Action (type=form)
        │
        ▼
ExperienceFormHost → PortalExperienceForm
        │
        ▼
Form Engine (validation)
        │
        ▼
Submission Engine (destino)
        │
        ▼
MongoDB (experience_form_submissions)
```

## Componentes

| Componente | Rol |
| --- | --- |
| `PortalExperienceForm` | Formulario completo con estado, validación y envío |
| `PortalFormHeader` | Overline, título, descripción |
| `PortalFormFields` | Campos dinámicos por tipo |
| `PortalFormActions` | Botón enviar |
| `PortalFormSuccess` | Estado de éxito |
| `PortalFormError` | Banner de error global |
| `PortalFormSkeleton` | Loading (CLS = 0) |
| `ExperienceFormHost` | Modal invocado por acciones `type=form` |

Ruta: `src/components/portal/experience/forms/`

## Tipos de campo (v1.0)

`text`, `email`, `phone`, `number`, `textarea`, `select`, `radio`, `checkbox`, `date`, `time`, `file` (preparado), `hidden`

## Validaciones

Por campo: requerido, min/max length, regex, email, teléfono, número, fecha, hora.

Cliente (`validation.ts`) + servidor (`submit` API).

## Destinos (v1.0)

| Destino | Uso |
| --- | --- |
| `contact` | Contacto general |
| `information_request` | Solicitud de información |
| `attendance_confirmation` | Confirmación de asistencia |
| `absence_justification` | Justificación de inasistencia |
| `event_registration` | Inscripción a evento |
| `subscription` | Suscripción |

## Acciones posteriores

Integradas con Experience Actions: `message`, `redirect`, `modal`, `download`, `page`, `whatsapp`.

## Bloque CMS — `experience_form`

Categoría: **Experiencia**

| Campo | Tipo |
| --- | --- |
| `formId` | string |
| `overline` | string |
| `title` | string (opcional) |
| `description` | string |
| `display` | `inline` \| `modal` |

## Formularios SEM base

| ID | Nombre |
| --- | --- |
| `attendance-confirmation` | Confirmación de asistencia a Jornada Presencial |
| `absence-justification` | Justificación de inasistencia |
| `information-request` | Solicitud de información |
| `program-application` | Postulación al programa |

Alias: `contact` → `information-request`

Seed: `seedExperienceForms(tenant)` en `src/lib/experience/forms/repository.ts`

## API

| Ruta | Método | Auth |
| --- | --- | --- |
| `/api/experience/forms` | GET, POST | read / manage |
| `/api/experience/forms/[id]` | GET, PUT, DELETE, PATCH | read / manage |
| `/api/experience/forms/[id]/public` | GET | público |
| `/api/experience/forms/[id]/submit` | POST | público |

## Admin CMS

`/admin/experience/forms` — listado, duplicar, publicar, desactivar, editor JSON.

## Integraciones

- **CTA Premium** — `type: "form"` abre `ExperienceFormHost` (sin cambios en CTA).
- **Contact Hub** — botón Solicitar información → `formId: "contact"`.
- **Hero / News / Timeline / Agenda** — acciones `form` con IDs configurables.

## Deprecaciones

| Legacy | Reemplazo |
| --- | --- |
| `ContactForm` | `experience_form` / `PortalExperienceForm` |
| `InformationRequestForm` | alias de ContactForm |
| `AdmissionForm` | `program-application` |
| `EventRegistrationForm` | destino `event_registration` |
| `src/core/forms` | `src/core/experience/forms` |

## Experience Kit v1.0

Con este módulo queda completo el Experience Kit v1.0:

Hero Premium · Catalog Card · Feature Grid · Timeline · News Grid · People Grid · CTA Premium · Contact Hub · Footer Premium · **Experience Forms**

## Referencias

- [CORE-EXPERIENCE-ACTIONS-v1.md](./CORE-EXPERIENCE-ACTIONS-v1.md)
- [OT-PORTAL-010](../ot/OT-PORTAL-010.md)
