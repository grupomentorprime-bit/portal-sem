# Dirección de Arte Editorial — SEM

**Código:** OT-PORTAL-003  
**Versión:** v1.0  
**Estado:** Activo — referencia permanente  
**Complementa:** [Experience Kit — INTRODUCTION.md](./INTRODUCTION.md)

---

## Qué es este documento

El **Experience Kit** define *cómo se construye* la interfaz: tokens, componentes, accesibilidad y patrones técnicos.

Esta **Dirección de Arte Editorial** define *cómo se comunica* visualmente la identidad del Seminario Eclesiástico Mayor: qué debe sentir el visitante, qué imágenes usar, qué lenguaje emplear y qué evitar.

Juntos forman la guía completa para mantener coherencia institucional en el largo plazo.

| Documento | Pregunta que responde |
| --- | --- |
| Experience Kit | ¿Cómo lo construyo correctamente? |
| Dirección de Arte Editorial | ¿Se siente como el SEM? |

---

## Principio rector

> Cada pantalla debe comunicar primero el **llamado ministerial** y la **formación bíblica**; la tecnología debe percibirse como el **medio** que hace posible esa experiencia — nunca como el protagonista.

El portal no es una plataforma de cursos. Es una **institución de formación ministerial de excelencia**.

---

## 1. ADN visual del SEM

Toda decisión gráfica debe transmitir:

| Concepto | Manifestación visual |
| --- | --- |
| Formación bíblica | Escrituras, estudio, profundidad teológica |
| Excelencia académica | Composición cuidada, tipografía editorial, orden |
| Comunidad cristiana | Personas en diálogo, oración, servicio conjunto |
| Tradición | Sobriedad, permanencia, referencias históricas del SEM |
| Modernidad | Claridad digital, accesibilidad, fluidez sin ruido |
| Cercanía pastoral | Rostros reales, tono humano, acompañamiento |
| Liderazgo | Autoridad docente, credenciales, trayectoria |
| Servicio | Vocación al ministerio, impacto en la Iglesia |
| Vocación | Llamado, discernimiento, propósito |
| Confianza | Consistencia, institucionalidad, respaldo IPN |

### Nunca transmitir

| Evitar | Por qué |
| --- | --- |
| Marketplace de cursos | Reduce la formación a producto consumible |
| Venta agresiva | Contradice la vocación pastoral |
| Startup tecnológica | Desplaza el foco del ministerio |
| Plataforma genérica | Intercambiable con cualquier LMS |
| Academia comercial | Prioriza conversión sobre formación |

---

## 2. Inspiración

**No copiar. Inspirarse.**

### Referencias internacionales (tono y composición)

- Harvard Divinity School
- Fuller Theological Seminary
- Dallas Theological Seminary
- Hillsong College
- Biola University
- Westminster Seminary

Tomar de ellas: sobriedad editorial, jerarquía tipográfica, fotografía con propósito, narrativa institucional.

### Referencias propias (identidad SEM)

Toda la línea gráfica histórica del seminario:

- Calendarios académicos
- Mallas curriculares
- Programas académicos impresos
- Manual corporativo
- Material institucional y comunicaciones pastorales

Estos materiales son la fuente primaria de autenticidad. La web debe sentirse continuidad de esa tradición, no ruptura.

---

## 3. Paleta editorial

Mantener los **tokens oficiales** (`--sem-*` en `src/styles/tokens/brand.css`). No agregar colores fuera del Manual de Marca.

| Token | Valor | Rol editorial |
| --- | --- | --- |
| `--sem-primary` | `#002A47` | Azul profundo SEM — autoridad, footer, overlays |
| `--sem-secondary` | `#246AA1` | Azul institucional — enlaces, acentos |
| `--sem-accent` | `#10BCE2` | Azul claro — destacados, indicadores |
| `--sem-success` | `#3ED6AF` | Confirmación, estados positivos |
| `--sem-light` | `#8CE27F` | Acento suave — uso muy puntual |

### Gradientes institucionales

Incorporar gradientes **contenidos** derivados de la paleta:

```
Azul profundo SEM  (--sem-primary)
        ↓
Azul institucional (--sem-secondary)
        ↓
Azul claro         (--sem-accent)
```

**Uso permitido:** Hero, CTA, footer, destacados puntuales.

**Regla:** nunca gradientes excesivos ni multicolor. Un gradiente editorial debe sentirse como profundidad institucional, no decoración SaaS.

Implementación técnica: variables CSS semánticas (p. ej. `--gradient-institutional`) definidas en tokens — ver [COLORS.md](./COLORS.md).

---

