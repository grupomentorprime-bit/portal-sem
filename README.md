# Portal Institucional SEM

Portal web del **Seminario Eclesiástico Mayor (SEM)**, construido con Next.js y MongoDB, integrado al ecosistema **AprendeHoy** bajo la separación oficial entre Portal Web y Core Académico.

| Campo | Valor |
| --- | --- |
| Código OT (infra) | OT-SEM-INFRA-001 — v1.0-base |
| Código OT (CMS config) | OT-SEM-CMS-001 — Configuration Hub |
| Código OT (CMS menús) | OT-SEM-CMS-002 — Menu Engine v1.1 |
| Base de datos | SeminarioIPN |

## Arquitectura

```
Usuario
   ↓
Portal SEM (Next.js — App Router)
   ↓
API Routes (/api/*)
   ↓
MongoDB (SeminarioIPN)
   ↓
AprendeHoy (integración futura)
```

### Principios

- **Portal Web** y **Core Académico** permanecen separados.
- Toda lectura/escritura de datos ocurre exclusivamente en **API Routes** del servidor.
- Los componentes React **no** acceden directamente a MongoDB.
- La información institucional se obtiene de la colección `cms_config`.
- No se almacena información académica en este portal.
- Una única instancia reutilizable de conexión MongoDB (patrón singleton en desarrollo).

### Estructura del proyecto

```
portal-sem/
├── docs/
│   ├── INFRAESTRUCTURA.md      # OT infraestructura base
│   └── CMS-CONFIGURACION.md    # OT Configuration Hub
├── public/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── config/         # Configuration Hub
│   │   │   └── menus/          # Menu Engine
│   │   ├── (site)/             # Portal público con shell
│   │   ├── api/
│   │   │   ├── cms/
│   │   │   │   ├── config/     # GET/PUT configuración
│   │   │   │   └── menus/      # CRUD menús
│   │   │   └── test/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── config/             # Panel CMS config
│   │   ├── menu/               # Motor de menús (reutilizable)
│   │   ├── navigation/         # Header, footer, shell
│   │   └── ui/
│   ├── lib/cms/                # Servicios CMS
│   ├── lib/mongodb.ts
│   └── types/cms.ts
├── .env.example
└── .env.local
```

## Requisitos

- Node.js 20+
- npm
- Acceso a la base MongoDB `SeminarioIPN`

## Configuración

1. Clonar el repositorio e instalar dependencias:

```bash
npm install
```

2. Copiar la plantilla de variables de entorno:

```bash
cp .env.example .env.local
```

3. Completar `.env.local` con las credenciales reales:

```env
MONGODB_URI=mongodb://usuario:contraseña@host:27017/?authSource=admin
MONGODB_DB=SeminarioIPN
```

## Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Configuration Hub

Panel de administración institucional en `/admin/config`.

| Endpoint | Método | Descripción |
| --- | --- | --- |
| `/api/cms/config` | GET | Obtiene configuración |
| `/api/cms/config` | PUT | Actualiza configuración |

## Menu Engine

Motor de navegación dinámica en `/admin/menus`. Sin menús hardcodeados.

| Endpoint | Método | Descripción |
| --- | --- | --- |
| `/api/cms/menus` | GET | Listado de menús |
| `/api/cms/menus` | POST | Crear menú |
| `/api/cms/menus/[id]` | GET | Obtener menú |
| `/api/cms/menus/[id]` | PUT | Actualizar menú |
| `/api/cms/menus/[id]` | DELETE | Eliminar menú |

Portal: `main` → header, `footer` → footer, `mobile` → navegación móvil.

## Validación de infraestructura

Endpoint de prueba:

```
GET /api/test
```

Verifica conexión MongoDB, variables de entorno y lectura de `cms_config` (`_id: "site"`).

Respuesta exitosa (ejemplo):

```json
{
  "ok": true,
  "database": "SeminarioIPN",
  "sitio": { ... }
}
```

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Verificación ESLint |

## Integraciones futuras

Preparado para:

- AprendeHoy API (Core Académico)
- Mercado Pago
- SMTP
- WhatsApp Business

## Documentación

- [Infraestructura técnica](./docs/INFRAESTRUCTURA.md)
- [Configuration Hub (CMS)](./docs/CMS-CONFIGURACION.md)
- [Motor de Menús (CMS)](./docs/CMS-MENUS.md)
- Arquitecturas de referencia: ARQ-001, ARQ-002

## Licencia

Proyecto privado — Seminario Eclesiástico Mayor.
