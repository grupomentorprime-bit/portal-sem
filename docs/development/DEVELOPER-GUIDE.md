# Guía de Desarrollo — Growth OS

Guía obligatoria para desarrollo en **Growth OS** (este repositorio).

Producto ≠ cliente: Growth OS es la plataforma; SEM (T001) y ADL (T002) son Espacios; Aprende Hoy es otro sistema. Ver [GLOSSARY](../GLOSSARY.md) y [ADR-009](../architecture/ADR-009.md).

---

## Regla oficial

**Ningún desarrollo puede comenzar sin revisar:**

| Documento | Referencia |
| --- | --- |
| Handbook | [HANDBOOK](../HANDBOOK.md) |
| Glosario | [GLOSSARY](../GLOSSARY.md) |
| ADR-008 / ADR-009 / ADR-010 | [architecture/](../architecture/) |
| OT correspondiente | [validation/](../validation/) o [ot/](../ot/) |
| Estándar de OT | [OT-STANDARD](./OT-STANDARD.md) |

Si el trabajo toca el pack visual del cliente SEM (T001):

| Documento | Referencia |
| --- | --- |
| UX SEM | [UX-SEM-001](../ux/UX-SEM-001.md) |
| Manual de Marca | [MANUAL-DE-MARCA](../design/MANUAL-DE-MARCA.md) |
| Moodboard | [MOODBOARD](../design/MOODBOARD.md) |

---

## Reglas para futuras OT

Toda OT nueva **debe**:

- Crear o actualizar documentación en la ubicación oficial (`docs/`)
- Actualizar [README](../../README.md) si cambia la orientación de entrada o el mapa hoy/roadmap
- Actualizar [CHANGELOG](../../CHANGELOG.md) / [RELEASES](../../RELEASES.md) cuando corresponda a un release
- Actualizar versión en `package.json` cuando se publique release
- **No** presentar CRM / Growth Core / automatizaciones como capacidades ya disponibles
- **No** reescribir OTs, auditorías o ADRs históricos solo para cambiar nombres

Ver plantilla en [OT-STANDARD](./OT-STANDARD.md).

---

## Documentación complementaria

- [Handbook](../HANDBOOK.md)
- [Glosario](../GLOSSARY.md)
- [Handoff → Aprende Hoy](../architecture/GROWTH-OS-HANDOFF-APRENDE-HOY.md)
- [TENANT-GUIDELINES](../core/TENANT-GUIDELINES.md)
- [Estándares de código](./CODING-STANDARDS.md)
- [Flujo Git](./GIT-WORKFLOW.md)
- [Documentación CMS](../cms/)

---

## Flujo de trabajo

1. Leer documentación obligatoria (tabla superior).
2. Abrir o crear la OT en `docs/validation/` (frentes Growth) o `docs/ot/`.
3. Implementar respetando ADR-008/009, Core UI y estándares de código.
4. Documentar cambios y cerrar OT con criterios de aceptación.
5. Actualizar changelog / releases según corresponda.
