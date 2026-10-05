# Cumple: páginas de materias, recursos y SEO

Sitio público Mentor Prime Cumple: cada ítem relevante del menú deja de ser solo un ancla en la home y pasa a ser una página en código, informativa, cautivadora y orientada a dueños y gerentes. El contenido se ancla en fuentes oficiales. Se mantiene el sistema visual actual.

## Decisiones

- Una URL por materia de negocio. **Soluciones** y **Normativas** apuntan a la misma página del tema (sin duplicar servicio vs norma en dos URLs).
- Tono **mixto**: marco normativo confiable → implicancia para la empresa → cómo Cumple lo ordena → CTA.
- Redacción en **tercera persona / trato formal** («la empresa», «la organización», «el empleador»).
- Hechos jurídicos desde **páginas oficiales** de gobierno e instituciones (DT, BCN, ministerios, SEREMI/ISP u otras competentes). Citas en el cuerpo y bloque **Fuentes oficiales** al pie.
- Objetivo doble: **informar con credibilidad** y **atraer visitas cualificadas** (SEO) que conviertan en evaluación.
- Mismo diseño del sitio Cumple (header, tipografía, colores, tema claro/oscuro, CTA). No rediseñar la marca.
- Aviso breve en páginas de materia: información orientativa; no sustituye asesoría legal formal.
- No prometer «cero multas» ni garantías legales imposibles.

## Rutas

| Ruta | Rol |
|------|-----|
| `/` | Home (resumen + enlaces a profundidad) |
| `/materias/ley-karin` | Materia |
| `/materias/seguridad-salud-trabajo` | Materia |
| `/materias/laboral-rrhh` | Materia |
| `/materias/proteccion-datos` | Materia |
| `/materias/inclusion-laboral` | Materia |
| `/materias/contratistas-terceros` | Materia |
| `/como-funciona` | Recurso / método |
| `/preguntas-frecuentes` | Recurso / FAQ |
| `/evaluar` | Diagnóstico (conversión) |
| `/nosotros` | Confianza institucional |
| `/contacto` | Contacto del espacio + acceso a evaluar |

Todas se registran en el sitio en código `cumple` (`src/sites/cumple/`) y tienen vista React asociada.

## Menú

- **Inicio** → `/`
- **Soluciones** → panel con las 6 materias (enfoque servicio); cada ítem → `/materias/...`
- **Normativas** → panel con las mismas 6 materias y URLs; el copy del panel enfatiza el marco normativo (no un segundo set de páginas)
- **Recursos** → Cómo funciona, Preguntas frecuentes, Evaluar mi empresa → rutas reales
- **Nosotros** → `/nosotros`
- **Contacto** → `/contacto`
- CTA del header «Evaluar mi empresa» → `/evaluar`

Las anclas `#` de la home pueden permanecer como atajos de sección o redirigirse a las páginas; el menú principal usa rutas reales.

## Página de materia (plantilla única)

Orden de secciones:

1. **Hero** — H1 orientado a intención de búsqueda del empresario; una frase de soporte; CTA a `/evaluar`.
2. **Qué exige el marco** — obligaciones típicas en lenguaje ejecutivo, ancladas a fuente oficial.
3. **Qué implica para la empresa** — riesgo, fiscalización, evidencia, responsables, costo de desorden.
4. **Cómo lo ordena Cumple** — diagnóstico → plan → implementación → control permanente.
5. **CTA** — Evaluar mi empresa.
6. **Fuentes oficiales** — lista con nombre de institución, título del recurso y URL oficial.

Citas puntuales en el cuerpo («según la Dirección del Trabajo…») con enlace, además del bloque final.

### SEO por página de materia

- `title` y `meta description` propios (beneficio + materia + Chile cuando aporte).
- Un solo H1; H2 alineados a preguntas reales del visitante.
- Contenido útil y verificable; sin relleno.
- Enlaces internos a `/como-funciona`, `/preguntas-frecuentes`, otras materias y `/evaluar`.
- Enlaces externos solo a dominios oficiales.
- Open Graph básico coherente con title/description si el sitio ya lo soporta; si no, title/description bastan en este corte.

## Páginas de apoyo

### `/como-funciona`

Método en cuatro pasos ya usado en la home, ampliado lo necesario para SEO informativo. CTA a `/evaluar`.

### `/preguntas-frecuentes`

FAQ ampliada (alcance, plazos, cambios de norma, tamaño de organización, qué no promete Cumple). Cada pregunta como H2. Enlaces a materias y a `/evaluar`.

### `/evaluar`

Formulario de diagnóstico actual como página propia. Texto de confianza: qué ocurre después del envío. Conversión principal.

### `/nosotros`

Quién es Mentor Prime Cumple, para quién trabaja, en qué se diferencia (consultoría + plataforma + acompañamiento). Tono institucional. Sin garantías legales imposibles.

### `/contacto`

Lee `contact` y `social` de la configuración del espacio (no hardcodear teléfono/correo en el contenido). Muestra lo disponible + acceso claro a `/evaluar`.

## Contenido y fuentes

- El copy vive en código junto al sitio Cumple (módulos de contenido por página o por materia), no en el editor CMS de páginas.
- Antes de redactar cada materia, se consultan fuentes oficiales vigentes y se registran las URLs en el bloque de fuentes.
- Si una cifra o plazo no está respaldado por fuente oficial verificable en el momento de escribir, no se inventa: se omite o se formula en términos generales sin número.
- Estadísticas ya presentes en la home solo se reutilizan si su fuente sigue siendo trazable; si no, se retiran o se actualizan con fuente.

## Arquitectura técnica

- Extender `cumpleSite.pages` con las rutas nuevas.
- Registrar una vista por ruta (o una plantilla de materia parametrizada por slug + vistas propias para apoyo).
- Reutilizar `SiteHeader`, layout/tema de Cumple, tipografías y tokens existentes.
- Actualizar `menus` / `href` en `content.ts` (o equivalente) a rutas reales.
- Home sigue siendo la portada; enlaza a las páginas nuevas en lugar de (o además de) anclas profundas.

## Fuera de este corte

- Blog, noticias, landing por industria o por ciudad.
- Calculadoras o herramientas interactivas.
- Schema/JSON-LD avanzado, sitemap XML dedicado o campaña de backlinks.
- Duplicar cada materia en URL «solución» y URL «norma».
- Rediseño visual del sitio.
- Borrar el código del editor CMS histórico (sigue el contrato de sitio en código).

## Prueba

- Cada ruta de la tabla responde con su página cuando el sitio Cumple está publicado.
- El menú Soluciones, Normativas y Recursos abre destinos reales (no solo `#`).
- Cada página de materia muestra H1, CTA a `/evaluar` y bloque Fuentes oficiales con al menos un enlace oficial.
- `/contacto` solo muestra campos de contacto que existan en la configuración del espacio.
- `/evaluar` envía el formulario de diagnóstico como hoy.
- Title/description distintos por página de materia.
- Paleta, header y tipografía coherentes con la home en claro y oscuro.
- Redacción en tercera persona / trato formal en las páginas nuevas.
