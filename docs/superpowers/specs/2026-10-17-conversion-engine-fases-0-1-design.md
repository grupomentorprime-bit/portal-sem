# Conversion Engine — contrato fases 0 y 1

Núcleo único de Growth OS. No hay un segundo CRM. Workflow Engine sigue siendo el motor de estados. Personas, Oportunidades, Actividades, Mensajes, Automatizaciones y Analítica se conservan.

Fase 0 saca Mentor CUMPLE del núcleo comercial. Fase 1 agrega embudos por Espacio, con etapas intermedias configurables y los cuatro resultados de plataforma.

Fuera de estas fases: dueño de la oportunidad, prioridad, campos por embudo, analítica por etapa, monto y propuesta, recomendaciones, y la ficha de organización comercial.

## Decisiones cerradas

- Cada Espacio tiene N embudos independientes. Las etapas se administran en la interfaz, no en código.
- Resultados de plataforma, iguales en todo embudo: `won`, `lost`, `archived`, `handed_off`. Etiquetas fijas: Ganada, Perdida, Archivada, Traspasada. No se renombran, reordenan, desactivan ni eliminan.
- Las etapas intermedias pertenecen a un embudo. Su clave es inmutable. Su etiqueta y su orden sí cambian.
- `organizationId` queda reservado en la oportunidad como `string | null`. En estas fases siempre es `null`. No hay colección, API, índice ni pantalla de empresas.
- Una oportunidad no cambia de embudo.
- Kanban y lista son dos vistas de la misma lectura y de las mismas operaciones.
- Toda lectura y escritura filtra por `tenantId`. Las claves de embudo son únicas dentro del Espacio, no en la plataforma.

## Fase 0 — frontera CUMPLE

El núcleo comercial no importa `@/sites/cumple` ni `@/lib/cumple`.

Hoy esa dependencia está en `src/lib/growth/ventas-read.ts`, `src/lib/growth/ventas-view.ts`, `src/lib/growth/personas-read.ts`, `src/lib/growth/persona-assessment.ts` y el tramo CUMPLE de `src/lib/growth/live-ingest.ts`.

Contrato de lectura, neutro, en el núcleo:

```ts
interface GrowthAssessmentView {
  title: string;
  headline: string;
  disclaimer: string;
  reportPath?: string;
  items: Array<{ id: string; label: string; statusLabel: string; detail?: string }>;
  previousCount: number;
}
```

Un puerto opcional por Espacio resuelve esa vista y, en la captación, el efecto posterior al alta (próxima acción inicial y persistencia del informe). El adaptador de CUMPLE vive junto al sitio CUMPLE y solo se registra en ese Espacio. Sin adaptador, Ventas y la ficha abren igual y la evaluación es `null`.

La oportunidad, su historial, su próxima acción y el vínculo con formulario o WhatsApp no se modifican en esta fase.

## Fase 1 — embudos

### Datos

Colección `growth_funnels`, un documento por embudo y Espacio:

| Campo | Regla |
| --- | --- |
| `tenantId` | Obligatorio. Aísla el documento. |
| `key` | Slug estable. Inmutable. Único por Espacio. |
| `name` | Nombre visible. Editable. |
| `status` | `active` o `archived`. |
| `isDefault` | Exactamente uno activo por Espacio. La captación sin embudo explícito usa ese. |
| `workflowDefinitionKey` | `growth.opportunity.<funnelKey>`. |
| `createdAt`, `updatedAt` | ISO. |

La definición de workflow de ese Espacio es la lista de etapas. No se duplica en otra colección.

Etapa intermedia dentro de la definición:

| Campo | Regla |
| --- | --- |
| `key` | Inmutable. No puede ser `won`, `lost`, `archived` ni `handed_off`. |
| `label` | Editable. |
| `position` | Orden entre intermedias. Los cuatro resultados no entran en este orden. |
| `active` | `false` la retira como destino y como entrada. No la borra. |
| `isInitial` | Una sola por embudo. No se puede desactivar. |

`growth_oportunidades` suma:

| Campo | Regla |
| --- | --- |
| `funnelKey` | Obligatorio tras la migración. Inmutable. |
| `organizationId` | `null` en estas fases. Ignorado por lecturas, automatizaciones y analítica. |

`status` sigue siendo el espejo de `workflow_instances.currentState`. `typeKey` sigue siendo el tipo de intención (`inquiry`, `registration`, `conversion`), no el embudo.

Índice nuevo: `{ tenantId: 1, funnelKey: 1, status: 1 }`. Índice único de embudos: `{ tenantId: 1, key: 1 }`.

### Transiciones

Se regeneran al crear, ordenar o desactivar etapas. No son un grafo dibujado a mano.

Desde una etapa intermedia, activa o ya desactivada, una oportunidad abierta puede ir a:

- cualquier otra etapa intermedia activa del mismo embudo;
- cualquiera de los cuatro resultados.

No puede ir a una etapa desactivada, a otro embudo, ni salir de un resultado. Al entrar en un resultado la instancia queda `completed`, se escribe `closedAt` y se limpia `nextAction`, como hoy.

Cada movimiento escribe una actividad `opportunity_transitioned`. `handed_off` escribe además `handoff`. El historial anterior no se reescribe.

La captación (formulario, WhatsApp, admisión) abre en la etapa inicial del embudo predeterminado del Espacio. El reuso de oportunidad abierta por `typeKey` + asunto se mantiene dentro de ese embudo.

### Gestión de etapas

Permiso nuevo `growth.funnels.manage`, solo en Super Admin e Institution Admin del Espacio. Operar una oportunidad sigue en `growth.sales.operate`. Ver Ventas sigue en `growth.sales.view` / `growth.sales.read`.

