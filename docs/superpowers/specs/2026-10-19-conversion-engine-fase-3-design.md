# Conversion Engine — contrato fase 3

Analítica de conversión sobre el mismo núcleo de Growth OS. Lee oportunidades, actividades, embudos, campañas y membresías que ya existen. No es un almacén, no materializa métricas y no abre un segundo módulo Analítica.

`/admin/analitica` sigue en Crecer, con su contrato actual: personas nuevas, captación, cierres, campañas, mensajes. Esta fase no le agrega etapas, permanencia ni rendimiento por responsable, y no reutiliza su pantalla.

Fuera de esta fase: catálogo de motivos de pérdida, pronósticos, metas, montos, comparación contra el período anterior, exportación, IA y cualquier atribución reconstruida. La migración `029-growth-conversion-phase2` sigue pendiente de producción; esta fase no la ejecuta.

## Decisiones cerradas

- Toda lectura filtra por `tenantId`. Una fila de otro Espacio no entra aunque comparta embudo, campaña o usuario.
- El período es el de Analítica V1: UTC, intervalo `[start, end)`, presets `last_7d`, `last_30d`, `this_month`, `previous_month` y `custom` (tope 366 días). Default `last_30d`.
- La unidad es la oportunidad. El origen que cuenta es `oportunidad.origin`, no el de la persona.
- Captación, stock y cohortes de conversión son tres lecturas. No comparten denominador. Cada una publica el suyo en la respuesta.
- Una tasa con denominador 0 es «—», no 0 %.
- No se inventa un valor ausente. Si falta `openedAt`, `closedAt`, la actividad o la campaña, la oportunidad va a un cubo explícito de calidad y no se reparte en una barra real. Esos cubos se muestran; el indicador no los absorbe.
- Las etiquetas de etapa salen del embudo del Espacio. Los cuatro resultados usan las etiquetas de plataforma ya definidas (ganada, perdida, traspasada, archivada). No hay nombres de un sector.
- El instante de la consulta (`readAt`) fija el estado observado. Una conversión en curso no se presenta como resultado definitivo.

## Dónde se ve

Ítem nuevo en `CRM · Conversión`, después de Panel comercial:

| Ítem | Ruta | Permiso |
| --- | --- | --- |
| Analítica de conversión | `/admin/conversion/analitica` | `growth.sales.view` |

Quien solo tiene `growth.sales.operate` o `growth.sales.read` no entra: la pantalla es del Espacio, no de Mi trabajo. `growth.analytics.view` sigue abriendo solo `/admin/analitica`.

El ítem de Panel comercial deja de coincidir con todo `/admin/conversion`: excluye `/admin/conversion/analitica`, igual que Oportunidades excluye Embudos y Mi trabajo. En móvil la pantalla es una columna. Vacío de período: «Sin datos en el período». Un fallo de lectura no se dibuja como ceros.

## Qué se mide

### 1. Captación: oportunidades nuevas

Denominador: oportunidades del Espacio con `openedAt` dentro del período. Cuenta el alta válida aunque el `status` actual sea `archived`. Archivar después no borra la captación del período.

Sin `openedAt` no es alta. Va a «Sin fecha de apertura» y no entra en el total ni en los cortes.

Cortes: embudo (`funnelKey`; si falta, «Sin embudo») y origen, con la misma agrupación que Analítica V1 (`acquisitionOriginGroupLabel` sobre `oportunidad.origin`: WhatsApp, formulario o su nombre, admisión, registro manual, evento, sitio, «Sin origen claro»).

El total es la suma de los cortes por embudo y también la suma de los cortes por origen. La respuesta publica, aparte, cuántas de esas altas están archivadas ahora. Esa cifra es un subconjunto del total, no un tercer corte: no se suma otra vez.

Gráfico de barras por embudo y por origen, más el total. Texto del denominador: «Oportunidades con fecha de apertura en el período, incluidas las archivadas después».

### 2. Stock y movimiento por etapa

Dos lecturas distintas.

**Stock actual.** No usa el período. Oportunidades cuyo `status` no es resultado (`won`, `lost`, `handed_off`, `archived`), agrupadas por embudo y por `status`. Es el estado de ahora. Denominador: «Oportunidades abiertas ahora. No depende del período».

