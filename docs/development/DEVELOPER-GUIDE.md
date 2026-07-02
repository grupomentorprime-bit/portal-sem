# Guía de Desarrollo — Portal SEM

Guía obligatoria para todo desarrollo en el Portal Institucional SEM.

---

## Regla oficial

**Ningún desarrollo puede comenzar sin revisar:**

| Documento | Referencia |
| --- | --- |
| Handbook | [HANDBOOK](../HANDBOOK.md) |
| ARQ correspondiente | [architecture/](../architecture/) |
| UX correspondiente | [UX-SEM-001](../ux/UX-SEM-001.md) |
| Manual de Marca | [MANUAL-DE-MARCA](../design/MANUAL-DE-MARCA.md) |
| Moodboard | [MOODBOARD](../design/MOODBOARD.md) |
| OT correspondiente | [Índice de OT](../README.md#órdenes-de-trabajo-ot) |
| Estándar de OT | [OT-STANDARD](./OT-STANDARD.md) |

---

## Reglas para futuras OT

Toda OT nueva **debe**:

- Crear o actualizar documentación en la ubicación oficial (`docs/`)
- Actualizar [README](../../README.md) si corresponde
- Actualizar [Roadmap](../../README.md#roadmap) si aplica
- Actualizar [CHANGELOG](../../CHANGELOG.md)
- Actualizar [RELEASES](../../RELEASES.md)
- Actualizar versión en `package.json` cuando se publique release

Ver plantilla y secciones obligatorias en [OT-STANDARD](./OT-STANDARD.md).

---

## Documentación complementaria

- [Handbook](../HANDBOOK.md)
- [Estándares de código](./CODING-STANDARDS.md)
- [Flujo Git](./GIT-WORKFLOW.md)
- [Documentación CMS](../cms/)

---

## Flujo de trabajo

1. Leer documentación obligatoria (tabla superior).
2. Abrir o crear la OT en `docs/ot/`.
3. Implementar respetando ARQ, UX, diseño y estándares de código.
4. Documentar cambios y cerrar OT con criterios de aceptación.
5. Actualizar changelog, releases y versión según corresponda.
