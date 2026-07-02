# EP-001 — Portal Institucional Premium

| Atributo | Valor |
| --- | --- |
| Código | EP-001 |
| Estado | 🟡 En progreso |
| Dependencia | EP-000 ✅ |
| Tenant piloto | SEM (AprendeHoy) |

---

## Objetivo

Convertir el sitio público en una **experiencia institucional completa** para el postulante: coherente, conversiva y configurable desde CMS, consumiendo exclusivamente el Experience Kit.

---

## Alcance

| Área | Descripción |
| --- | --- |
| Home definitivo | Narrativa institucional unificada |
| Programas | Catálogo y destacados |
| Perfil del postulante | ¿Para quién es la formación? |
| Metodología | Modelo pedagógico |
| Equipo académico | Docentes y autoridad |
| Testimonios | Prueba social |
| Noticias | Actualidad institucional |
| Biblioteca | Recursos públicos (preview) |
| Preguntas frecuentes | FAQ admisión y formación |
| Footer institucional | Cierre premium multi-columna |
| Proceso de admisión | Timeline / CTA de conversión |
| Dirección de arte editorial | Identidad ministerial, no LMS comercial — [EDITORIAL-ART-DIRECTION.md](../../design/EDITORIAL-ART-DIRECTION.md) |

---

## Dependencias

| Dependencia | Estado |
| --- | --- |
| EP-000 Experience Kit | ✅ |
| Portal Engine | ✅ |
| Content Engine / CMS | ✅ |
| Bloques premium existentes | 🟡 Home definitivo ✅; páginas secundarias pendientes |

---

## OTs asociadas

| OT | Título | Estado |
| --- | --- | --- |
| [OT-PORTAL-001](../ot/OT-PORTAL-001.md) | Home Institucional Definitivo | ✅ Completada |
| OT-PORTAL-002 | Páginas secundarias (programas, institución) | ⚪ Pendiente |
| [OT-PORTAL-003](../ot/OT-PORTAL-003.md) | Dirección de Arte Editorial | ⚪ Planificada |
| OT-PORTAL-004 | Biblioteca pública & SEO sitio | ⚪ Pendiente |

> OTs históricas SEM-PORTAL y OT-PORTAL-008+ siguen vigentes como módulos LOCKED; esta épica consolida la **experiencia de producto** end-to-end.

---

## Criterios de cierre de épica

| Criterio | Meta |
| --- | --- |
| Home como experiencia única (no suma de bloques sueltos) | ✅ definido en OT-PORTAL-001 |
| 100 % bloques en Experience Kit | Sin HEX ni componentes paralelos |
| Responsive 360px – 2560px | Sin regresiones críticas |
| Contenido editable desde CMS | Sin hardcode de copy institucional |
| Conversión hacia `/admision` | CTA y timeline visibles |
| `check:branding` y `build` | 0 incidencias |

---

## Flujo del postulante (esta épica)

```
Visita al portal
      ↓
Home institucional (confianza + propuesta)
      ↓
Programas / Perfil / Metodología
      ↓
Proceso de admisión + FAQ
      ↓
CTA → EP-002 (Postulación formal)
```

---

## Referencias

- Roadmap: [PRODUCT-ROADMAP-2026-2028.md](../PRODUCT-ROADMAP-2026-2028.md)
- Épica anterior: [EP-000](./EP-000-FOUNDATION-EXPERIENCE-KIT.md)
- Siguiente épica: [EP-002 — CRM & Admisiones](./EP-002-CRM-ADMISSIONS.md)
