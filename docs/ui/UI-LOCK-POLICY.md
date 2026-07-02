# UI Lock Policy — OT-ARCH-UX-001 + OT-DESIGN-HOME-001

## Objetivo

Evitar que OTs de UX rompan componentes previamente aprobados.  
La Home v2 sigue la [dirección de arte](../design/HOME-PREMIUM-v2-ART-DIRECTION.md): experiencia editorial, no CMS.

## Metodología v2 (obligatoria)

Ninguna sección se implementa sin diseño previo aprobado.

| Fase | Acción | Entregable |
| --- | --- | --- |
| **1 — Diseño** | Mockup o captura de referencia | Aprobación en 1920 / 1366 / 1024 / 390 |
| **2 — Implementación** | Código = diseño aprobado | OT de implementación scoped |
| **3 — Lock** | Componente aprobado | Estado LOCKED + comparación Antes/Después en cambios futuros |

## Reglas

### 1. Componentes LOCKED

Un componente marcado como **LOCKED** no puede modificarse sin una OT de desbloqueo explícita (ej. `OT-UNLOCK-HERO-001`).

### 2. CSS aislado por bloque

Cada sección Home tiene su propio archivo en `src/styles/home-premium/`:

| Archivo | Bloque |
| --- | --- |
| `hero-home.css` | `[data-block="hero"]` |
| `programs-home.css` | `[data-block="academic_offer"]` |
| `why-study-home.css` | `[data-block="feature_grid"]` |
| `timeline-home.css` | `[data-block="timeline"]` |
| `teachers-home.css` | `[data-block="people"]` |
| `news-home.css` | `[data-block="news"]` |
| `cta-home.css` | `[data-block="cta_premium"]` |
| `contact-home.css` | `[data-block="contact_hub"]` |
| `footer-home.css` | Footer en contexto Home |

**Prohibido** que un archivo de sección modifique selectores de otra sección.

### 3. Scoped CSS

Todas las reglas de composición Home deben anclarse al bloque:

```css
.portal-home-experience [data-block="academic_offer"] .portal-catalog-card { ... }
```

**Evitar** selectores globales sueltos:

- `section { }`
- `.container { }`
- `.reveal { }` sin scope
- `.card { }` sin scope

### 4. `!important`

No usar `!important` salvo en `home-premium/compat.css`, documentado con comentario y razón (puentes con Experience Kit LOCKED).

### 5. Capturas Antes / Después

Toda OT visual debe incluir capturas comparativas en los cuatro breakpoints antes de cerrarse.

### 6. Checklist de cierre

- [ ] Hero sin regresiones
- [ ] Header sin regresiones
- [ ] Footer sin regresiones
- [ ] CSS nuevo scoped a `[data-block]`
### 7. Estándar visual v2

- Hero LOCKED = piso de calidad para toda la Home
- No cuatro cajas iguales; no grids repetitivos sin jerarquía
- Ritmo claro ↔ oscuro; fotografía protagonista
- Ver [HOME-PREMIUM-v2-ART-DIRECTION.md](../design/HOME-PREMIUM-v2-ART-DIRECTION.md)

## Referencias

- [UI-COMPONENT-STATUS.md](./UI-COMPONENT-STATUS.md)
- [HOME-PREMIUM-v2-ART-DIRECTION.md](../design/HOME-PREMIUM-v2-ART-DIRECTION.md)
