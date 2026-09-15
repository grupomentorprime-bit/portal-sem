# OT-GROWTH-UX-PERSONAS-004 — Refinamiento visual Personas V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-UX-PERSONAS-004 |
| Tipo | Diseño / UX |
| Agente | AGENTE 1 — Diseño / UX |
| Fecha | 2026-09-12 |
| Entrada | [OT-GROWTH-PERSONAS-CONTRACT-002](./OT-GROWTH-PERSONAS-CONTRACT-002.md) · [OT-GROWTH-PERSONAS-IMPLEMENT-003](./OT-GROWTH-PERSONAS-IMPLEMENT-003.md) (APTO) |
| Estado | **CERRADA · APTO VISUAL** |
| Alcance | Listado, ficha y modal Crear persona — jerarquía, copy, responsive, consistencia Growth OS |
| Fuera de alcance | Motores · contratos · APIs · permisos · Shell · Ventas write · Mensajes composer · Actividad schema · Campañas · Analítica · merge/archive · scoring · campos nuevos |

**Restricciones cumplidas:** sin funciones nuevas; sin cambios a `upsertGrowthPersona` / dedupe / normalización; sin tocar Shell; sin datos ficticios; sin segundo CRM/inbox/timeline.

---

## Gate final

**APTO VISUAL**

Personas V1 queda al nivel visual de Growth OS: listado escaneable, ficha con historia clara, Crear persona simple, lenguaje humano y evidencia desktop + mobile reales. **No** se cierra Personas V1 de producto automáticamente. **No** se abre otra OT.

---

## 1. Estado inicial

| Superficie | Antes (IMPLEMENT-003) |
| --- | --- |
| Listado | Filas operativas pero con etiqueta «Situación», `StatusBadge` en próxima acción y copy de cabecera genérico |
| Ficha | Colección de cards (identidad + próxima acción + opp + conversaciones + timeline) sin historia fluida |
| Crear | Modal funcional; CTA «Crear»; campo «Email»; ayuda más larga |
| Copy pendiente | «Sin próxima acción»; «Ver detalle» en listado; «Todos los orígenes» |
| Shell | Congelado — no tocado |

Base funcional cerrada: permisos `growth.people.*`, filtro origen, conversaciones read-only, crear vía `upsertGrowthPersona`, CTAs fail-safe.

---

## 2. Problemas visuales encontrados

1. Cabecera del listado no respondía en segundos a «quién se relacionó con mi negocio».
2. La columna «Situación» mezclaba origen y oportunidad sin prioridad clara.
3. `StatusBadge` en «Qué hacer ahora» aportaba ruido tipo CRM cuando no había pendiente.
4. Ficha repetía el nombre en card + título de módulo; demasiadas superficies card.
5. Conversaciones se sentían como tarjetas sueltas (riesgo de parecer mini-inbox).
6. Actividad envuelta en card + `Timeline` genérico (más log que historia).
7. Modal: «Email» / «Crear» / ayuda técnica-larga.
8. Filtros de oportunidades saturaban cabecera en móvil (labels largos).

---

## 3. Cambios realizados

| Área | Cambio |
| --- | --- |
| Copy | Cabecera, vacío, sin coincidencias, crear, sin pendiente, Ver persona, Llegó por… |
| Listado | Jerarquía: nombre → contacto → origen → N oportunidades → Qué hacer ahora → Ver persona |
| Filtros | Búsqueda protagonista; origen + opp en fila con scroll horizontal; labels cortos |
| Ficha | Historia: identidad compacta → Qué hacer ahora → Oportunidades → Conversaciones → Qué ha pasado |
| Conversaciones | Lista compacta read-only; sin composer |
| Actividad | Timeline humano (qué / cuándo); actor/kind solo si aporta |
| Modal | Nombre / Correo / Teléfono; «Agrega un correo o un teléfono.»; CTA «Crear persona» |

---

## 4. Listado

