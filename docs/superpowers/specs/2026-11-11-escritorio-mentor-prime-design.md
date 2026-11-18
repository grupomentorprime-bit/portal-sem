# Escritorio Mentor Prime

## Goal

Al entrar con un Espacio, la persona cae en una mesa: fondo, barra y dock. El dock muestra siempre Growth OS, Cumple, Aprende Hoy y RR.HH. Solo se abre lo que ese Espacio contrató. Lo demás se ve con candado y deja una solicitud.

## Context

Hoy `resolvePostAuthDestination` manda a un miembro con Espacio a `/admin`. El admin es el shell de Growth OS (barra lateral y topbar). Aprende Hoy es otro producto: este repo solo hace el handoff de interesado a lead. Cumple vive aquí como sitio del Espacio `cumple`. RR.HH. no tiene sistema. El operador de plataforma sigue cayendo en `/platform`.

La maqueta aprobada está en `.superpowers/brainstorm/` (sesión local, no se versiona). La barra de «¿Esta es la mesa?» era del compañero visual y no entra al producto.

## Decisions

- La mesa es `/escritorio`. No reemplaza `/admin`. `/admin` sigue siendo el inicio de Growth OS.
- El contrato es del Espacio. El candado no mira el rol. Dentro de Growth OS los permisos siguen como hoy.
- El catálogo es fijo: `growth-os`, `cumple`, `aprende-hoy`, `rrhh`, en ese orden.
- El candado es solo para lo no contratado. Lo contratado sin pantalla abre una ficha distinta, sin botón de solicitud.
- El fondo es de la persona, entre tres escenas. No hay subida.
- Este corte no une personas entre sistemas, no redibuja el interior de ninguna app y no cobra un plan.
- Asuntos estudiantiles no ve la mesa. El operador de plataforma sigue entrando a `/platform`.

## Puerta

`/escritorio` entra en `isPlatformProductPath` y en `isProtected` de `src/proxy.ts`, igual que `/admin`. Sin sesión, `/login?next=/escritorio`. En el host de plataforma no rebota a `/`.

`resolvePostAuthDestination` cambia el destino por defecto del miembro con Espacio, sin `next` profundo, de `/admin` a `/escritorio`. Se conserva:

- operador → `/platform`, aunque tenga Espacio o `next=/admin`
- sin Espacio → `/admin/sin-espacio`
- `next` profundo (por ejemplo `/admin/ventas`) → ese `next`
- `next` que hoy cuenta como aterrizaje por defecto (`/admin`, `/admin/config`, `/admin/sin-espacio`) → `/escritorio` si hay Espacio

La página `/escritorio`, en el servidor y antes de pintar:

- sin Espacio → `/admin/sin-espacio`
- `usesStudentAffairsFocusedShell` → `STUDENT_AFFAIRS_HOME_PATH`
- operador sin membresía en el Espacio activo → `/platform`

Un operador que ya entró a un Espacio y abre `/escritorio` ve la mesa de ese Espacio.

El umbral de entrada, si el `redirectTo` es `/escritorio`, dice «Entras a tu escritorio.» y no lee el panel de atención. Un `next` a `/admin` sigue usando las frases de hoy.

## Mesa

Página de servidor que lee sesión, Espacio activo, contrato y fondo. El cliente pinta.

Barra, de izquierda a derecha: marca, «Mentor Prime», botón Fondo, nombre del Espacio, hora local (`es-CL`, hora y minuto), píldora de la persona. Si hay más de un Espacio, el nombre abre la lista de Espacios que ya arma `AdminUserMenuPanel`. Al cambiar, la página vuelve a leer el contrato de ese Espacio. El fondo no cambia. La píldora abre perfil y salir desde ese mismo panel.

Dock: cuatro iconos. El no contratado lleva el candado de la maqueta. Clic:

| Estado | Qué pasa |
| --- | --- |
| `growth-os` contratado | Navega a `/admin`. |
| `cumple` contratado y el Espacio activo es `cumple` | Navega al origen que ya resuelve `resolvePublicOriginForTenant` para ese Espacio. |
| `aprende-hoy` contratado y el Espacio tiene una URL `https` | Navega a esa URL, fuera de este origen. |
| `rrhh` contratado | Ficha «Llega después». No hay ruta. |
| Contratado sin entrada (`cumple` en otro Espacio, `aprende-hoy` sin URL) | Ficha «Entrada no conectada». Sin botón de solicitud. |
| No contratado | Ficha «No está en el plan». |

Frases de la ficha, una línea:

