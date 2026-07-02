# Principios de diseño

**Experience Kit v1.0**

---

## 1. Una sola fuente de verdad

Todo color, espaciado y tipografía proviene de tokens. Los componentes consumen variables CSS (`var(--color-primary)`), clases semánticas (`bg-primary`, `text-muted`) o utilidades del tema — nunca valores literales.

**Cuándo aplicarlo:** Siempre. Si necesitas un color, busca el token semántico antes de escribir una clase nueva.

---

## 2. Reutilizar antes de crear

Antes de un componente nuevo, verificar `@/components/ui` y el catálogo en `/internal/design-system`.

**Cuándo aplicarlo:** Cualquier botón, card, input, badge o estado vacío. Las implementaciones paralelas generan deuda y regresiones de branding.

---

## 3. Consistencia institucional

La interfaz refleja la identidad del Seminario Eclesiástico Mayor: sobria, clara, accesible. Evitar ornamentación excesiva, sombras pesadas o paletas ajenas a la marca.

**Cuándo aplicarlo:** Portal público, CMS, emails transaccionales y futuros módulos académicos.

---

## 4. Accesibilidad por defecto

Contraste WCAG AA, foco visible, navegación por teclado y roles ARIA en componentes interactivos.

**Cuándo aplicarlo:** Todo componente que reciba foco o transmita estado (formularios, modales, tabs, alertas).

---

## 5. Responsive desde el diseño

Mobile-first. Probar en desktop, tablet y mobile antes de aprobar cambios visuales.

**Cuándo aplicarlo:** Layouts, grids, tipografía fluida y componentes con overflow (tablas, timelines).

---

## 6. Multi-tenant por tokens, no por forks

Un tenant nuevo redefine `--sem-*` en su capa de marca. No se copian ni bifurcan componentes.

**Cuándo aplicarlo:** White-label, campus adicionales o marcas derivadas dentro de AprendeHoy.

---

## 7. Evolución versionada

Nuevos componentes entran en v1.x con documentación. La deprecación sigue un ciclo explícito antes de eliminación.

**Cuándo aplicarlo:** Cambios breaking en props, variantes o tokens. Ver [VERSIONING.md](./VERSIONING.md).

---

## Anti-patrones (prohibidos)

| Anti-patrón | Alternativa |
| --- | --- |
| `style={{ color: '#002A47' }}` | `className="text-primary"` |
| `bg-zinc-500`, `text-amber-600` | `bg-gray-500`, `text-warning` |
| Duplicar `Button` en un módulo | Importar `@/components/ui/button` |
| Nuevo token en `brand.css` sin aprobación | Usar alias existente o escala `--gray-*` |
| Componente sin spec ni catálogo | Seguir [CONTRIBUTING.md](./CONTRIBUTING.md) |
