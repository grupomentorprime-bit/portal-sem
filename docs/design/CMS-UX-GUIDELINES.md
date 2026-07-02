# Manual UX del CMS — Centro de Administración Institucional

| Atributo | Valor |
| --- | --- |
| OT | OT-CMSV2-001A |
| Versión | 1.0.0 |
| Estado | Vigente |
| Complementa | [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md), [EDITORIAL-ART-DIRECTION.md](./EDITORIAL-ART-DIRECTION.md) |

## Propósito

Este manual define **cómo se construyen las experiencias administrativas** del CMS del SEM (y futuro AprendeHoy) sobre el Experience Kit. Los componentes existen en `src/components/ui` y `src/components/admin`; este documento establece las reglas de composición.

## Principios

1. **Una sola aplicación** — Todas las pantallas `/admin/*` comparten `AdminInstitutionalHeader` + `AdminModuleLayout`.
2. **Lenguaje institucional** — Nunca mostrar al usuario: Tenant, Identity, Engine, Hub, Feature, Membership, Workflow.
3. **Orientado a tareas** — Títulos que respondan “¿qué puedo hacer aquí?”
4. **Editorial, no técnico** — Tarjetas y timelines antes que tablas con nombres de colección.
5. **Responsive por defecto** — Drawer en móvil; acciones críticas siempre accesibles.

## Anatomía de una pantalla

```
┌─────────────────────────────────────────────────────────┐
│ AdminInstitutionalHeader (global, sticky)               │
├─────────────────────────────────────────────────────────┤
│ Breadcrumb: Inicio > Módulo > Sección actual            │
│ Título H1 + descripción breve                           │
│ Acciones primarias (derecha): Guardar, Nuevo, etc.      │
├──────────────┬──────────────────────────────────────────┤
│ Sidebar      │ Contenido principal                      │
│ (opcional)   │ — formularios, tarjetas, listas          │
└──────────────┴──────────────────────────────────────────┘
```

### Componentes canónicos

| Pieza | Componente |
| --- | --- |
| Shell global | `AdminInstitutionalHeader` + `AdminShell` |
| Contexto de módulo | `AdminModuleLayout` |
| Páginas simples | `AdminPageFrame` (wrapper de `AdminModuleLayout`) |
| Migas | `Breadcrumb` vía prop `breadcrumbs` |
| Accesos rápidos | `AdminQuickActions` |

## Breadcrumbs

- Siempre comienzan en **Inicio** (`/admin`) salvo login.
- Máximo 3 niveles visibles: `Inicio > Comunicaciones > Noticias`.
- El último ítem es la página actual (sin enlace).
- Ejemplos:
  - Institución → `Institución > Configuración general`
  - Medios → `Inicio > Biblioteca de medios`
  - Usuarios → `Inicio > Administración > Usuarios CMS`

## Títulos y descripciones

| Evitar | Usar |
| --- | --- |
| Configuration Hub | Configuración general / Institución |
| Content Hub | Centro editorial |
| Media Manager | Biblioteca de medios |
| Content Engine | (no mostrar) |
| Constructor de Páginas | Páginas del portal |
| Equipo (en CMS usuarios) | Usuarios CMS |
| Equipo docente (contenido) | Equipo docente |

**Descripción:** una línea que explique el valor para el administrador, no la implementación.

## Sidebar

Usar cuando hay **4+ secciones** dentro de un módulo (ej. Institución). Reglas:

- Ancho fijo `lg:w-64`.
- Ítem activo: fondo `primary`, texto inverse.
- Ícono + etiqueta institucional (no IDs técnicos).

## Tarjetas vs tablas

| Usar tarjetas | Usar tabla |
| --- | --- |
| Usuarios CMS | Listados densos con 10+ columnas comparables |
| Centro editorial (accesos) | Exportación masiva / datos financieros |
| Biblioteca de medios (grid) | — |
| Dashboard widgets | — |

Tarjetas del Experience Kit: `Card`, `CardHeader`, `CardTitle`, `CardDescription`.

## Formularios

