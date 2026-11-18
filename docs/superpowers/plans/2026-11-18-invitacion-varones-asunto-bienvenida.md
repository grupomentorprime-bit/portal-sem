# Invitación Varones — asunto de bienvenida Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el correo de invitación del Departamento Nacional de Varones use asunto de bienvenida a la plataforma.

**Architecture:** Un único cambio en `invitationEmailVoice` cuando hay `departmentName`; actualizar el test de baseline que fija el asunto. Sin tocar layout, CTA, recovery ni access reminder.

**Tech Stack:** TypeScript, `node:test` vía `npx tsx --test`.

**Spec:** `docs/superpowers/specs/2026-11-18-invitacion-varones-asunto-bienvenida-design.md`

## Global Constraints

- Asunto con departamento: exactamente `Bienvenido a la plataforma del ${department}`.
- Sin cambios a `preview`, `lead`, recovery, access reminder, ni HTML del correo.
- Invitación sin departamento: sigue `Invitación — ${spaceName}`.
- **Sin commit/PR** salvo pedido explícito del usuario (omitir pasos `git commit` / `git push`).

## File map

| Path | Responsibility |
|------|----------------|
| `src/lib/notifications/email-brand.ts` | `invitationEmailVoice` — subject con departamento |
| `tests/baseline/unit-email-brand.test.ts` | Expectativa del asunto de invitación con departamento |

---

### Task 1: Asunto de bienvenida en invitación de departamento

**Files:**
- Modify: `tests/baseline/unit-email-brand.test.ts`
- Modify: `src/lib/notifications/email-brand.ts`
- Test: `tests/baseline/unit-email-brand.test.ts`

**Interfaces:**
- Consumes: `invitationEmailVoice(spaceName: string, departmentName?: string): { label; subject; preview; lead }`
- Produces: mismo shape; con departamento, `subject === \`Bienvenido a la plataforma del ${department}\``

- [x] **Step 1: Actualizar el test al nuevo asunto**

En `tests/baseline/unit-email-brand.test.ts`, en el caso `"la invitación del departamento no habla del Espacio"`, cambiar:

```ts
assert.equal(voice.subject, "Invitación — Departamento Nacional de Varones");
```

por:

```ts
assert.equal(
  voice.subject,
  "Bienvenido a la plataforma del Departamento Nacional de Varones"
);
```

Dejar intactas las aserciones de `lead` y `preview`.

- [x] **Step 2: Correr el test y confirmar que falla**

Run:

```bash
npx tsx --test tests/baseline/unit-email-brand.test.ts
```

Expected: FAIL en el assert del `subject` (sigue saliendo `Invitación — Departamento Nacional de Varones`).

- [x] **Step 3: Cambiar el subject en `invitationEmailVoice`**

En `src/lib/notifications/email-brand.ts`, dentro de `invitationEmailVoice`, rama con departamento:

```ts
if (department) {
  return {
    label: department,
    subject: `Bienvenido a la plataforma del ${department}`,
    preview: `Crea tu contraseña para acceder al ${department}.`,
    lead: `Te invitaron a administrar el ${department}.`,
  };
}
```

No modificar `preview`, `lead`, ni la rama sin departamento.

- [x] **Step 4: Correr el test y confirmar que pasa**

Run:

```bash
npx tsx --test tests/baseline/unit-email-brand.test.ts
```

Expected: PASS (todos los casos del archivo en verde), incluyendo:

- invitación con departamento → asunto de bienvenida
- sin departamento → `Invitación — IPN Chile`
- recovery → `Recupera tu contraseña — Departamento Nacional de Varones` (sin cambio)

- [x] **Step 5: Commit** — omitido (constraint global).
