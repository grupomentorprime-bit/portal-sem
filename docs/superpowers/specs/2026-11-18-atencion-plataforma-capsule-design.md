# Atención · Plataforma — Cápsula Mac 2050

**Fecha:** 2026-11-18  
**Estado:** diseño aprobado en chat; pendiente revisión del archivo  
**Alcance:** solo la mesa **Atención · Plataforma** (`serverDesk === "platform"`, `mode === "panel"`, canal mensajes)  
**Fuera de alcance:** Chat en vivo (`live-chat-sheet` / canal `envivo`), Atención de empresa (`is-attention-company`), lógica de tickets/API, adjuntos (ya existentes)

## Objetivo

Separar visualmente la mesa de soporte de plataforma del Chat en vivo y de la Atención de empresa. La mesa debe sentirse como una **cápsula de OS luminosa** (vidrio claro, profundidad suave, tipografía y espaciado modernos), sin cambiar el flujo operativo: buscar, filtrar, abrir ticket, asignar, responder, crear ticket.

## Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Enfoque | **A — Cápsula de mesa** (rearmar presencia/layout visual; no solo piel) |
| Tono | Claro / vidrio; no modo oscuro genérico |
| Chat en vivo | **No tocar**; la cápsula no debe parecerse al sheet de chat |
| Empresa | **No tocar** el shell `is-attention-company` |
| Comportamiento | Conservar acciones, filtros, correlativos, estados, compose de mesa |
| Scope técnico | Estilos + markup mínimo bajo `is-attention-panel`; sin rediseño de dominio |

## 1. Cápsula de ventana

- Aplica únicamente a `.ajustes-window.is-attention-panel` (y su `.attn-shell` interno de mensajes).
- Ventana grande de **vidrio claro**: borde suave, sombra espacial, radios amplios; no modal admin blanco plano.
- Barra superior propia de mesa: título `Atención · Plataforma` + cierre limpio.
- Interior en dos zonas: **tray** (lista) | **escenario** (detalle).
- Prohibido reutilizar patrones visuales del `live-chat-sheet` (compacto, sheet, avatar de chat en vivo).

## 2. Tray (bandeja)

- Columna izquierda tipo bandeja Mac: filas amplias, poco borde duro, selección con wash suave.
- Cada fila: correlativo discreto, asunto fuerte, empresa debajo, estado a la derecha, hora al final.
- Herramientas: buscar + chips (`Sin asignar`, `Sin primera respuesta`, `Filtros`) + **Nuevo ticket** como primaria clara.
- Panel de filtros flotante conservado; look de cristal alineado a la cápsula.
- Misma fuente de datos y filtros actuales (`filterDeskCases`, etc.).

## 3. Escenario (detalle)

- Derecha = escenario amplio.
- Encabezado: correlativo, asunto, meta (empresa / origen / área); acciones de mesa (estado, asignar) como controles flotantes, no toolbar densa.
- Tabs tipo segmento (pastillas), no pestañas admin.
- Hilo con burbujas claras y aire; adjuntos sin cambio de contrato (imagen / PDF / Word).
- Composer inferior en barra de cristal, distinto del composer de Chat en vivo.
- Vacío: “Elige un ticket” centrado, atmósfera ligera.
- **Nuevo ticket** de mesa: compose actual con el lenguaje visual de la cápsula (no el layout de empresa).

## 4. Separación de superficies

| Superficie | Clase / señal | ¿Se rediseña? |
|------------|---------------|---------------|
| Mesa Plataforma | `is-attention-panel` + desk platform | Sí |
| Chat en vivo | `live-chat-sheet` / `channel === "envivo"` | No |
| Atención empresa | `is-attention-company` | No |

Regla de implementación: estilos nuevos scoped a panel de plataforma (p. ej. `.ajustes-window.is-attention-panel …` o modificador dedicado). No alterar selectores globales que el chat o la empresa compartan, salvo extraer variantes.

## 5. Motion

- 2–3 movimientos intencionales: aparición suave de la cápsula, highlight de fila seleccionada, transición ligera tray ↔ escenario en móvil si ya existe.
- Sin glow excesivo, sin partículas, sin “AI purple”.

## 6. Criterios de éxito

- A ojo, la mesa **no** se confunde con Chat en vivo.
- Misma operación de soporte que hoy (sin regresiones de filtros, lectura, assign, reply, open).
- Empresa y chat se ven y se comportan igual que antes.
- Tests de contrato UI de Atención siguen pasando; ampliar asserts de clases/título si hace falta.

## 7. Fuera de este trabajo

- Rediseño del Chat en vivo.
- Rediseño de Atención empresa / dropzone de adjuntos (ya hecho).
- Cambios de API, correlativos, permisos o modelo de casos.
- Dark mode de la mesa.