- Título **Personas**
- Descripción: *Todas las personas que se han relacionado con tu negocio.*
- CTA **Crear persona** solo con `canManage`
- Búsqueda: *Buscar por nombre, correo o teléfono*
- Origen: Todos / WhatsApp / Formulario / Admisión / Registro manual / Evento / Portal web / Sin origen claro
- Filtros de oportunidades conservados (funcionalidad intacta), organizados debajo
- Sin IDs, tenant, `origin.kind`, metadata

---

## 5. Ficha

Orden:

1. Persona (nombre en header + contacto + *Llegó por …*)
2. **Qué hacer ahora** (bloque operativo principal)
3. **Oportunidades** (intención + estado + CTAs Ventas si permiso)
4. **Conversaciones** (contexto reciente)
5. **Qué ha pasado**

Sin hero exagerado. Sin inventar recomendaciones.

---

## 6. Crear persona

Modal existente afinado:

- Título: Crear persona
- Campos: Nombre, Correo, Teléfono
- Ayuda: Agrega un correo o un teléfono.
- Primario: Crear persona · Secundario: Cancelar

Estados funcionales respetados (CREATED / MATCHED / CONFLICT / VALIDACIÓN) con copy humano ya estabilizado en labels.

---

## 7. Conversaciones

Read-only. Canal · preview · fecha · estado útil. CTA **Abrir en Mensajes** solo con flag real.

En evidencia tenant **adl**: la Persona real no tenía conversaciones → empty state humano validado. Preview con mensajes reales: pendiente de datos del Espacio (no inventados).

---

## 8. Actividad

Historia cronológica: resumen + tiempo relativo; `kindLabel` solo si difiere del resumen. Sin metadata técnica. CTA **Ver actividad** solo si permiso.

---

## 9. Empty / error / loading

| Estado | Tratamiento |
| --- | --- |
| Sin Personas | Copy de llegada + CTA Crear si manage |
| Sin coincidencias | *No encontramos personas con esos filtros.* + Limpiar filtros |
| Sin opp / conversaciones / actividad | Empty calmados (no error) |
| Sin próxima acción | *No hay nada pendiente por ahora.* |
| Loading | `useTransition` opacity (patrón Growth OS) |
| Error crear | Mensaje humano en modal |

---

## 10. Responsive

| Viewport | Comportamiento |
| --- | --- |
| Desktop | Fila de 3 zonas: identidad / origen+opp / qué hacer ahora |
| Tablet | Misma composición con wrap |
| Mobile 390×844 | Nombre → contacto → origen → oportunidades → qué hacer ahora → Ver persona; filtros en scroll-x; Crear persona visible |

Sin navegación móvil paralela. Shell V2 intacto.

---

## 11. Copy

Preferido y aplicado: Personas, Crear persona, De dónde llegó / Llegó por, Qué hacer ahora, Oportunidades, Conversaciones, Qué ha pasado, Abrir en Ventas/Mensajes, Ver persona.

Evitado en UI: CRM, pipeline, lead, Identity, Origin técnico, Activity log, Payload, Metadata, IDs.

`GROWTH_NO_NEXT_ACTION_LABEL` actualizado a *No hay nada pendiente por ahora.* (copy compartido de proyección; no cambia `pickPrimaryNextAction`).

---

## 12. Archivos modificados

### Creados

| Archivo | Rol |
| --- | --- |
| `scripts/capture-growth-ux-personas-004.ts` | Capturas Playwright con datos reales |
| `tests/baseline/growth-ux-personas-004.test.ts` | Regresión UX / copy / no-toques |
| `docs/AI/auditorias/OT-GROWTH-UX-PERSONAS-004.md` | Esta acta |
| `docs/AI/auditorias/OT-GROWTH-UX-PERSONAS-004-evidence/*` | Evidencia visual |

### Modificados

