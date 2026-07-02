# AUDIT-CORPORATE-BRANDING-001 — Auditoría Integral de Identidad Visual Corporativa

| Atributo | Valor |
| --- | --- |
| Código | OT-BRANDING-001 |
| Prioridad | 🔴 Alta |
| Tipo | Auditoría de marca (sin cambios funcionales) |
| Estado | Completada |
| Fecha | 2026-07-01 |
| Alcance | Plataforma AprendeHoy — código en `src/` |
| Tokens generados | `src/styles/tokens/brand.css` |

---

## 1. Resumen ejecutivo

Se realizó un barrido automatizado y revisión manual de **721 archivos** en `src/` (TSX, TS, CSS). La plataforma **no cumple** el criterio de usar exclusivamente la paleta oficial del SEM. Existe una capa de tokens correcta (`design-tokens.css`, `colors.ts`) con los cinco colores institucionales, pero **múltiples superficies críticas del portal público ignoran esos tokens** y aplican una paleta paralela «premium» (teal `#14C9C3`, navy `#041525`, dorado `#C9A227`, cyan Tailwind `#0EA5C9`).

**Hallazgos principales:**

| Severidad | Hallazgo |
| --- | --- |
| Crítico | Hero, Header premium y CTAs usan gradientes con colores no oficiales (`#14C9C3`, `#0577B8`, `#FFF4CC`) |
| Crítico | Programas destacados usan dorado `#C9A227` / `#B8921F` — color **prohibido** por Manual |
| Crítico | Acento oficial `#10BCE2` casi sin uso visual (4 ocurrencias); sustituido por teal `#14C9C3` (24 ocurrencias) |
| Alto | Panel administrativo (CMS) usa paleta Tailwind `zinc-*` completa (274 ocurrencias) en lugar de tokens SEM |
| Alto | Cursor personalizado y defaults de portal hardcodean `#14C9C3` / `#0577B8` |
| Medio | Escala de grises funcional (`--gray-50`…`--gray-900`) derivada pero no parte de los 5 oficiales |
| Medio | Workflows admin con colores Tailwind genéricos (`#3B82F6`, `#F59E0B`, `#10B981`) |
| Bajo | Estados de sistema (error/advertencia/éxito) usan `red-*`, `amber-*`, `emerald-*` — aceptables con convención de accesibilidad, deben mapearse a tokens semánticos en fase 2 |

**Cobertura de portales:**

| Portal | Estado en repo | Resultado auditoría |
| --- | --- | --- |
| Portal Público (Home, Programas, Equipo, Noticias, Biblioteca, Contacto, Login) | Implementado | Desviaciones críticas en Hero, Header, Programas |
| Portal Estudiante (Dashboard, Aula, Cursos, etc.) | **No implementado** | Sin código — aplicar tokens desde fase 2 |
| Portal Docente | **No implementado** | Sin código |
| Portal Administrativo (CRM, Finanzas, etc.) | Parcial (`/admin/*` CMS) | Paleta zinc/amber/red genérica |

**Veredicto:** La auditoría habilita una fase 2 de migración. Los tokens oficiales están definidos en `src/styles/tokens/brand.css`. El sistema actual mezcla tres fuentes de color: tokens SEM correctos, tokens «premium» paralelos y utilidades Tailwind genéricas.

---

## 2. Cantidad de colores encontrados

Metodología: escaneo de HEX, `rgb()`/`rgba()`, `hsl()`/`hsla()`, variables CSS de color, clases Tailwind no corporativas e inline styles en `src/`.

| Categoría | Valores distintos |
| --- | ---: |
| Códigos HEX literales | 46 |
| — Oficiales (Manual SEM) | **5** |
| — No oficiales | **39** |
| — Neutros puros (blanco/negro) | 2 |
| Clases Tailwind no corporativas | 71 |
| Expresiones RGB/RGBA/HSL | 47 |
| Estilos inline con color | 29 expresiones |
| Variables CSS de color | 64 |

### Inventario consolidado

