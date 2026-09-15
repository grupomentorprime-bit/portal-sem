# OT-GROWTH-UX-ACTIVITY-002 — Diseño final de Actividad V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-UX-ACTIVITY-002 |
| Tipo | Diseño / UX |
| Agente | AGENTE 1 — Diseño / UX |
| Fecha | 2026-09-11 |
| Entrada | [OT-GROWTH-ACTIVITY-001](./OT-GROWTH-ACTIVITY-001.md) (APTO) |
| Estado | **CERRADA · APTO VISUAL** |
| Alcance | Diseño final de `/admin/actividad` sobre el contrato de lectura existente |
| Fuera de alcance | Backend · adaptador · API · índices · permisos · Growth Core · Ventas · Mensajes · Automatizaciones · Event Bus · Ajustes › Auditoría · Shell · Inicio · DNS/Meta/WhatsApp |

**Restricciones cumplidas:** sin lógica/datos/motores nuevos; solo endpoint existente; sin métricas ni actividad simulada; sin rediseñar Shell ni superficies hermanas.

---

## Gate final

**APTO VISUAL**

`/admin/actividad` queda como historial comercial vivo: cabecera humana, filtros del contrato, timeline agrupado por día, acciones reales y estados vacíos/carga/error recuperable, alineado a la línea visual congelada de Growth OS.

---

## 1. Qué cambió

| Antes | Después |
| --- | --- |
| Lista mínima tipo auditoría (`AdminPageFrame` + `divide-y`) | Timeline aireado con iconografía suave por categoría |
| Copy técnico de Espacio | «Todo lo que ha pasado en tu negocio, en un solo lugar.» |
| Paginación por enlace que reemplazaba la página | «Cargar más» que acumula vía `GET /api/growth/actividad` |
| Sin acciones | «Ver persona» / «Ver oportunidad» solo con IDs del feed |
| Sin estados de filtro vacío / carga / error | EmptyState diferenciado, skeleton al cambiar filtro, banner recuperable |

Idea principal cubierta: en segundos se responde «¿Qué ha pasado en mi negocio?» con historias humanas como protagonista.

---

## 2. Archivos modificados / creados

### Creados

| Archivo | Rol |
| --- | --- |
| `src/components/admin/growth/ActividadFeedClient.tsx` | UI final: filtros, timeline, estados, cargar más |
| `scripts/capture-growth-ux-activity-002.ts` | Capturas Playwright con datos reales |
| `tests/baseline/growth-ux-activity-002.test.ts` | Regresión de superficie / copy / no-toques |
| `docs/AI/auditorias/OT-GROWTH-UX-ACTIVITY-002-evidence/*` | Evidencia visual |
| `docs/AI/auditorias/OT-GROWTH-UX-ACTIVITY-002.md` | Esta acta |

### Modificados

| Archivo | Cambio |
| --- | --- |
| `src/app/admin/actividad/page.tsx` | Auth/permisos + lectura SSR → `ActividadFeedClient` |
| `src/lib/growth/labels.ts` | Copy de cabecera, vacío, filtro sin resultados, error, acciones |

### No tocados (según OT)

Adaptador `actividad-read` · proyección `actividad-view` · API route · índices · permisos · Ventas/Mensajes/Automatizaciones · Event Bus · `settings/activity` · Shell · Inicio · DNS/Meta/WhatsApp.

---

## 3. Capturas

Directorio: [`OT-GROWTH-UX-ACTIVITY-002-evidence/`](./OT-GROWTH-UX-ACTIVITY-002-evidence/)

Tenant de captura: **adl** (datos reales; sin actividad inventada).

| # | Archivo | Qué valida |
| --- | --- | --- |
| 1 | `01-desktop-todos.png` | Desktop · filtro Todos · timeline |
| 2 | `02-desktop-filtro-con-datos.png` | Desktop · Ventas con datos |
| 3 | `03-mobile-todos.png` | Mobile 390×844 · historia primero |
| 4 | `04-estado-vacio.png` | Filtro Automatizaciones sin resultados (vacío real) |

`RESULT.json`: `filterWithData=ventas`, `emptyKind=filtro`.

### Revisión visual

| Criterio | Resultado |
| --- | --- |
| Legibilidad / historia protagonista | OK |
| Densidad aireada (sin cards pesadas) | OK |
| Alineación timeline + iconos | OK |
| Filtros contrato exactos | OK |
| Acciones solo con IDs del feed | OK |
| Ausencia de IDs/JSON/claves técnicas | OK |
| Ancho controlado en desktop | OK (`max-w-2xl`) |
| Mobile: filtros con scroll horizontal | OK (Automatizaciones fuera del primer pliegue) |

---

## 4. Responsive

| Viewport | Comportamiento |
| --- | --- |
| Desktop | Timeline centrado, ancho máximo ~42rem; no se estira a todo el lienzo |
| Mobile | Historia → meta → acciones táctiles (`min-h-9`); filtros en fila con overflow-x |

Shell V2 intacto (sidebar desktop / chrome móvil).

---

## 5. Estados diseñados

| Estado | Tratamiento |
| --- | --- |
| Historial con actividad | Grupos Hoy / Ayer / Hace N días · story · señal · tiempo · actor secundario · CTAs |
| Filtro sin resultados | «No hay actividad en este filtro» + ayuda no técnica |
| Historial completamente vacío | «Aún no hay actividad» + copy OT (reproducible cuando el Espacio no tiene hechos) |
| Cargando | Skeleton de timeline al cambiar filtro (`useTransition`) |
| Error recuperable | `AlertBanner` + «Reintentar» (fallo de «Cargar más» o refresh) |
| Cargar más | Botón cuando existe `nextCursor`; acumula items sin perder los previos |

Jerarquía aplicada:

1. Frase humana (`story`)
2. Persona / oportunidad vía CTAs
3. Hora + actor («por …» solo si aporta; se omite Growth OS / Formulario web / Admisión / Equipo / misma persona)
4. Categoría/canal con icono suave + etiqueta (`WhatsApp`, `Ventas`, `Automatización`, …)

---

## 6. Pruebas / regresiones

| Suite | Resultado |
| --- | --- |
| `tests/baseline/growth-ux-activity-002.test.ts` | Pass |
| `tests/baseline/growth-activity-001.test.ts` | Pass (contrato + superficie lectura) |

Capturas: `npx tsx --env-file=.env scripts/capture-growth-ux-activity-002.ts` con `npm run dev`.

---

## 7. Riesgos

| Riesgo | Severidad | Nota |
| --- | --- | --- |
| Espacios con poca actividad se ven «cortos» | Info | Datos reales; no se inventan hechos |
| Vacío general no capturado en ADL | Baja | Sí se capturó vacío de filtro real; vacío total solo si el Espacio no tiene feed |
| «Cargar más» depende del API existente | Baja | Mismo contrato `ok/items/nextCursor`; sin cambios de backend |
| Actor «Equipo» en story cuando no hay operador | Info | Viene del humanizer del backend (fuera de alcance UX) |

---

## 8. Respuesta ejecutiva

| Pregunta | Respuesta |
| --- | --- |
| ¿Nueva lógica / motor / colección? | **No.** |
| ¿Datos del endpoint existente? | **Sí.** |
| ¿Shell / Inicio / Mensajes tocados? | **No.** |
| ¿Lenguaje técnico en UI? | **No** (frases humanas + señales suaves) |
| ¿Abrir otra OT? | **No** automáticamente |
| **GATE** | **APTO VISUAL** |

---

**Fin del acta OT-GROWTH-UX-ACTIVITY-002.**