**Movimiento del período.** Cada actividad `opportunity_transitioned` con `occurredAt` en el período y `payload.fromState` / `payload.toState` presentes y no vacíos. Por etapa de salida:

| Movimiento | `toState` |
| --- | --- |
| Avance | otra etapa que no es resultado |
| Abandono | `lost` |
| Ganada desde la etapa | `won` |
| Traspaso | `handed_off` |
| Archivo | `archived` |

Se cuentan movimientos y oportunidades distintas. Una oportunidad puede salir más de una vez. El gráfico es de un embudo elegido (sus etapas no son comparables con las de otro). «Todos» no mezcla claves de etapa.

Una transición sin `fromState` o sin `toState`, o con alguno vacío, no se reparte: suma en «Movimiento ilegible» y ese cubo se muestra.

### 3. Pérdidas y etapa de salida

Cierres del período: `status` `won` o `lost` y `closedAt` dentro del período. Si el estado es final y no hay `closedAt`, no se fecha con `updatedAt`: va a «Sin fecha de cierre» y no entra en el indicador. `archived` no es un cierre de este bloque.

`handed_off` con `closedAt` en el período se cuenta al lado, como traspaso.

Cada pérdida del período conserva su conteo y su etapa de salida: el `fromState` de la última actividad `opportunity_transitioned` con `toState` `lost` y `occurredAt` menor o igual a `closedAt`. La etiqueta sale del embudo de esa oportunidad. Si esa actividad no existe o no trae `fromState`, la pérdida igual cuenta y suma en «Etapa de salida no registrada».

**Los motivos de pérdida no se registran.** No hay campo ni catálogo. El comentario libre o el `summary` de una transición no es un motivo. La pantalla muestra el conteo, la etapa de salida y el texto «Los motivos de pérdida no se registran». No se agrupa el comentario, no se siembra una lista, no se rellena el pasado y no se incorpora el catálogo en esta fase.

### 4. Permanencia y ciclo

Fuente única: `growth_actividades` de esa oportunidad, más `openedAt` y `closedAt`. No se consulta el historial de workflow para completar huecos.

Recorrido usable:

1. La entrada a la primera etapa es `opportunity_opened.occurredAt` si existe, si no `openedAt`. La etapa es `payload.status` de esa actividad; si no viene, la `fromState` de la primera transición.
2. Cada `opportunity_transitioned` cierra la etapa de `fromState` y abre `toState` en su `occurredAt`.
3. La etapa final se cierra en `closedAt` cuando existe. Si no existe, el intervalo de esa etapa no se cierra.

Un intervalo terminado dura `salida − entrada`, en milisegundos. La permanencia publicada es la mediana de los intervalos terminados cuya salida cae en el período, por embudo y etapa. Con cantidad impar se toma el valor central; con cantidad par, el promedio de los dos centrales. Con cero intervalos, «—». La cantidad de intervalos va al lado. Un día son 86.400.000 ms; la pantalla muestra días con un decimal.

La etapa en curso (oportunidad no final) dura hasta `readAt`, se cuenta aparte como «en curso» y no entra en la mediana.

**Historial incompleto**, excluido de la mediana y contado en su cubo: no hay actividad de apertura ni `openedAt`; una transición no trae estados; `payload.status` de la apertura y la primera `fromState` discrepan; el `status` actual no coincide con la última `toState`; las fechas van hacia atrás. Esas oportunidades siguen en el stock por su `status` actual.

**Ciclo comercial.** Solo ganadas con `openedAt` y `closedAt`, cierre dentro del período: mediana de `closedAt − openedAt`. Las perdidas tienen su propia mediana, con la misma regla. No se mezclan. Sin par de fechas, «—».

### 5. Conversión de cohortes por embudo, campaña y fuente

Denominador de la cohorte: oportunidades con `openedAt` en el período cuyo `status` actual no es `archived`. Una alta que después se archivó entra en captación y no entra aquí.

La tasa es el estado observado en `readAt`: las de esa cohorte cuyo `status` actual es `won`, dividido por el tamaño de la cohorte. No es el resultado definitivo del período. `handed_off` y `lost` permanecen en el denominador y no suman al numerador. `open` son las de la cohorte que todavía no son resultado. Cada fila muestra cohorte, ganadas, abiertas, perdidas, traspasadas y la tasa. Texto junto a la tasa: «Tasa al momento de la consulta. Las abiertas siguen en curso».

