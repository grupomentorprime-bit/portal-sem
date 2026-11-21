# Traslado futuro a nelzuri_core

Lectura del 20 nov 2026. **No está autorizado y este corte no lo ejecuta.** `SeminarioIPN` sigue siendo el sistema de registro. `nelzuri_core` existe en el mismo servidor, vacía, y no se escribe.

Tampoco entra aquí la rotación de la cuenta del portal, Dokploy, Keycloak, el firewall ni el cierre del puerto. Eso queda en el informe del incidente y se hace aparte, cuando se autorice.

## Lo que se movió junto, cuando se autorice

Una sola base, 103 colecciones, 95.985 documentos, unos 65 MB. El Espacio es un campo (`tenantId` o `tenant`), no una base distinta. Seis Espacios activos:

| Espacio | Código | Documentos con ese campo |
| --- | --- | ---: |
| Seminario Eclesiástico Mayor | T001 | 93.667 |
| IPN Chile | IPN_CHILE | 626 |
| Mentor Cumple | CUMPLE | 475 |
| Mentor Capacitación | MENTOR_PRIME_CAPACITACION | 185 |
| Academia ADL | T002 | 173 |
| Fundación Mueve | FUNDACION_MUEVE | 28 |

Además había 225 identificadores que no son un Espacio y 719 documentos, sobre todo restos `ot-*`. Un traslado los arrastra. Limpiarlos es otro trabajo.

Identidad global, fuera de esa tabla: 13 usuarios y 205 sesiones. En el congreso de IPN Chile había 191 inscripciones.

Las 103 colecciones incluyen identidad, sesiones, Espacios, dominios, CMS, formularios, congreso, Growth, Cumple, atención, workflows, `cms_migrations` y `platform_integrations` (secretos de almacenamiento cifrados con `SESSION_SECRET`).

## Lo que no cambia de nombre

`tenantId` `seminario-ipn`, el site `S001`, el realm Keycloak `seminario-ipn`, los hosts, las cookies y `SESSION_SECRET`. Renombrar eso es una migración de identidad, no el cambio de base.

El código abre `process.env.MONGODB_DB`. El literal `SeminarioIPN` no está en la aplicación. Dokploy tiene el valor fuera de git. RR.HH., Aprende Hoy, Factura y Sinca son otras bases del mismo servidor y no se tocan.

## Orden, cuando se autorice

1. Desarrollo y pruebas ya no abren `SeminarioIPN`. Es el corte de este documento de trabajo, no el traslado.
2. `mongodump` de `SeminarioIPN` fuera del servidor, con conteos por colección.
3. Ventana corta: parar el portal en Dokploy, el Next local y los scripts. Confirmar que `nelzuri_core` sigue vacía.
4. Restaurar en `nelzuri_core` y dejar `SeminarioIPN` intacta. No alcanza con renombrar.
5. Cambiar `MONGODB_DB` en Dokploy. Ningún entorno de desarrollo ni de pruebas apunta ahí.
6. Verificar 6 Espacios, 13 usuarios, 191 inscripciones, la migración 032 en success y un login.
7. Conservar `SeminarioIPN` al menos un ciclo de negocio. El regreso es volver la variable al nombre anterior.

No hay réplica. El volumen cabe en minutos; la espera es de continuidad. El restore de prueba sigue pendiente y no se hace en este corte.
