# OT-BRANDING-004 — Migración Completa del Panel Administrativo (CMS) a Design Tokens Corporativos

| Atributo | Valor |
| --- | --- |
| OT | OT-BRANDING-004 |
| Prioridad | 🔴 Muy Alta |
| Dependencia | OT-BRANDING-003 ✅ |
| Estado | Completada |
| Fecha cierre | 2026-07-01 |

---

## Objetivo

Eliminar la deuda técnica de branding existente en el CMS y asegurar que el **100 %** de la plataforma utilice exclusivamente los tokens corporativos del SEM.

---

## Alcance ejecutado

| Área | Componentes / archivos | Estado |
| --- | --- | --- |
| Layout administrativo | `ConfigurationLayout`, `ConfigurationHub`, sidebar, topbar, breadcrumbs | ✅ |
| Dashboard / cards | `PortalStatusCard`, widgets de configuración | ✅ |
| Media Manager | `MediaCard`, listados, upload, estados | ✅ |
| Workflows | `workflow-colors.ts`, `defaults.ts`, `WorkflowAdminClient` | ✅ |
| CMS editor | `ContentEditorClient`, `ContentListClient`, `FormEditorClient` | ✅ |
| Formularios / inputs | `ColorPicker`, `PortalCursorForm`, `MenuItemEditor` | ✅ |
| Menús | `NavMenu`, `MenuSortableList`, `MenuBadge`, `IconSelector` | ✅ |
| Defaults CMS | `cms/defaults.ts`, `hero-portal-defaults.ts`, `page-defaults.ts` | ✅ |
| Infraestructura admin | `src/lib/admin/admin-ui.ts` (clases compartidas) | ✅ |
| Validador | `scripts/check-branding.ts` — modo estricto ampliado | ✅ |

### Fuera de alcance (respetado)

Lógica funcional, rutas API, estructura del Experience Kit, responsive/layout.

---

## Mapeo aplicado (admin)

| Patrón legacy | Token destino |
| --- | --- |
| `zinc-*`, `slate-*` | `gray-*`, `background-*`, `border`, `muted`, `foreground` |
| `amber-*`, `yellow-*`, `orange-*` | `--state-warning-*`, `--color-warning` |
| `emerald-*`, `green-*` | `success`, `--state-success-*` |
| `red-*` | `--color-danger`, `--state-danger-*` |
| `blue-*` | `primary`, `secondary`, `accent` |
| HEX workflow (`#3B82F6`, `#F59E0B`, …) | `workflowStateColors` desde `colorDefaults` |
| HEX inline en badges | `color-mix` + CSS custom property |

---

## Validador ampliado

`scripts/check-branding.ts` ahora verifica en modo **estricto** (por defecto):

- HEX fuera de `src/styles/tokens/` e infraestructura autorizada
- `rgb()` / `rgba()` fuera de tokens y `design-tokens.css` / `shadow.ts`
- Estilos inline con colores (`backgroundColor`, `color`, `borderColor`)
- Clases Tailwind prohibidas: `zinc`, `slate`, `amber`, `yellow`, `orange`, `emerald`, `red`, `blue`, etc.
- Valores semánticos de configuración (`background: "primary"`, `"gradient"`) — permitidos

`scripts/branding-baseline.json`: **0 entradas** (modelo baseline deprecado).

---

## Resultados de auditoría

| Indicador | Meta | Resultado |
| --- | --- | --- |
| Baseline Branding | 0 | **0** ✅ |
| Portal Público | ✅ | ✅ |
| Dashboard | ✅ | ✅ |
| CMS | ✅ | ✅ |
| Media Manager | ✅ | ✅ |
| Workflows | ✅ | ✅ |
| Componentes | ✅ | ✅ |
| Build | ✅ | ✅ |
| Branding Check | ✅ | ✅ |

| Métrica | Antes (OT-003) | Después (OT-004) |
| --- | ---: | ---: |
| Baseline branding | 90 | **0** |
| Modo validador | baseline | **estricto** |
| Archivos escaneados | — | 734 |

```bash
npm run check:branding   # ✓ 0 incidencias
npm run build            # ✓ passed
```

---

## Criterios de aceptación

| Criterio | Estado |
| --- | --- |
| Branding centralizado en tokens corporativos | ✅ |
| 0 HEX fuera de archivos de tokens | ✅ |
| 0 colores inline prohibidos | ✅ |
| 0 Tailwind colors prohibidos (zinc, slate, amber, …) | ✅ |
| Experience Kit consistente portal + admin | ✅ |
| `npm run check:branding` → 0 incidencias | ✅ |
| `npm run build` sin errores | ✅ |

---

## Entregables

- `docs/ot/OT-BRANDING-004.md` (este documento)
- `docs/audits/AUDIT-BRANDING-004.md`
- `scripts/branding-baseline.json` (0 entradas)
- `CHANGELOG.md`

---

## Siguiente paso sugerido

**OT-BRANDING-005 — Gobernanza del Design System**: integración CI estricta permanente, documentación oficial, guía para desarrolladores, checklist en PRs y política de nuevos componentes. Con ello el branding deja de ser migración y pasa a ser estándar permanente.

---

## Referencias

- OT anterior: [OT-BRANDING-003](./OT-BRANDING-003.md)
- Auditoría: [AUDIT-BRANDING-004](../audits/AUDIT-BRANDING-004.md)
- Sistema: [BRANDING-SYSTEM.md](../design/BRANDING-SYSTEM.md)
