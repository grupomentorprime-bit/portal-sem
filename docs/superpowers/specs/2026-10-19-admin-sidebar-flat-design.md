# Admin sidebar plano — Design

Fecha: 2026-10-19  
Estado: aprobado para implementación  
Referencia visual: menú Growth OS de 9 filas (Inicio → Ajustes), sin acordeones

## Problema

El sidebar productivo muestra acordeones (CRM · Conversión, Sitio web, Institución, Ajustes). La referencia aprobada es una lista plana: una fila por módulo.

## Decisión

**Enfoque: lista plana en el sidebar + subnavegación de módulo en el área principal.**

| Alternativa | Veredicto |
| --- | --- |
| A. Solo aplanar y perder subenlaces | Rechazada — rompe acceso a Personas, Mensajes, etc. |
| B. Aplanar + subnav horizontal en el chrome | **Elegida** — un solo cambio de shell, sin editar cada página |
| C. Aplanar + hubs con tarjetas | Más trabajo; duplica navegación |

## Comportamiento

### Sidebar

- Nueve filas (según permisos): Inicio, CRM · Conversión, Campañas, Automatizaciones, Analítica, Sitio web, Institución, Equipo, Ajustes.
- Sin acordeones ni chevrons en modo expandido.
- Grupo con un solo ítem visible: etiqueta e icono del ítem (p. ej. solo Personas → «Personas»).
- Grupo con varios ítems: etiqueta e icono del grupo; destino = ítem primario.
- Activo: cualquier ruta hija del grupo marca la fila del grupo.
- Zonas Core / Crecer / tools se conservan en datos (orden); la etiqueta «Crecer» y el separador de tools pueden ocultarse para acercarse a la referencia.
- Fuera de alcance: tarjetas «Plan Pro» / onboarding (no hay datos de plan ni progreso).

### Primarios por grupo

| Grupo | Primario |
| --- | --- |
| CRM · Conversión | Panel comercial (`/admin/conversion`) |
| Sitio web | Formularios |
| Institución | Identidad visual |
| Ajustes | Roles y permisos (si visible; si no, primer ítem autorizado) |

### Subnavegación de módulo

- Visible solo cuando el grupo activo tiene más de un ítem autorizado.
- Lista horizontal de los mismos ítems del grupo (IAM intacta).
- Vive en el chrome (bajo migas), no en cada página.

## No cambia

- Rutas, permisos, badges, `/platform`.
- Árbol `ADMIN_NAV_GROUPS` (solo se añade `primaryItemId` donde haga falta).
- Espacio activo en la cabecera del sidebar.

## Criterio de listo

- Sidebar sin acordeones en desktop expandido.
- Desde CRM se llega a Personas / Oportunidades / etc. por la subnav.
- Baselines de navegación actualizados y en verde.
