# OT-CORE-HERO-002 — Migración definitiva del Hero al esquema v2

**Estado:** Cerrada — superseded por Migration Framework (`docs/core/MIGRATIONS.md`)

## Resumen

- Hero en esquema v2 anidado (`content`, `multimedia`, …)
- Versión de módulo en `cms_config.modules.heroPortal.version`
- Versión de documento en `cms_config.schemaVersion`
- Migración vía `npm run migrate` (entrada `001-hero-v2`)
- Hero declarado **CORE v1.0 LOCKED** — ver `docs/core/CORE-HERO-v1.md`

## Comandos

```bash
npm run migrate              # todas las pendientes
npm run migrate -- 001-hero-v2
```

## Verificación post-guardado

1. Configuration Hub → Guardar
2. MongoDB `cms_config`:

```json
{
  "schemaVersion": 2,
  "modules": {
    "heroPortal": { "version": 2 }
  },
  "heroPortal": {
    "slides": [{ "content": {}, "multimedia": {} }]
  }
}
```

Sin campos planos (`titulo`, `imagenDesktopId`) ni `heroPortal.schemaVersion` anidado.
