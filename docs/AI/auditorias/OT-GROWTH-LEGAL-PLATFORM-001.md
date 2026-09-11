# OT-GROWTH-LEGAL-PLATFORM-001 — Legales públicos de plataforma Growth OS

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-LEGAL-PLATFORM-001 |
| Tipo | Superficie pública de plataforma + contenido legal inicial |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-11 |
| Entrada | OT-GROWTH-META-TP-001 (**CERRADA · META PARCIAL**) |
| Estado | **CERRADA · APTO CON PENDIENTE EXTERNO** |
| Alcance | URLs públicas estables de privacidad, términos y eliminación de datos de **Growth OS** |
| Fuera de alcance | Embedded Signup · Meta App Dashboard · webhook WhatsApp · Mensajes · Canales · Automatizaciones · Growth Core · datos productivos · segundo CMS |

**Restricciones cumplidas:** sin segundo CMS; sin duplicar renderer de páginas; sin hardcodear SEM/ADL; sin tocar Mensajes / WhatsApp / Centro de Canales / Automation Runtime.

---

## Gate final

**APTO CON PENDIENTE EXTERNO**

Pendiente externo (único bloqueante para pegar URLs HTTPS productivas en Meta App Dashboard):

- Dominio canónico HTTPS de **Growth OS / Mentor Prime** aún no evidenciado en repo (mismo hallazgo que OT-GROWTH-META-TP-001 §1.2).
- En local: `http://localhost:3000/legal/...` responde **200** sin sesión.
- Canonical/sitemap usan `NEXT_PUBLIC_APP_URL` / `APP_URL` (hoy plantilla local).

Cuando exista dominio productivo HTTPS, las URLs a registrar en Meta son las de la sección 2 (sin redeploy de contenido si el host solo cambia por env).

---

## 1. Auditoría previa (ETAPA 1)

| Superficie | Hallazgo | Decisión |
| --- | --- | --- |
| Routing público | `(site)/[slug]` carga páginas CMS publicadas por Espacio | No usurpar `/privacidad` ni `/terminos` del CMS |
| CMS / legales por Espacio | Menú legal default apunta a `/privacidad`, `/terminos` (`menu-defaults`) | Se mantienen para **legales del cliente** |
| `/platform/*` | Requiere sesión + operador (`platform/layout.tsx`, `proxy.ts`) | **No** sirve para Meta crawlers |
| Branding plataforma | `PlatformNeutralTheme` + `ProductMark` + `PLATFORM_DISPLAY_NAME` | Reutilizar; no estética de tenant |
| Site → Tenant | Host → Domain → Site → Tenant (`core/tenant`) | Legales de plataforma **fuera** de ese contenido |
| Dominio plataforma | `PLATFORM_BASE_DOMAIN` opcional; APP_URL de Growth OS **no definido** productivamente | Pendiente externo |
| Sitemap | Solo paths de portal + formularios | Añadir paths `/legal/*` de plataforma |
| robots | `allow: /`; disallow admin/api | Sin `noindex` accidental en legales |
| Footer tenant | Enlaces `/privacidad`, `/terminos` vía CMS/menú | **No** redirigir a legales Growth OS (no mezclar ámbitos) |
| Contacto ops | `soporte@mentorprime.cl` | Reutilizar |

**Conclusión:** crear superficie pública **propia de plataforma** bajo `/legal/*`, con contenido versionado en código (no CMS de tenant).

---

## 2. Rutas finales

| Documento | Ruta estable | Notas |
| --- | --- | --- |
| Índice | `/legal` | Lista los tres documentos; aclara ámbito plataforma vs Espacio |
| Política de privacidad | `/legal/privacidad` | Equivalente arquitectónico a `/privacidad` sin sombrear CMS |
| Términos de servicio | `/legal/terminos` | Equivalente a `/terminos` |
| Eliminación de datos | `/legal/eliminacion-de-datos` | URL candidata Meta User Data Deletion |

**Forma absoluta (cuando exista dominio HTTPS de plataforma):**

```text
https://<dominio-https-de-growth-os>/legal/privacidad
https://<dominio-https-de-growth-os>/legal/terminos
https://<dominio-https-de-growth-os>/legal/eliminacion-de-datos
```

**Por qué no `/privacidad` y `/terminos` en la raíz**

Esas rutas están reservadas al motor CMS por Espacio (`(site)/[slug]` + menú legal). Publicar ahí legales de Growth OS mezclaría ámbitos y rompería la capacidad de cada cliente de publicar los suyos. La OT autoriza “rutas equivalentes que mejor encajen con la arquitectura pública REAL”.

---

## 3. Infraestructura reutilizada

| Pieza | Uso |
| --- | --- |
| `PlatformNeutralTheme` | Aísla CSS de marca del Espacio activo |
| `ProductMark` / `PLATFORM_DISPLAY_NAME` | Identidad Growth OS |
| `getAppBaseUrl()` | Canonical + sitemap |
| `src/app/sitemap.ts` | Inclusión de `/legal*` |
| `src/app/robots.ts` | Sin cambios (ya permite `/`) |
| `src/proxy.ts` | Sin cambios (`/legal` no es zona protegida) |
| Contacto | `soporte@mentorprime.cl` |

**No reutilizado (a propósito):** CMS pages, `PortalRenderer`, `PortalShell`, menús legales de Espacio.

---

## 4. Contenido publicado

Contenido inicial en `src/core/legal/platform/content.ts` (fecha visible: **2026-09-11**).

### A. Política de privacidad

