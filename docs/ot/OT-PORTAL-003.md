# OT-PORTAL-003 — Dirección de Arte Institucional (Editorial Identity)

| Atributo | Valor |
| --- | --- |
| OT | OT-PORTAL-003 |
| Épica | [EP-001 — Portal Institucional Premium](../strategy/epics/EP-001-PORTAL-INSTITUCIONAL-PREMIUM.md) |
| Prioridad | 🔴 Alta |
| Dependencia | EP-000 ✅ · OT-PORTAL-001 ✅ |
| Estado | ⚪ Planificada |
| Tipo | Diseño / Identidad / Producto |

---

## Objetivo

Definir y **aplicar** una dirección de arte única para el portal del Seminario Eclesiástico Mayor, inspirada en la identidad histórica del SEM y reinterpretada bajo un lenguaje editorial contemporáneo.

El objetivo no es parecer una plataforma de cursos, sino una **institución de formación ministerial de excelencia**.

---

## Principio rector

> Cada pantalla debe comunicar primero el llamado ministerial y la formación bíblica; la tecnología debe percibirse como el medio que hace posible esa experiencia.

---

## Documento rector (permanente)

La especificación completa vive en:

**[docs/design/EDITORIAL-ART-DIRECTION.md](../design/EDITORIAL-ART-DIRECTION.md)**

Este documento complementa el Experience Kit:

| Capa | Documento | Función |
| --- | --- | --- |
| Construcción | Experience Kit | Tokens, componentes, accesibilidad |
| Comunicación | Dirección de Arte Editorial | Identidad, fotografía, lenguaje, storytelling |

---

## Alcance de implementación

| Área | Entregable | Estado |
| --- | --- | --- |
| Guía permanente | `EDITORIAL-ART-DIRECTION.md` | ✅ Documentada |
| Gradientes institucionales | Tokens CSS `--gradient-*` derivados de `--sem-*` | ⚪ Pendiente |
| Guía fotográfica operativa | Ejemplos aprobados/rechazados + preset | ⚪ Pendiente |
| Glosario de lenguaje | Copy UI/CMS alineado (§8 de la guía) | ⚪ Pendiente |
| Variantes editoriales | Cards, timeline, badges — sin look SaaS | ⚪ Pendiente |
| Biblioteca gráfica SEM | Patrones, sellos, texturas SVG/CSS | ⚪ Pendiente |
| Aplicación Home | Elevar tratamiento visual post OT-PORTAL-001 | ⚪ Pendiente |
| Aplicación páginas secundarias | Programas, admisión, institución | ⚪ Pendiente |
| Checklist PR / Visual QA | Integrar criterios §15 en procesos de revisión | ⚪ Pendiente |

### Fuera de alcance

- Nuevos colores de marca fuera de `--sem-*` (Manual Corporativo)
- Cambios breaking en módulos LOCKED sin OT de revisión
- Sustitución del Experience Kit por componentes paralelos

---

## Fases sugeridas

### Fase 1 — Fundamentos (documentación + tokens)

1. Publicar `EDITORIAL-ART-DIRECTION.md` ✅
2. Definir tokens de gradiente institucional en `src/styles/tokens/`
3. Actualizar [COLORS.md](../design/COLORS.md) con uso editorial de gradientes
4. Integrar checklist §15 en [PULL_REQUEST_CHECKLIST.md](../design/PULL_REQUEST_CHECKLIST.md)

### Fase 2 — Lenguaje y assets

1. Auditoría de copy: reemplazar términos SaaS por glosario institucional
2. Curar / reemplazar fotografías genéricas en CMS y demo
3. Documentar guía fotográfica con preset y ejemplos

### Fase 3 — Componentes editoriales

1. Variantes editoriales de Card, Timeline (Ruta Formativa), Section headers
2. Microdetalles: líneas, citas, versículos, badges
3. Biblioteca gráfica SEM (patrones, sellos)

### Fase 4 — Aplicación y QA

1. Home — refinamiento visual sobre narrativa OT-PORTAL-001
2. Páginas clave: `/programas`, `/admision`, `/institucion`
3. Visual QA con checklist §15 + `check:branding` + `build`

---

## Criterios de aceptación

| Criterio | Verificación |
| --- | --- |
| Guía permanente publicada | `docs/design/EDITORIAL-ART-DIRECTION.md` |
| Checklist §15 en flujo de PR | `PULL_REQUEST_CHECKLIST.md` |
| Gradientes solo con tokens `--sem-*` | `check:branding` |
| Glosario aplicado en UI pública principal | Revisión copy |
| Fotografías alineadas a dirección §4–5 | Media library + demo |
| Home no confundible con LMS comercial | QA visual + checklist §15 |
| Build sin errores | `npm run build` |
| OT + AUDIT + CHANGELOG al cierre | Documentación |

### Pregunta final (obligatoria por pantalla)

> ¿Podría confundirse con Coursera o Udemy?

Si la respuesta es **sí** → no aprobar.

---

## Resultado esperado

Al cerrar OT-PORTAL-003 (y EP-001), el portal transmite la imagen de un **Seminario Eclesiástico contemporáneo**: tradición bíblica, excelencia académica y tecnología en equilibrio.

El visitante debe pensar:

> *"Aquí no solo enseñan teología. Aquí forman personas para servir a Dios."*

---

## Referencias

- Guía: [EDITORIAL-ART-DIRECTION.md](../design/EDITORIAL-ART-DIRECTION.md)
- Experience Kit: [INTRODUCTION.md](../design/INTRODUCTION.md)
- Home narrativo: [OT-PORTAL-001](./OT-PORTAL-001.md)
- Home visual: [HOME-PREMIUM-v2-ART-DIRECTION.md](../design/HOME-PREMIUM-v2-ART-DIRECTION.md)
- Épica: [EP-001](../strategy/epics/EP-001-PORTAL-INSTITUCIONAL-PREMIUM.md)
