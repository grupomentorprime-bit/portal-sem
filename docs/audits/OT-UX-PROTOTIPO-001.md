# OT-UX-PROTOTIPO-001 — Prototipo Visual Integral del Nuevo Centro SEM

| Atributo | Valor |
| --- | --- |
| Código | OT-UX-PROTOTIPO-001 |
| Estado | **Aprobado** (revisión final 2026-07-03) |
| Prioridad | Crítica |
| Tipo | UX / UI / Product Design |
| Dependencias | [OT-UX-AUDITORIA-001](./OT-UX-AUDITORIA-001.md) · [OT-UX-BLUEPRINT-001](./OT-UX-BLUEPRINT-001.md) |
| Fecha | 2026-07-03 |
| Restricción | **Cero código de producción** — solo diseño y validación visual |

---

## Declaración de cumplimiento

| Criterio de aceptación | Estado |
| --- | --- |
| No se modificó ningún archivo de `src/`, configs ni APIs | ✅ |
| No se escribió lógica de producción | ✅ |
| Prototipo completo del nuevo Centro SEM | ✅ |
| Sidebar definitivo diseñado | ✅ |
| Layout Maestro definitivo visualizado | ✅ |
| Coherencia visual entre módulos | ✅ |
| Navegación validable antes de implementar | ✅ |

**Artefactos visuales (abrir en navegador):**

| Entregable | Archivo |
| --- | --- |
| **Prototipo navegable** | [`index.html`](../prototypes/ot-ux-prototipo-001/index.html) |
| **Shell administrativo** | [`shell.html`](../prototypes/ot-ux-prototipo-001/shell.html) |

Usar la barra superior del prototipo para alternar **Desktop · Notebook · Tablet · Mobile**.

---

## Verificación Blueprint ↔ Código (pre-diseño)

Revisión ejecutada el 2026-07-03 antes de elaborar mockups:

| Tema | Blueprint | Código actual | Acción prototipo |
| --- | --- | --- | --- |
| Rutas `page.tsx` | 32 | **33** (+ `settings/roles`) | Prototipo Admin incluye Roles en sub-menú Administración |
| Shell | Sidebar objetivo | Nav horizontal `AdminInstitutionalHeader` | Prototipo muestra **sidebar fijo** (objetivo V2) |
| Etiqueta inicio | «Inicio» | `/admin` dashboard | OT prototipo pide **Dashboard** — adoptado en mockups |
| Nav ERP futuro | Agrupación plana | No existe en código | Prototipo expande **Académico / Admisión / Estudiantes** con badge «Próximo» |
| Tokens marca | `#002A47`, `#246AA1`, `#10BCE2` | `colors.ts` + `brand.css` | Aplicados en prototipo HTML |
| Permisos nav | Todos con `requiredAnyPermission` | Confirmado `institutional.ts` | Sidebar prototipo asume filtrado IAM en implementación |

**Nota:** El Blueprint §4 (sidebar) describe el **estado implementable Fase 1**. Este prototipo visualiza además la **visión ERP AprendeHoy** solicitada en la OT (Cursos, Mallas, CRM, Expedientes, etc.), marcada visualmente como «Próximo». Al aprobar el prototipo, actualizar Blueprint §4 con tabla Fase 1 vs Roadmap.

---

# Entregable 1 — Mockup general del Centro SEM

Vista consolidada del sistema: chrome persistente + workspace modular.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ☰  [SEM] Centro SEM │ Seminario Eclesiástico Mayor   🟢 Portal  🟢 CMS     │
│                              ⌕ Buscar… ⌘K    🔔  ⚡  [MS]                   │
├──────────────┬──────────────────────────────────────────────────────────────┤
│  Dashboard ● │ Inicio › Dashboard                                           │
│ ──────────── │ Buenos días, Marco                    [Portal] [+ Acción]    │
│ Institución  ├──────────────────────────────────────────────────────────────┤
│ Portal       │  KPIs · Alertas · Actividad · Accesos · Tareas               │
│ Académico ▾  │                                                              │
│ Admisión ▾   │  ┌─────────────┐  ┌──────────────────────────────────────┐ │
│ Estudiantes▾ │  │ Accesos     │  │ Actividad reciente + Alertas         │ │
│ Comunicac.   │  │ rápidos     │  │                                      │ │
│ Personas     │  └─────────────┘  └──────────────────────────────────────┘ │
│ Medios       │                                                              │
│ Admin        │                                                              │
│ ──────────── │                                                              │
│ Ayuda        │                                                              │
│ [MS] Perfil  │                                                              │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