```
143 colores distintos (inventario normalizado)
  5 oficiales
138 no oficiales
```

> **Nota metodológica:** el total consolidado de 143 deduplica solapamientos entre formatos (p. ej. `#002A47` en HEX y referencias equivalentes) e incluye clases Tailwind como entradas de color. Los 5 oficiales corresponden exclusivamente a la paleta del Manual Corporativo.

### Paleta oficial (única fuente permitida)

| Token | HEX | Rol |
| --- | --- | --- |
| `--sem-primary` | `#002A47` | Primario |
| `--sem-secondary` | `#246AA1` | Secundario |
| `--sem-accent` | `#10BCE2` | Acento |
| `--sem-success` | `#3ED6AF` | Complementario |
| `--sem-light` | `#8CE27F` | Complementario claro |

---

## 3. Mapa de colores

### 3.1 Colores oficiales

```
#002A47  Primario        9 usos   (tokens, CMS defaults, seed)
──────────
#246AA1  Secundario      8 usos   (tokens, programas, CMS)
──────────
#10BCE2  Acento          4 usos   (solo design-tokens + colors.ts) ⚠ SUBUTILIZADO
──────────
#3ED6AF  Complementario  2 usos   (tokens)
──────────
#8CE27F  Compl. claro    2 usos   (tokens, mapeado como --color-warning)
```

### 3.2 Colores no oficiales — críticos (prohibidos o sustitutos activos)

```
#14C9C3  24 usos  (NO PERMITIDO — reemplaza acento oficial)
         ↳ globals.css, hero-premium.css, cursor.css, cursor-defaults.ts, hero-home.css

#C9A227  2 usos   (NO PERMITIDO — dorado/amber)
         ↳ programs-home.css, content/seed.ts

#B8921F  1 uso    (NO PERMITIDO — dorado hover)
         ↳ programs-home.css

#FFF4CC  1 uso    (NO PERMITIDO — amarillo/crema en gradiente hero)
         ↳ hero-premium.css

#0EA5C9  2 usos   (NO PERMITIDO — cyan Tailwind/sky)
         ↳ globals.css, hero-premium.css

#0577B8  6 usos   (NO PERMITIDO — blue genérico)
         ↳ cursor.css, hero-premium.css, cursor-defaults.ts

#2563EB  1 uso    (NO PERMITIDO — blue-600 Tailwind)
         ↳ globals.css (focus outline fallback)

#041525  12 usos  (NO PERMITIDO — navy alternativo, ≠ primario oficial)
         ↳ hero-premium.css, programs-home.css, globals.css, compat.css

#061F35  6 usos   (cercano a primario — adaptar)
         ↳ globals.css, hero-premium.css

#1A8A7A  1 uso    (NO PERMITIDO — teal genérico)
         ↳ programs-home.css (--fp-teal)

#3B82F6  1 uso    (NO PERMITIDO — blue Tailwind)
         ↳ workflow/definitions/defaults.ts

#F59E0B  2 usos   (NO PERMITIDO — amber, salvo estado sistema)
         ↳ workflow/definitions/defaults.ts

#10B981  3 usos   (NO PERMITIDO — emerald Tailwind)
         ↳ workflow/definitions/defaults.ts
```

### 3.3 Colores no oficiales — neutros funcionales (adaptables)

```
#FFFFFF  37 usos  (superficie — permitido)
#141F29  5 usos   (texto — derivado, mapear a color-mix de --sem-primary)
#5C7289  6 usos   (--color-muted)
#475A6E  5 usos   (--gray-600)
#D1D9E0  4 usos   (--color-border)
#F5F7F9…#141F29  escala --gray-50 a --gray-900 (10 tonos)
#E8EDF2, #DDE5EC, #D8E2EA, #C5D3DF, #F8FAFC  (bordes/superficies header premium)
```

### 3.4 Tailwind no corporativo (top 15 por frecuencia)