Cubre: qué es Growth OS; ámbito plataforma vs cliente; datos de cuenta/contacto; datos en Espacios; canales conectados; WhatsApp/Meta; finalidades; seguridad; proveedores; conservación; derechos; contacto; cambios. Distingue responsable cliente vs operador de plataforma. Sin afirmar prácticas técnicas inexistentes ni plazos legales inventados.

### B. Términos de servicio

Cubre: uso; cuenta/Espacios; responsabilidades del cliente; canales externos; WhatsApp/Meta; **costos de Meta/terceros no incluidos automáticamente en la licencia de Growth OS**; disponibilidad; uso permitido; PI; suspensión; limitaciones; cambios; contacto.

### C. Eliminación de datos

Página simple con proceso en 5 pasos hacia `soporte@mentorprime.cl`, verificación de identidad, procesamiento según corresponda e información al solicitante. Compatible como URL pública de User Data Deletion cuando Meta lo acepte.

---

## 5. Presentación / SEO

| Requisito | Estado |
| --- | --- |
| Público sin login | Sí (`proxy` no protege `/legal`) |
| Diseño institucional Growth OS | Sí (shell propio, no admin, no tenant) |
| Índice en documentos largos | Sí (privacidad y términos) |
| Fecha de actualización visible | Sí |
| Metadata title/description | Sí |
| Canonical | Sí (`getAppBaseUrl()` + path) |
| robots index/follow | Sí (`index: true`) |
| Sitemap | Sí (`/legal`, tres documentos) |
| HTTPS productivo | **Pendiente externo** |

---

## 6. Evidencia de acceso público

Pruebas locales (2026-09-11, revalidadas al cierre), **sin cookie de sesión**:

| GET | Status | Observación |
| --- | --- | --- |
| `/legal` | **200** | Índice plataforma |
| `/legal/privacidad` | **200** | Growth OS + `soporte@mentorprime.cl`; `robots: index, follow`; sin `noindex` |
| `/legal/terminos` | **200** | Incluye cláusula costos Meta/terceros |
| `/legal/eliminacion-de-datos` | **200** | Proceso 5 pasos |
| `/privacidad` | **404** | Sin página CMS publicada en este entorno (capacidad CMS intacta) |
| `/terminos` | **404** | Idem |
| `/robots.txt` | **200** | `Allow: /`; sitemap declarado |
| `/sitemap.xml` | **200** | Incluye las cuatro rutas `/legal*` |

Canonical local de ejemplo: `http://localhost:3000/legal/privacidad`.  
Fecha visible en UI: **11 de septiembre de 2026** (`PLATFORM_LEGAL_LAST_UPDATED`).  
Capturas regeneradas con `scripts/capture-growth-legal-platform-001.ts`.

---

## 7. Compatibilidad con legales por Espacio

| Control | Resultado |
| --- | --- |
| Motor CMS / `[slug]` | No modificado |
| Menú legal default `/privacidad`, `/terminos` | Intactos |
| Footer / PortalShell | Intactos |
| Rutas plataforma bajo `/legal/*` | Fuera de `(site)` → sin `PortalShell` de tenant |
| Mezcla de ámbitos | Evitada: copy aclara “Documento de plataforma” |

---

## 8. Pruebas de no-regresión (alcance OT)

| Área | ¿Modificada? |
| --- | --- |
| Mensajes | No |
| WhatsApp / webhook | No |
| Centro de Canales | No |
| Automation Runtime | No |
| Embedded Signup / Meta App | No |
| `growth_whatsapp_connections` | No |

---

## 9. Capturas

Directorio: `docs/AI/auditorias/OT-GROWTH-LEGAL-PLATFORM-001-evidence/`

| Archivo | Viewport |
| --- | --- |
| `privacidad-desktop.png` | Desktop 1280×800 (full page) |
| `privacidad-mobile.png` | Mobile 390×844 (full page) |
| `terminos-desktop.png` | Desktop |
| `terminos-mobile.png` | Mobile |
| `eliminacion-desktop.png` | Desktop |
| `eliminacion-mobile.png` | Mobile |

---

## 10. Archivos entregados

| Path | Rol |
| --- | --- |
| `src/core/legal/platform/*` | Constantes + contenido legal de plataforma |
| `src/components/legal/*` | Shell, vista de documento, page helper |
| `src/app/legal/**/page.tsx` | Rutas públicas |
| `src/app/sitemap.ts` | Inclusión `/legal*` |
| `scripts/capture-growth-legal-platform-001.ts` | Capturas desktop/mobile |
| Este acta + evidence/ | Cierre OT |

---

## 11. Decisiones humanas pendientes

1. **Dominio HTTPS canónico de Growth OS** para Meta App Dashboard (pegar las tres URLs `/legal/...`).
2. Revisión legal/compliance humana del texto inicial (copy de producto; no es dictamen jurídico).
3. Si en el futuro se desea servir las mismas páginas también en `/privacidad` y `/terminos` **solo en el host de plataforma**, hacerlo con resolución por host sin sombrear CMS en dominios de clientes (fuera de esta OT).
4. Registrar en Meta el email `soporte@mentorprime.cl` y la URL de eliminación cuando el dominio productivo esté listo (acción manual de Marco / ops).

---

## 12. Cierre

| Criterio OT | Cumplimiento |
| --- | --- |
| Tres URLs públicas estables Growth OS | Sí (`/legal/...`) |
| Sin segundo CMS / sin duplicar renderer | Sí |
| Distinción legales cliente vs plataforma | Sí |
| Contacto institucional | Sí |
| Validación GET sin sesión | Sí |
| Sin tocar NO TOCAR | Sí |
| HTTPS dominio productivo | Pendiente externo |

**GATE: APTO CON PENDIENTE EXTERNO** — falta únicamente dominio/HTTPS productivo de plataforma para uso oficial en Meta.
