# Auditoría técnica — Flujo convocatorias / jornada presencial

**Código:** CONVOCATORIA-FLOW-AUDIT-001  
**Fecha:** 2026-07-04  
**Convocatoria de referencia:** `talca-aurora-jul-2026` / `convocatoria-talca-aurora-jul-2026`  
**Estado:** Aprobada — referencia técnica vigente  
**Alcance:** Registro, nómina, operación día D, justificación, correos, persistencia MongoDB

> UAT, runbook operativo y checklist de despliegue se abordarán más adelante, al acercarse la primera jornada real en producción.

---

## Resumen ejecutivo

Se auditó el flujo completo de convocatorias presenciales de punta a punta. **TypeScript compila sin errores.** Se detectó y corrigió **un bug crítico** (gestión de inasistencia en Centro de formularios apuntaba a una ruta inexistente → 404). El panel de Asuntos Estudiantiles y el resto del flujo estaban correctamente cableados.

**Veredicto:** listo para continuar el roadmap del Portal Administrativo; temas de producción documentados como checklist diferido.

---

## 1. Mapa del flujo

```
Alumno (formulario público)
  → POST /api/experience/forms/[id]/submit
  → experience_form_submissions (+ opcional convocatoria_rosters)

Operador (Asuntos Estudiantiles)
  → PATCH .../student-affairs/submissions/[id]/event-day
  → PATCH .../student-affairs/submissions/[id]/absence-review

Operador (Centro de formularios)
  → PATCH .../experience/forms/submissions/[id]

Alumno (justificación post no-show)
  → /asistencia/justificar/[submissionId]?token=
  → POST .../experience/forms/submissions/[id]/participant-justification
```

### Acciones día D (`event-day`)

| Acción | Precondición | Efecto |
|--------|--------------|--------|
| `check-in` | `attendance === "yes"` | `dayCheckIn.present = true` + correo (solo primera vez) |
| `undo-check-in` | `attendance === "yes"` | `dayCheckIn.present = false` |
| `mark-absent` | `attendance === "yes"` | `attendance → "no"`, `absenceReview pending`, email con enlace |
| `mark-arrived-from-absence` | `attendance === "no"` | `attendance → "yes"`, check-in, limpia `absenceReview` |

---

## 2. Archivos clave

| Área | Ruta |
|------|------|
| Panel operación | `src/components/admin/student-affairs/StudentAffairsOperationsPanel.tsx` |
| Event-day API | `src/app/api/student-affairs/submissions/[id]/event-day/route.ts` |
| Absence review (AE) | `src/app/api/student-affairs/submissions/[id]/absence-review/route.ts` |
| Absence review (forms) | `src/app/api/experience/forms/submissions/[id]/route.ts` |
| Justificación pública | `src/app/(site)/asistencia/justificar/[submissionId]/page.tsx` |
| Token participante | `src/lib/experience/forms/submission-participant-token.ts` |
| Correos seguimiento | `src/lib/notifications/convocatoria-follow-up-email.ts` |
| Repositorio BD | `src/lib/experience/forms/repository.ts` |
| Nómina / matching | `src/lib/experience/forms/roster-import.ts` |
| Submit convocatoria | `src/app/api/experience/forms/[id]/submit/route.ts` |
| Índices MongoDB | `scripts/ensure-mongodb-indexes.ts` |
| Reconciliación Otros | `scripts/reconcile-otros-submissions.ts` |

---

## 3. MongoDB

### Colecciones

**`experience_form_submissions`**
- `data.attendance`, `data.email`, `data.fullName`, `data.generation`, `data.studentId`, `data.rut`
- `data.justification`, `data.justificationAttachment`
- `dayCheckIn`: `{ present, checkedInAt, checkedInByName, notes }`
- `absenceReview`: `{ status, managementNotes, evidenceReceived, evidenceNotes, reviewedAt, reviewedByName }`

**`convocatoria_rosters`**
- `tenant`, `convocatoriaSlug`, `formId`, `students[]`, `updatedAt`

**`platform_integrations`**
- Credenciales S3 cifradas con `SESSION_SECRET`

No hay migraciones SQL. Campos nuevos son opcionales sobre documentos existentes.

### Índices recomendados

Ejecutar una vez por entorno:

```bash
npx tsx --env-file=.env scripts/ensure-mongodb-indexes.ts
```

---

## 4. Bug crítico detectado y corregido

| Antes | Después |
|-------|---------|
| `ExperienceFormSubmissionsTable` usaba default `/api/experience/forms/submissions/[id]/absence-review` (ruta **inexistente** → 404) | Default corregido a `/api/experience/forms/submissions/[id]` |
| PATCH en Centro de formularios no enviaba correo al participante | Misma ruta ahora envía email de resolución de inasistencia |

---

## 5. Otros fixes aplicados (2026-07-04)

- `mark-arrived-from-absence` limpia `absenceReview` obsoleto
- `undo-check-in` valida `attendance === "yes"`
- Re-check-in no reenvía correo si ya existía `checkedInAt`
- Página y API de justificación rechazan reenvío si ya hay adjunto
- Ruta legacy `check-in` delega a repositorio (deprecated)
- Matching nómina: acentos, merge Excel prioriza G-20XX sobre Otros, auto-match en registro manual