```
border-zinc-200     26 usos  (NO PERMITIDO como primario de UI)
text-zinc-500       23 usos
bg-zinc-900         20 usos
border-zinc-800     17 usos
bg-zinc-100         11 usos
text-red-600        10 usos  (estado error — OK con token semántico)
bg-zinc-50           9 usos
text-zinc-400        9 usos
bg-red-50            8 usos
text-red-700         7 usos
bg-amber-50          4 usos  (estado advertencia)
text-amber-500       4 usos
bg-emerald-100       3 usos  (estado éxito)
bg-gray-100          3 usos  (badge/button outline)
text-gray-300        3 usos  (footer/hero legacy UI)
text-blue-600        1 uso   (NO PERMITIDO)
```

---

## 4. Archivos afectados

### 4.1 Críticos — Portal público

| Archivo | Problema | Color detectado | Reemplazo propuesto |
| --- | --- | --- | --- |
| `src/styles/hero-premium.css` | Gradientes hero, CTAs, indicadores | `#14C9C3`, `#0577B8`, `#FFF4CC`, `#041525` | `var(--sem-accent)`, `var(--sem-secondary)`, `var(--sem-primary)` |
| `src/app/globals.css` | Header premium, nav activo, botones hero | `#14C9C3`, `#0EA5C9`, `#061F35`, `#475A6E` | `var(--sem-accent)`, `var(--sem-primary)`, `var(--sem-secondary)` |
| `src/styles/home-premium/programs-home.css` | Badges, precios, CTAs programas | `#C9A227`, `#B8921F`, `#1A8A7A`, `--fp-gold` | `var(--sem-light)` / `var(--sem-accent)` |
| `src/styles/cursor.css` | Cursor premium | `#14C9C3`, `#0577B8` | `var(--sem-accent)`, `var(--sem-secondary)` |
| `src/lib/portal/cursor-defaults.ts` | Defaults cursor | `#14C9C3`, `#0577B8` | `var(--sem-accent)`, `var(--sem-secondary)` |
| `src/styles/home-premium/hero-home.css` | Fondo hero home | `#041525`, `#14C9C3` | `var(--sem-primary)`, `var(--sem-accent)` |
| `src/lib/content/seed.ts` | Timeline seed color dorado | `#C9A227` | `var(--sem-light)` |

### 4.2 Altos — Admin / CMS

| Archivo | Problema | Reemplazo propuesto |
| --- | --- | --- |
| `src/components/config/ConfigurationLayout.tsx` | `zinc-*`, `amber-*`, `emerald-*`, `red-*` | Tokens `--sem-*` + semánticos error/warning/success |
| `src/components/content/ContentHubClient.tsx` | `zinc-*`, `red-*`, `blue-600` | `--gray-*` del DS o alias `--sem-*` |
| `src/components/content/ContentListClient.tsx` | Idem | Idem |
| `src/components/content/ContentEditorClient.tsx` | Idem | Idem |
| `src/components/menu/*` | Paleta zinc completa | Migrar a tokens foundation |
| `src/components/media/*` | amber/emerald/red para estados | `--sem-light` (warning), `--sem-success`, `--color-danger` |
| `src/components/navigation/SiteHeader.tsx` | `zinc-*` borders/backgrounds | `--border`, `--background` |
| `src/components/navigation/NavMenu.tsx` | `zinc-*` | Idem |
| `src/components/navigation/SiteFooter.tsx` | `zinc-*` | Idem |

### 4.3 Medios — Datos y configuración

| Archivo | Problema | Reemplazo |
| --- | --- | --- |
| `src/core/workflow/definitions/defaults.ts` | `#3B82F6`, `#F59E0B`, `#10B981`, `#6B7280` | Tokens workflow basados en `--sem-*` |
| `src/components/workflow/WorkflowAdminClient.tsx` | `#94A3B8` fallback inline | `var(--color-muted)` |
| `src/components/config/PortalCursorForm.tsx` | Gradiente `#041525` → `#062A42` | `color-mix` de `--sem-primary` |
| `src/components/config/HeroPortalPreview.tsx` | `bg-[#041525]` | `bg-[var(--sem-primary)]` |
| `src/components/config/ColorPicker.tsx` | Placeholder `#003B73` | `#002A47` |
| `src/components/menu/MenuItemEditor.tsx` | Placeholder `#003B73` | `#002A47` |

