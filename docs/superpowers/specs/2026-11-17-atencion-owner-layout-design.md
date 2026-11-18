# Atención — layout del dueño (maqueta NELZURI)

## Goal

La ventana Atención en la mesa de **plataforma del dueño** debe verse y navegarse como la maqueta de 3 columnas (navegación · conversaciones · escenario), usando **solo datos reales** del API de atención. El dock y el modo cliente no cambian en este corte.

## Context

- Hoy `DesktopAttention` ya monta un shell de 3 columnas en `mode === "panel"`, con vistas, áreas, lista por organización y tabs del caso. La captura que el usuario rechazó es la UI anterior (pestañas horizontales + banner de cliente + 2 columnas).
- La maqueta de referencia muestra: sidebar con vistas y áreas coloreadas, lista de organizaciones con preview, chat con estado/tabs/composer, y dock con Equipo (fuera de alcance).
- Decisiones ya tomadas con el usuario:
  1. Layout de maqueta + datos reales (sin conversaciones inventadas).
  2. Solo dueño en mesa de plataforma.
  3. Solo la ventana Atención; el dock (Equipo) se queda como está.

## Decisions

### Alcance

- **Incluye:** rediseño visual y de navegación del `mode === "panel"` para igualar la maqueta; badges y filtros con conteos/casos reales; panel derecho con Conversación / Solicitudes / Información sobre el caso seleccionado; empty states honestos.
- **Excluye:** app Equipo en el dock; modo `client`; presencia real «en vivo» (sigue `attentionOnline() === false`); datos demo; correo; canales externos.

### Layout (panel dueño)

Tres columnas fijas:

1. **Navegación (`attn-nav`)**
   - Marca Atención + subtítulo «Centro de atención y soporte».
   - Vistas, en este orden y con estas etiquetas: Conversaciones, En vivo, Mis casos, Sin asignar, Pendientes, Resueltos.
   - Badges numéricos reales (tope `99+`) en las vistas que apliquen; En vivo muestra punto de presencia, no un conteo inventado.
   - Bloque «Áreas de atención» con puntos de color por área activa; clic filtra por `areaId` (toggle).
   - Sin banner ni pie de presencia en este corte (la maqueta no lo muestra; la presencia real llega después). Queda prohibido el copy de tono cliente («Si escribes, el caso queda pendiente…») en el panel del dueño.

2. **Bandeja (`attn-inbox`)**
   - Título Conversaciones + cierre.
   - Filtro «Todas las áreas» y búsqueda «Buscar organización…».
   - Lista agrupada por organización (`groupAttentionOrgs`): nombre, preview `área · asunto`, hora, indicador no leído.
   - Sin botón «+ Nueva atención» en el panel del dueño (abrir caso es del cliente).
   - Vacío: «No hay organizaciones en esta vista.» (o el mensaje específico de En vivo / sin áreas).

3. **Escenario (`attn-stage`)**
   - Con organización/caso: cabecera (empresa, área, badge de estado vía `statusLabel`), tabs Conversación / Solicitudes / Información, composer en Conversación.
   - Solicitudes: solo registros comerciales/productos reales del caso (`commercial` / `productLabel`); si no hay, empty state claro.
   - Información: código, prioridad, assignee, contexto, eventos reales.
   - Sin selección: «Elige una organización para atenderla.»

### Datos

- Fuente única: `GET/POST /api/desktop/attention`.
- Vistas reutilizan `AttentionView` + `filterAttentionCases` sin inventar estados nuevos.
- Mapeo de etiquetas de UI (sin cambiar IDs de filtro):
  - `general` → Conversaciones
  - `vivo` → En vivo
  - `mias` → Mis casos
  - `sin_asignar` → Sin asignar
  - `pendientes` → Pendientes
  - `resueltos` → Resueltos
- Estado visible: `abierto` → «En gestión»; `pendiente` → «Pendiente»; `resuelto` → «Resuelto» (ya en `statusLabel`).

### Modo cliente

Sin cambios de layout en este corte. Sigue su shell de 2 columnas.

### Enfoque técnico

Reordenar y pulir el `mode === "panel"` de `DesktopAttention` + CSS en `mentor-desktop.css`. No crear un segundo componente dueño ni cambiar el contrato del API salvo que falte un campo ya previsto en el modelo público.

## Architecture

```
MentorDesktop (dock sin cambio)
  └── DesktopAttention mode="panel"
        ├── attn-nav (vistas + áreas)
        ├── attn-inbox (orgs filtradas)
        └── attn-stage (OrgStage: tabs + hilo)
              └── /api/desktop/attention
```

## Error handling

- Fallo de carga: mensaje de error existente; no se inventa bandeja.
- Lista vacía: empty state en bandeja; escenario vacío o colapsado (`is-idle`) sin fingir orgs.
- En vivo sin presencia: lista vacía con copy de operador.

## Testing

- Mantener / ajustar tests baseline de atención y contrato de escritorio si cambian etiquetas visibles o selectores.
- Verificación manual en `/escritorio` como Owner Mentor Prime: 3 columnas, badges reales, abrir un caso existente si hay, empty states si no hay.

## Fuera de alcance (explícito)

- Icono Equipo en el dock.
- Rediseño del modo cliente.
- Presencia multi-agente real.
- Semillas / mock data en producción o UI.
- Cambiar Clientes, Ajustes o Growth Mensajes.
