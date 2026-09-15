# OT-GROWTH-UX-CAMPAIGNS-004 — Diseño final Campañas V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-UX-CAMPAIGNS-004 |
| Tipo | Diseño / UX |
| Agente | AGENTE 1 — Diseño / UX |
| Fecha | 2026-09-11 |
| Entrada | [OT-GROWTH-CAMPAIGNS-CONTRACT-002](./OT-GROWTH-CAMPAIGNS-CONTRACT-002.md) (APTO) · superficie funcional Campañas V1 |
| Estado | **CERRADA · APTO VISUAL** |
| Alcance | Diseño final de `/admin/campanas` (listado, crear 4 pasos, detalle, estados, responsive) |
| Fuera de alcance | Backend · `growth_campaigns` · APIs · tracking bridge · live ingest · Automation runtime · Growth Core · Mensajes · Actividad · Inicio · Shell · permisos de producto · índices · DNS/Meta/WhatsApp |

**Restricciones cumplidas:** sin tocar motores/contratos/APIs; sin métricas inventadas (CTR/ROAS/alcance/etc.); sin rediseñar Shell; copy humano; wizard de 4 pasos; estados humanos Borrador/Activa/Terminada.

---

## Gate final

**APTO VISUAL**

`/admin/campanas` queda como superficie Growth OS escaneable: listado con resumen real, cards amplias, creador guiado de 4 pasos sin IDs/`trackingKey`, detalle con resultados derivados y acciones por estado. Evidencia real en tenant **adl**.

---

## 1. Qué cambió

| Antes | Después |
| --- | --- |
| Copy técnico / genérico | «Organiza cómo atraes personas y acompaña sus resultados.» |
| Filas mínimas con clave y métricas parciales | Cards amplias: nombre, objetivo, estado, fuente, personas/oportunidades/ganadas + «Ver campaña» |
| Formulario monolítico con `trackingKey`, formId, automationId | Wizard 4 pasos; selects por nombre; `trackingKey` generado detrás |
| Detalle con «Clave: …» y «Terminar» también en borrador | Acciones contextuales; fuente/seguimiento/audiencia humanas; enlace a Actividad |
| Sin resumen ni vacío OT | Resumen compacto (activas / personas / oportunidades / ganadas) + vacío «Crea tu primera campaña» |

Idea cubierta: en segundos se responde qué campañas hay, cuáles están activas, qué buscan, de dónde llegan, qué resultados llevan y qué se puede hacer ahora — sin parecer un Ads Manager.

---

## 2. Archivos modificados / creados

### Creados

| Archivo | Rol |
| --- | --- |
| `scripts/capture-growth-ux-campaigns-004.ts` | Capturas Playwright con datos reales |
| `tests/baseline/growth-ux-campaigns-004.test.ts` | Regresión de superficie / copy / no-toques |
| `docs/AI/auditorias/OT-GROWTH-UX-CAMPAIGNS-004-evidence/*` | Evidencia visual |
| `docs/AI/auditorias/OT-GROWTH-UX-CAMPAIGNS-004.md` | Esta acta |

### Modificados

| Archivo | Cambio |
| --- | --- |
| `src/lib/growth/campaigns-labels.ts` | Copy OT + humanización de audiencia/fuente/errores |
| `src/lib/growth/campaigns-read.ts` | Nombres de formulario, resumen de listado, labels de audiencia |
| `src/components/admin/growth/CampanasListClient.tsx` | Listado final + resumen + vacío |
| `src/components/admin/growth/CampanaFormClient.tsx` | Wizard 4 pasos |
| `src/components/admin/growth/CampanaDetailClient.tsx` | Ficha final + acciones por estado |
| `src/app/admin/campanas/page.tsx` | Pasa `summary` |
| `src/app/admin/campanas/nueva/page.tsx` | Pasa formularios/automatizaciones reales |
| `src/app/admin/campanas/[id]/editar/page.tsx` | Idem + audience existente |
| `src/app/admin/campanas/[id]/page.tsx` | Props de detalle humanizado |

### No tocados (según OT)

`src/core/growth/campaigns/*` · APIs `/api/growth/campaigns*` · tracking bridge · ingest · Automation runtime · Growth Core · Mensajes · Actividad · Inicio · Shell · índices · Meta/WhatsApp/DNS.

---

## 3. Capturas

Directorio: [`OT-GROWTH-UX-CAMPAIGNS-004-evidence/`](./OT-GROWTH-UX-CAMPAIGNS-004-evidence/)

