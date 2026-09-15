# OT-GROWTH-UX-ANALYTICS-004 — Diseño UX final Analítica V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-UX-ANALYTICS-004 |
| Tipo | Diseño / UX |
| Agente | AGENTE 1 — Diseño / UX |
| Fecha | 2026-09-12 |
| Entrada | [OT-GROWTH-ANALYTICS-CONTRACT-002](./OT-GROWTH-ANALYTICS-CONTRACT-002.md) · [OT-GROWTH-ANALYTICS-IMPLEMENT-003](./OT-GROWTH-ANALYTICS-IMPLEMENT-003.md) |
| Estado | **CERRADA · APTO VISUAL** |
| Alcance | Diseño final de `/admin/analitica` (jerarquía, copy, empty/loading/error, responsive) |
| Fuera de alcance | Métricas · cálculos · períodos · endpoint · permisos · read model · índices · motores · Shell · otras superficies Growth |

**Restricciones cumplidas:** sin alterar contrato funcional; sin rediseñar Shell; sin inventar datos; sin flechas/comparaciones/series temporales; sin embudo Personas→Ganadas; sin términos técnicos (UTC, cohorte, closedAt, trackingKey, ROAS, SLA).

---

## Gate final

**APTO VISUAL**

`/admin/analitica` queda como historia visual Growth OS: Resumen → Captación → Ventas → Campañas → Mensajes, con números protagonistas, barras proporcionales, ranking de campañas, empty/loading/error humanos y evidencia real en tenant **adl**. Analítica V1 **no** se declara cerrada de producto automáticamente.

---

## 1. Situación inicial

| Antes | Problema |
| --- | --- |
| Superficie funcional mínima (IMPLEMENT-003) | Listas/`<ul>`/`<table>` sin jerarquía visual |
| Selector `<select>` + timestamps UTC | Copy técnico (`fin exclusivo`, ISO) |
| Sin skeletons / empty humanos OT | Parecía backoffice, no Growth OS |
| Sin distinción visual Resumen vs Ventas | Riesgo de confundir «Ganadas» (cierres) con conversión de lo generado |

---

## 2. Cambios visuales

| Zona | Diseño |
| --- | --- |
| Cabecera | `AdminModulePage` · título **Analítica** · «Entiende cómo está funcionando tu negocio.» |
| Período | Pills: Últimos 7/30 días · Este mes · Mes anterior · Personalizado · **sin** UTC/`[start,end)` |
| Resumen | 5 números protagonistas; «En seguimiento ahora»; Ganadas/Perdidas con tono semántico |
| Captación | Total + barras horizontales por origen humano |
| Ventas | Generadas + **Conversión** («De las oportunidades generadas»); estado de lo generado; pérdidas por tipo/origen/campaña solo con datos |
| Campañas | Ranking en cards compactas (móvil = lista); vacío humano |
| Mensajes | Totales + bloque «Conversaciones sin respuesta» (atención, no alarma) + canal |
| Loading | Skeletons discretos |
| Error | «No pudimos cargar la analítica.» + «Intentar nuevamente» |

---

## 3. Archivos modificados / creados

### Creados

| Archivo | Rol |
| --- | --- |
| `scripts/capture-growth-ux-analytics-004.ts` | Capturas Playwright con datos reales |
| `tests/baseline/growth-ux-analytics-004.test.ts` | Regresión copy / jerarquía / no-toques |
| `docs/AI/auditorias/OT-GROWTH-UX-ANALYTICS-004-evidence/*` | Evidencia visual |
| `docs/AI/auditorias/OT-GROWTH-UX-ANALYTICS-004.md` | Esta acta |

### Modificados

| Archivo | Cambio |
| --- | --- |
| `src/components/admin/growth/AnaliticaClient.tsx` | Diseño final completo |
| `src/lib/growth/labels.ts` | Copy humano Analítica UX |
| `src/app/admin/analitica/page.tsx` | Comentario de alcance (sin cambio funcional) |

### No tocados (obligatorio)

`analytics-read.ts` · `analytics-aggregate.ts` · `analytics-period.ts` · `GET /api/growth/analytics` · migración 022 · índices · permisos · Growth Core · Ventas · Mensajes · Actividad · Campañas · Automatizaciones · Shell · Inicio.

---

## 4. Jerarquía final

```text
1. Resumen        ¿Qué está pasando?
2. Captación      ¿De dónde llegan?
3. Ventas         ¿Qué pasa con las oportunidades?
   └─ Pérdidas    ¿Dónde estamos perdiendo?
4. Campañas       ¿Qué está funcionando?
5. Mensajes       ¿Por dónde nos hablan?
```

