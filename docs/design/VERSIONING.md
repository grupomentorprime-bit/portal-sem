# Versionado del Design System

**Versión actual:** v1.0  
**Código:** OT-BRANDING-005

---

## Esquema

```
v1.0 (actual)
  ↓
v1.x — nuevos componentes, variantes, tokens semánticos (no breaking)
  ↓
deprecación — @deprecated + aviso en catálogo (mín. 1 minor)
  ↓
v2.0 — eliminación de APIs deprecadas, cambios breaking
```

---

## Qué incrementa cada versión

| Cambio | Versión |
| --- | --- |
| Nuevo componente en `@/components/ui` | MINOR (v1.1) |
| Nueva variante o size en componente existente | MINOR |
| Nuevo alias en `colors.css` (no marca) | MINOR |
| Cambio en `--sem-*` oficial | MAJOR + aprobación institucional |
| Eliminar prop o renombrar variante | MAJOR |
| Deprecar componente | MINOR + aviso; eliminar en MAJOR |

---

## Proceso de deprecación

1. Marcar en código: `@deprecated Usar X — se elimina en v2.0`
2. Actualizar catálogo `/internal/design-system` con banner de deprecación
3. Documentar en CHANGELOG bajo `### Deprecated`
4. Mantener al menos **una versión minor** antes de eliminar
5. En v2.0: remover export, spec y ejemplos

---

## Historial

| Versión | OT | Hitos |
| --- | --- | --- |
| v1.0 | OT-BRANDING-001 → 005 | Tokens SEM, portal + admin migrados, gobernanza, catálogo interno |
| v1.1 | (futuro) | Toast, Table formal, Mosk typography |

---

## Changelog del sistema

Los cambios del Design System se registran en el [CHANGELOG.md](../../CHANGELOG.md) del proyecto bajo secciones `Design System` o releases `v2.x.x`.

No versionar el Design System de forma independiente del monorepo por ahora; la versión `v1.0` es semántica/documental.
