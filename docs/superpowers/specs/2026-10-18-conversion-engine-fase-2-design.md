# Conversion Engine — contrato fase 2

Gestión comercial inteligente sobre el núcleo único de Growth OS. Workflow Engine sigue siendo el motor de estados. No hay un segundo CRM ni un gestor de tareas. Personas, Oportunidades, Actividades, Mensajes y Automatizaciones se conservan.

Fase 2 agrega responsable de la oportunidad, una vista de trabajo derivada, prioridad comercial calculada y campos del embudo. Inicio sigue siendo el panel general del Espacio.

Fuera de esta fase: IA, recomendaciones, cotizaciones, montos, propuestas, analítica avanzada, tasas por etapa, empresas (`organizationId`), cambio de embudo, asignación masiva y reparto automático.

## Decisiones cerradas

- El responsable de la oportunidad es `ownerUserId`. Es distinto del `assigneeUserId` de la próxima acción. Cerrar la acción no quita al responsable.
- No existe colección de tareas. «Tarea», vencimiento y seguimiento pendiente son lecturas de la oportunidad y de su `nextAction` (0..1), como ADR-010 §1.5.
- La prioridad no se guarda. Es una función pura, con una sola banda por oportunidad abierta.
- Los campos pertenecen al embudo, no al workflow ni al tipo de intención. Sus valores viven en la oportunidad. No disparan transiciones ni condiciones de automatización.
- Toda lectura y escritura filtra por `tenantId`. Un responsable solo puede ser un usuario con membresía en ese Espacio.
- `organizationId` sigue reservado y en `null`. `funnelKey` sigue inmutable. `status` sigue siendo el espejo de `workflow_instances.currentState`.
- Campañas, Automatizaciones y Analítica no entran al escritorio comercial. Siguen en sus grupos actuales. Automatizaciones sí afectan el trabajo porque ya escriben `nextAction` y actividades.

## Navegación — CRM · Conversión

El grupo `CRM · Conversión` ya está en el lateral, debajo de Inicio. Esta fase no crea otro grupo y no mueve Campañas, Automatizaciones ni Analítica: siguen en Crecer.

Ítems actuales, con sus rutas y permisos:

| Ítem | Ruta | Permiso | Qué es |
| --- | --- | --- | --- |
| Oportunidades | `/admin/ventas` | `growth.sales.read` o `growth.sales.operate` | Cola y Kanban actuales. La pantalla sigue titulada Ventas. |
| Personas | `/admin/personas` | `growth.people.view` o `growth.people.manage` | Ficha actual. |
| Embudos | `/admin/ventas/embudos` | `growth.funnels.manage` | Configuración actual de embudos. |
| Mensajes | `/admin/mensajes` | `growth.sales.read` o `growth.sales.operate` | Bandeja actual. |
| Actividad | `/admin/actividad` | `growth.sales.read` o `growth.sales.operate` | Timeline actual. |

El grupo se abre al entrar en cualquiera de esas rutas y conserva ese estado al moverse por el admin. Si los permisos dejan un solo ítem visible, el lateral muestra el nombre de ese módulo.

Inicio permanece en `/admin` y no muestra la cola comercial.

Panel comercial y Mi trabajo no se publican en el lateral hasta que existan sus pantallas. Entran en el mismo grupo, sin cambiar las rutas de arriba:

| Ítem | Ruta | Permiso | Lugar en el grupo |
| --- | --- | --- | --- |
| Panel comercial | `/admin/conversion` | `growth.sales.view`, `growth.sales.read` o `growth.sales.operate` | Primero. |
| Mi trabajo | `/admin/ventas/mi-trabajo` | `growth.sales.view`, `growth.sales.read` o `growth.sales.operate` | Después de Embudos. |

`growth.sales.view` implica el permiso legado `growth.sales.read`. Quien solo opera entra igual: el Panel muestra los conteos de Mi trabajo. Orden resultante: Panel comercial, Oportunidades, Personas, Embudos, Mi trabajo, Mensajes, Actividad.