**Abrir:** [index.html](../prototypes/ot-ux-prototipo-001/index.html) → pantalla Dashboard por defecto.

---

# Entregable 2 — Shell Administrativo

## Zonas del shell

| Zona | Altura / ancho | Contenido |
| --- | --- | --- |
| **TopBar** | 56px fijo | Logo, tenant, estado sistema, ⌘K, notificaciones, acciones rápidas, avatar |
| **Sidebar** | 248px / 72px colapsado | Navegación funcional completa |
| **Breadcrumbs** | — | Debajo del chrome, encima del H1 |
| **ModuleHeader** | — | H1 + descripción + acciones primarias |
| **Workspace** | flex 1 | Dashboard opcional → filtros → contenido → panel lateral opcional |
| **Footer** | — | No aplica en admin (banner prototipo solo en HTML demo) |

## Estados del shell

- **Desktop (≥1280px):** sidebar expandido 248px, topbar completa con buscador.
- **Notebook (1024–1279px):** sidebar colapsable a 72px; KPIs en grid 2×2.
- **Tablet (<1024px):** sidebar overlay drawer; buscador en topbar oculto (acceso vía ⌘K).
- **Mobile (<768px):** una columna; tablas con scroll horizontal; cards apiladas.

---

# Entregable 3 — Sidebar definitivo

Estructura visual aprobada para validación (iconografía Lucide en implementación):

```
Dashboard                          ← /admin
─────────────────────────────────────
Institución                        ← /admin/config
Portal                             ← hub páginas/menús/forms/studio
Académico
  · Programas                      ← /admin/content/programs  [Fase 1]
  · Cursos                         [Próximo · ERP]
  · Mallas                         [Próximo · ERP]
  · Docentes                       [Próximo · ERP]
Admisión
  · CRM                            [Próximo · ERP]
  · Formularios                    ← /admin/portal/forms  [Fase 1]
  · Postulantes                    [Próximo · ERP]
  · Matrículas                     [Próximo · ERP]
Estudiantes
  · Expedientes                    [Próximo · ERP]
  · Asistencia                     ← asuntos-estudiantiles  [Fase 1]
  · Certificados                   [Próximo · ERP]
  · Historial                      [Próximo · ERP]
Comunicaciones                     ← /admin/content hub
Personas                           ← /admin/content/people
Medios                             ← /admin/media
Administración                     ← users, integrations, workflows, events, roles
─────────────────────────────────────
Ayuda                              ← /admin/settings/help
Perfil                             ← settings/profile (footer sidebar)
```

### Estados visuales

| Estado | Tratamiento |
| --- | --- |
| **Activo** | Fondo `#002A47`, texto blanco, radio 8px |
| **Hover** | Fondo `#F5F7F9` |
| **Colapsado** | Solo iconos 72px; tooltips en implementación |
| **Sub-ítem** | Indent 30px; tipografía 12px |
| **Próximo** | Pill `#EEF6FC` «Próximo» — no navegable en Fase 1 |
| **Filtrado IAM** | Ítems ocultos si sin permiso (no mostrar disabled) |

---

