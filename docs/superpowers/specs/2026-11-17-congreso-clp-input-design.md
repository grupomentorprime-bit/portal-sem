# Congreso — inputs de monto en formato pesos CLP

**Fecha:** 2026-11-17  
**Estado:** diseño aprobado (conversación); pendiente plan  
**Alcance:** solo panel Congreso (ficha + aportes)

## Objetivo

Que los montos editables del Congreso se vean siempre en formato pesos chilenos con puntos (y `$`), alineados con las etiquetas que ya usan `formatClp` (`$17.000`), no como `17000`.

## Decisiones

| Tema | Decisión |
|------|----------|
| Alcance | A — solo Congreso |
| Enfoque | Input CLP reutilizable (formatea al escribir) |
| Display input | Con `$` y separador de miles `es-CL` |
| Persistencia / API | Entero CLP sin cambio de contrato |
| Fuera | Growth, formularios públicos, otros módulos |

## Helpers

Junto a `formatClp` (p. ej. en `labels.ts` o módulo `clp.ts`):

- `parseClpInput(text: string): number` — extrae dígitos; `""` / inválido → `0` o `NaN` según uso documentado (preferir `0` en UI y validar `> 0` al enviar).
- `formatClpInputDigits(digitsOrNumber): string` — reformatea para el campo visible (`$17.000`).

Reglas:

- Solo enteros (CLP sin decimales).
- Ignorar caracteres que no sean dígitos al parsear.
- Vacío permitido mientras se edita.

## Componente

`ClpAmountInput` (admin congress):

- Props alineadas al `Input` del kit (`label`, `value` como string formateado o number + onChange numérico — elegir una API clara: **controlado por `value: number | null` + `onValueChange: (n: number | null) => void`** y display interno formateado).
- Placeholder por defecto: `formatClp(CONGRESS_CONTRIBUTION_CLP)` o `$17.000`.
- `inputMode="numeric"`.

## Cableado

1. **Ficha → Alimentación → Pago individual → Monto** (`ParticipantSheet`).
2. **Aportes → Monto total (CLP)** (`CongressOpsPanel`).

Labels, tablas, resumen e historial: siguen usando `formatClp` (sin cambio).

## Verificación

- Al abrir ficha con cargo, el monto se ve `$17.000` (no `17000`).
- Al editar (p. ej. abono `5000`) se muestra `$5.000`.
- Registrar pago / pago grupal envía el entero correcto a la API.
- Placeholder nunca muestra `17000` crudo.

## Criterios de éxito

1. Ningún input de monto del Congreso muestra dígitos sin formato pesos.
2. API y saldos no cambian de semántica.
3. Helper/componente listos para reutilizar fuera del Congreso más adelante (sin hacerlo ahora).