---

## 6. Dependencias de infraestructura (checklist diferido)

| Config | Uso | Si falta |
|--------|-----|----------|
| `MONGODB_URI`, `MONGODB_DB` | Persistencia | App no funciona |
| `SESSION_SECRET` estable | Sesiones, S3 cifrado, tokens justificación | Enlaces invalidados al rotar |
| `APP_URL`, `NEXT_PUBLIC_APP_URL` | URLs en correos | Enlaces a localhost |
| `RESEND_API_KEY`, `EMAIL_FROM` | Correos transaccionales | Estado se guarda; aviso en panel |
| S3 (Integraciones) | Adjuntos justificación | 503 al subir respaldo |
| Scopes operadores AE | `formIds` + `generationCodes` | Lista vacía silenciosa |

---

## 7. Riesgos medios conocidos (sin acción inmediata)

- Listados limitados a 500/1000 respuestas en panel AE
- Scripts de reconciliación con slug fijo (`talca-aurora-jul-2026`)
- Token justificación: TTL 14 días; rotación de `SESSION_SECRET` invalida enlaces
- Matching fuzzy por nombre puede ambiguar homónimos sin RUT
- URLs S3 privadas en admin pueden requerir stream autenticado

---

## 8. Prueba manual recomendada (pre-jornada real)

1. RSVP confirmado → correo confirmación
2. Panel AE → Registrar llegada → estado + correo
3. Confirmado no-show → Marcar inasistencia → correo con enlace → justificar con PDF
4. Justificado que llega → Registrar llegada
5. Gestionar inasistencia → alumno recibe resolución
6. Centro de formularios → misma gestión (verificar sin 404)

---

## 9. Aprobación

Auditoría aprobada. Referencia técnica del flujo de convocatorias. Sin nuevas OTs ni ampliación de alcance en esta fase. UAT, runbook y checklist de producción: pendientes para fase pre-despliegue.

---

## 10. Base certificada — Plantilla de operación jornada presencial

**Referencia UI:** panel en `/admin/portal/asuntos-estudiantiles/[formId]` (`StudentAffairsOperationsPanel`).

Este tablero queda como **base certificada** para futuras jornadas (p. ej. fin de año). No es código exclusivo de Talca Aurora: el motor es **genérico por `formId`**.

### Qué ya es reutilizable sin cambiar código

| Capacidad | Cómo se activa |
|-----------|----------------|
| Tablero de operación (métricas, filtros, check-in, inasistencias, cierre jornada) | Formulario con destino `attendance_confirmation` y campo `attendance` |
| Aparición en Asuntos Estudiantiles → Operación | `filterFormsForStudentAffairsPanel()` detecta convocatorias automáticamente |
| Filtro por generación en el panel | Chips G-2023…G-2026 / Equipo / Otros (desde nómina + respuestas) |
| Alcance por operador (formulario + generaciones) | Asuntos Estudiantiles → Equipo → marcar formulario y generaciones |
| Nómina vs formulario (“Sin registrar ni justificar”) | Requiere nómina cargada (ver paso 3 abajo) |
| Export CSV, cierre de jornada e informe | Por `formId` |

### Qué hay que configurar por cada nueva jornada

1. **Formulario** — Crear en Centro de formularios con plantilla de confirmación de asistencia (campos: búsqueda nómina, asistencia sí/no, teléfono, correo, justificación).
2. **Convocatoria** — Registrar en `FORM_CONVOCATORIAS` (`src/lib/admin/forms-center.ts`): `slug`, `formId`, título, fecha, lugar, landing. Sin esto: no hay nómina enlazada, correos sin datos del evento ni pestaña Participantes con slug.
3. **Nómina** — Admin → formulario → Participantes → importar Excel (hojas por generación + Otros/Equipo).
4. **Operadores** — Asignar alcance: formulario de la jornada + generaciones a gestionar (p. ej. solo G-2025).
5. **Infra** — `APP_URL`, Resend, S3, índices MongoDB (`scripts/ensure-mongodb-indexes.ts`).

### Estados del tablero (certificados)

| Etiqueta | Significado |
|----------|-------------|
| Asistió / Sin asistir | Check-in día D o confirmado pendiente de llegada |
| Sin registrar ni justificar | En nómina, sin respuesta al formulario |
| Pendiente contacto / Plazo / Sin justificar / Por revisar | Flujo de inasistencia tras marcar o declarar no asistencia |

### Certificación Talca Aurora (jul-2026)

Primera jornada operada con esta plantilla. Nómina reconciliada, flujo event-day auditado, bug crítico Centro de formularios corregido. Sirve como **referencia de comportamiento esperado** para la jornada de fin de año.

### Pendiente para multi-jornada sin tocar código (fase posterior)

- Convocatorias en BD en lugar de array estático `FORM_CONVOCATORIAS`
- Wizard “Nueva jornada presencial” que cree formulario + convocatoria + enlace al panel en un paso

