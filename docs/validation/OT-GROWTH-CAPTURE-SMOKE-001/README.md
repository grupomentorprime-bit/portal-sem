# OT-GROWTH-CAPTURE-SMOKE-001 — Probar Captación V1 completa

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-CAPTURE-SMOKE-001 |
| Tipo | Smoke operativo (Espacio real) |
| Fecha | 2026-09-07 |
| Espacio | `adl` (Host `adl.localhost:3000`) |
| Estado | **CERRADA · APTO** |

## Qué se reutilizó

Experience Forms + Admisión + live-ingest (CORE-005) + Personas/Ventas + Automatizaciones activas existentes (`Seguimiento con espera`) + `sales-ops` + historial «Qué ha pasado» (AUTOMATION-007). Sin cambios al motor de formularios ni a Automatizaciones.

## Evidencia

| Archivo | Contenido |
| --- | --- |
| `RESULT.json` | Marcadores de los 4 casos |
| `admin-personas-after-capture.png` | Listado Personas ADL |
| `admin-persona-detail-capture.png` | Ficha + «Qué ha pasado» (reenvío) |
| `admin-ventas-after-capture.png` | Cola Ventas |
| `admin-automatizacion-que-ha-pasado.png` | Ejecución automatización |

Reproducir (app viva):

```bash
npx tsx --env-file=.env scripts/smoke-growth-capture-001.ts
```

## Nota de entorno

ADL no trae forms V1 de fábrica (SAAS-009). El smoke crea/asegura un form `adl-smoke-info-request` (`information_request`) solo como dato del Espacio de prueba.

## Veredicto

**APTO** — recorrido Captación V1 de punta a punta demostrado en Espacio real. Sin defecto bloqueante de producto.