| App | Frase |
| --- | --- |
| Growth OS | Captación y conversión del Espacio. |
| Cumple | Cumplimiento de la empresa: obligaciones, brechas y evidencia. |
| Aprende Hoy | Vida académica: admisión, clases, evaluación y campus. |
| RR.HH. | Personas empleadas, contratos y jornada. |

La ficha de candado tiene «Solicitar acceso» y «Cerrar». Al guardar, el botón pasa a «Solicitud enviada» y aparece «Queda registrada para este Espacio.» Cerrar y clic fuera cierran la ficha. Una solicitud abierta por Espacio y por app: el segundo clic no crea otra.

Fondos, en este orden, archivos en `public/desktop/`: `mar.jpg`, `valle.jpg`, `noche.jpg`. El primero es el de partida. Fondo avanza en ciclo y se guarda. Si la imagen falla, el fondo es `#102033`.

## Volver

En el topbar de Growth OS (`AdminTopBarV2`), a la izquierda, un control «Escritorio» hacia `/escritorio`. Aparece en `/admin` salvo login y sin Espacio. No se agrega una segunda barra.

En el sitio Cumple, el mismo control solo con sesión. Una visita sin sesión no lo ve.

Aprende Hoy está en otro origen. Volver es regresar a `/escritorio`.

## Datos

Catálogo puro en `src/lib/desktop/catalog.ts`: id, etiqueta, frase, orden.

Contrato en el documento del Espacio (`TenantDocument`):

- `contractedApps?: MentorAppId[]` — si el campo no está, el default es `["growth-os"]`. El Espacio `cumple` suma `cumple`. Si el campo está, esa lista es la verdad, aunque venga vacía.
- `aprendeHoyEntryUrl?: string` — solo se usa si es `https://`. Cualquier otro valor cuenta como sin entrada.

Preferencia en `identity_users.desktopWallpaper`: `"mar" | "valle" | "noche"`. Ausente o desconocido → `mar`.

Solicitudes, colección `space_app_requests`:

| Campo | |
| --- | --- |
| `tenantId` | Espacio |
| `appId` | una del catálogo |
| `requestedBy` | id de la persona |
| `createdAt` | ISO |
| `status` | `open` o `fulfilled` |

Índice único parcial: una fila `open` por `tenantId` + `appId`.

`POST /api/desktop/requests` con `{ appId }`. Exige sesión y Espacio. Rechaza un app ya contratado y un id fuera del catálogo. Si ya hay una abierta, responde éxito sin insertar. `POST /api/desktop/wallpaper` con `{ wallpaper }` guarda la preferencia de la persona de la sesión.

## Operador

En la ficha del Espacio (`/platform/spaces/[tenantId]`) se ven las cuatro apps, si están contratadas, la URL de Aprende Hoy y las solicitudes abiertas. El operador puede marcar o quitar el contrato y editar la URL. Al marcar contratada, las solicitudes abiertas de ese par pasan a `fulfilled`. Quitarla no borra el historial. Solo `requirePlatformOperator`.

## Errores

- Sin sesión en `/escritorio`: el proxy manda al login.
- Sin Espacio, asuntos estudiantiles u operador fuera de un Espacio: redirección de la página, sin pintar la mesa.
- Imagen de fondo rota: `#102033`.
- `POST` de solicitud que falla: la ficha sigue abierta y el botón se puede reintentar.
- `POST` de fondo que falla: la escena cambia en la mesa y, al recargar, vuelve a la guardada.

## Tests

Funciones puras, sin Mongo:

- Default de contrato: Espacio cualquiera → `growth-os`. Espacio `cumple` → `growth-os` y `cumple`. Lista explícita, incluida la vacía, reemplaza el default.
- Clic: contratado con entrada abre; `rrhh` contratado es «llega después»; contratado sin entrada es «entrada no conectada»; no contratado es solicitud.
- URL de Aprende Hoy: solo `https://` es entrada.
- `resolvePostAuthDestination`: el caso «usuario normal + solo SEM» pasa a `/escritorio`. Operador, sin Espacio y `next` profundo no cambian. `next=/admin` sin ser operador pasa a `/escritorio`.
- Frase de umbral de `/escritorio`: «Entras a tu escritorio.», sin panel.

Con almacén en memoria:

- La segunda solicitud abierta del mismo par no inserta.
- Contratar el app marca esa abierta como `fulfilled`.

El proxy: `/escritorio` sin cookie redirige a `/login?next=/escritorio`, y el host de plataforma no lo manda a `/`.

## Fuera de este corte

Persona compartida entre Growth OS, Cumple, Aprende Hoy y RR.HH. Mundos interiores (Órbita, la ciudad de Aprende Hoy, una cara nueva de Conversión). Subir un fondo. Cobro. Construir RR.HH. Abrir Cumple dentro de un Espacio que no es `cumple`.
