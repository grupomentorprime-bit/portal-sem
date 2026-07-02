# CORE EXPERIENCE ACTIONS v1.0

**Estado:** LOCKED

Motor transversal del Experience Framework. Resuelve cualquier acción configurable desde el CMS — navegación, formularios, modales, contacto, descargas, flujos de negocio — sin que los componentes conozcan la implementación.

## Principio

Un único contrato (`ExperienceAction`) y un único registry para todo el Portal Experience Kit.

**Regla del Core (Handbook):** Ningún componente público del Portal ejecutará navegación, aperturas de ventanas o lógica específica de acciones. Todas las acciones se resuelven mediante el **Experience Actions Engine**.

## Arquitectura

```
CMS (action JSON)
      ↓
parser.ts → ExperienceAction
      ↓
Componente UI (ExperienceActionButton)
      ↓
registry.ts → handler/{type}.ts
      ↓
ExperienceActionContext (Provider)
```

### Ubicación

| Capa | Ruta |
| --- | --- |
| Tipos | `src/types/experience-action.ts` |
| Motor Core | `src/core/experience/actions/` |
| Handlers | `src/core/experience/actions/handlers/` |
| Provider React | `src/components/portal/experience/ExperienceActionProvider.tsx` |
| Botón genérico | `src/components/portal/experience/ExperienceActionButton.tsx` |

## Registry

```typescript
import { registerExperienceActionHandler } from "@/core/experience/actions";

registerExperienceActionHandler("url", (action, ctx) => {
  if (action.type !== "url") return;
  ctx.navigate(action.href);
});
```

Handlers se registran por efecto lateral al importar `src/core/experience/actions/handlers/index.ts` (automático vía `ExperienceActionProvider`).

API pública:

| Función | Rol |
| --- | --- |
| `registerExperienceActionHandler` | Registrar handler por tipo |
| `executeExperienceAction` | Ejecutar acción con contexto |
| `parseExperienceAction` | Normalizar JSON CMS → `ExperienceAction` |
| `resolveExperienceActionLink` | Resolver enlace nativo (`<a>`) si aplica |
| `requiresExperienceActionHandler` | Indica si requiere botón + handler |

## Contrato — `ExperienceAction`

```typescript
type ExperienceActionType =
  | "url"
  | "form"
  | "modal"
  | "whatsapp"
  | "email"
  | "phone"
  | "download"
  | "calendar"
  | "video"
  | "application"
  | "enrollment"
  | "program"
  | "workflow"
  | "api"
  | "custom";
```

### Tipos y campos

| Tipo | Campos | Handler | Enlace nativo |
| --- | --- | --- | --- |
| `url` | `href`, `newTab?` | ✅ | ✅ |
| `form` | `formId` | ✅ | — |
| `modal` | `modalId` | ✅ | — |
| `whatsapp` | `phone`, `message?` | ✅ | ✅ (`wa.me`) |
| `email` | `address`, `subject?`, `body?` | ✅ | ✅ (`mailto:`) |
| `phone` | `number` | ✅ | ✅ (`tel:`) |
| `download` | `href`, `filename?`, `newTab?` | ✅ | ✅ |
| `calendar` | `eventId?`, `title?`, `start?`, `end?` | stub | — |
| `video` | `videoId`, `provider?` | stub | — |
| `application` | `programId?` | stub | — |
| `enrollment` | `programId?` | stub | — |
| `program` | `programId` | stub | — |
| `workflow` | `workflowId`, `stepId?` | stub | — |
| `api` | `endpoint`, `method?`, `payload?` | stub | — |
| `custom` | `handlerId`, `payload?` | stub | — |

## Compatibilidad legacy

El parser acepta botones con `href` sin `action`:

```json
{ "label": "Postular", "href": "/admision" }
```

Se transforma automáticamente en:

```json
{
  "label": "Postular",
  "action": { "type": "url", "href": "/admision" }
}
```

Aliases `@deprecated` disponibles para migración gradual: `parseCtaAction`, `executeCtaAction`, `PortalCtaAction`.

## Cómo agregar un nuevo handler

1. Extender `ExperienceActionType` y la unión en `src/types/experience-action.ts` (si es tipo nuevo).
2. Añadir case en `parser.ts`.
3. Crear `src/core/experience/actions/handlers/{tipo}.ts` con `registerExperienceActionHandler`.
4. Importar el archivo en `handlers/index.ts`.
5. **No modificar** componentes UI — el registry resuelve todo.

## Ejemplos

### URL interna

```json
{ "type": "url", "href": "/admision" }
```

### Abrir formulario

```json
{ "type": "form", "formId": "contact" }
```

### WhatsApp

```json
{ "type": "whatsapp", "phone": "+56912345678", "message": "Hola, quiero información" }
```

### Uso en componente

```tsx
import { ExperienceActionButton } from "@/components/portal/experience/ExperienceActionButton";

<ExperienceActionButton
  label="Postular ahora"
  action={{ type: "url", href: "/admision" }}
  variant="primary"
/>
```

## Consumidores actuales y futuros

| Módulo | Estado |
| --- | --- |
| CTA Premium | ✅ Integrado |
| Hero Premium | ⏳ Pendiente |
| Catalog Card | ⏳ Pendiente |
| Feature Grid | ⏳ Pendiente |
| Timeline | ⏳ Pendiente |
| News Grid | ⏳ Pendiente |
| People Grid | ⏳ Pendiente |
| Contact Hub | ⏳ Pendiente |
| Footer / Navigation | ⏳ Pendiente |
| Experience Forms | ⏳ Pendiente |
| Experience Studio | ⏳ Pendiente |

## Referencias

- [CORE-CTA-PREMIUM-v1.md](./CORE-CTA-PREMIUM-v1.md) — Primer consumidor
- [OT-CORE-EXP-001](../ot/OT-CORE-EXP-001.md) — Orden de trabajo
- [PORTAL-ENGINE.md](./PORTAL-ENGINE.md) — Portal Engine (motor hermano)
