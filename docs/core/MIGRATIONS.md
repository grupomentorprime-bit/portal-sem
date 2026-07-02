# Migration Framework — AprendeHoy

Infraestructura común para evolucionar esquemas de datos sin acoplar migraciones a un solo módulo.

## Comandos

```bash
# Ejecutar todas las migraciones pendientes
npm run migrate

# Ejecutar una migración específica
npm run migrate -- 001-hero-v2

# Alias histórico
npm run migrate:hero-v2
```

## Flujo

```
Buscar migraciones en registry
        ↓
Comparar con cms_migrations (aplicadas)
        ↓
Ejecutar pendientes en orden
        ↓
Registrar resultado en cms_migrations
        ↓
Actualizar cms_config.schemaVersion + modules.*
```

## Estructura

```
src/core/migrations/
  types.ts           # Contratos MigrationDefinition, MigrationRecord
  env.ts             # Carga .env.local
  config-helpers.ts  # Utilidades cms_config multi-tenant
  registry.ts        # Lista ordenada de migraciones
  runner.ts          # Orquestador
  001-hero-v2.ts
  002-menu-v2.ts
  003-footer-v2.ts
  004-branding-v2.ts
  005-content-v2.ts

scripts/migrate.ts   # Entrypoint CLI
```

## Registro de ejecución (`cms_migrations`)

```json
{
  "_id": "001-hero-v2",
  "appliedAt": "2026-06-30T12:00:00.000Z",
  "documentsAffected": 1,
  "skipped": 0,
  "durationMs": 142,
  "status": "success"
}
```

## Versionado en `cms_config`

```json
{
  "schemaVersion": 2,
  "modules": {
    "heroPortal": { "version": 2 },
    "branding": { "version": 1 },
    "menu": { "version": 1 },
    "footer": { "version": 1 },
    "content": { "version": 1 }
  }
}
```

- `schemaVersion` — formato del documento completo
- `modules.*.version` — versión independiente por módulo

Constantes en `src/lib/cms/schema-versions.ts`.

## Añadir una migración

1. Crear `src/core/migrations/00N-nombre-v2.ts`
2. Implementar `MigrationDefinition` con `id`, `description`, `modules`, `run`
3. Registrar en `registry.ts`
4. Incrementar `MODULE_VERSIONS` si aplica
5. Ejecutar `npm run migrate`

Las migraciones `002`–`005` son placeholders que inicializan versiones de módulo; se reemplazarán cuando evolucionen Menú, Footer, Branding y Contenido.