| Archivo | Cambio |
| --- | --- |
| `src/lib/growth/labels.ts` | Copy Personas V1 + sin pendiente |
| `src/components/admin/growth/PersonasListClient.tsx` | Listado + filtros + modal |
| `src/components/admin/growth/PersonaDetailClient.tsx` | Ficha historia |
| `tests/baseline/growth-personas-ui.test.ts` | Aserciones alineadas al copy UX |

### No tocados

`upsertGrowthPersona` · `growth_personas` · dedupe · normalización · APIs (salvo consumo UI existente) · permisos · Shell · Ventas/Mensajes/Actividad motores · Campañas · Analítica · `pickPrimaryNextAction` lógica.

---

## 13. Pruebas

| Suite | Resultado |
| --- | --- |
| `growth-ux-personas-004.test.ts` | PASS |
| `growth-personas-003.test.ts` (IMPLEMENT) | PASS |
| `growth-personas-ui.test.ts` | PASS |

Sin arreglar fallos baseline ajenos.

---

## 14. Evidencia visual

Directorio: [`OT-GROWTH-UX-PERSONAS-004-evidence/`](./OT-GROWTH-UX-PERSONAS-004-evidence/)

Tenant: **adl** · Persona real existente (sin inventar registros nuevos en esta OT).

| # | Archivo | Qué valida |
| --- | --- | --- |
| 1 | `01-desktop-listado.png` | Listado desktop · jerarquía · Crear persona |
| 2 | `02-desktop-filtros.png` | Filtro WhatsApp sin coincidencias + Limpiar |
| 3 | `03-desktop-ficha.png` | Ficha historia · Qué hacer ahora · Opp |
| 4 | `04-desktop-conversaciones.png` | Sección Conversaciones (vacío real) |
| 5 | `05-modal-crear.png` | Modal Crear persona |
| 6 | `06-estado-vacio.png` | Sin coincidencias por búsqueda |
| 7 | `07-mobile-listado.png` | Mobile listado |
| 8 | `08-mobile-ficha.png` | Mobile ficha |

`RESULT.json`: `tenantId=adl`, `personaCount=1`, `emptyKind=filtro`, `conversationsVisible=false`.

### Revisión visual (humana)

| Criterio | Resultado |
| --- | --- |
| Jerarquía listado | OK |
| Ficha cuenta historia | OK |
| Qué hacer ahora protagonista | OK |
| Lenguaje humano / sin tokens técnicos | OK |
| Modal simple | OK |
| Conversaciones sin inbox | OK (empty real) |
| Responsive mobile | OK |
| Consistencia Growth OS / Shell intacto | OK |

---

## 15. Cambios deliberadamente NO realizados

- Motores / contratos / índices / rutas nuevas
- Shell, nav global, selector de Espacio
- Merge, archive, tags, scoring, `persona.nextAction`
- Composer / mini chat / segundo timeline
- Operaciones de Ventas dentro de Personas
- Inventar conversaciones o Personas para captura
- Corregir issues funcionales ajenos (ninguno bloqueante detectado en esta pasada)

---

## 16. Pendientes reales

| Ítem | Nota |
| --- | --- |
| Conversaciones con preview real | Tenant adl sin mensajes en la Persona capturada; empty state OK; revalidar visualmente cuando existan hilos |
| Vacío absoluto (0 Personas) | No capturado en adl (había 1); empty de filtros sí |
| Roles BD vs plantillas | Ya documentado en IMPLEMENT-003 (`sync:tenant-roles`) |
| Cierre de producto Personas V1 | Fuera de esta OT — no se declara cerrado aquí |

---

## 17. Veredicto

**APTO VISUAL**

Cumple gate: evidencia desktop + mobile reales; listado/ficha/crear claros; conversaciones integradas sin inbox; Qué hacer ahora con jerarquía; lenguaje humano; sin datos ficticios; sin regresión funcional; sin cambios de motores/contratos.

Personas V1 **no** se cierra automáticamente. **No** se abre otra OT.