### 4.4 Componentes UI Core — menores

| Archivo | Problema | Reemplazo |
| --- | --- | --- |
| `src/components/ui/footer.tsx` | `text-gray-300`, `border-gray-700` | `text-muted`, `border-border` |
| `src/components/ui/hero.tsx` | `text-gray-300` | `text-muted` |
| `src/components/ui/badge.tsx` | `bg-gray-100 text-gray-700` (neutral) | `bg-background-muted text-muted` |
| `src/components/ui/button.tsx` | `bg-gray-100` (outline/ghost active) | `bg-background-muted` |
| `src/components/ui/skeleton.tsx` | `bg-gray-200` | `bg-gray-100` (token) |
| `src/components/ui/switch.tsx` | `bg-gray-300` unchecked | `bg-gray-200` (token) |

---

## 5. Componentes afectados — Clasificación A / B / C

| Componente | Ubicación | Clase | Observación |
| --- | --- | --- | --- |
| **Buttons** | `ui/button.tsx` | **A** | Usa `bg-primary`, `bg-secondary`, `bg-success` |
| **Buttons (hero/header)** | `globals.css` `.portal-btn-*` | **C** | Gradiente `#14C9C3` → `#0EA5C9` hardcodeado |
| **Cards** | `ui/card.tsx` | **A** | Tokens `--border`, `--background` |
| **Cards (programas premium)** | `FeaturedProgramCard`, `programs-home.css` | **C** | Dorado, teal, navy alternativo |
| **Cards (catálogo)** | `catalog-card.css` | **A** | `--catalog-accent`, `--secondary` |
| **Badges** | `ui/badge.tsx` | **B** | Semánticos OK; variante `neutral` usa `gray-*` |
| **Badges (programas)** | `ProgramBadge.tsx` + CSS | **C** | Tono `gold` explícito |
| **Tabs** | `ui/tabs.tsx` | **A** | Tokens semánticos |
| **Navbar (Core UI)** | `ui/navbar.tsx` | **A** | `text-primary`, `text-secondary` |
| **Navbar (portal premium)** | `globals.css` header | **C** | HEX hardcodeados, acento teal |
| **Footer (Core UI)** | `ui/footer.tsx` | **C** | `gray-300`, `gray-700` Tailwind |
| **Footer (portal premium)** | `footer-premium.css`, `footer-home.css` | **A** | `var(--primary)`, `var(--text-inverse)` |
| **Hero (premium)** | `hero-premium.css` | **C** | Paleta paralela completa |
| **Hero (Core UI)** | `ui/hero.tsx` | **B** | `text-gray-300` en descripción |
| **Timeline** | `timeline.css`, `timeline-home.css` | **A** | `--primary`, `--timeline-accent` |
| **Program Cards** | `portal/home/programs/*` | **C** | `--fp-gold`, `--fp-teal` |
| **Program Cards (legacy)** | `institutional/ProgramCard.tsx` | **A** | `bg-accent/15`, `text-secondary` |
| **Teacher Cards** | `people-grid.css`, `teachers-home.css` | **A** | Tokens semánticos |
| **News Cards** | `news-grid.css` | **A** | `--secondary`, `--accent` |
| **Forms (portal)** | `experience-forms.css`, `PortalFormFields` | **A** | Tokens foundation |
| **Forms (admin)** | `ConfigurationLayout`, editors | **C** | Paleta zinc Tailwind |
| **Inputs** | `ui/input.tsx`, `ui/select.tsx` | **A** | `--border`, focus ring accent |
| **Tables** | `MediaListTable.tsx` | **B** | Estructura OK; badges emerald/amber |
| **Charts** | — | **N/A** | No implementados en codebase |
| **Alerts** | `ui/alert.tsx` | **A** | Variantes con tokens semánticos |
| **Dialogs / Modals** | `ui/modal.tsx`, `ui/drawer.tsx` | **A** | Tokens foundation |
| **Sidebar** | Admin nav en `ConfigurationLayout` | **C** | `bg-zinc-900`, `zinc-*` |
| **Stepper** | — | **N/A** | No implementado |
| **Calendar** | — | **N/A** | No implementado (agenda usa cards) |
| **Dashboard Widgets** | `PortalStatusCard.tsx` | **B** | emerald/amber/red para estados |
| **Cursor premium** | `cursor.css`, `PremiumCursor.tsx` | **C** | Teal/blue no oficial |
| **Workflow badges** | `WorkflowAdminClient.tsx` | **C** | Colores Tailwind en definiciones |