| Acción | Efecto | Prohibido |
| --- | --- | --- |
| Crear embudo | Definición propia con una etapa inicial y los cuatro resultados. | Compartir etapas con otro embudo. |
| Archivar embudo | Deja de ofrecerse para altas nuevas. | Archivarlo si tiene oportunidades no finales. El predeterminado no se archiva sin elegir otro antes. |
| Crear etapa | Clave nueva, al final de las intermedias, activa. | Reusar una clave reservada o una clave ya usada en ese embudo, aunque esté inactiva. |
| Renombrar | Cambia `label`. | Cambiar `key`. |
| Ordenar | Cambia `position`. | Mover oportunidades ni reescribir historial. |
| Desactivar | `active: false`. Sigue visible si hay oportunidades ahí. Esas oportunidades pueden salir. | Desactivar la etapa inicial, un resultado, o la última intermedia activa. Eliminar una etapa. |

### Migración

Para cada Espacio con oportunidades o con la definición actual `growth.opportunity`:

1. Crear el embudo `default`, nombre `Ventas`, `isDefault: true`, definición `growth.opportunity.default`.
2. Copiar las etapas actuales sin cambiar claves: `open` / Abierta (inicial), `active` / En seguimiento, más los cuatro resultados.
3. En cada oportunidad del Espacio: `funnelKey = "default"`, `organizationId = null`. No tocar `personaId`, `typeKey`, `status`, `origin`, `source`, `nextAction`, `handoff`, `openedAt`, `closedAt` ni `workflowInstanceId`.
4. Apuntar la instancia de workflow a `growth.opportunity.default` conservando `currentState` y el historial de `workflow_history`.
5. No regenerar actividades. Los textos ya guardados quedan como estaban.

Un Espacio sin oportunidades recibe el mismo embudo al asegurar su configuración. La definición global `growth.opportunity` deja de usarse para altas nuevas; permanece como plantilla de la que nace `default`.

### Ventas

Una sola lectura de oportunidades del Espacio, filtrable por embudo. La lista es esa lectura en el orden actual de la cola. El Kanban agrupa la misma lectura por etapa intermedia, en `position`. Las etapas desactivadas ocupan columna solo cuando tienen oportunidades. Los cuatro resultados no son columnas: se aplican con la misma acción de transición que en la lista.

Detalle y cola muestran embudo y etapa con la etiqueta vigente. La evaluación de la fase 0 aparece en el detalle solo si el puerto del Espacio la devuelve.

### Compatibilidad

- Formularios, WhatsApp y admisión siguen entrando por la apertura actual de oportunidad. Si no indican embudo, usan el predeterminado.
- Una automatización que compara `status` con `open`, `active`, `won`, `lost`, `handed_off` o `archived` sigue coincidiendo con esas claves. Una etapa nueva no dispara sola una condición vieja.
- Una automatización que transiciona a `active` o a un resultado sigue siendo válida en el embudo `default`. En otro embudo falla como transición inválida si esa clave no existe. No se agregan condiciones por embudo en esta fase.
- Analítica V1 no gana cortes por etapa. Ganadas, perdidas y traspasadas siguen filtrando por esas claves. «En seguimiento» pasa a contar toda oportunidad no final cuya etapa no es la inicial de su embudo. Así una etapa nueva no desaparece del pipeline y el embudo `default` conserva el número actual.
- Persona, conversación, origen y próxima acción no cambian de contrato.

## Pruebas de aceptación

Fase 0:

1. El núcleo `src/core/growth` y `src/lib/growth` no importa CUMPLE. El adaptador vive en el sitio CUMPLE.
2. Un Espacio sin adaptador abre la cola y el detalle de Ventas con evaluación `null`.
3. El Espacio CUMPLE sigue mostrando el diagnóstico de esa oportunidad, con informe, materias y diagnósticos anteriores.
4. Enviar el formulario CUMPLE sigue abriendo o reusando la oportunidad, guardando el informe y proponiendo la próxima acción. Otro formulario no ejecuta ese adaptador.

Fase 1:

5. Tras migrar, cada oportunidad conserva id, persona, tipo, estado, origen, fuente, próxima acción, handoff, fechas e historial de actividades. `funnelKey` es `default`. `organizationId` es `null`.
6. `open` sigue en Abierta y `active` en En seguimiento. Una ganada sigue ganada y no admite otra transición.
7. Dos Espacios pueden tener embudos con la misma clave y etapas distintas. Ninguna consulta cruza `tenantId`.
8. Crear, renombrar y reordenar una etapa no mueve oportunidades ni altera actividades ya escritas. La etiqueta nueva se ve en cola, Kanban y detalle.
9. Desactivar una etapa con oportunidades la deja visible y permite salir de ella. No aparece como destino. No se puede desactivar la etapa inicial, un resultado, ni la última intermedia activa. No existe borrado de etapa.
10. No se archiva un embudo con oportunidades abiertas. El predeterminado no desaparece sin otro predeterminado.
11. Kanban y lista muestran las mismas oportunidades. Mover una tarjeta y usar la acción de la lista ejecutan `transitionGrowthOpportunity` y producen la misma actividad.
12. Un alta por formulario y un alta por WhatsApp en un Espacio migrado entran a `open` del embudo `default`, reusando la oportunidad abierta de la misma intención.
13. Una automatización existente de «si status es active, cerrar ganada» sigue funcionando sobre una oportunidad del embudo `default`.
14. El conteo de ganadas, perdidas y en seguimiento del embudo `default` coincide con el de antes de la migración.
