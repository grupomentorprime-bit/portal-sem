# Editor de contenido de sitios públicos

Cada espacio (Formación, ADL, Cumple) publica un sitio en código. El admin no redibuja el layout: edita slots nombrados (texto, imagen, animación). Dominio y publicar siguen en las pantallas actuales.

## Arquitectura

- El código declara páginas y slots. Mongo (`site_page_content`) guarda solo lo que el admin cambió, por `{ tenantId, path }`.
- La vista pública mezcla overlay + defaults del código. Si Mongo falla, se sirven los defaults.
- Ruta de admin nueva: `/admin/site/pages` (no se reabre `/admin/pages`).
- Imágenes: selector `cms_media` existente. Animación: interruptor por slot.

## Tenants

| Espacio | tenantId | Origen visual |
|---|---|---|
| Mentor Formación | `mentor-prime-capacitacion` | Repo externo `Mentorprime-formacion`; Growth solo entrega contacto e imágenes |
| Academia ADL | `adl` | Landing de código |
| Mentor Cumple | `cumple` | Sitio ya registrado; el home usa el overlay |

## Slots del primer corte

Inicio de cada sitio: `hero.kicker`, `hero.title` o `hero.lead`, `hero.image`, `hero.animation`. Páginas sin slots se listan y dicen que el diseño está en código.

## Permisos

Leer/guardar páginas: `cms.pages.read` / `cms.pages.update`. Publicar y dominio no cambian.

## Fallos

- Slot desconocido o tipo incorrecto: 400, no se guarda.
- Espacio sin sitio en código: lista vacía, no error.
- Sitio sin publicar: «Este sitio está por comenzar».
