# Umbral de entrada — Growth OS

## Goal

La puerta de `/login` y el primer segundo del inicio son un solo gesto. Una frase pública se reescribe, al reconocer a la persona, en la primera pieza que esa persona va a ver. Después se abre el destino que el login ya calcula.

## Context

Hoy `/login` renderiza `ProductAuthFrame` y `LoginForm`. El formulario postea a `POST /api/identity/auth/keycloak/session`, y esa ruta devuelve `redirectTo` vía `resolvePostAuthDestination`. El cliente hace `location.assign`. El inicio (`/admin`) ya proyecta «Qué necesita atención» desde `readCommercialPanel` y `projectGrowthOsHomeDashboard`. `porAtender` es vencidas + sin seguimiento + estancadas.

La página de login no hereda el CMS del Espacio. Esta entrega lee un conteo por host y nada más.

## Decisions

- El gesto ocurre en `/login`, en un solo documento. La transición del navegador no es el espectáculo.
- El formulario de usuario y contraseña sigue visible desde el primer pixel y sigue validándose en el servidor.
- Antes de la sesión, la frase pública no lleva nombres. Solo aparece un conteo si el host resuelve un Espacio.
- La frase de cruce describe la pantalla en la que la persona se queda, no una ruta intermedia.
- El inicio no se redibuja. Solo asienta la primera pieza de atención cuando la puerta lo anuncia.
- `ProductAuthFrame` sigue en sin Espacio, acceso denegado y el resto de pantallas de acceso.
- Si la frase no se puede armar, el login responde como hoy y el cliente abre el destino sin respiro.

## Frases

Función pura, sin IO, en `src/lib/identity/threshold-line.ts`.

### Pública

Entrada: un conteo o `null`.

| Conteo | Frase |
| --- | --- |
| `null` | Entra a tu Espacio. |
| `0` | Este Espacio está al día. |
| `1` | Hay 1 oportunidad esperando. |
| `n > 1` | Hay {n} oportunidades esperando. |

`n` se formatea con `Intl.NumberFormat("es")`, igual que los conteos del inicio. Esta frase no incluye nombres, correos ni ids.

### De cruce

Se evalúa sobre el `redirectTo` ya resuelto, en este orden. Comparar solo el path, sin query. La primera fila que coincide gana.

| Orden | Path | Frase |
| --- | --- | --- |
| 1 | `/platform` o debajo | Entras a la plataforma. |
| 2 | `/admin/sin-espacio` | Todavía no tienes un Espacio. |
| 3 | `/admin`, shell de asuntos estudiantiles | Entras a tu trabajo. |
| 4 | `/admin`, sin permiso de ventas | Entras a tu Espacio. |
| 5 | `/admin`, con permiso y sin filas de atención | Nada pide atención ahora. |
| 6 | `/admin`, con permiso y con primera fila | Frase de banda, abajo. |
| 7 | Cualquier otro path | Entras a tu trabajo. |

Permiso de ventas: `growth.sales.view`, `growth.sales.read` o `growth.sales.operate`. El mismo `canSales` del inicio.

Shell de asuntos estudiantiles: `usesStudentAffairsFocusedShell`. Esas personas no se quedan en el inicio: la página y el layout las mandan a `/admin/portal/asuntos-estudiantiles`. No se lee el panel.

Alcance del panel, igual que `loadGrowthOsHomeSnapshot`: todo el Espacio si hay `growth.sales.view` o `growth.sales.read`; si no, lo suyo. La primera fila es la primera de `priorityGrowthQueue`, que es la primera pieza de «Qué necesita atención». El nombre es el `personaLabel` de esa fila (`displayName`, o «Persona» si falta).

| Banda | Frase |
| --- | --- |
| `overdue` | {nombre} está vencida. |
| `unfollowed` | {nombre} está sin seguimiento. |
| `stale` | {nombre} está estancada. |
| cualquier otra | {nombre} · {etiqueta}. |

La etiqueta de la banda sale de `growthPriorityBandLabel`. «Está vencida» concuerda con la oportunidad, no con la persona.

La frase pública es el agregado del Espacio. La de cruce es la cola que esa persona verá. Pueden no coincidir. No se unifican.

## Lecturas

### Conteo público

`readSpaceAttentionCount(tenantId)` junto a `readCommercialPanel`, en `src/lib/growth/commercial-read.ts`. Usa el `loadOpen` que ya carga el panel y `countGrowthBands`. Devuelve `overdue + unfollowed + stale`. No mapea filas y no devuelve nombres.

`/login` (server) llama `resolveActiveTenantIdFromRequest`. Sin tenant, la frase es la de conteo `null`. Con tenant, pide el conteo. Si la lectura lanza, la frase es la de conteo `null`. No se agrega un endpoint público.

### Frase de cruce

Dos funciones puras en `threshold-line.ts`. Las pruebas de «no llama al panel» las ejercitan sin Mongo.

