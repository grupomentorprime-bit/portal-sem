# Formularios como submenú de Sitio web

Sitio web conserva Páginas, Dominio y Ajustes del sitio. Formularios deja de ser un enlace suelto: es un submenú con dos vistas que no comparten pantalla. Asuntos Estudiantiles no entra en este submenú. Ese módulo es solo del SEM.

## Navegación

La barra de Sitio web queda así:

- Páginas → `/admin/site/pages`
- Formularios (submenú)
- Dominio → `/admin/site/domain`
- Ajustes del sitio → `/admin/config`

Pulsar Sitio web en el lateral abre Páginas.

El submenú de Formularios se crea con dos entradas, visibles cuando Formularios está activo:

- Edición → `/admin/portal/forms`
- Panel de control → `/admin/portal/forms/panel`

Pulsar Formularios abre Edición. En Edición y en el panel, la barra de Sitio web marca Formularios, y el submenú marca la vista activa.

Quien puede leer formularios ve el panel. Quien no, no lo ve. Asuntos Estudiantiles sigue en Institución y solo para el SEM.

## Edición

La lista sigue en `/admin/portal/forms`. El constructor sigue en `/admin/portal/forms/[id]`.

De la ficha salen las pestañas Respuestas y Participantes. En su lugar hay **Ver respuestas**, que abre `/admin/portal/forms/panel/[id]`.

En una convocatoria del SEM, **Ir a operación** sigue yendo a `/admin/portal/asuntos-estudiantiles/[id]`. En cualquier otro espacio ese botón no aparece.

## Panel de control

Pantallas nuevas, solo de formularios:

- `/admin/portal/forms/panel` lista los formularios del espacio activo y cuántas respuestas tiene cada uno.
- `/admin/portal/forms/panel/[id]` muestra la tabla de respuestas que ya existe: buscar, ver y eliminar.

El conteo y la tabla salen de las respuestas de ese formulario en el espacio de la sesión. No hay otro almacén. No hay nómina, generaciones, asistencia de alumnos ni encargadas.

Si el formulario no tiene respuestas, la pantalla lo dice. Si la carga falla, muestra el error y permite reintentar. Un id que no es de este espacio responde como no encontrado.

## Fuera de alcance

No se mueven ni se reutilizan las rutas de Asuntos Estudiantiles. No cambian el envío público, Páginas, Dominio ni Ajustes del sitio.

## Pruebas

- Sitio web abre Páginas y su barra sigue siendo Páginas, Formularios, Dominio, Ajustes del sitio.
- Con Formularios activo aparecen Edición y Panel de control, con esas rutas.
- La ficha de edición no ofrece Respuestas ni Participantes, y enlaza al panel de ese formulario.
- Ir a operación solo se ofrece en una convocatoria del SEM.
- El panel lista formularios del espacio activo y abre sus respuestas.
- Asuntos Estudiantiles sigue en Institución.
