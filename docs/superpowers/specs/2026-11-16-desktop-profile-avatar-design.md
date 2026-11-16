# Avatar y foto de perfil en el escritorio

## Goal

En Mi cuenta la persona puede elegir un avatar listo o subir una foto propia. Esa imagen se ve en el círculo de Mi cuenta, en la píldora de la barra del escritorio y en las listas de personas del Espacio. Sin elección, siguen las iniciales.

## Context

Hoy el avatar son solo iniciales. El texto en Perfil dice que la foto personal aún no está disponible. El fondo del escritorio ya se guarda por persona (`desktopWallpaper*` + archivo en `data/desktop-wallpapers`). Este corte sigue ese patrón, no la biblioteca de medios del Espacio.

## Decisions

- Avatares prefabricados **y** subida de foto.
- Prioridad al pintar: **foto propia → preset → iniciales**.
- Quitar la foto no borra el preset. «Usar iniciales» limpia preset y foto.
- Guardado inmediato al elegir preset, subir o quitar (como el fondo). No depende de «Guardar perfil».
- Alcance de visualización: Mi cuenta, barra del escritorio, listas de personas en Ajustes del Espacio.
- Sin cropper avanzado en este corte: la foto se centra y recorta a cuadrado en el servidor.
- Sin sincronizar todavía con Growth OS admin (`AdminUserAvatar`) ni con otros productos; el componente del escritorio es la fuente en la mesa.

## Datos

En `identity_users`:

| Campo | |
| --- | --- |
| `avatarPresetId?: string` | Id de un preset del catálogo fijo. Ausente o desconocido → sin preset. |
| `avatarPhoto?: boolean` | Hay foto propia guardada. |
| `avatarPhotoUpdatedAt?: string` | Sello para cache-bust de la URL. |

Catálogo puro en `src/lib/desktop/avatar-catalog.ts`: lista de ids y etiqueta. Archivos en `public/desktop/avatars/{id}.webp` (o svg/png). En este corte: **8** presets.

Archivo de foto: `data/desktop-avatars/{hash(userId)}.webp`, espejo de wallpapers.

Resolución de visualización (función pura `resolveDesktopAvatar`):

1. `avatarPhoto` → `{ kind: "photo", url }`
2. else preset válido → `{ kind: "preset", id, src }`
3. else → `{ kind: "initials", text }`

## API

Espejo de `/api/desktop/wallpaper`:

| Método | Ruta | Cuerpo | Efecto |
| --- | --- | --- | --- |
| `POST` | `/api/desktop/avatar` | `{ presetId }` | Guarda preset. No borra la foto. |
| `POST` | `/api/desktop/avatar` | multipart `file` | Guarda foto (webp cuadrado). Marca `avatarPhoto`. |
| `DELETE` | `/api/desktop/avatar` | opcional `{ clear: "photo" \| "all" }` | `photo` (default): borra archivo y flags de foto. `all`: también limpia `avatarPresetId`. |
| `GET` | `/api/desktop/avatar/file?v=` | — | Sirve la foto. Requiere sesión. En listas del Espacio, el cliente pide la URL solo para usuarios que tienen `avatarPhoto`; el GET autentica al que mira (misma casa). |

URL de foto: `/api/desktop/avatar/file?v={avatarPhotoUpdatedAt}`.

Validación de subida:

- JPG, PNG o WebP
- hasta **2 MB**
- lado mínimo **128 px**
- se normaliza a cuadrado centrado, lado máximo **512 px**, WebP

Mensajes de error en español, claros, sin guardar.

## UI

En **Mi cuenta → Perfil**, junto al círculo del header:

- Vista previa del avatar actual (foto / preset / iniciales).
- Rejilla de presets (radio visual; el activo marcado).
- **Subir foto** / **Quitar foto** (si hay foto).
- **Usar iniciales** (clear all).
- Nota corta de formatos y tamaño. Se elimina el texto «La foto personal aún no está disponible…».

Alerta de estado: «Foto guardada.», «Avatar guardado.», o el error de validación.

La barra y las listas usan el mismo componente presentacional `DesktopAvatar` con la resolución ya calculada o con props `{ photoUrl?, presetId?, name, email }`.

## Fuera de alcance

- Cropper interactivo, filtros, GIFs animados.
- Avatares en el admin de Growth OS, portal público o Keycloak.
- Galería de medios del Espacio.
- Moderación automática de contenido.

## Testing

- Resolución: foto gana; sin foto con preset; sin ambos → iniciales; preset desconocido → iniciales.
- Subida: tipo inválido / peso / dimensión → 400 y mensaje; válido → flags y archivo.
- DELETE photo vs all.
- UI: elegir preset y subir foto actualizan la vista previa y la píldora sin recargar la página completa (mismo patrón que el fondo).