**Resumen clasificación:**

| Clase | Cantidad | % |
| --- | ---: | ---: |
| A — Solo corporativos | 18 | 56% |
| B — Cercanos / adaptables | 6 | 19% |
| C — Colores ajenos | 8 | 25% |
| N/A — No implementado | 3 | — |

---

## 6. Mapa de prioridad

### Crítico (Semanas 1–2)

| Superficie | Motivo |
| --- | --- |
| **Hero** | Primera impresión; gradientes con amarillo, teal y blue genérico |
| **Header** | Visible en 100% páginas públicas; nav activo `#14C9C3` |
| **Footer público** | Coherencia de cierre de página |
| **Programas** | Dorado `#C9A227` en badges, precios y CTAs |
| **Botones CTA hero/header** | Gradiente cyan no oficial |

### Medio (Semanas 3–4)

| Superficie | Motivo |
| --- | --- |
| **Timeline** | Aceptable (A); revisar acentos por ítem desde CMS seed |
| **Noticias** | Grid conforme; validar imágenes overlay |
| **Contacto** | `contact-hub.css` usa tokens; verificar formularios |
| **Cursor premium** | Marca secundaria pero visible en home |
| **Login / Registro** | `LoginForm` OK; página admin login con `amber-700` |

### Bajo (Semanas 5–8)

| Superficie | Motivo |
| --- | --- |
| **Administración CMS** | Audiencia interna; zinc consistente pero no SEM |
| **Dashboard widgets** | Estados semánticos — mapear a tokens |
| **Reportes / Workflows** | Colores de estado en definiciones JSON |
| **Design System showcase** | Referencia interna; actualizar swatches |

---

## 7. Mapa de reemplazo hacia colores corporativos

| Color actual | Usos aprox. | Token destino | Notas |
| --- | ---: | --- | --- |
| `#14C9C3` | 24 | `var(--sem-accent)` `#10BCE2` | Sustituto más usado del acento real |
| `#041525`, `#061F35`, `#062A42`, `#053049`… | 20+ | `var(--sem-primary)` + `color-mix()` | Variantes navy → derivar de primario |
| `#0577B8`, `#0EA5C9`, `#2563EB`, `#3B82F6` | 10 | `var(--sem-secondary)` / `var(--sem-accent)` | Eliminar blues Tailwind |
| `#C9A227`, `#B8921F`, `#FFF4CC` | 4 | `var(--sem-light)` `#8CE27F` | Eliminar dorado/amarillo |
| `#1A8A7A` (--fp-teal) | 1 | `var(--sem-success)` `#3ED6AF` | Teal programas |
| `#10B981` (emerald) | 3+ | `var(--sem-success)` | Estados éxito |
| `#F59E0B`, `amber-*` | 15+ | `var(--sem-light)` + `--color-warning` | Solo estados advertencia |
| `red-*` (error) | 40+ | `--color-danger` `#B42318` | Mantener accesibilidad WCAG |
| `zinc-*` / `gray-*` Tailwind | 274 | `--gray-*` / `--border` / `--background` | Neutros del design system |
| `#003B73` (placeholder) | 2 | `#002A47` | Alinear placeholder a primario |

