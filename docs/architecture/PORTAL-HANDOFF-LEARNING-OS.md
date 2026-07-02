# Portal → AprendeHoy Learning OS — Handoff de Admisión

**OT-PORTAL-004** · **Versión** 1.0 · **Estado** Vigente

## Principio arquitectónico

El **Portal Institucional SEM** y **AprendeHoy Learning OS** son productos distintos con responsabilidades claramente delimitadas.

| Producto | Misión |
|----------|--------|
| Portal Institucional | Informar, inspirar y convertir visitantes en **interesados** |
| AprendeHoy Learning OS | Gestionar el ciclo de vida del estudiante: admisión, evaluación, matrícula, campus, certificación y egreso |

El portal **no** administra alumnos, matrículas, pagos, contratos, expedientes ni campus virtual.

## Flujo de conversión

```
Visitante → Conoce SEM → Explora programas → Lee requisitos → POSTULA → INTERESADO
                                                              │
                                                              ▼
                                                    ═══ HANDOFF ═══
                                                              │
                                                              ▼
                                                         LEAD (AprendeHoy)
                                                              │
                                                              ▼
                                              CRM → Admisiones → Evaluación → …
```

### Estados terminales

| Sistema | Estado inicial del registro | Significado |
|---------|----------------------------|-------------|
| Portal | `interesado` | El postulante manifestó formalmente su interés |
| AprendeHoy | `lead` | Entrada al CRM y pipeline de admisiones |

## Implementación en el Portal

### Colecciones MongoDB

| Colección | Propósito |
|-----------|-----------|
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
Portal (POST /api/admission/apply)
        │
        ▼
createInteresadoFromApplication()
        │
        ▼
AdmissionAdapter.handoff(payload)
        │
        ├── LocalAdmissionAdapter (default, desarrollo)
        │
        └── AprendeHoyAdmissionAdapter (producción)
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
|----------|-------------|
| `ADMISSION_ADAPTER` | `local` (default) o `aprendehoy` |
| `APRENDEHOY_API_URL` | Base URL de la API AprendeHoy |
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
  source: "portal-sem";
}
```

## Lo que NO existe en el Portal

- CRM ni pipeline de admisiones
- Estados posteriores a `interesado`
- Contratos, matrículas, pagos
- Expediente del postulante
- Campus virtual
- Dashboard del postulante

Todo lo anterior pertenece a **AprendeHoy Learning OS** (EP-002 en adelante).

## Páginas

| Ruta | Función |
|------|---------|
| `/admision` | Centro de Admisión — contenido + formulario |
| `/postulacion/enviada` | Confirmación post-envío |

## Criterios de aceptación (OT-PORTAL-004)

- [x] Portal termina en estado `interesado`
- [x] AprendeHoy comienza en estado `lead` (vía adapter)
- [x] Sin lógica académica en el Portal
- [x] Contenido administrable desde CMS
- [x] Experience Kit + dirección editorial
- [x] Adapter preparado para integración futura

## Roadmaps independientes

**Portal Institucional (EP-001)** — OT-PORTAL-001…004  
**AprendeHoy Learning OS** — EP-002 CRM & Admisiones, EP-003 Campus, EP-004 Gestión Académica, etc.
