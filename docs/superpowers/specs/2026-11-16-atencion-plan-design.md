# Atención — pedidos de plan y conversación

## Goal

El dueño de NELZURI atiende los pedidos de plan en una aplicación propia del escritorio, con un hilo por organización. Clientes sigue siendo configuración. El cliente responde en el mismo hilo, y solo ve el suyo.

## Context

`space_app_requests` ya guarda una fila abierta por Espacio y aplicación, y se cierra al guardar el plan. Clientes edita estado, plan y dominio. Mensajes de Growth OS es el chat de las personas de un Espacio, no el de Nelzuri con la organización.

## Decisions

- Aplicación de dock `atencion`, etiqueta **Atención**. En la mesa del dueño va delante de Clientes. En la mesa del cliente va al final, después de las aplicaciones del plan.
- La lista muestra solo organizaciones con un pedido abierto. Una fila por organización; los módulos van dentro, en el orden de `MENTOR_APPS`.
- El hilo es uno por `tenantId`, en `attention_threads`. El primer mensaje de un pedido nuevo lo escribe el cliente: `Pidió {etiqueta}.`
- Un pedido repetido (`already: true`) no agrega otro mensaje. Volver a pedir después de cumplido sí agrega uno, porque nace una fila abierta nueva.
- El dueño escribe con rol `owner` (se muestra «Nelzuri»). El miembro del Espacio escribe con rol `client` (se muestra «Cliente»). El rol lo decide el servidor.
- El dueño en la mesa de plataforma ve la cola. Dentro de un cliente, Atención abre el hilo de ese Espacio y escribe como Nelzuri.
- El icono del dueño muestra cuántas organizaciones tienen pedido, tope `99+`. El del cliente muestra un punto si el último mensaje es de Nelzuri y aún no lo abrió.
- Abrir el hilo marca leído para quien mira. Si el correo no está, el pedido y el mensaje igual quedan. Esta entrega no envía correo.
- Guardar el plan sigue en Clientes y sigue cumpliendo la fila. El hilo no se borra.

## Fuera de alcance

Tickets que no nacen de un pedido de plan. Campana, Ventas, Personas, Mensajes y WhatsApp. Borrar `/platform`. Correo resumen.
