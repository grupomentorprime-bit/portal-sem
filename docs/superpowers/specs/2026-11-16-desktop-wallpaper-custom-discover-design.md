# Fondo propio visible en Preferencias

## Goal

En Mi cuenta → Preferencias, la persona descubre sin bajar el scroll que puede subir su propio fondo, y al cargar el archivo ve de inmediato las medidas de la imagen junto a lo recomendado.

## Context

El fondo propio ya existe: catálogo fijo (`mar`, `valle`, `volcan`, `kepler`, `noche`), valor `custom`, archivo en `data/desktop-wallpapers`, API `/api/desktop/wallpaper` (POST preset / multipart / DELETE) y GET `/api/desktop/wallpaper/file`. Las reglas de medida viven en `src/lib/desktop/wallpaper-upload.ts`.

El problema es de descubrimiento: el botón «Agregar mi fondo» y a veces la nota de medidas quedan bajo la fila de miniaturas, fuera del primer vistazo del modal.

## Decisions

- Tile **«+» / Agregar** al final de la fila de fondos (misma altura y estilo de radio visual que Mar/Valle/…). Abre el selector de archivo.
- Si ya hay fondo propio, el tile **«Mío»** sigue en la fila; el **+** pasa a significar **cambiar** (misma acción de subida).
- Se **quita** el botón azul suelto «Agregar mi fondo» / «Cambiar mi fondo» debajo de la fila para no duplicar. «Quitar» permanece como texto debajo cuando hay custom.
- La nota fija **«Medida recomendada: 1920 × 1080 px. JPG, PNG o WebP, hasta 8 MB.»** queda **arriba** de la fila, siempre visible al abrir Preferencias.
- Al elegir archivo: mensaje de estado inmediato con `wallpaperLoadedText` — **«Tu imagen mide Ancho × Alto px»** + recomendado; si el servidor reescala, se indica el tamaño guardado.
- Errores (formato, peso, demasiado chica) siguen mostrando las medidas reales cuando se conocen.
- Sin cambios de API, de reglas de validación ni de almacenamiento.

## UI

En **Mi cuenta → Preferencias → Fondo del escritorio**:

1. Título + lead («Se guarda en tu cuenta…»).
2. Nota de medida recomendada (`WALLPAPER_SIZE_HINT`).
3. Fila: presets + (si hay) «Mío» + tile «+» con etiqueta «Agregar» o «Cambiar».
4. Si hay custom: enlace/texto **Quitar**.
5. Zona de alerta: ok (medidas al cargar / «Fondo guardado.») o error.

El tile «+» es un `label` con `input type=file` oculto (mismo patrón que el file-btn actual), no un radio de selección de fondo.

## Datos y API

Sin cambios. Siguen:

| Campo / ruta | |
| --- | --- |
| `desktopWallpaper` | preset id o `custom` |
| `desktopWallpaperUpdatedAt` | cache-bust del archivo |
| `POST /api/desktop/wallpaper` | `{ wallpaper }` o multipart |
| `DELETE /api/desktop/wallpaper` | vuelve a un preset |
| `GET /api/desktop/wallpaper/file?v=` | sirve el WebP |

Límites vigentes: JPG/PNG/WebP, máx. 8 MB, mín. 640×360, recomendado 1920×1080, lado máx. guardado 2560.

## Fuera de alcance

- Varios fondos propios, recorte interactivo, fondos por empresa.
- Cambiar catálogo de presets o el botón «Fondo» de la barra (ciclo de presets).

## Testing

- La fila de Preferencias incluye el tile de agregar/cambiar sin depender de scroll.
- Tras elegir un archivo válido, el mensaje incluye el ancho × alto medido.
- Archivo demasiado chico: error con medidas reales y el mínimo.
- Con custom presente: «Mío» seleccionable, «+» cambia el archivo, «Quitar» limpia.
