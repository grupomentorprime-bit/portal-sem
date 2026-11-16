# Llaves de aplicación por persona

## Goal

El administrador de cada Espacio autoriza, desde NELZURI, qué miembros pueden abrir Growth OS, Cumple, Aprende Hoy y RR.HH. Solo dentro del plan contratado. El servidor comprueba la llave; ocultar el icono no basta.

## Context

Hoy el dock mira solo `contractedApps` del Espacio. Cualquier miembro activo abre todo lo contratado. El plan ya se administra en Plataforma → Clientes. Membresías (`identity_memberships`) y roles ya existen. No hay SSO ni cambios al interior de las aplicaciones.

## Decisions

- **Techo:** sigue en el Espacio (`contractedApps` + `aprendeHoyEntryUrl`). Solo el operador de plataforma lo cambia.
- **Llave:** `authorizedApps: MentorAppId[]` en la membresía del Espacio. Intersección con el techo = lo que la persona puede abrir ahí.
- **Estados del dock:**
  - no contratada → candado / solicitar (solo quien administra el Espacio)
  - contratada sin llave → no se muestra el icono
  - contratada con llave sin entrada → «no conectada» / «llega después»
  - contratada con llave y entrada → abre
- **Migración:** cada membresía existente recibe exactamente las apps contratadas de su Espacio en ese momento. No se agregan apps fuera del techo. Contratar una app nueva después no reparte llaves.
- **Gestión en NELZURI:** Ajustes → Equipo pasa a panel del escritorio; ahí se marcan las apps autorizadas (solo las contratadas).
- **Servidor:** entrar a Growth OS (`/admin`) exige llave `growth-os` en la membresía del Espacio activo. Plataforma y operadores siguen con sus capacidades actuales; al otorgar acceso a un Espacio se autorizan las apps contratadas de ese momento.
- Fuera de alcance: SSO, seguridad interna de cada app, invitación única multiplataforma, líneas del día.

## Datos

| Campo | Dónde |
| --- | --- |
| `contractedApps` | documento del Espacio (sin cambio de dueño) |
| `authorizedApps` | `identity_memberships` |
| opcional en invitación | `authorizedApps` para copiar al aceptar |

Resolución pura: `effectiveApps = intersection(authorizedApps ?? contracted, contracted)`. Ausencia del campo solo vale como «todas las contratadas» hasta que la migración lo materialice; el runtime post-migración trata lista vacía como ninguna llave.

## Tests

Funciones puras: migración de llaves, intersección, visibilidad del dock, clic con `unauthorized`, parche de autorización acotado al techo. Rutas: PATCH de membresía rechaza apps no contratadas y Espacios ajenos. Entrada a `/admin` sin llave redirige al escritorio.