# Entregable 4 — TopBar definitiva

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [☰] [◇ SEM] Centro SEM │ Seminario Eclesiástico Mayor                      │
│     ● Portal activo  ● CMS operativo                                       │
│                    [ ⌕ Buscar en el centro…  ⌘K ]  [🔔] [⚡]  [MS ▾]        │
└────────────────────────────────────────────────────────────────────────────┘
```

| Elemento | Comportamiento |
| --- | --- |
| Logo | Isotipo SEM + wordmark «Centro SEM» |
| Tenant | Nombre institucional (no slug técnico) |
| Estado sistema | Pills: portal público, CMS, integraciones |
| Buscador global | Placeholder + atajo ⌘K; Fase 2 = búsqueda real |
| Notificaciones | Panel dropdown (invitaciones, alertas SSL, actividad) |
| Acciones rápidas | Crear noticia, formulario, subir medio |
| Perfil | Avatar iniciales → menú Perfil, Seguridad, Actividad, Salir |

---

# Entregable 5 — Mockups de los 10 módulos

Todos siguen Layout Maestro (TopBar + Sidebar + ModuleHeader + Workspace). Detalle en prototipo HTML:

| # | Módulo | Pantalla prototipo | Plantilla layout |
| ---: | --- | --- | --- |
| 1 | **Dashboard** | KPIs 4 col, accesos 3×2, tareas tabla, actividad panel | Hub + ModuleDashboard |
| 2 | **Institución** | Split: sub-nav lateral + formulario branding | Configuration + RightPanel |
| 3 | **Portal** | FilterBar + DataTable páginas | Listado estándar |
| 4 | **Programas** | KPIs + cards programa | Hub académico |
| 5 | **Admisión** | Formularios cards + flujo convocatoria | Hub admisión |
| 6 | **Asuntos estudiantiles** | Asistencia: buscar + tabla + Guardar | Operaciones tabla |
| 7 | **Personas** | Grid cards con foto | Grid editorial |
| 8 | **Comunicaciones** | Hub 6 cards (noticias, eventos, etc.) | Hub editorial |
| 9 | **Medios** | Filtros + grid thumbnails | Biblioteca |
| 10 | **Administración** | Usuarios cards + invitar | Gestión accesos |

Módulos «Próximo» (Cursos, CRM, Expedientes…) reservan mismo layout con placeholder — ver HTML.

---

# Entregable 6 — Experience Kit Administrativo (AEK v1)

Pantalla dedicada en prototipo: **Experience Kit** en sidebar.

| Componente | Especificación visual |
| --- | --- |
| **Cards** | Borde `#D1D9E0`, radio 10px, hover borde `#246AA1` |
| **Tablas** | Header uppercase 11px muted; filas 13px; acciones al final |
| **KPIs** | Valor 28px bold; delta verde `#3ED6AF` |
| **Badges** | success / warning / neutral / info — fondos pastel |
| **Botones** | Primario `#002A47`; outline borde neutro |
| **Filtros** | Input + selects inline, gap 10px |
| **Buscadores** | Icono ⌕ + placeholder contextual |
| **Formularios** | Labels 13px; inputs borde `#D1D9E0`, radio 8px |
| **Dialogs** | Panel max 400px; acción destructiva `#B42318` |
| **Drawers** | Panel derecho 380px; en móvil full-screen overlay |
| **Timeline** | Hora 11px muted + texto actividad |
| **Panel lateral** | 380px fijo en split layout |

---

# Entregable 7 — Sistema de dashboards

## Dashboard maestro (`/admin`)

- 4 KPIs institucionales
- Grid 6 accesos rápidos (tareas frecuentes)
- Tabla «Próximas tareas» con badges estado
- Panel derecho: actividad reciente + alertas

## Dashboards de módulo (patrón)

| Módulo | KPIs ejemplo |
| --- | --- |
| Programas | Publicados · Borradores · Destacados |
| Formularios | Activos · Respuestas · Borradores |
| Comunicaciones | Por sub-sección en hub cards (no KPI numérico obligatorio) |
| Medios | Total archivos · Espacio · Recientes |

Regla: **máximo 4 KPIs** por pantalla; sin duplicar H1 en hero secundario.

---

# Entregable 8 — Guía visual de navegación

## Jerarquía

1. **Global:** Sidebar + TopBar (nunca cambian entre módulos)
2. **Módulo:** Breadcrumb refleja ruta lógica (no URL técnica)
3. **Sub-módulo:** Acordeón en sidebar o sub-nav lateral (Institución)
4. **Acción:** Siempre arriba-derecha en ModuleHeader

## Convenciones

| Acción | Ubicación |
| --- | --- |
| Crear recurso | Botón primario ModuleHeader derecha |
| Guardar | ModuleHeader; pill «Cambios sin guardar» si dirty |
| Filtrar | Debajo del header, antes de tabla |
| Destructiva | Dialog AEK; nunca `window.confirm` |
| Volver | Breadcrumb clickeable |

## Mapa mental usuario