En escritorio el grupo sigue en el lateral. En móvil los ítems se apilan en ese orden. Panel y Mi trabajo son una columna. El Kanban no se duplica en Mi trabajo: cada fila abre el detalle de Oportunidades que ya existe.

## Responsable

`growth_oportunidades` suma:

| Campo | Regla |
| --- | --- |
| `ownerUserId` | Opcional. Usuario del Espacio. Ausente = sin responsable. |

Asignar, reasignar o quitar escribe una actividad `opportunity_assigned` (`fromUserId`, `toUserId`). El historial anterior no se reescribe. No cambia etapa, `nextAction` ni `funnelKey`.

Puede hacerlo quien tiene `growth.sales.operate`, desde el detalle de Ventas, la tarjeta del Kanban y la ficha de la persona, sobre esa oportunidad. El destino debe tener membresía vigente en el Espacio. Si el usuario pierde el acceso, sigue figurando como responsable hasta que alguien lo reasigne: no hay baja automática.

`nextAction.assigneeUserId` se mantiene. Si la acción no tiene responsable propio, el trabajo de esa acción recae en `ownerUserId`.

Índice: `{ tenantId: 1, ownerUserId: 1, status: 1 }`.

## Prioridad

Solo oportunidades no finales (`won`, `lost`, `archived`, `handed_off` quedan fuera). La primera banda que cumple gana:

| Orden | Banda | Condición | Orden interno |
| --- | --- | --- | --- |
| 1 | Acción vencida | `nextAction.dueAt` anterior a ahora | Vencimiento más antiguo primero |
| 2 | Sin seguimiento | `nextAction` es `null` | `openedAt` más antiguo primero |
| 3 | Estancada | Hay próxima acción no vencida y la edad de `lastActivityAt` es mayor o igual al umbral | `lastActivityAt` más antiguo primero |

Lo demás está al día y no entra en las tres colas.

El umbral vive en la configuración del Espacio: `staleAfterDays`, entero de 1 a 90, default 7. Lo edita quien tiene `growth.funnels.manage`. Es uno por Espacio, no por embudo.

`lastActivityAt` se desnormaliza en la oportunidad. `recordGrowthActivity` lo actualiza cuando la actividad trae `oportunidadId`: nota, contacto, transición, próxima acción y asignación cuentan como movimiento. Un día del umbral son 86.400.000 ms. Si la edad es mayor o igual al umbral, está estancada.

Índice de la acción: `{ tenantId: 1, "nextAction.assigneeUserId": 1, status: 1 }`.

La lista de Ventas conserva su orden actual y suma tres filtros de banda. Dentro de una columna del Kanban el orden pasa a ser esta prioridad y, a igualdad, el orden actual. La tarjeta muestra la banda y el responsable. Los resultados no son columnas.

## Mi trabajo

Una lectura del Espacio, no una copia. Entran oportunidades abiertas donde `ownerUserId` es el usuario actual o `nextAction.assigneeUserId` es el usuario actual.

Cada fila muestra persona, embudo, etapa, banda, vencimiento y resumen de la próxima acción, y abre `/admin/ventas/[id]`. Si la persona es responsable y además tiene la acción, hay una sola fila.

Cuatro cortes de esa misma lectura, en este orden: vencidas, sin seguimiento, estancadas, al día. Vacío: «Nada asignado». Las oportunidades sin responsable no aparecen aquí; están en Ventas.

Quien tiene `growth.sales.view`, `growth.sales.read` o `growth.sales.operate` entra. No ve oportunidades de otro Espacio ni de otro usuario, aunque comparta rol.

## Panel comercial

Tres conteos del Espacio —vencidas, sin seguimiento, estancadas— más el conteo sin responsable. Cada conteo abre Ventas con ese filtro. Debajo, hasta diez oportunidades en orden de prioridad, con el mismo enlace al detalle.

Quien solo opera y no tiene vista general ve los conteos de Mi trabajo, no los del Espacio. No hay gráficos, tasas ni cortes por etapa.

