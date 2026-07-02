# Visual QA — Procedimiento obligatorio

**Código:** OT-BRANDING-005  
**Automatización:** Fuera de alcance v1.0 — procedimiento manual documentado.

---

## Cuándo aplicar

Antes de aprobar cualquier PR que modifique UI, CSS de componentes o tokens semánticos.

---

## Breakpoints de revisión

| Viewport | Ancho | Dispositivo de referencia |
| --- | --- | --- |
| Mobile | &lt; 768px | iPhone 14 / 390×844 |
| Tablet | 768px – 1023px | iPad / 768×1024 |
| Desktop | ≥ 1024px | 1440×900 |
| Wide | ≥ 1600px | Hero y layouts premium |

**Herramientas:** Chrome DevTools → Responsive, o Firefox. Preferir al menos una revisión en navegador real en mobile.

---

## Checklist por breakpoint

### Desktop (≥ 1024px)

- [ ] Layout completo sin overflow horizontal no intencional
- [ ] Jerarquía tipográfica clara (display → body)
- [ ] Hover states visibles en cards y botones
- [ ] Focus ring visible al tabular (`Tab`)
- [ ] Modales centrados; drawer con ancho adecuado
- [ ] Grids de 3–4 columnas alineados

### Tablet (768px – 1023px)

- [ ] Grids colapsan a 2 columnas sin solapamiento
- [ ] Sidebar / drawer no tapa contenido crítico
- [ ] Touch targets ≥ 44×44px en controles principales
- [ ] Tablas con scroll horizontal si es necesario
- [ ] Hero y navegación sin texto cortado

### Mobile (&lt; 768px)

- [ ] Una columna por defecto en listados y cards
- [ ] Texto legible sin zoom (mín. 16px en inputs)
- [ ] Modales y drawers usan altura usable (safe areas)
- [ ] Menú móvil / hamburger funcional
- [ ] CTAs principales accesibles sin scroll excesivo

---

## Branding

- [ ] Solo colores de tokens (`--sem-*`, `--color-*`, `--gray-*`)
- [ ] Sin regresiones vs catálogo `/internal/design-system`
- [ ] `npm run check:branding` → 0 incidencias

---

## Accesibilidad rápida

- [ ] Contraste texto/fondo AA
- [ ] Imágenes informativas con `alt`
- [ ] Formularios con `<label>` o `aria-label`
- [ ] Estados no dependen solo del color (icono o texto)

---

## Flujo de aprobación

```
Implementación
      ↓
Autor revisa en Mobile + Tablet + Desktop
      ↓
check:branding + build
      ↓
PULL_REQUEST_CHECKLIST.md completado
      ↓
Aprobación PR
```

---

## Referencias

- [PULL_REQUEST_CHECKLIST.md](./PULL_REQUEST_CHECKLIST.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- Catálogo: `/internal/design-system`