| Dimensión | Cuándo entra | Si no se puede atribuir |
| --- | --- | --- |
| Embudo | `funnelKey` presente | «Sin embudo» |
| Campaña | `origin.campaign`, ya recortado, igual al `trackingKey` de una campaña del mismo Espacio, esté activa o no | Con texto que no coincide: «Campaña no registrada», y suma en ese cubo de calidad. Sin texto: no entra en la tabla de campañas |
| Fuente | agrupación de origen del punto 1 | «Sin origen claro» es una fila, no se reparte |

No se lee `referrer` para adivinar campaña o fuente. No se usa el origen de la persona si el de la oportunidad falta: la fila es «Sin origen claro».

### 6. Rendimiento por responsable

Solo oportunidades con atribución comprobable.

- Abiertas (stock): `ownerUserId` actual. Sin él, «Sin responsable».
- Cierres del período (`won`, `lost`, y traspaso aparte): la última actividad `opportunity_assigned` con `occurredAt` menor o igual a `closedAt`. Si `toUserId` de esa actividad es un identificador no vacío, el cierre es de ese usuario. Si esa actividad no existe, o existe y dejó la oportunidad sin responsable (`toUserId` ausente o vacío), el cierre va a «Sin atribución de responsable». No se usa `ownerUserId` actual ni un `toUserId` anterior.
- Una asignación o desasignación con `occurredAt` posterior a `closedAt` no cambia ese cierre.
- Cada fila: abiertas a cargo, ganadas, perdidas, traspasos y mediana de ciclo de sus ganadas. El nombre sale de la membresía del Espacio, vigente o no. Si la membresía ya no está activa, o el usuario no tiene membresía en el Espacio, la etiqueta es «Responsable no vigente» y los números se conservan en la fila de ese usuario. Asignar no se cuenta como avance de etapa.

## Calidad de datos

La respuesta trae estos cubos y la pantalla los muestra cuando son mayores que cero, al lado del indicador que no pudo usarlos:

| Cubo | Qué cuenta |
| --- | --- |
| Sin fecha de apertura | Oportunidad del Espacio sin `openedAt` |
| Sin fecha de cierre | `won`, `lost` o `handed_off` sin `closedAt` |
| Historial incompleto | Recorrido excluido de la mediana, según el punto 4 |
| Movimiento ilegible | Transición del período sin `fromState` o sin `toState` |
| Campaña no registrada | Cohorte con `origin.campaign` que no coincide con un `trackingKey` del Espacio |
| Etapa de salida no registrada | Pérdida del período sin `fromState` usable |

Un indicador no esconde el cubo poniéndolo en cero dentro de otra serie, ni omite la fila.

## Lectura

Una función pura, al estilo de `buildAnalyticsV1Response`. Recibe el `tenantId`, el período, el instante de lectura y los documentos ya filtrados por ese Espacio. No escribe. No crea colección.

Entradas: oportunidades, actividades `opportunity_opened`, `opportunity_transitioned` y `opportunity_assigned`, embudos (etapas), campañas (`trackingKey`, nombre) y el nombre y la vigencia de los miembros. Nada más.

El selector de embudo de los gráficos de etapa es de presentación: el cálculo por embudo ya viene separado.

## Qué ya se puede calcular

| Medida | Hoy |
| --- | --- |
| Captación por período, embudo y origen, incluidas las archivadas después | Sí, con `openedAt`, `funnelKey` y `origin` |
| Stock por etapa | Sí, con `status` y el embudo |
| Avance, abandono, ganada desde la etapa, traspaso y archivo | Sí, si la actividad de transición trae `fromState`, `toState` y `occurredAt` |
| Ganadas y perdidas del período | Sí, con `status` y `closedAt` |
| Etapa de salida de una pérdida | Sí, si la transición a `lost` trae `fromState` y `occurredAt` ≤ `closedAt` |
| Motivos de pérdida | No. No se registran. Esta fase no agrega catálogo |
| Permanencia y ciclo | Sí, cuando el recorrido de actividades cierra. El resto va a «historial incompleto» o «sin fecha de cierre» |
| Conversión por embudo y por fuente, con abiertas de la cohorte | Sí. La tasa es el estado en `readAt` |
| Conversión por campaña | Solo si `origin.campaign` coincide con un `trackingKey` del Espacio |
| Rendimiento del responsable en abiertas | Sí, con `ownerUserId` |
| Rendimiento del responsable en cierres | Solo con la última `opportunity_assigned` anterior o igual al `closedAt` y `toUserId` presente. Una desasignación deja el cierre sin atribución |