## Campos del embudo

Van en el documento `growth_funnels`, no en la definición de workflow.

| Campo | Regla |
| --- | --- |
| `key` | Slug inmutable. Único en el embudo. |
| `label` | Editable. |
| `type` | `text`, `long_text`, `number`, `date`, `select`, `boolean`. Inmutable. |
| `required` | Marca el dato incompleto. No bloquea la captación ni la transición. |
| `position` | Orden en la ficha. |
| `active` | `false` lo retira del formulario. No lo borra. |
| `options` | Solo `select`. Cada opción tiene `key` inmutable, `label` y `active`. |
| `help` | Texto corto opcional. |

Tope: 30 campos por embudo, 50 opciones por select, 500 caracteres en `text`, 4000 en `long_text`. Sin archivos, relaciones ni fórmulas.

Los valores van en la oportunidad:

```ts
customFields?: Record<string, string | number | boolean | null>
```

`select` guarda la `key` de la opción. `date` guarda `YYYY-MM-DD`. Una clave desconocida se ignora al leer. Un campo desactivado se muestra en solo lectura si tiene valor. Cambiar el tipo está prohibido. Permiso de definición: `growth.funnels.manage`. Permiso de valores: `growth.sales.operate`.

En el detalle, los campos van en «Datos del embudo». En el Kanban no. En la ficha de persona se leen, no se editan: la edición queda en el detalle de la oportunidad. En móvil ese bloque va debajo de etapa y responsable.

## Integración

| Superficie | Efecto |
| --- | --- |
| Personas | Responsable, próxima acción y campos con valor en cada oportunidad abierta. Asignar desde la ficha usa el mismo comando que Ventas. |
| Ventas | Filtros de banda, responsable en la fila, campos en el detalle. |
| Kanban | Misma lectura que la lista. Banda y responsable en la tarjeta. Asignar no mueve de columna. |
| Actividad | `opportunity_assigned` entra al timeline de la oportunidad y al feed del Espacio. |
| Automatizaciones | `salesSetNextAction` y `salesClearNextAction` siguen cambiando la banda al ejecutarse. Nueva condición `owner` con `exists` o `absent`. Nueva acción `salesAssignOwner` con `userId` de un miembro del Espacio; si no pertenece, el paso falla y la oportunidad no cambia. Los campos no son condiciones ni acciones. |

Mensajes no cambia de contrato. Una conversación sigue abriendo la misma oportunidad.

## Compatibilidad

Migración, sin reescribir actividades ni historial de workflow:

1. Oportunidades existentes: sin `ownerUserId`, sin `customFields`, `lastActivityAt` = fecha de la última actividad de esa oportunidad, o `updatedAt` si no hay actividad.
2. Cada embudo: `fields: []`.
3. Configuración del Espacio: `staleAfterDays: 7` si falta.
4. No se asigna un responsable por defecto. La captación (formulario, WhatsApp, admisión) sigue abriendo sin responsable y con la próxima acción que ya define hoy.

Una oportunidad previa a la migración cae en «sin seguimiento» si no tiene `nextAction`, o en «vencida» / «estancada» / «al día» según las reglas de arriba. Su etapa, embudo, persona e historial quedan igual.

## Pruebas de aceptación

