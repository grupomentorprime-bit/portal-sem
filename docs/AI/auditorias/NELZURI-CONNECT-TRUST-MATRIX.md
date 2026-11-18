# NELZURI Connect — Matriz de confianza (fase análisis)

**Estado:** borrador operativo para diseño; **sin** Launch Code ni SSO.  
**Base:** `NELZURI-CONNECT-IDENTITY-INVENTORY.md`  
**Rama:** `feat/escritorio-mentor-prime`  
**Fecha:** 2026-11-16

## Cómo leer la matriz

Cada fila es un **origen** donde el usuario actúa. Columnas = mecanismos de confianza que el código asume hoy.

| Símbolo | Significado |
| --- | --- |
| Sí | El origen dispone / exige ese mecanismo |
| No | Ausente por diseño actual |
| Parcial | Existe en algunos flujos o hosts |
| N/A | No aplica |

## Matriz origen × mecanismo

| Origen | Cookie `ah_session` | Login Keycloak (mismo host) | Llave `MentorAppId` | Same-site nav | Full navigation externa | Notas de medición |
| --- | --- | --- | --- | --- | --- | --- |
| Plataforma `APP_URL` → `/escritorio` | Sí | Sí (vía `/login`) | Sí (iconos mesa) | Sí | N/A | Dev: `localhost:3000` / `localhost:3001` |
| Plataforma → `/admin` (Growth OS) | Sí | Sí | Sí (`growth-os`) | Sí | N/A | Layout exige membresía + llave |
| Plataforma → `/platform` | Sí | Sí | N/A | Sí | N/A | `platformRoles`, no llave de app |
| Host Espacio `{slug}.localhost` portal público | No* | Parcial (`/ingresar` en ese host) | No | N/A | N/A | Tenant por Host→Domain; cookie de plataforma **no** viaja |
| Host Espacio publicado (prod) | No* | Parcial | No | N/A | N/A | Mismo límite de cookie por host |
| Escritorio → `aprende-hoy` URL | No | No (otro producto) | Sí (para mostrar icono) | No | Sí | `desktopClick` abre HTTPS sin ticket |
| Escritorio → `cumple` URL | No | No | Sí (icono) | No | Sí | Sin handoff de identidad |
| Escritorio → `rrhh` | N/A | N/A | Parcial (catálogo) | N/A | No | Destino `later`; sin superficie |
| Switch Espacio `POST …/spaces/switch` | Sí (misma cookie) | N/A | Recalcula en destino | Sí → `/escritorio` | N/A | No usa `?tenant=` |

\* “No” = la cookie emitida en el host de plataforma no se envía al host del Espacio (SameSite/host).

## Casos a validar en dev (checklist)

Sin cambiar auth: solo observar requests/cookies en DevTools.

1. Login en `localhost:3000` → cookie `ah_session` Domain/Path/Secure/SameSite.
2. Abrir `{slug}.localhost:3000` en otra pestaña → ¿aparece `ah_session`? (esperado: no).
3. Desde escritorio, abrir Growth OS `/admin` → misma cookie, 200 si hay llave `growth-os`.
4. Quitar llave `growth-os` al miembro → `/admin` redirige a `/escritorio`.
5. Click `aprende-hoy` / `cumple` → navegación limpia (sin `state`/`code`/`sub` en query).
6. Switch de Espacio → `redirectedTo: "/escritorio"` y APIs siguientes usan el nuevo `tenantId`.

## Huecos que Connect deberá resolver después (no implementar ahora)

1. Confianza cross-host (plataforma ↔ dominio Espacio).
2. Handoff a satélites sin re-login (hoy full navigation ciega).
3. Superficie `rrhh`.
4. Política explícita para membresías sin `authorizedApps` (legado = techo completo).

## Siguiente paso de análisis (no código de SSO)

Completar la columna **“evidencia”** de la checklist anterior con capturas o log de cookies en los tres hosts locales (`APP_URL`, `{slug}.localhost`, URL satélite de prueba). Ese paquete alimenta el diseño de Connect.