Historia única, no cinco módulos pegados.

---

## 5. Responsive

| Viewport | Comportamiento |
| --- | --- |
| Desktop | Resumen 5 columnas; ventas estados 5; campañas card horizontal |
| Tablet | Grids intermedias; pills scrollables |
| Mobile (390×844) | Lectura vertical; pills overflow-x; estados 2 cols; campañas en stack |

---

## 6. Empty / loading / error

| Estado | Copy |
| --- | --- |
| Sin personas nuevas | «Aún no hay personas nuevas en este período.» |
| Sin oportunidades | «Aún no hay oportunidades en este período.» + Conversión **—** |
| Sin campañas | «No hay campañas con actividad en este período.» |
| Sin mensajes | «Aún no hay mensajes en este período.» |
| Sin pérdidas | «No hay pérdidas en este período.» |
| Loading | Skeletons (`data-analitica-loading`) |
| Error | Título OT + CTA «Intentar nuevamente» |

Sin demo data.

---

## 7. Evidencia

Directorio: [`OT-GROWTH-UX-ANALYTICS-004-evidence/`](./OT-GROWTH-UX-ANALYTICS-004-evidence/)

Tenant: **adl**. Inventario real: 1 campaña existente pero **0** opps con `origin.campaign` en período; **0** conversaciones/mensajes. Rol recibió `growth.analytics.view` en captura previa (idempotente).

| # | Archivo | Valida |
| --- | --- | --- |
| 1 | `01-desktop-con-datos.png` | A · Desktop con datos (1 persona, 1 opp, captación Admisión) |
| 2 | *(omitido)* | D · Campañas con filas — sin actividad periodizada real (no inventado) |
| 3 | `03-desktop-mensajes.png` | E · Sección Mensajes (vacío real del Espacio) |
| 4 | `04-desktop-periodo-vacio-o-bajo.png` | B · Mes anterior vacío / snapshot «En seguimiento ahora» |
| 5 | `05-desktop-conversion-sin-base.png` | C · Conversión **—** (sin denominador) |
| 6 | `06-mobile-con-datos.png` | Mobile con datos |
| 7 | `07-mobile-mensajes.png` | Mobile mensajes |
| 8 | `08-mobile-periodo-vacio-o-bajo.png` | Mobile vacío/bajo |

`RESULT.json`: `last30d` personas=1, opps=1, conversionRate=0, campaigns=0, messages=0, unanswered=0; `conversionNull.preset=previous_month`.

### Revisión visual

| Criterio | Resultado |
| --- | --- |
| Jerarquía historia 1→5 | OK |
| Copy humano / sin UTC técnico | OK |
| Resumen ≠ Ventas (Ganadas vs «De las generadas») | OK |
| Conversión null → «—» (no 0% fingido) | OK |
| Sin embudo Personas→Ganadas | OK |
| Densidad / tokens Growth OS | OK |
| Empty / loading / error | OK |
| Responsive móvil | OK |
| Campañas ranking con datos | N/A en adl (vacío real) |
| Mensajes + sin respuesta > 0 | N/A en adl (0 conversaciones) |

---

## 8. Pruebas

```text
npx tsx --test tests/baseline/growth-analytics-003.test.ts
               tests/baseline/growth-ux-analytics-004.test.ts
→ 29 pass / 0 fail

Typecheck focalizado (filtros Analitica/analytics/labels):
sin errores nuevos en archivos de esta OT.
tsc --noEmit global sigue con baseline preexistente ajeno (IMPLEMENT-003).
```

Semántica funcional del read model **intacta** (tests IMPLEMENT-003 verdes).

---

## 9. Confirmación de no alterar contrato funcional

| Pieza | Estado |
| --- | --- |
| Presets / `[start,end)` UTC | Sin cambios (ocultos en UI) |
| KPIs Resumen / Captación / Ventas / Campañas / Mensajes | Solo presentación |
| `formatConversionPercent(null) → "—"` | Conservado |
| Endpoint GET | Sin cambios |
| Permisos / índices / migración 022 | Sin cambios |

---

## 10. Pendientes reales

1. **Evidencia con campañas periodizadas > 0** y **mensajes / sin respuesta > 0** en un Espacio con datos — hoy adl no los tiene; UI lista, captura no forzada.
2. Sync de `growth.analytics.view` en roles de entornos (plantillas de código ya lo incluyen; Mongo puede requerir sync).
3. Analítica V1 **producto** sigue abierta a cierre formal aparte (esta OT solo cierra diseño visual).

---

## Gate

**APTO VISUAL**

No se abre otra OT desde aquí.
