# SEM · Admisión — embudo + cola primero en Ventas

## Goal

Hacer que la línea de conversión de SEM refleje admisión real, y que `/admin/ventas` priorice la cola de atención (“qué hacer ahora”) sobre el Kanban genérico.

## Context

El embudo default (Abierta / En seguimiento) no encaja con cómo convierte SEM. Growth OS ya tiene Growth Core, embudos por Espacio, bandas de atención y vistas Kanban/Lista. Esta entrega reusa ese núcleo: no hay un segundo CRM ni un módulo Admisión aparte.

## Decisions

- Alcance: solo Espacio **SEM (T001)** para embudo, migración y copy de página.
- Enfoque: cola primero + embudo SEM (no solo textos; no módulo nuevo).
- Vista por defecto de `/admin/ventas`: **`cola`**. Switcher: **Cola · Kanban · Lista**.
- Renombrar el embudo **default** existente a **Admisión** y reemplazar etapas intermedias (conservar `funnelKey` de oportunidades).
- Resultados de plataforma sin cambio: Ganada, Perdida, Archivada, Traspasada.
- Captación (formulario / WhatsApp / admisión) abre en etapa inicial `interes`.
- Nav global “CRM - Conversión” / tabs del grupo: fuera de alcance.

## Embudo SEM

Etapas intermedias (keys inmutables):

| key | label | inicial |
| --- | --- | --- |
| `interes` | Interés | sí |
| `contactado` | Contactado | |
| `orientacion` | Orientación | |
| `postulacion` | Postulación | |
| `en-revision` | En revisión | |
| `listo-matricular` | Listo para matricular | |

Cierres fijos de plataforma: `won`, `lost`, `archived`, `handed_off`.

## Migración (solo SEM)

One-shot, idempotente:

1. Asegurar embudo default con nombre Admisión y las 6 etapas.
2. Oportunidades abiertas:
   - etapa vieja inicial (`open` u otra inicial genérica) → `interes`
   - otras intermedias viejas (p. ej. seguimiento) → `contactado`
3. Resultados finales: no se mueven.
4. `nextAction`, responsable e historial: no se reescriben.
5. Etapa abierta desconocida → `interes` + log; el batch no aborta entero.
6. Segunda corrida no duplica etapas ni remapea lo ya migrado.

## Superficie Ventas (UX)

### Vista Cola (principal)

Lista priorizada de oportunidades abiertas:

1. Vencidas  
2. Sin seguimiento  
3. Estancadas  
4. Resto  

Dentro de cada banda: por fecha de próxima acción / última actividad.

Cada fila: persona (postulante), etapa, próxima acción (+ vencimiento), responsable, chip de atención si aplica. Click → `/admin/ventas/[id]`.

### Franja de atención

Chips existentes (Vencidas, Sin seguimiento, Estancadas, Mías, Sin responsable) filtran la cola. No hay panel comercial aparte.

### Kanban / Lista

- Kanban: columnas = etapas del embudo; vista secundaria de stock.
- Lista: búsqueda y filtros actuales.

Sin `?vista=` → `cola`.

### Copy SEM (página Ventas)

- Título: **Admisión**
- Descripción: postulantes y próximas acciones del Espacio
- Vacíos orientados a admisión (no “Sin oportunidades” genérico de columna vacía)
- Implementación: override mínimo tenant-aware en la lectura/labels de Ventas para T001; no hardcodear SEM en el núcleo de embudos

## Architecture

```
Captación / WhatsApp / form
        ↓
Growth Core (Persona → Oportunidad en interes)
        ↓
/admin/ventas  →  vista cola (default) | kanban | lista
        ↓
mismas lecturas (ventas-read / bandas / board)
```

### Piezas

| Área | Cambio |
| --- | --- |
| `admin/ventas` + `VentasListClient` | Vista `cola`; default; switcher |
| `ventas-read` / `ventas-view` / prioridad | Orden de cola sobre bandas existentes; sin nuevo store |
| Labels / branding de página | Override SEM para título, descripción, vacíos |
| Migración one-shot SEM | Etapas + remap de status abiertos |
| Tests baseline | Default `cola`, switcher, mapeo, copy SEM |

### Permisos

Sin cambio: `growth.sales.*` para ver/operar; `growth.funnels.manage` para etapas.

## Out of scope

- Renombrar nav global CRM / Conversión
- Módulo Admisión separado
- IA, montos, empresas, cambio de embudo mid-flight
- Otros Espacios (ADL, etc.)
- Rediseño visual completo del shell admin

## Error / edge cases

- Sin oportunidades: empty de admisión
- Filtro de banda sin matches: empty de esa atención; UI intacta
- Kanban con 6 columnas: scroll horizontal actual
- Otros tenants: sin cambio de etapas ni copy

## Done when

1. SEM tiene embudo de 6 etapas y oportunidades viejas mapeadas.
2. Entrar a Ventas en SEM muestra Cola primero, con próxima acción visible.
3. Kanban y Lista operan sobre el mismo embudo.
4. Tests baseline verdes para vista default + migración.