## 4. Dirección fotográfica

Eliminar fotografías genéricas de stock sin contexto ministerial.

### Prioridad temática

| Tema | Ejemplos |
| --- | --- |
| Escritura | Biblia abierta, anotaciones, estudio bíblico |
| Aprendizaje | Estudiantes leyendo, tomando notas en contexto formativo |
| Docencia | Profesor enseñando, explicando texto bíblico |
| Diálogo | Discusión bíblica en grupo, mesa de estudio |
| Biblioteca | Estanterías, recursos académicos, lectura |
| Oración | Comunidad en oración, discernimiento |
| Comunidad | Hermanos en la fe, vida seminarista |
| Graduación | Ceremonias, entrega de certificación |
| Servicio | Ministerio en acción, servicio cristiano |

### Evitar

- Personas mirando notebook sin contexto teológico
- Oficinas corporativas, coworking, ambientes empresariales
- Tecnología como protagonista visual
- Sonrisas genéricas de stock sin narrativa

---

## 5. Tratamiento fotográfico

Todas las imágenes del portal deben compartir un tratamiento unificado:

| Parámetro | Criterio |
| --- | --- |
| Temperatura | Cálida-neutra, coherente en todo el sitio |
| Contraste | Medio-alto, legibilidad sobre overlays |
| Saturación | Contenida — sobriedad editorial |
| Profundidad | Sensación editorial, no publicidad |
| Iluminación | Natural, preferir luz lateral o ambiente real |

### Guía operativa

1. Seleccionar imágenes que cumplan la dirección temática (§4).
2. Aplicar el mismo preset de color (definir en producción fotográfica).
3. Verificar legibilidad de texto superpuesto (Hero, CTA).
4. Documentar assets aprobados en el CMS Media Library.
5. Rechazar imágenes que no pasen el checklist ministerial (§15).

> Entregable OT-PORTAL-003: guía fotográfica extendida con ejemplos aprobados/rechazados.

---

## 6. Tipografía editorial

La jerarquía debe sentirse **editorial**, no de dashboard.

### Títulos

- Grandes, con presencia institucional
- Respirados — mucho espacio alrededor
- Una idea por titular; evitar subtítulos encadenados largos

### Subtítulos y cuerpo

- Claros y breves
- Sin párrafos extensos en bloques de impacto
- Overlines discretos para contexto (`Programas Formativos`, `Ruta Formativa`)

Referencia técnica: [TYPOGRAPHY.md](./TYPOGRAPHY.md) y clases `.text-display-*`.

---

## 7. Componentes con identidad institucional

Los componentes no deben parecer SaaS genérico. Traducir el lenguaje visual:

| Evitar (SaaS) | Usar (SEM) | Sensación |
| --- | --- | --- |
| Cards | Tarjetas editoriales | Artículo, no widget |
| Timeline | Ruta formativa | Viaje ministerial, no workflow |
| Beneficios / Features | Vocación / Propósito | Llamado, no checklist de producto |
| Dashboard | Campus virtual | Formación, no panel admin |
| Users | Estudiantes | Personas en formación |
| Instructors | Docentes | Autoridad académica |
| Content | Material formativo | Recursos de estudio |

Implementación: variantes editoriales sobre componentes del Experience Kit — no forks paralelos.

---

## 8. Lenguaje del portal

El copy es parte de la identidad. Glosario obligatorio:

| ❌ Evitar | ✅ Usar |
| --- | --- |
| Cursos | Programas formativos |
| Usuarios | Estudiantes |
| Dashboard | Campus virtual |
| Instructor | Docente |
| Contenido | Material formativo |
| Comprar / Adquirir | Postular / Matricularse |
| Features | Vocación / Formación |
| Workflow | Ruta formativa |
| Onboarding | Proceso de admisión |

Aplicar en UI, CMS, metadata SEO y microcopy de botones.

---

## 9. Iconografía

- **Librería principal:** Lucide (alineado con [ICONS.md](./ICONS.md))
- **Referencias de estilo:** Phosphor, Remix — solo como inspiración de trazo
- **Tratamiento:** líneas finas, stroke consistente, mucho aire alrededor
- **Prohibido:** iconos rellenos agresivos, emojis, mezcla de librerías

Los iconos acompañan la narrativa (metodología, ruta formativa); no compiten con la fotografía.

---

## 10. Microdetalles editoriales

Recursos gráficos sutiles que refuerzan identidad sin sobrecargar:

- Líneas y separadores editoriales
- Citas y versículos (`VerseBlock`, pull quotes)
- Badges y etiquetas pequeñas (`Generación 2024`, `IPN Chile`)
- Overlines de sección
- Numeración de pasos en ruta formativa