```
Dashboard → elegir módulo (sidebar)
         → hub con cards O listado directo
         → detalle / editor
         → guardar → toast → permanecer o volver a listado
```

---

# Entregable 9 — Propuesta responsive

| Breakpoint | Sidebar | TopBar | Workspace |
| --- | --- | --- | --- |
| **Desktop ≥1280** | 248px fijo | Completa | Split 1fr + 380px panel |
| **Notebook 1024–1279** | 72px default o toggle | Completa | KPI 2×2; split apila panel debajo |
| **Tablet 768–1023** | Drawer overlay | Sin buscador inline | Tablas scroll-x |
| **Mobile <768** | Drawer full-height | Solo logo + menú + avatar | Una columna; acciones wrap |

Implementación CSS de referencia en `index.html` (`@media` queries).

---

# Entregable 10 — Prototipo navegable

| Recurso | Descripción |
| --- | --- |
| [index.html](../prototypes/ot-ux-prototipo-001/index.html) | SPA estática: cambio de pantallas por sidebar, sin backend |
| Pantalla **Flujos UX** | Recorridos documentados con enlaces a pantallas |

### Flujos visualizados

**1. Buscar estudiante → Asistencia → Guardar**

```
Dashboard → Estudiantes › Asistencia → [Buscar estudiante…] → marcar Presente/Ausente → [Guardar]
```

**2. Crear formulario → Publicar**

```
Admisión › Formularios → [+ Crear] → editor tabs → [Publicar]
```

**3. Crear programa → Generaciones**

```
Académico › Programas → [+ Nuevo] → editor → pestaña Generaciones (futuro ERP)
```

**4. Enviar comunicación**

```
Comunicaciones → Noticias → [+ Nueva] → editor → seleccionar audiencia → [Publicar]
```

---

# Identidad visual SEM / AprendeHoy

| Token | Valor | Uso |
| --- | --- | --- |
| Primary | `#002A47` | Sidebar activo, botones primarios, avatar |
| Secondary | `#246AA1` | Links, hover cards |
| Accent | `#10BCE2` | Focus, highlights, pills info |
| Success | `#3ED6AF` | Estados positivos, deltas KPI |
| Danger | `#B42318` | Acciones destructivas |
| Surface | `#FFFFFF` | Cards, chrome |
| Background | `#F5F7F9` | Workspace |
| Foreground | `#141F29` | Texto principal |
| Muted | `#5C7289` | Labels, breadcrumbs |
| Border | `#D1D9E0` | Divisores, inputs |
| Tipografía | Manrope | Alineado a portal público |

---

# Próximo paso

Tras **aprobación formal** de este prototipo:

→ **OT-UX-IMPLEMENTACIÓN-001** — desarrollo gradual del Shell Administrativo con feature flag `ADMIN_SHELL_V2`.

---

# Checklist de revisión para stakeholders

- [x] Sidebar: agrupación por dominios — **ajuste: escalar a plataforma AprendeHoy multi-tenant**
- [x] Badge «Próximo» para módulos ERP fuera de Fase 1
- [x] Dashboard: KPIs y accesos rápidos validados
- [x] TopBar: estados de sistema aceptados; branding dinámico por tenant en implementación
- [x] Layout Maestro elimina triple hero
- [x] Responsive drawer sidebar aceptado
- [x] Flujos UX validados

---

# Acta de aprobación (revisión final)

| Aspecto | Resolución |
| --- | --- |
| Etapa Diseño (Auditoría + Blueprint + Prototipo) | **Cerrada y aprobada** |
| OT siguiente autorizada | [OT-UX-IMPLEMENTACIÓN-001](../ot/OT-UX-IMPLEMENTACION-001.md) |
| Feature flag | `ADMIN_SHELL_V2` |
| Condición 1 | Shell = plataforma **AprendeHoy** multi-tenant, no exclusivo SEM |
| Condición 2 | Sidebar por **dominios funcionales** escalables |
| Condición 3 | Layout Maestro obligatorio sin excepciones no justificadas |
| Condición 4 | AEK como única fuente de componentes — **antes** de migrar módulos |
| Condición 5 | Implementación gradual por 4 fases |

---

*Documento generado en cumplimiento de OT-UX-PROTOTIPO-001. Cero modificaciones en `src/`.*
