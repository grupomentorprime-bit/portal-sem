# CRM · Conversión — menú corto

## Goal
Reducir el enredo del CRM: 4 destinos claros. Panel, Mi trabajo y Actividad dejan de competir en la subnav.

## Nav visible
Oportunidades · Personas · Mensajes · Embudos  
(+ Analítica de conversión si hay `growth.sales.view`)

## Absorción
- Entrada CRM → `/admin/ventas`
- Panel → franja de bandas en Oportunidades; `/admin/conversion` redirige ahí
- Mi trabajo → filtro `mias=1`; `/admin/ventas/mi-trabajo` redirige
- Actividad → enlace en Oportunidades; ruta viva; ítem de nav oculto en subnav (solo match de grupo)

## Fuera de alcance
Home, Kanban, fichas, nuevo CRM/workflow.