---

## 8. Plan de migración priorizado (Fase 2)

### Fase 2.1 — Fundación (Sprint 1)

1. Importar `src/styles/tokens/brand.css` en `globals.css`.
2. Alias en `design-tokens.css`: `--color-primary-default: var(--sem-primary)` etc.
3. Deprecar variables paralelas: `--fp-gold`, `--fp-teal`, `--fp-navy`, `--cursor-primary`.
4. Script CI: `grep` bloqueando `#14[Cc]9[Cc]3`, `#C9A227`, `bg-blue-`, `bg-sky-`, `bg-cyan-`, `bg-yellow-`, `bg-amber-` (excepto en tests de auditoría).

### Fase 2.2 — Portal público (Sprint 2–3)

1. Refactor `hero-premium.css`: gradientes con `color-mix(in srgb, var(--sem-primary) …)`.
2. Refactor `globals.css` header premium: eliminar HEX, usar tokens.
3. Refactor `programs-home.css`: eliminar `--fp-gold`; mapear badges a `--sem-light` / `--sem-accent`.
4. Actualizar `cursor-defaults.ts` y `cursor.css`.
5. QA visual: Home, Programas, Programa individual, Contacto.

### Fase 2.3 — Componentes Core UI (Sprint 4)

1. `ui/footer.tsx`, `ui/hero.tsx`: eliminar `gray-*` Tailwind.
2. `ui/badge.tsx`, `ui/button.tsx`: neutral variant con tokens.
3. Validar `DesignSystemShowcase` como referencia post-migración.

### Fase 2.4 — Admin y datos (Sprint 5–6)

1. Crear primitivos admin: `AdminShell`, `AdminCard` con tokens (no zinc).
2. Migrar `ConfigurationLayout`, content/menu/media clients.
3. Workflow defaults: paleta basada en `--sem-*`.
4. Validar CMS color picker contra paleta oficial (whitelist).

### Fase 2.5 — Portales futuros (Sprint 7+)

1. Estudiante, Docente, CRM: **obligatorio** usar solo `var(--sem-*)` desde scaffold.
2. Documentar en `docs/design/DESIGN-SYSTEM.md` regla: cero HEX literal en componentes.

---

## 9. Reglas de conformidad (post-migración)

### Prohibido

Amarillos, dorados, amber decorativo, orange, purple, indigo, pink, red/blue/sky/cyan Tailwind **como color de marca**.

### Permitido

| Uso | Color |
| --- | --- |
| Marca | Solo `--sem-primary`, `--sem-secondary`, `--sem-accent`, `--sem-success`, `--sem-light` |
| Superficies | `#FFFFFF`, escala `--gray-*` derivada del primario |
| Error | `--color-danger` (accesibilidad) |
| Advertencia | `--sem-light` o token `--color-warning` |
| Éxito | `--sem-success` |

---

## 10. Criterio de aceptación — verificación

| Criterio | Estado actual | Post Fase 2 |
| --- | --- | --- |
| 100% UI usa paleta oficial | No | Objetivo |
| Cero dorado/amber decorativo | No (`#C9A227`) | Objetivo |
| Acento `#10BCE2` en superficies visibles | No (domina `#14C9C3`) | Objetivo |
| Tokens `--sem-*` como única fuente | Parcial (archivo creado) | Import + alias |
| Inventario completo documentado | Sí (este documento) | Mantener |
| Plan migración priorizado | Sí (§8) | Ejecutar |

---

## Anexo A — Herramienta de auditoría

Script reproducible: `scripts/audit-colors.mjs`  
Salida JSON: `scripts/audit-colors-output.json` (generado, no versionado).

```bash
node scripts/audit-colors.mjs
```

## Anexo B — Referencias

- Tokens oficiales: `src/styles/tokens/brand.css`
- Tokens existentes: `src/styles/design-tokens.css`, `src/design/tokens/colors.ts`
- Auditoría UX previa: `docs/audits/UX-AUDIT-001.md`
