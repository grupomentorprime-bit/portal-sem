# Sitio público en código

Cada espacio tiene su sitio web como código en este repositorio. El editor de Páginas deja de diseñar la web. El panel sigue editando el contacto, el dominio y la publicación, y recibe los envíos de los formularios escritos en código.

## Decisiones

- Un espacio, una carpeta de sitio. El diseño, el menú y los formularios viven en código.
- El contacto se edita en Ajustes del sitio: correo, teléfono, WhatsApp, dirección, ciudad, país, horario y redes.
- Un formulario escrito en código guarda la respuesta en Formularios y, si trae correo o teléfono, crea o actualiza a la persona.
- Todos los espacios, incluidos los que ya están en línea, nacen sin publicar.
- Hasta que alguien pulse Publicar sitio, el dominio muestra «Este sitio está por comenzar».
- Noticias, equipo, programas, cursos, eventos y el resto del contenido de la web vieja dejan de publicarse. Las páginas nuevas se escriben desde cero.
- El primer corte construye el contrato y la página de inicio. No escribe las páginas reales y no borra todavía el código del editor.

## Estados públicos

La dirección se resuelve como hoy: sin espacio, portada de la plataforma; con espacio, el sitio de ese espacio. En un host de espacio, las páginas del sitio pasan por este resolvedor. `/admin` y `/api` no cambian. Esas páginas ya no renderizan el portal CMS, las páginas preparadas del seminario ni los módulos de contenido.

1. **Sin espacio.** El host no pertenece a ninguna organización. Se muestra la portada de Growth OS.
2. **Por comenzar.** El espacio existe y `sitePublished` no es `true`, o es `true` y no hay carpeta de sitio. Se muestra la página de inicio en el subdominio y en el dominio propio, en cualquier ruta pública.
3. **Sitio publicado.** `sitePublished` es `true` y existe la carpeta. Se renderiza la página registrada para esa ruta. Una ruta no registrada es una página no encontrada.

`institution.status` (activo, mantenimiento, inactivo) no elige la página pública. El único interruptor es Publicar sitio.

## Página «por comenzar»

Muestra el nombre de la organización (`institution.name`) y el texto exacto «Este sitio está por comenzar».

Si hay dato, también muestra correo, teléfono, WhatsApp, dirección, ciudad, país, horario y cada red que tenga URL. Un campo vacío no se muestra. Si no hay contacto, la página queda solo con el nombre y esa frase.

## Publicar

`SiteConfig` gana un booleano `sitePublished`. Si el campo falta en un documento ya guardado, se trata como `false`.

En Ajustes del sitio (`/admin/config`) hay un control **Publicar sitio**, visible para quien ya puede editar esos ajustes. Activarlo guarda `sitePublished: true`. Desactivarlo guarda `false` y el dominio vuelve a «por comenzar».

Publicar un espacio que todavía no tiene carpeta no cambia lo que ve el visitante: sigue la página de inicio, porque no hay páginas que mostrar.

## Carpeta del sitio

`src/sites/<tenantId>/` exporta el sitio de ese espacio:

- un registro de rutas a páginas, por ejemplo `/` y `/contacto`;
- el menú, tomado de ese registro;
- los formularios declarados junto a las páginas.

El `tenantId` de la carpeta es el id del espacio. El primer corte no agrega la carpeta de ningún espacio real, así que todos quedan en «por comenzar» aunque alguien publique. Las pruebas pueden registrar un sitio ficticio para comprobar el resolvedor.

## Contacto

Las páginas leen `contact` y `social` de la configuración del espacio. No duplican teléfono, correo ni redes en el código. Esos datos también alimentan la página «por comenzar».

## Formularios

La pantalla y los campos se escriben en la carpeta del sitio. La declaración incluye id estable, nombre, campos, mensajes de éxito y error, y un destino. El destino solo puede ser `contact`, `information_request` o `event_registration`.

Si la carpeta existe, la declaración se sincroniza en `experience_forms` aunque el sitio siga sin publicar. Así el equipo ve el formulario en el panel antes de abrirlo al público. La página del formulario solo se ve con el sitio publicado. El código manda: nombre, campos, destino y mensajes se reescriben desde la declaración. Las respuestas guardadas no se tocan. Si un id desaparece de la carpeta, el formulario se archiva y sus respuestas siguen en el panel.

El envío usa `submitExperienceForm`. Primero se guarda la respuesta en `experience_form_submissions`. Después, si el destino es uno de los tres anteriores y los datos traen correo o teléfono, `ingestFormSubmissionToGrowthSafe` crea o actualiza la persona. Si faltan los dos, la respuesta queda solo en Formularios.

En Formularios el equipo ve el formulario y sus respuestas. El panel no es la fuente de los campos.

Un sitio sin publicar no muestra el formulario: el host sigue en «por comenzar».

## Panel

En el primer corte, estas pantallas dejan de existir para todos los espacios. No aparecen en el menú y su dirección ya no abre el editor:

- Páginas (`/admin/pages`) y Menús (`/admin/menus`), dentro de Sitio web.
- Autoridades, Programas, Cursos, Comunicaciones y Medios, dentro de Institución.

Admisión, Contacto, Cursos de Formación y el resto de esa lista no se crean ahí. Cada página nueva es un archivo en la carpeta del espacio.

Siguen Formularios, Dominio, Ajustes del sitio, Identidad visual, el centro de admisión, la operación de formularios, Personas y el resto de Growth.

El código y los datos viejos del editor pueden seguir en el repositorio. Ninguna pantalla de admin ni ninguna ruta pública los usa. Borrarlos es un corte posterior.

## Fallos

- Un campo inválido no se guarda. El formulario marca ese campo.
- Si falla el guardado, no se crea la persona y el visitante ve el mensaje de error del formulario.
- Si el guardado funciona y falla la proyección a Personas, el visitante ve el mensaje de éxito. La respuesta queda en Formularios.
- Sin correo y sin teléfono, la respuesta queda solo en Formularios.
- Una ruta no registrada en un sitio publicado es una página no encontrada.
- Un espacio sin publicar, o publicado sin carpeta, muestra «Este sitio está por comenzar» en cualquier ruta pública.

## Fuera de este corte

- Escribir las páginas reales de un espacio.
- Borrar el código y los datos que ya no tienen pantalla: editor de Páginas, menús CMS y módulos de noticias, equipo, programas, cursos y eventos.
- Cambiar la portada de Growth OS que se ve cuando el host no tiene espacio.

## Prueba

- Un espacio sin `sitePublished` muestra «Este sitio está por comenzar» en su subdominio y en su dominio propio, también en una ruta interna.
- Publicar sin carpeta de sitio sigue mostrando esa página.
- Publicar con una carpeta que registra `/` muestra esa página. Una ruta no registrada responde como no encontrada.
- Despublicar vuelve a «Este sitio está por comenzar».
- Un host sin espacio sigue mostrando la portada de Growth OS.
- Un formulario con correo o teléfono deja la respuesta en Formularios y crea o actualiza la persona.
- Un formulario sin correo y sin teléfono deja la respuesta solo en Formularios.
- Un campo inválido no guarda respuesta ni persona.
