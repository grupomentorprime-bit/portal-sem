# AUDIT-BRANDING-004 — Verificación Post-Migración Panel Administrativo (CMS)

| Atributo | Valor |
| --- | --- |
| Código | OT-BRANDING-004 |
| Dependencia | OT-BRANDING-003 |
| Fecha | 2026-07-01 |
| Alcance | Panel administrativo, CMS, Media Manager, Workflows |

---

## Resumen ejecutivo

La migración OT-BRANDING-004 eliminó **las 90 entradas restantes** del baseline de branding. La plataforma completa — portal público y panel administrativo — consume exclusivamente la cadena de tokens corporativos SEM.

El validador opera en **modo estricto**: cualquier HEX, `rgb()`, color inline o clase Tailwind prohibida fuera de los archivos autorizados provoca fallo inmediato en CI y build.

```
brand.css (--sem-*)
  → colors.css (--color-*, --gray-*, --state-*)
    → admin-ui.ts / workflow-colors.ts
      → componentes CMS y layouts admin
```

---

## Verificación por superficie

| Superficie | Clasificación pre (OT-003) | Clasificación post | Incidencias |
| --- | --- | --- | ---: |
| Layout admin (sidebar, topbar) | C | **A** | 0 |
| Dashboard / configuración | C | **A** | 0 |
| Media Manager | C | **A** | 0 |
| Workflows (timeline, badges) | C | **A** | 0 |
| CMS editor / formularios | C | **A** | 0 |
| Menús / iconografía | C | **A** | 0 |
| Portal público | A | **A** | 0 |

---

## Colores y patrones eliminados

| Patrón | Estado |
| --- | --- |
| `zinc-*`, `slate-*` | ✅ Eliminado del admin |
| `amber-*`, `yellow-*`, `orange-*` | ✅ Eliminado |
| `emerald-*`, `red-*`, `blue-*` (decorativos) | ✅ Eliminado |
| HEX workflow (`#6B7280`, `#F59E0B`, `#3B82F6`, …) | ✅ → `workflowStateColors` |
| HEX inline (`#003B73`, `backgroundColor: ${color}22`) | ✅ → tokens / `color-mix` |
| `text-green-600` (éxito formularios) | ✅ → `text-success` |

---

## Archivos clave migrados

### Infraestructura

- `src/lib/admin/admin-ui.ts` — clases compartidas del panel
- `src/core/workflow/workflow-colors.ts` — paleta de estados workflow
- `src/core/workflow/definitions/defaults.ts` — definiciones sin HEX legacy

### Layout y configuración

- `src/components/config/ConfigurationLayout.tsx`
- `src/components/config/ConfigurationHub.tsx`
- `src/components/config/PortalStatusCard.tsx`
- `src/components/config/PortalCursorForm.tsx`
- `src/components/config/HeroPortalPreview.tsx`

### CMS y contenido

- `src/components/cms/ContentEditorClient.tsx`
- `src/components/cms/ContentListClient.tsx`
- `src/components/experience/forms/FormEditorClient.tsx`
- `src/lib/cms/defaults.ts`
- `src/lib/cms/hero-portal-defaults.ts`
- `src/lib/cms/hero-portal-migrate-v2.ts`

### Media y workflows

- `src/components/media/MediaCard.tsx`
- `src/components/workflow/WorkflowAdminClient.tsx`

### Menús

- `src/components/menu/MenuItemEditor.tsx`
- `src/components/menu/MenuSortableList.tsx`
- `src/components/menu/MenuBadge.tsx`
- `src/components/navigation/NavMenu.tsx`
- `src/components/menu/IconSelector.tsx`

### Validador

- `scripts/check-branding.ts` — modo estricto, Tailwind prohibidos ampliados
- `scripts/branding-baseline.json` — **0 entradas**

---

## Métricas finales

| Métrica | Valor |
| --- | ---: |
| Baseline branding | **0** |
| Archivos escaneados | 734 |
| HEX fuera de tokens/ | **0** |
| Clases Tailwind prohibidas | **0** |
| Build | ✅ passed |

---

## Comandos de verificación

```bash
npm run check:branding
# ✓ Branding validation passed (0 incidencias)
#   Archivos escaneados: 734
#   Modo: estricto

npm run build
# ✓ check:branding + next build
```

---

## Conclusión

La línea de migración de branding (OT-BRANDING-001 → 004) queda **cerrada**. La plataforma cumple el estándar corporativo SEM de forma unificada. Se recomienda iniciar OT-BRANDING-005 para gobernanza permanente y evitar regresiones futuras.

---

## Referencias

- OT: [OT-BRANDING-004](../ot/OT-BRANDING-004.md)
- Auditoría portal: [AUDIT-BRANDING-003](./AUDIT-BRANDING-003.md)
- Sistema: [BRANDING-SYSTEM.md](../design/BRANDING-SYSTEM.md)
