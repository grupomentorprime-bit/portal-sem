# Atención — formulario Plataforma, filtros flotantes y título por desk

## Goal

En la mesa **Plataforma**, el alta de ticket exige empresa explícita en cada apertura, y los filtros de bandeja no deben robar espacio a la lista. El título de ventana identifica el desk. Dentro de una empresa (p. ej. Mentor Capacitación), la misma cuenta Owner ve la capa cliente (**Mis tickets** + empresa fija).

## Context

- `DesktopAttention` ya distingue `serverDesk === "platform"` vs `"company"` y monta `CompanySpace` en empresa.
- En Plataforma el selector de empresa existe, pero el placeholder dice «Elige una empresa» y el estado del formulario puede sobrevivir entre aperturas si el componente no se remonta de forma explícita.
- El panel `attn-filter-panel` es inline: al abrirlo empuja la lista. Los selects escriben filtros al instante (sin borrador ni Aplicar).
- El título de ventana en Plataforma es solo «Atención».

## Decisions

### Alcance

- **Incluye:** Compose en mesa Plataforma; panel Filtros flotante con draft + Aplicar; título `Atención · Plataforma`; verificación Owner en Mentor Capacitación (Mis tickets + empresa fija, sin cambios de modelo/API).
- **Excluye:** rediseño de `CompanySpace`; chat en vivo; nuevos endpoints; cambios de permisos.

### Nuevo ticket (Plataforma)

- Valor inicial del selector: vacío, etiqueta visible **Seleccionar empresa**.
- **Enviar ticket** deshabilitado mientras falte empresa, área o descripción (trim).
- Cada apertura (tras Cancelar/Volver, tras enviar, o al pulsar de nuevo Nuevo ticket) remonta Compose con una `key` de sesión de composición, de modo que empresa y campos vuelven al estado inicial.
- Dentro de empresa: sin cambios de producto; empresa fija de solo lectura (nombre del espacio activo) y envío con ese `tenantId`.

### Filtros (solo mesa Plataforma / panel)

- Botón **Filtros** cerrado al entrar (`filtersOpen = false`).
- Contador en el botón = número de criterios **aplicados** (no del draft). En Plataforma cuenta: empresa, origen, estado, prioridad, responsable.
- Panel **flotante** (overlay anclado al botón / zona de tools): no reflow de la lista de tickets.
- Al abrir, el draft se copia desde los filtros aplicados.
- Selects del panel mutan solo el draft.
- **Aplicar:** escribe draft → aplicados, cierra el panel, actualiza contador y lista.
- **Limpiar:** vacía el draft en el panel; al **Aplicar**, quedan 0 filtros activos (lista sin esos criterios).
- Chips **Sin asignar** / **Sin primera respuesta** siguen fuera del panel (comportamiento actual, toggle inmediato).

### Título de ventana

- Plataforma (`serverDesk === "platform"`, canal mensajes): **Atención · Plataforma**.
- Empresa: se mantiene la cabecera existente (`Atención | {empresa}` / Mis tickets); no se fuerza el título de Plataforma.
- Chat en vivo: sin cambio («Chat en vivo»).

### Verificación manual

Con la misma cuenta Owner:

1. Escritorio en **Plataforma** → Atención → Nuevo ticket: «Seleccionar empresa»; Enviar deshabilitado; elegir empresa + campos → habilita; cancelar o enviar y volver a abrir → selector limpio.
2. Abrir Filtros (cerrado al entrar) → ajustar draft → Aplicar → panel cerrado, badge con N, lista filtrada sin haber perdido altura por el panel.
3. Entrar a **Mentor Capacitación** → Atención: **Mis tickets**; Nuevo ticket con Mentor Capacitación fija (sin selector de empresa).

## Architecture

```
DesktopAttention
  ├── title: "Atención · Plataforma" | "Atención" | "Chat en vivo"
  ├── applied filters (companyId, originId, …) → listed / activeFilterCount
  ├── draft filters + filtersOpen → floating panel → Aplicar | Limpiar
  └── Compose key={composeSession}
        ├── platform: select empresa vacío (“Seleccionar empresa”)
        └── company: empresa fija (lockedTenantId / spaceName)
```

Archivos previstos: `DesktopAttention.tsx`, `mentor-desktop.css`; tests baseline de atención/contexto si hay aserciones de copy o selectores.

## Error handling

- Sin empresa en Plataforma: no se envía; botón deshabilitado (y `required` en el select).
- Fallo de POST: mensaje existente; el formulario no se considera “enviado” (no se limpia por éxito).
- Abrir Filtros con error de carga: mismo empty/error de bandeja; el panel no inventa datos.

## Testing

- Ajustar o añadir baseline si se fija el copy «Seleccionar empresa» o el título.
- Verificación manual Owner: Plataforma + Mentor Capacitación según la sección Verificación.

## Fuera de alcance

- Extraer componentes `AttentionFilters` / `ComposeTicket` a archivos nuevos (opcional en un corte posterior).
- Cambiar lógica de `attentionDeskScope` / API (ya resuelta en el corte de contexto).
- Dock, Equipo, presencia en vivo.
