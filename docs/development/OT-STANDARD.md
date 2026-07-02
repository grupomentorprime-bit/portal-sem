# Estándar de Órdenes de Trabajo (OT) — Portal SEM

Todas las OT del proyecto deben seguir la estructura definida en este documento.

---

## Secciones obligatorias

Cada OT **debe** contener las siguientes secciones, en el orden indicado:

| # | Sección | Descripción |
| --- | --- | --- |
| 1 | **Objetivo** | Propósito y resultado esperado de la OT |
| 2 | **Alcance** | Límites funcionales y técnicos del trabajo |
| 3 | **Arquitectura** | Referencia a documentos ARQ y decisiones arquitectónicas aplicables |
| 4 | **UX** | Referencia a UX-SEM-001 y criterios de experiencia de usuario |
| 5 | **Diseño** | Referencia a Design System, Manual de Marca y Moodboard |
| 6 | **APIs** | Endpoints, contratos y métodos HTTP involucrados |
| 7 | **Base de datos** | Colecciones, esquemas y operaciones de persistencia |
| 8 | **Componentes** | Componentes React y módulos afectados |
| 9 | **Seguridad** | Controles de acceso, autenticación y protección de datos |
| 10 | **Validaciones** | Reglas de validación de entrada y salida |
| 11 | **Documentación** | Documentos a crear o actualizar |
| 12 | **Criterios de aceptación** | Condiciones verificables para dar por cerrada la OT |
| 13 | **Restricciones** | Limitaciones técnicas, de negocio o de integración |

---

## Plantilla

```markdown
# OT-SEM-XXX-NNN — [Título]

| Atributo | Valor |
| --- | --- |
| OT | OT-SEM-XXX-NNN |
| Versión | |
| Estado | |

## Objetivo

## Alcance

## Arquitectura

## UX

## Diseño

## APIs

## Base de datos

## Componentes

## Seguridad

## Validaciones

## Documentación

## Criterios de aceptación

## Restricciones
```

---

## Reglas para futuras OT

Toda OT nueva **debe**:

1. Crear o actualizar documentación en la ubicación oficial (`docs/`)
2. Actualizar [README](../../README.md) si corresponde
3. Actualizar [Roadmap](../../README.md#roadmap) si aplica
4. Actualizar [CHANGELOG](../../CHANGELOG.md)
5. Actualizar [RELEASES](../../RELEASES.md)
6. Actualizar versión en `package.json` al publicar release

---

## Gate de calidad antes de Release Candidate

Ninguna versión candidata a producción (**RC1** o superior) debe liberarse sin:

| Fase | OT / documento | Obligatorio |
| --- | --- | --- |
| Auditoría UX/UI | [UX-AUDIT-001](../audits/UX-AUDIT-001.md) | ✅ Completada antes de RC |
| Demo oficial | [DEMO-001](../demo/DEMO-001.md) | ✅ Completada antes de RC |
| Lint + build | `npm run lint` · `npm run build` | ✅ Sin errores |

La Demo valida la experiencia del usuario final; la Auditoría valida deuda técnica y arquitectura. Ambas generan hallazgos P0/P1 que deben cerrarse o aceptarse explícitamente antes de **OT-SEM-RELEASE-001**.

---

## Referencias

- [Handbook](../HANDBOOK.md)
- [Guía de Desarrollo](./DEVELOPER-GUIDE.md)
- [Índice de OT](../README.md#órdenes-de-trabajo-ot)
