# OT-GROWTH-CORE-AUDIT-001 — Auditoría corta Growth Core V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-CORE-AUDIT-001 |
| Fecha | 2026-09-04 |
| Tipo | Solo lectura · sin código |
| Núcleo | Persona → Origen → Oportunidad → Actividad → Próxima acción |
| Estado | **CERRADA · AUDITORÍA** |

Predecesoras congeladas: [UX-SHELL-003](../OT-GROWTH-UX-SHELL-003/README.md) · [IDENTITY-MT-001](../OT-GROWTH-IDENTITY-MT-001/README.md).

---

## 1. Qué existe

| Área | Hallazgo |
| --- | --- |
| **CRM** | No hay colecciones ni módulo `crm_*`. Docs EP-001/002 = diseño futuro. |
| **Postulaciones / interesados** | `portal_interesados` + `POST /api/admission/apply` + `AdmissionAdapter` (handoff opt-in → Aprende Hoy como *lead*). Campos: nombre, email, teléfono, programa, `source: "portal-admision"`. |
| **Formularios** | `experience_forms` / `experience_form_submissions`. Destinos: contact, information_request, event_registration, etc. `processFormDestination` es **stub** (no crea persona/oportunidad). |
| **Contactos institucionales** | Contact Hub + `site_config.contact` (canales del Sitio). No es libreta de personas. |
| **Contactos operativos** | `absenceContactLog` en submissions (student-affairs / follow-up de jornadas). |
| **Personas** | `content_people` = editorial. `identity_users` = cuentas. **Ninguna** es Persona de crecimiento. |
| **Eventos** | Event Bus (`core_events`) + workflows CMS. `content_events` = agenda editorial. |
| **Conversaciones** | No hay inbox/chat/CRM de mensajes. WhatsApp/email = Experience Actions / notificaciones puntuales. |
| **Automatizaciones** | No hay motor de secuencias/nurture. Notifications = stub/canal. Follow-up jornadas = operativo vertical, no Growth Core. |
| **Campañas** | Solo etiqueta editorial en hero (`campaign`), no motor de campañas. |

---

## 2. Qué reutilizamos

| Concepto | Fuente a reutilizar |
| --- | --- |
| Señal de **Persona** (fragmentos) | Datos de contacto en `portal_interesados` y en `experience_form_submissions.data` |
| **Origen** | `source` de admisión; `destination` + tipo de Experience Action / form |
| **Oportunidad** (señal fuerte) | Interesado + `programId` (interés formal de conversión) |
| **Oportunidad** (señal débil) | Submission con destino contact / information_request / event_registration |
| Pipeline de captación | Extender Forms + Admission; no crear tercer ingreso |
| Estados / historial genérico | Workflow Engine + Event Bus (consumir, no fork) |
| Corte académico | Handoff existente; CRM de Aprende Hoy **fuera** |
| Aislamiento | `tenant` / TenantContext ya vigente |

**No reutilizar como Persona Growth:** `identity_users`, `content_people`.

---

## 3. Qué falta

| Concepto | Hueco |
| --- | --- |
| **Persona** | Entidad única por Espacio (dedupe por email/tel); hoy hay copias sueltas en interesado/submission |
| **Origen** | Catálogo normalizado compartido (hoy strings/destinos sueltos) |
| **Oportunidad** | Modelo genérico ligado a Persona; forms no abren oportunidad |
| **Actividad** | Timeline comercial unificado (hoy: events CMS, audit IAM, log de inasistencias) |
| **Próxima acción** | Campo/cola explícita “qué sigue” (hoy implícita en follow-up jornadas) |
| UI Espacio | Ninguna superficie Growth Core en `/admin` (y **no** en `/platform`) |

---

## 4. Propuesta mínima — Growth Core V1

Sin segundo CRM. Sin duplicar personas. Sin automatizaciones ni embudos visuales.

1. **Persona** (1 por Espacio, clave email y/o teléfono) — única ficha de contacto de crecimiento.
2. **Origen** — enum/catálogo corto en la primera captura (admisión, form contact, form evento, …).
3. **Oportunidad** — 1 intención abierta ligada a Persona + Origen (+ programa/evento/asunto opcional). Admisión e interesados **alimentan** esto; no se mantiene un silo paralelo.
4. **Actividad** — append-only mínimo (form enviado, nota, contacto registrado) sobre Persona/Oportunidad; publicar en Event Bus cuando aporte.
5. **Próxima acción** — un campo por Oportunidad: tipo + dueño + vencimiento (sin motor de tareas nuevo).
6. **Cableado** — `createInteresadoFromApplication` y `processFormDestination` → upsert Persona + abrir/actualizar Oportunidad + registrar Actividad. Handoff Aprende Hoy intacto.
7. **Superficie** — listado/ficha en admin del Espacio; Platform Admin y branding **congelados**.

Contrato = [OT-GROWTH-CORE-001](../OT-GROWTH-CORE-001/README.md) (**CERRADA · APTO**) / [ADR-010](../../architecture/ADR-010.md). Implementación: [CORE-002](../OT-GROWTH-CORE-002/README.md) · [CORE-003](../OT-GROWTH-CORE-003/README.md) · [CORE-004](../OT-GROWTH-CORE-004/README.md) (**CERRADAS · APTO**). Esta OT no implementa.

---

## Veredicto

**CERRADA · AUDITORÍA** — inventario listo. Hay captación (interesados + forms) y motores Platform Core; no hay CRM. V1 = unificar Persona/Oportunidad encima de lo existente.