## Pruebas de aceptación

1. Dos Espacios con las mismas claves de embudo, campaña y usuario no comparten cifras. Una oportunidad de otro `tenantId` colada en la entrada no suma.
2. En un período, el total de captación es la suma de los cortes por embudo y también la suma de los cortes por origen. Una oportunidad sin `funnelKey` aparece solo en «Sin embudo». Una sin origen clasificable aparece solo en «Sin origen claro». Una alta con `openedAt` en el período que hoy está `archived` entra en el total y en sus cortes, y la cifra «archivadas ahora» la incluye. No entra en la cohorte de conversión.
3. El stock por etapa ignora el período y excluye resultados. Un avance con `occurredAt` fuera del período no entra en el movimiento. Una transición sin estados suma en «Movimiento ilegible» y no mueve otra barra. `handed_off` no incrementa ganadas ni perdidas y sí incrementa traspaso.
4. Ganar y perder usa `closedAt`. Una oportunidad `won` sin `closedAt` queda en «Sin fecha de cierre» y no altera la tasa. La tasa de una cohorte vacía es «—». `handed_off` cuenta en el denominador de la cohorte y no en el numerador. Cada fila de cohorte trae las abiertas. La tasa es `won / cohorte` al `readAt`: si una oportunidad de la cohorte sigue abierta, la tasa no la cuenta como ganada ni la saca del denominador.
5. Una pérdida del período cuenta y muestra su etapa de salida. Sin `fromState` usable queda en «Etapa de salida no registrada» y el conteo de pérdidas no baja. No aparece ningún motivo. El comentario de una transición no genera una fila. No hay catálogo ni clave `lossReasonKey` en el código de esta fase.
6. La mediana de permanencia usa solo intervalos terminados con salida en el período. Un caso en curso no la cambia. Si el `status` no coincide con la última transición, la oportunidad está en «historial incompleto», sigue en el stock y no entra en la mediana. El ciclo de ganadas no se promedia con el de perdidas.
7. Una campaña cuenta solo cuando `origin.campaign` es el `trackingKey` de una campaña de ese Espacio. Un texto desconocido va a «Campaña no registrada» y ese cubo es visible. Un `referrer` parecido a una campaña no atribuye. El origen de la persona no sustituye al de la oportunidad.
8. Una abierta se atribuye a `ownerUserId`. Una ganada se atribuye al `toUserId` de la última asignación con fecha menor o igual a `closedAt`. Si esa última asignación es una desasignación, el cierre queda en «Sin atribución de responsable», aunque antes hubiera otro responsable y aunque `ownerUserId` esté puesto ahora. Una reasignación posterior al cierre no se lleva esa ganada. Sin ninguna asignación anterior o igual al cierre, el mismo cubo.
9. «Sin fecha de apertura», «Sin fecha de cierre», «Historial incompleto», «Movimiento ilegible» y «Campaña no registrada» se muestran cuando son mayores que cero. Ninguno se publica como una barra de etapa, origen o responsable.
10. Con cero oportunidades la pantalla dice «Sin datos en el período» y no muestra series de ejemplo. Si el período no tiene altas, movimientos ni cierres pero hay stock, el stock se ve y las secciones del período dicen que no hay datos. `/admin/analitica` sigue mostrando personas, captación, campañas y mensajes, sin etapas ni responsables. Panel comercial sigue siendo los conteos de trabajo, sin estos gráficos.
11. Entra quien tiene `growth.sales.view`. Quien solo opera no entra. El ítem queda en CRM · Conversión, debajo de Panel comercial, y Panel no queda marcado al abrir esta ruta. En móvil es una columna.
