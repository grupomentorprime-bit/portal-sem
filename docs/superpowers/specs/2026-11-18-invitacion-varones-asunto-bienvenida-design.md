# Invitación Departamento de Varones — asunto de bienvenida

**Fecha:** 2026-11-18  
**Estado:** diseño aprobado (conversación); pendiente plan de implementación  
**Enfoque:** 1 — solo cambiar el asunto del correo de invitación cuando hay marca de departamento

## Objetivo

Cuando se envía una **cuenta nueva** (correo de invitación) del Departamento Nacional de Varones, el **asunto** debe ser un mensaje de bienvenida a la plataforma del departamento, no “Invitación — …”.

## Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Asunto (con departamento) | `Bienvenido a la plataforma del ${department}` → hoy: `Bienvenido a la plataforma del Departamento Nacional de Varones` |
| Alcance | Toda invitación nueva con `departmentName` (marca de departamento; hoy solo Varones vía `departmentEmailBrand`) |
| Cuerpo / CTA / logo / vencimiento | Sin cambios |
| Recuperación / reenvío de acceso | Sin cambios (`Recupera tu contraseña — …`, `Tu acceso — …`) |
| Invitación sin departamento | Sigue `Invitación — ${spaceName}` |

## Cambio

Archivo: `src/lib/notifications/email-brand.ts` — `invitationEmailVoice`:

- Con departamento: `subject` de `Invitación — ${department}` → `Bienvenido a la plataforma del ${department}`.
- `preview` y `lead` se mantienen.
- Rama sin departamento: sin cambio.

Test: `tests/baseline/unit-email-brand.test.ts` — actualizar la expectativa del asunto con departamento.

## Verificación

- Invitación a unidad Varones: asunto `Bienvenido a la plataforma del Departamento Nacional de Varones`.
- Invitación solo Espacio (sin unidad Varones): asunto `Invitación — {nombre del Espacio}`.
- Recovery / access reminder: asuntos actuales intactos.
- `npx tsx --test tests/baseline/unit-email-brand.test.ts` en verde.

## Fuera de alcance

- Rediseño del cuerpo del correo.
- Plantilla específica por rol (`congress_operator`).
- Commit/PR/despliegue salvo pedido explícito.

## Criterios de éxito

1. Toda cuenta nueva del Departamento de Varones llega con asunto de bienvenida a la plataforma.
2. El resto de voces de correo no se alteran.
