# Congreso de Varones — Tríptico, correo y aviso “ya inscrito”

Público mayoritariamente de personas mayores. Todo debe ser claro, anti-errores y sin inventar pantallas nuevas: se reutiliza lo que ya existe (mapa, calendario, descarga).

## Objetivo

1. El tríptico del congreso se puede **descargar** desde el formulario público.
2. Tras registrarse, si hay correo, se **envía el tríptico adjunto** en el correo de confirmación.
3. Si la persona **ya está inscrita** (mismo RUT o correo), el aviso es **muy notorio** y sigue mostrando el mismo bloque de programa / mapa / calendario.
4. No se permite una segunda inscripción.

## Tríptico (archivo y enlaces)

- Fuente: el PDF entregado para el congreso.
- Ruta pública fija: `public/documentos/Triptico-Congreso-Varones-2026.pdf`
- URL del formulario: `/documentos/Triptico-Congreso-Varones-2026.pdf`
- Etiqueta del botón: **Descargar el tríptico**

En la experiencia del congreso (`ipn-asistencia-congreso-varones-2026`) se fijan `confirmationEmailCtaUrl` y `confirmationEmailCtaLabel` con esos valores (reemplaza el CTA genérico de “programa” por el tríptico).

## Pantalla tras confirmar o “ya inscrito”

Se reutiliza `CongressAttendanceSuccess` sin bloques nuevos:

- Descarga del tríptico
- Cómo llegar (mapa Quilicura / Nazareth)
- Agregar al calendario (ICS + Google Calendar)

Ese mismo bloque aparece:

- Después de una inscripción nueva (éxito)
- Cuando el servidor responde `alreadyRegistered` (ya inscrito)

El aviso “Ya estás inscrito” se refuerza visualmente (título grande, mensaje corto, contraste alto) para que no se confunda con un error genérico ni se intente enviar otra vez.

## Correo de confirmación

Hoy el envío con adjunto solo corre en el flujo de **convocatoria**. El congreso usa `PortalExperienceForm` y no dispara ese correo.

Después de guardar una inscripción nueva del congreso:

- Si hay correo válido: enviar confirmación con el tríptico **adjunto** y enlace al mismo PDF (resolver existente `resolveConfirmationEmailCta` / documento en `public/documentos/`).
- Si no hay correo: la inscripción igual queda; solo descarga en pantalla.
- Asunto y cuerpo claros, en español, sin pedir pasos extras.
- No inventar sede ni fechas: usar las del congreso ya definidas (21–22 nov 2026, inicio 08:00, Quilicura).

No se reescribe el correo de convocatorias. Se agrega un helper de envío solo para el congreso, reutilizando la plantilla transaccional y `resolveConfirmationEmailCta` para el adjunto.

## Anti-errores (ya inscrito)

- Sigue el chequeo existente por RUT o correo (`findCongressEnrolleeMatch` + HTTP 409).
- Mensaje corto y explícito: ya estás inscrito; no hace falta enviar otra vez; aquí puedes descargar el tríptico y ver el lugar/calendario.
- No se guarda una segunda respuesta.

## Fuera de alcance

- No rediseñar todo el formulario (tipografía de cada campo, wizard, etc.).
- No tocar el panel operativo de congreso ni Asuntos Estudiantiles.
- No inventar secciones nuevas en la pantalla de éxito (solo lo ya creado).
- No cambiar el flujo de convocatorias académicas.

## Pruebas

- El PDF responde en `/documentos/Triptico-Congreso-Varones-2026.pdf`.
- Tras inscribirse con correo, el envío incluye adjunto del tríptico (o el helper de resolución lo encuentra desde la URL pública).
- Tras inscribirse sin correo, la pantalla de éxito ofrece la descarga.
- Reintento con mismo RUT o correo → `alreadyRegistered`, aviso notorio, y el bloque de tríptico/mapa/calendario visible.
- Tests baseline cubren URL/label del CTA del congreso, mensaje de ya inscrito, y resolución del adjunto desde `public/documentos/`.
