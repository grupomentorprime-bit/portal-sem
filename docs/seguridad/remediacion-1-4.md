# Remediación 1–4

Growth OS no está apto para liberación. Este registro cubre la rama `fix/growth-os-seguridad-1-4` después de `4dcb9f4`. No hubo push, merge, deploy ni cambios en Dokploy, Cloudflare, Keycloak, Mongo productivo o el bucket.

## Pruebas de esta copia

Corridas el 19 de noviembre de 2026 sobre este árbol, con `public/media/catalog.json` generado en local y fuera de git.

| Control | Resultado |
|---|---|
| `npm audit --audit-level=high` | 0 vulnerabilidades |
| `tsc --noEmit` | 0 |
| `npm run build` | 0 |
| Pruebas de reclamo, CSP, medios, límite, Connect y gate | 52/52 |
| Baseline completo | 1240 pasaron, 20 fallaron, 24 se omitieron, de 1284 |
| Lint del repo | 60 errores y 125 advertencias; ninguno en los archivos de esta pasada |

Los 20 fallos del baseline ya estaban fuera de estos archivos: escritorio y marca presentes en `5388492`, y `OT-GROWTH-TEST-002` contra un servidor que ya escuchaba en la máquina. No se usó la base configurada.

`help-origins.ts` solo exporta `DeskFilterFields`, `emptyDeskFilters` y `countAppliedDeskFilters`, que `DesktopAttention` ya importaba. Sin eso `tsc` no llegaba a 0. El archivo sin commit de `master` no se tocó.

## Controles pendientes

- **Almacenamiento.** Un documento privado ya no se entrega con la URL del bucket. Quien conozca `{publicUrl}/media/{clave}` sigue pudiendo abrir el objeto mientras el bucket no cambie. El bucket no se tocó.
- **CSP.** En producción `script-src` ya no trae `'unsafe-inline'`. `CSP_RUNTIME_CHECK.verified` sigue en falso: falta recorrer CUMPLE, formularios, login y páginas públicas en el navegador.
- **Límite.** El contador compartido está listo, pero en ejecución usa la memoria del proceso. Pasa a Mongo solo con `RATE_LIMIT_BACKEND=mongo`. Hoy no es un control de borde.
- **Despliegue.** El job `release-gate` escribe el resultado de `branding` y no llama a Dokploy. `failedCiBlocksDeploy` sigue en falso. Un job rojo no frena el despliegue.
- **Reclamo por teléfono.** No hay SMS. Si no hay correo, la solicitud queda para el operador.

## SheetJS 0.20.3

El registro de npm no publica una versión corregida (`xlsx@0.18.5`, `fixAvailable: false`). La fuente oficial de la comunidad 0.20.3 es el tarball de SheetJS:

`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`

Instalación que documenta SheetJS: <https://docs.sheetjs.com/docs/getting-started/installation/nodejs>.

`package.json` apunta a esa URL. `package-lock.json` la fija con esta integridad, comprobada descargando el tarball el 19 de noviembre de 2026:

`sha512-oLDq3jw7AcLqKWH2AhCpVTZl8mf6X2YReP+Neh0SJUzV/BdZYjth94tG5toiMB1PPrYtxOCfaoUCkvtuH+3AJA==`

En un checkout limpio, `npm ci` instala ese archivo y rechaza otro hash. No sustituir por `npm install xlsx` desde el registro.

El lockfile también avanzó, dentro de los rangos ya declarados, lo que `npm audit fix` y el `npm install` de esta copia resolvieron juntos: Next `16.4.6`, `eslint-config-next` `16.4.6`, postcss, sharp `0.35.5`, brace-expansion, browserslist, js-yaml, nanoid, source-map-js, zod, y el refresco de Tailwind `4.3.5` y `sanitize-html` `2.18.2`. Cada paquete resuelto trae `integrity`. Las URLs son `registry.npmjs.org` o el CDN de SheetJS.

## Catálogo institucional

`public/media/catalog.json` está en `.gitignore` (`/public/media/*`). No se copia a mano ni se commitea.

En un checkout limpio:

```text
npm run build:institutional-media
```

Ese script (`scripts/build-institutional-media.ts`) escribe el catálogo. `npm run build` y `npm run build:docker` lo ejecutan antes de `next build`. `tsc` importa el archivo desde `src/lib/media/institutional-catalog-data.ts`; sin generarlo, el error es `TS2307`.
