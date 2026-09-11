# Growth OS → Aprende Hoy — Handoff de Admisión

**OT-PORTAL-004** (origen) · **Productización** [ADR-009](./ADR-009.md) · **Estado** Vigente

Nombre anterior del archivo: `PORTAL-HANDOFF-LEARNING-OS.md` (redirige aquí).

## Principio arquitectónico

**Growth OS** (este repositorio) y **Aprende Hoy** (sistema académico) son productos distintos.

| Producto | Misión |
| --- | --- |
| **Growth OS** | Atraer personas, no perder oportunidades y convertir visitantes en **interesados** (clientes, alumnos o participantes en sentido comercial/de captación) |
| **Aprende Hoy** | Gestionar el ciclo de vida académico: admisión, evaluación, matrícula, campus, certificación y egreso |

Growth OS **no** administra alumnos, matrículas, pagos, contratos, expedientes ni campus virtual.

La vertical **educación** usa este handoff; SEM (T001) es un cliente con copy/pack propio. El adapter es **opt-in**, no el núcleo del producto.

## Flujo de conversión

```
Visitante → Explora el Sitio del Espacio → Requisitos → POSTULA → INTERESADO
                                                              │
                                                              ▼
                                                    ═══ HANDOFF ═══
                                                              │
                                                              ▼
                                                         LEAD (Aprende Hoy)
                                                              │
                                                              ▼
                                              CRM → Admisiones → Evaluación → …
```

El CRM y el pipeline de admisiones académicas viven en **Aprende Hoy** (u otros sistemas). Growth Core en este repo es el núcleo comercial ([ADR-010](./ADR-010.md)); **no** reemplaza este handoff ni administra alumnos.

### Estados terminales

| Sistema | Estado inicial del registro | Significado |
| --- | --- | --- |
| Growth OS | `interesado` | Manifestación formal de interés en el portal |
| Aprende Hoy | `lead` | Entrada al CRM / pipeline de admisiones |

## Implementación en Growth OS

### Colecciones MongoDB

| Colección | Propósito |
| --- | --- |
| `portal_admission_config` | Contenido administrable del Centro de Admisión (`admission-center`) |
| `portal_interesados` | Registros de postulantes — estado terminal `interesado` |

### API pública

```
POST /api/admission/apply
```

Captura el formulario, valida campos, persiste `portal_interesados` y dispara el handoff.

### API CMS (admin)

```
GET  /api/cms/admission-config
PUT  /api/cms/admission-config
```

### Adapter pattern

```
Growth OS (POST /api/admission/apply)
        │
        ▼
createInteresadoFromApplication()
        │
        ▼
AdmissionAdapter.handoff(payload)
        │
        ├── LocalAdmissionAdapter (default, desarrollo)
        │
        └── AprendeHoyAdmissionAdapter (opt-in / producción)
                │
                ▼
        POST {APRENDEHOY_API_URL}/v1/leads
```

**Archivos:**

- `src/core/admission/admission-adapter.ts` — interfaces y adaptadores
- `src/core/admission/interesado-repository.ts` — persistencia y orquestación
- `src/types/admission.ts` — tipos del dominio
- `src/lib/portal/admission-content.ts` — defaults editoriales
- `src/lib/cms/admission-config.ts` — merge CMS + defaults

### Variables de entorno

| Variable | Descripción |
| --- | --- |
| `ADMISSION_ADAPTER` | `local` (default) o `aprendehoy` |
| `APRENDEHOY_API_URL` | Base URL de la API Aprende Hoy |
| `APRENDEHOY_API_KEY` | Token Bearer opcional |

## Payload de handoff

```typescript
interface AdmissionHandoffPayload {
  interesadoId: string;
  tenant: string;
  portalStatus: "interesado";
  aprendeHoyTarget: "lead";
  applicant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    church: string;
    city: string;
    programId: string;
    programLabel?: string;
    message?: string;
  };
  submittedAt: string;
  source: "portal-sem"; // valor histórico del campo; no renombra el producto
}
```

## Lo que NO existe en Growth OS (por diseño de este corte)

- CRM ni pipeline de admisiones académicas
- Estados posteriores a `interesado`
- Contratos, matrículas, pagos
- Expediente del postulante
- Campus virtual
- Dashboard del postulante como alumno

Todo lo anterior pertenece a **Aprende Hoy** (u otros sistemas). Growth Core ([ADR-010](./ADR-010.md)) observa el interesado y el handoff; no es capacidad implementada todavía y no absorbe el proceso académico.

## Páginas

| Ruta | Función |
| --- | --- |
| `/admision` | Centro de Admisión — contenido + formulario |
| `/postulacion/enviada` | Confirmación post-envío |

## Criterios de aceptación (OT-PORTAL-004)

- [x] El portal termina en estado `interesado`
- [x] Aprende Hoy comienza en estado `lead` (vía adapter)
- [x] Sin lógica académica en este producto
- [x] Contenido administrable desde CMS
- [x] Experience Kit + dirección editorial
- [x] Adapter preparado para integración opt-in

## Roadmaps independientes

**Growth OS** — Platform Core + Productization; Growth Core diferido ([ADR-009](./ADR-009.md)).  
**Aprende Hoy** — ciclo académico (CRM & Admisiones, Campus, Gestión Académica, etc.) fuera de este repositorio.