- `crossingMayResolveAccess(path, hasTenant)` es verdadera solo si el path es exactamente `/admin` y hay tenant. Si es falsa, no se resuelven permisos ni se lee el panel.
- `crossingNeedsPanel(path, flags)` es verdadera solo si además no es el shell de asuntos estudiantiles y hay permiso de ventas.

`readCrossingThresholdLine` en `src/lib/identity/threshold-read.ts` (`server-only`). La llama la ruta de sesión después de conocer `redirectTo`.

1. Si `crossingMayResolveAccess` es falsa, devuelve la frase fija de la tabla y no toca permisos ni el panel.
2. Si es verdadera, resuelve permisos y códigos de rol como la página `/admin` (`findRolesByIds`, `getRoleCode`, `resolvePermissionsForMembership`).
3. Si `crossingNeedsPanel` es falsa, devuelve la frase fija (asuntos estudiantiles o sin permiso) y no toca el panel.
4. Si es verdadera, llama `readCommercialPanel(tenantId, userId, spaceWide)` y formatea la primera fila.

Si este helper lanza, la ruta de sesión lo atrapa, no agrega los campos nuevos y responde `ok` con `redirectTo`. Un fallo de frase no es un fallo de login.

Devuelve `{ line, announceArrival }`. `announceArrival` es verdadero solo cuando el path es `/admin`, no es el shell de asuntos estudiantiles, hay permiso de ventas y el panel respondió (haya filas o no).

## Puerta

`/login` deja de usar `ProductAuthFrame`. Quien ya tiene sesión sigue redirigido como hoy, antes de pintar la puerta. Una escena de cliente muestra la frase pública y, debajo, `LoginForm`.

`LoginForm` acepta `onAuthenticated` opcional. Si no está, asigna `redirectTo` como hoy. Si está, no navega: espera la promesa del callback antes de soltar el estado de carga, para que no haya un segundo envío durante el respiro. Si el callback rechaza, el formulario muestra el error de conexión y no abre el destino.

La escena, con sesión aceptada:

1. Si no viene `thresholdLine`, abre `redirectTo` de inmediato.
2. Si la frase nueva es igual a la que ya se muestra, abre de inmediato.
3. Si `prefers-reduced-motion: reduce`, reescribe la frase y abre de inmediato.
4. Si no, reescribe la frase, espera 700 ms y abre `redirectTo`.

Justo antes de abrir, si `thresholdArrival` es verdadero, escribe la señal.

Contraseña incorrecta, servicio caído o auth no disponible: la frase pública no cambia. El error queda en el formulario, como hoy.

## Señal de llegada

Funciones puras y de almacenamiento en `src/lib/identity/threshold-arrival.ts`, sin `server-only`.

- Clave: `growth-os.threshold-arrival`.
- Valor: timestamp en ms. No guarda la frase.
- `shouldPlayArrival(storedAt, now)` es verdadero si la diferencia es menor a 15 segundos.
- Leer la señal la borra siempre.

En el inicio, un componente de cliente envuelve el bloque de «Qué necesita atención» (la lista o el vacío). Al montar, si la señal se debe reproducir, marca el bloque. CSS asienta la primera fila, o el vacío si no hay filas. Con `prefers-reduced-motion: reduce`, no anima. El texto del inicio lo sigue calculando el servidor.

## Respuesta de sesión

`POST /api/identity/auth/keycloak/session` conserva `redirectTo` y el resto del JSON. Suma, solo si el helper respondió:

- `thresholdLine: string`
- `thresholdArrival: boolean`

## Pruebas

`node:test` en `tests/baseline`, importando la función pura, al estilo de `growth-ventas-attention.test.ts`.

- Pública: `null`, `0`, `1`, `1200` (formato `es`). La función no recibe un nombre.
- Cruce: cada fila de la tabla, en orden; shell de asuntos estudiantiles; sin permiso de ventas; fila `overdue`, `unfollowed`, `stale` y banda desconocida.
- `crossingMayResolveAccess` falso fuera de `/admin` o sin tenant. `crossingNeedsPanel` falso sin permiso o con shell de asuntos estudiantiles. Ninguna de las dos toca Mongo.
- `announceArrival` verdadero solo en `/admin` con permiso y panel respondido. Falso en plataforma, sin Espacio, otro path, asuntos estudiantiles y sin permiso.
- `shouldPlayArrival`: dentro de 15 s verdadero, a los 15 s falso, timestamp inválido falso. El lector borra la clave al leer; con un almacenamiento en memoria, la segunda lectura no reproduce.
- La ruta de sesión sigue conteniendo `redirectTo` y `loginWithKeycloakPassword`. `/login` sigue renderizando `LoginForm`, con los campos Usuario y Contraseña, posteando a `/api/identity/auth/keycloak/session`. Los contratos de `auth-hardening-001` siguen cerrando.

## Fuera de alcance

Passkeys, voz, endpoint público de la frase, frases distintas por cada `next`, rehacer el inicio, mover `resolvePostAuthDestination`, y usar la View Transitions API como gesto principal.