**Regla:** si un microdetalle no refuerza formación, comunidad o vocación — eliminarlo.

---

## 11. Identidad ministerial — test por página

Antes de publicar cualquier pantalla, responder:

| Pregunta | Debe ser sí |
| --- | --- |
| ¿Habla de Biblia? | Preferiblemente |
| ¿Habla de servicio? | Sí |
| ¿Habla de comunidad? | Sí |
| ¿Habla de formación? | Sí |
| ¿Habla de misión? | Sí |

Si la mayoría es **no**, la página probablemente parece una academia comercial cualquiera.

---

## 12. Storytelling — arco narrativo del Home

El Home cuenta una historia. No es una colección de bloques.

```
Llamado
    ↓
Programas formativos
    ↓
¿Por qué estudiar? (perfil / vocación)
    ↓
Nuestra misión / metodología
    ↓
Ruta formativa
    ↓
Equipo docente
    ↓
Testimonios (comunidad)
    ↓
Admisión
    ↓
CTA
    ↓
Footer institucional
```

Implementación actual: [OT-PORTAL-001](../ot/OT-PORTAL-001.md). Esta dirección de arte eleva el tratamiento visual de ese arco.

Referencia de implementación home: [HOME-PREMIUM-v2-ART-DIRECTION.md](./HOME-PREMIUM-v2-ART-DIRECTION.md).

---

## 13. Elementos gráficos propios del SEM

Crear una biblioteca visual que no dependa solo de fotografías:

| Elemento | Descripción |
| --- | --- |
| Patrones bíblicos | Texturas sutiles inspiradas en páginas de Biblia |
| Líneas editoriales | Separadores, marcos de cita |
| Sellos institucionales | IPN, SEM, certificación |
| Mapas sutiles | Chile / comunidad nacional — muy discretos |
| Texturas de: | Fondos cálidos en secciones editoriales |
| Geometría del isotipo | Detalles derivados del logo, sin repetir marca |

Entregable OT-PORTAL-003: assets SVG/CSS en `public/images/brand/` o tokens de patrón documentados.

---

## 14. Experiencia emocional esperada

Al terminar el recorrido del Home, el visitante debería pensar:

> *"Aquí no solo enseñan teología. Aquí forman personas para servir a Dios."*

Ese es el resultado emocional que valida la dirección de arte.

---

## 15. Criterios de aceptación — checklist

Antes de aprobar cualquier pantalla nueva o rediseño:

| # | Pregunta | Respuesta requerida |
| --- | --- | --- |
| 1 | ¿Se reconoce inmediatamente que es el SEM? | ✅ Sí |
| 2 | ¿La Biblia es protagonista (directa o contextualmente)? | ✅ Sí |
| 3 | ¿La formación es protagonista? | ✅ Sí |
| 4 | ¿La tecnología acompaña y no domina? | ✅ Sí |
| 5 | ¿Existe identidad institucional clara? | ✅ Sí |
| 6 | ¿Podría confundirse con Coursera, Udemy o un LMS genérico? | ❌ No |

Si la respuesta a (6) es **sí** → rediseñar.

Integrar este checklist en [PULL_REQUEST_CHECKLIST.md](./PULL_REQUEST_CHECKLIST.md) y [VISUAL_QA.md](./VISUAL_QA.md).

---

## Relación con otros documentos

| Documento | Rol |
| --- | --- |
| [INTRODUCTION.md](./INTRODUCTION.md) | Experience Kit — construcción técnica |
| [DESIGN-PRINCIPLES.md](./DESIGN-PRINCIPLES.md) | Principios de decisión UI |
| [MANUAL-DE-MARCA.md](./MANUAL-DE-MARCA.md) | Marca corporativa oficial |
| [MOODBOARD.md](./MOODBOARD.md) | Referencias visuales |
| [HOME-PREMIUM-v2-ART-DIRECTION.md](./HOME-PREMIUM-v2-ART-DIRECTION.md) | Aplicación específica al Home |
| [OT-PORTAL-003](../ot/OT-PORTAL-003.md) | Orden de trabajo de implementación |

---

## Resultado esperado de EP-001

Cuando la épica Portal Institucional Premium cierre, el sitio no debe parecer un marketplace de cursos online. Debe transmitir la imagen de un **Seminario Eclesiástico contemporáneo**, donde tradición bíblica, excelencia académica y tecnología conviven de forma natural.

---

*Documento permanente del proyecto. Toda pantalla pública del portal SEM debe cumplir esta dirección de arte además del Experience Kit.*