Tenant de captura: **adl**. El Espacio no tenía campañas; se capturó el vacío real y luego se creó/activó una campaña de configuración real vía API (métricas = 0 reales). Rol `super_admin` carecía de `growth.campaigns.*` en Mongo (plantillas de código sí las tenían); el script de captura sincronizó esos permisos en el rol para poder abrir la superficie.

| # | Archivo | Qué valida |
| --- | --- | --- |
| 1 | `01-desktop-listado.png` | Desktop · listado con resumen + card activa |
| 2 | `02-desktop-crear.png` | Desktop · wizard paso 1 |
| 3 | `03-desktop-detalle.png` | Desktop · detalle campaña activa |
| 4 | `04-mobile-listado.png` | Mobile 390×844 · prioridad nombre/estado/objetivo/resultados |
| 5 | `05-mobile-detalle.png` | Mobile · ficha activa |
| 6 | `06-estado-vacio.png` | Vacío principal OT (antes de crear) |

`RESULT.json`: `createdForCapture=true`, `activated=true`, `emptyKind=general`.

### Revisión visual

| Criterio | Resultado |
| --- | --- |
| Jerarquía (nombre → estado → objetivo → fuente → resultados) | OK |
| Densidad aireada (no tabla admin) | OK |
| Copy OT / sin Ads Manager | OK |
| Sin `trackingKey` / formId / eq / AND visibles | OK |
| Acciones por estado (Activa: Editar + Terminar) | OK |
| Métricas solo §9.1 | OK |
| Responsive móvil | OK |
| Vacío principal | OK |

---

## 4. Flujo crear campaña

1. **Qué quieres lograr** — nombre, objetivo, fechas opcionales.
2. **De dónde llegarán** — Formulario (select por nombre) o Solo seguimiento.
3. **Qué seguimiento tendrán** — condiciones de audiencia en lenguaje humano + Automatización opcional por nombre.
4. **Revisar y activar** — resumen; [Guardar borrador] / [Activar campaña] con hint de qué ocurre al activar.

`trackingKey` se deriva del nombre y viaja en el payload; no se muestra.

---

## 5. Detalle

Responde: para qué sirve, si está activa, de dónde llegan, seguimiento, resultados (personas / oportunidades / en seguimiento / ganadas / perdidas), qué ha pasado (enlace a Actividad existente).

| Estado | Acciones |
| --- | --- |
| Borrador | Editar · Activar |
| Activa | Editar · Terminar campaña |
| Terminada | Sin reactivar |

Sin Pausar.

---

## 6. Responsive

| Viewport | Comportamiento |
| --- | --- |
| Desktop | Resumen 4 columnas; cards horizontales; wizard `max-w-2xl`; detalle `max-w-3xl` |
| Mobile | CTA bajo cabecera; métricas 2×2; card en columna (nombre/estado → objetivo → resultados → Ver campaña); wizard usable |

Shell V2 intacto.

---

## 7. Estados

| Estado | Tratamiento |
| --- | --- |
| Con campañas | Resumen + cards |
| Sin campañas | «Crea tu primera campaña» + CTA |
| Borrador / Activa / Terminada | Badge humano + acciones contextuales |
| Crear | Wizard 4 pasos |
| Formularios vacíos | Mensaje + opción Solo seguimiento |
| Automatizaciones vacías | Mensaje no-error; se puede continuar |
| Cargando / error recuperable | «Guardando…» / `AlertBanner` en wizard y detalle |

---

## 8. Pruebas / regresiones

```text
npx tsx --test tests/baseline/growth-ux-campaigns-004.test.ts
→ 5/5 pass
```

Cubre: copy OT, wizard sin jerga visible, detalle/métricas, humanización de audiencia, no invocación de service/API desde el cliente más allá de `fetch` a rutas existentes.

---

## 9. Riesgos

| Riesgo | Mitigación / nota |
| --- | --- |
| Roles Mongo sin `growth.campaigns.*` pese a plantillas de código | Captura sincronizó `role-adl-super-admin` en adl; conviene alinear roles de otros Espacios en Identity |
| Campaña creada para evidencia | Config real de prueba (`Campaña Matrículas 2027`); métricas 0 reales |
| Audiencia avanzada (`origin.kind`) | Cubierta en labels; el editor UI prioriza status/tipo/canal/formulario/esta campaña |
| Fechas `datetime-local` ↔ ISO | Mismo patrón previo; no se cambió contrato |

---

## Veredicto

**CERRADA · APTO VISUAL**

Diseño final de Campañas V1 alineado a Growth OS y al contrato funcional congelado. **No abrir otra OT automáticamente.**