- Agrupar por contexto semántico (Datos personales, Contacto, Seguridad).
- Etiquetas en español institucional.
- Botón primario: **Guardar cambios** / **Enviar invitación**.
- Estado de guardado visible junto al botón (sin cambios / Guardando / Guardado).

## Empty states

- Mensaje claro + acción sugerida.
- Ejemplo: “No hay contenido en esta sección” + enlace “Publicar noticia”.
- Usar `border-dashed` y tono `text-muted`; evitar pantallas en blanco.

## Confirmaciones y diálogos

- Destructivas: texto explícito (“Esta acción no se puede deshacer”).
- Preferir `Modal` del Experience Kit sobre `alert()` / `confirm()` nativos (migración gradual).

## Mensajes de éxito y error

| Tipo | Patrón visual |
| --- | --- |
| Éxito | `adminUi.successText` o banner success |
| Error | `state-danger` border/bg |
| Advertencia | `state-warning` (modo compat, cambios sin guardar) |

Mensajes en español claro: “No se pudo guardar la configuración”, no códigos HTTP.

## Iconografía y color

- Lucide para acciones (Buscar, Notificaciones, Actividad).
- Isotipo SEM en avatares sin foto (`AdminUserAvatar`).
- Badges de estado: verde = activo/seguro, ámbar = pendiente/abierto.
- No usar círculo amarillo genérico para usuarios.

## Responsive

| Viewport | Comportamiento |
| --- | --- |
| `< lg` | `AdminNavDrawer` para navegación principal |
| `≥ lg` | Nav horizontal en header |
| Sidebar módulo | Debajo del título en móvil, columna izquierda en desktop |

## Navegación principal (canónica)

Definida en `src/lib/admin/institutional.ts` → `ADMIN_PRIMARY_NAV`:

Inicio · Portal · Institución · Comunicaciones · Personas · Medios · Administración

No añadir enlaces técnicos al header sin actualizar este manual y la OT correspondiente.

## Checklist para nuevas pantallas admin

- [ ] Usa `AdminModuleLayout` o `AdminPageFrame`
- [ ] Breadcrumbs institucionales
- [ ] Sin términos técnicos visibles
- [ ] Acciones en la zona superior derecha
- [ ] Empty state definido
- [ ] Probado en móvil (drawer + scroll)
- [ ] Documentado en OT si es módulo nuevo

## Visual Experience Builder

Pantalla especial del módulo **Portal** (`/admin/pages/[id]`). Especificación completa: [VISUAL-EXPERIENCE-BUILDER.md](./VISUAL-EXPERIENCE-BUILDER.md).

### Reglas adicionales del builder

| Regla | Detalle |
| --- | --- |
| Layout | Tres columnas: Estructura · Canvas · Propiedades |
| Canvas | Portal real renderizado; nunca formulario central |
| Inspector | Solo campos del bloque activo; sin JSON/HTML |
| Medios | Siempre Biblioteca Institucional (modal) |
| Toolbar propia | `BuilderToolbar` con Guardar, Vista previa, Publicar, Historial |
| Estados | Borrador, Publicada, Programada, Archivada (etiquetas en español) |
| Atajos | Ctrl+S guardar, Ctrl+P vista previa, Ctrl+K buscar |
| Viewport móvil | Mensaje «usa escritorio»; no editor completo en &lt; 1024px |

### Nomenclatura

| Evitar | Usar |
| --- | --- |
| Page Builder | Editor del portal / Constructor visual |
| Block type / settings | Nombre del bloque (Hero, Programas) |
| Variant `sem_premium` | Estilo Premium |
| Slug en UI principal | Solo en configuración avanzada de página |

## Referencias

- [OT-CMSV2-001](../ot/OT-CMSV2-001.md) — Centro de Administración
- [OT-CMSV2-001A](../ot/OT-CMSV2-001A.md) — Unificación del Shell
- [OT-CMSV2-DESIGN-001](../ot/OT-CMSV2-DESIGN-001.md) — Diseño Visual Experience Builder
- [VISUAL-EXPERIENCE-BUILDER.md](./VISUAL-EXPERIENCE-BUILDER.md) — Especificación UX del builder
- `src/lib/admin/institutional.ts` — etiquetas y navegación