1. Asignar, reasignar y quitar responsable conserva id, persona, embudo, etapa, `nextAction` e historial. Cada cambio agrega `opportunity_assigned` y no modifica actividades viejas.
2. El destino de una asignación es un miembro del mismo Espacio. Un usuario de otro Espacio es rechazado. Dos Espacios con el mismo `ownerUserId` no comparten oportunidades.
3. Cerrar la próxima acción deja al responsable. Quitar al responsable deja la próxima acción.
4. Mi trabajo lista solo oportunidades abiertas del usuario, como responsable o como asignado de la acción, una fila por oportunidad, y abre el detalle de Ventas.
5. Una oportunidad sin responsable no aparece en el Mi trabajo de nadie y sí aparece en Ventas.
6. La banda es única: vencida gana a sin seguimiento y a estancada; sin seguimiento gana a estancada. Una oportunidad final no entra en ninguna banda.
7. Con `staleAfterDays` en 7, una oportunidad con próxima acción a futuro y última actividad hace 7 días o más es estancada. Con actividad hace menos de 7 días está al día. Asignar o anotar actualiza `lastActivityAt` y la saca de estancada.
8. Los filtros de Ventas y los conteos del Panel usan la misma función que Mi trabajo. Mover una tarjeta de Kanban sigue siendo `transitionGrowthOpportunity`. Asignar no cambia de columna.
9. Crear, renombrar, reordenar y desactivar un campo no mueve oportunidades ni borra valores. Un campo desactivado no se ofrece vacío y se lee si tiene valor. No se puede cambiar su tipo ni reusar su clave. No existe borrado.
10. Un alta por formulario o WhatsApp no exige campos obligatorios ni responsable. Guardar el detalle marca incompleto un campo `required` vacío y permite igual la transición de etapa.
11. Una automatización `salesSetNextAction` con vencimiento pasado hace pasar la oportunidad a vencida. `salesAssignOwner` con un miembro del Espacio escribe `opportunity_assigned`. Con un usuario ajeno no modifica la oportunidad.
12. Una automatización previa que compara `status` o `nextAction` sigue coincidiendo. El feed de Actividad muestra la asignación nueva y no altera eventos anteriores.
13. Inicio sigue en `/admin`. Oportunidades, Personas, Embudos, Mensajes y Actividad conservan sus rutas dentro de CRM · Conversión. Panel comercial y Mi trabajo entran en ese grupo, en el orden de esta sección. Crecer conserva Campañas, Automatizaciones y Analítica. Panel y Mi trabajo se usan en escritorio y en una columna móvil sin un segundo Kanban.

## Producción — `029-growth-conversion-phase2`

Pendiente de producción. No ejecutarla sin autorización explícita. No forma parte del cierre funcional de la fase 2 ni de la fase 3.

Qué hace, y solo eso: crea los índices `tenantId_ownerUserId_status` y `tenantId_nextAction.assigneeUserId_status`; en oportunidades sin `lastActivityAt`, escribe la fecha de su última actividad o, si no hay, `updatedAt`; en embudos sin `fields`, escribe `[]`; en la configuración del Espacio sin `staleAfterDays`, escribe `7`. No asigna responsable, no rellena `customFields`, no reescribe actividades ni historial de workflow.

Comprobaciones previas, solo lectura (`npx tsx scripts/inspect-migration-029.ts` contra el entorno que se va a tocar):

1. El host de `MONGODB_URI` es el de ese entorno. `MONGODB_DB` es la base de ese entorno.
2. `cms_migrations` no tiene `029-growth-conversion-phase2` con `status: success`.
3. Las migraciones anteriores del registro, hasta `028-growth-funnels`, están en `success`.
4. Anotar los conteos: oportunidades sin `lastActivityAt`, embudos sin `fields`, configuraciones sin `staleAfterDays`, y el total de cada colección.

Respaldo, antes de cualquier escritura: `mongodump` de `growth_oportunidades`, `growth_funnels`, `growth_space_config` y `cms_migrations`. Conservar el volcado junto con la fecha y el host.

Ejecución, solo con autorización: `npm run migrate -- 029-growth-conversion-phase2`. No correr `npm run migrate` a secas. Al terminar, el registro queda en `success` y una segunda pasada la omite. Si se corta a medias, lo ya escrito permanece y una reejecución sigue solo con los documentos a los que aún les falta el campo.

Recuperación: restaurar esas cuatro colecciones desde el volcado tomado inmediatamente antes. No borrar `lastActivityAt` a mano después: el escritorio ya puede haberlo actualizado con actividad real y un `$unset` se llevaría esos movimientos. Los índices nuevos se recrean con la aplicación; no hace falta dropearlos para volver al estado anterior de los documentos.
