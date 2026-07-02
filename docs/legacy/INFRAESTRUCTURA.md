# Infraestructura Base — OT-SEM-INFRA-001

Documentación técnica de la infraestructura fundacional del Portal Institucional SEM.

## 1. Resumen

| Atributo | Valor |
| --- | --- |
| OT | OT-SEM-INFRA-001 |
| Módulo | Infraestructura Base |
| Versión | 1.0 |
| Tag Git | v1.0-base |
| Stack | Next.js 16, React 19, TypeScript, MongoDB Driver 7 |

## 2. Objetivo

Establecer la base tecnológica mínima, segura y escalable sobre la cual se construirán todos los módulos posteriores del portal (CMS, programas, noticias, tienda, panel administrativo, etc.).

## 3. Diagrama de flujo

```
┌─────────┐     ┌──────────────────┐     ┌─────────────┐     ┌─────────────────┐
│ Usuario │ ──► │ Portal SEM       │ ──► │ API Routes  │ ──► │ MongoDB         │
│ (web)   │     │ Next.js App      │     │ /api/*      │     │ SeminarioIPN    │
└─────────┘     │ Router           │     └─────────────┘     └────────┬────────┘
                └──────────────────┘                                  │
                                                                      ▼
                                                            ┌─────────────────┐
                                                            │ AprendeHoy API  │
                                                            │ (futuro)        │
                                                            └─────────────────┘
```

## 4. Stack tecnológico

### Next.js (App Router)

- Directorio `src/app/` con convención de rutas basada en carpetas.
- API Routes en `src/app/api/`.
- TypeScript estricto habilitado en `tsconfig.json`.
- Alias de importación `@/*` → `./src/*`.

### MongoDB

- Driver oficial `mongodb` v7.
- Base de datos exclusiva: **SeminarioIPN**.
- Colección de lectura en esta OT: **cms_config**.

### Variables de entorno

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `MONGODB_URI` | URI de conexión al cluster | `mongodb://user:pass@host:27017/?authSource=admin` |
| `MONGODB_DB` | Nombre de la base de datos | `SeminarioIPN` |

Las variables se cargan desde `.env.local` en desarrollo. Este archivo está excluido de Git mediante `.gitignore`. Usar `.env.example` como plantilla sin credenciales reales.

## 5. Conexión MongoDB

Archivo: `src/lib/mongodb.ts`

### Patrón de reutilización

En **desarrollo**, la conexión se almacena en `global.mongo` para evitar múltiples conexiones durante hot-reload de Next.js.

En **producción**, se crea una única instancia de `MongoClient` al iniciar el proceso.

### Función exportada

```typescript
export async function getDatabase(): Promise<Db>
```

Retorna la instancia de base de datos configurada en `MONGODB_DB`.

### Reglas

- No importar `mongodb` ni `getDatabase` desde componentes React.
- Solo usar desde API Routes o Server Actions del servidor.
- No hardcodear credenciales en el código fuente.

## 6. API de prueba

### `GET /api/test`

Archivo: `src/app/api/test/route.ts`

**Propósito:** Validar que la infraestructura funciona correctamente.

**Verificaciones:**

1. Variables de entorno definidas.
2. Conexión activa a MongoDB.
3. Lectura del documento `cms_config` con `_id: "site"`.
4. Respuesta JSON estructurada.

**Respuesta exitosa (200):**

```json
{
  "ok": true,
  "database": "SeminarioIPN",
  "sitio": { ... }
}
```

**Respuesta de error (500):**

```json
{
  "ok": false,
  "error": "mensaje descriptivo"
}
```

## 7. Seguridad

- Credenciales únicamente en `.env.local` (servidor).
- Ninguna variable `MONGODB_*` expuesta al cliente (`NEXT_PUBLIC_` no se usa para DB).
- Acceso a datos exclusivamente vía API Routes.
- Preparado para autenticación futura en capa de API.

## 8. Calidad de código

### TypeScript

- `strict: true` en `tsconfig.json`.
- Sin errores de compilación (`npm run build`).

### ESLint

- Configuración `eslint-config-next` con reglas core-web-vitals y TypeScript.
- Sin errores (`npm run lint`).

## 9. Criterios de aceptación (OT-001)

| Criterio | Estado |
| --- | --- |
| Proyecto Next.js creado | ✅ |
| MongoDB conectado | ✅ |
| API `/api/test` funcionando | ✅ |
| Lectura de `cms_config` | ✅ |
| Respuesta JSON correcta | ✅ |
| Compilación exitosa | ✅ |
| ESLint limpio | ✅ |
| TypeScript limpio | ✅ |
| Git inicializado | ✅ |
| Documentación técnica | ✅ |
| Tag `v1.0-base` | ✅ |

## 10. Alcance excluido

Esta OT **no** incluye:

- CMS, programas, CRM, tienda, noticias, blog.
- Panel administrativo.
- Modificaciones estructurales a colecciones MongoDB.
- Interfaces TypeScript de dominio.
- Componentes React de negocio.

## 11. Próximos pasos

Las siguientes OTs agregarán capacidades sobre esta base:

1. Módulos de contenido (CMS, noticias, blog).
2. Integración con AprendeHoy API.
3. Autenticación y panel administrativo.
4. Pasarela de pagos (Mercado Pago).

## 12. Bitácora

| Fecha | Evento |
| --- | --- |
| 29-06-2026 | Proyecto Next.js creado, MongoDB conectado, API `/api/test` validada |
| 29-06-2026 | Limpieza de estructura, documentación y cierre OT con tag `v1.0-base` |
