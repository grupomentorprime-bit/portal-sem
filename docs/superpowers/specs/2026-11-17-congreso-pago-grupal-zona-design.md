# Pago grupal: filtro Zona → Iglesia

## Objetivo

En **Aportes y pagos → Pago grupal**, exigir elegir **Zona** antes de **Iglesia**, para acortar la lista y acelerar la búsqueda (mismo patrón que el alta de participante).

## Comportamiento

1. Select **Zona** obligatorio (Zona 01–11 vía `zoneOptions` / `CONGRESS_ZONES`).
2. Select **Iglesia** deshabilitado hasta elegir zona; opciones = iglesias de esa zona (`churchesByZone` ∪ nombres en `registrations` con ese `zoneId`).
3. Al cambiar zona: limpiar iglesia y selección de personas.
4. Candidatos a cubrir: `registrations` con `zoneId` + `churchName` coincidentes.
5. Sin cambios de API ni del payload de pago grupal.

## Fuera de alcance

- Extraer componente compartido `ZoneChurchSelect`.
- Opción “Todas las zonas”.
