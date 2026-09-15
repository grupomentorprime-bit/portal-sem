# OT-GROWTH-UX-TEAM-004 — Refinamiento UX mínimo — Equipo V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-UX-TEAM-004 |
| Tipo | Diseño / UX |
| Agente | AGENTE 1 — Diseño / UX |
| Fecha | 2026-09-14 |
| Entrada | [OT-GROWTH-TEAM-CONTRACT-002](./OT-GROWTH-TEAM-CONTRACT-002.md) · [OT-GROWTH-TEAM-IMPLEMENT-003](./OT-GROWTH-TEAM-IMPLEMENT-003.md) (APTO) |
| Estado | **CERRADA · APTO VISUAL** |
| Alcance | `/admin/settings/team` — jerarquía, copy, invitaciones, invitar, estados, responsive; consistencia Growth OS |
| Fuera de alcance | Identity · Keycloak · APIs · membership · permisos · `settings.team` · jerarquía · NON_ASSIGNABLE · migración 023 · Platform Admin · selector de Espacio · Personas Growth · Shell · otros módulos |

**Restricciones cumplidas:** sin cambiar lógica ni seguridad; sin datos ficticios para evidencia; sin declarar Equipo V1 cerrado; sin abrir otra OT.

---

## Gate final

**APTO VISUAL**

Equipo V1 queda legible y humano: listado escaneable, invitaciones separadas, invitar en un solo paso, acciones con confirmación clara y estados recuperables. **No** se declara Equipo V1 cerrado de producto. **No** se abre otra OT.

---

## 1. Estado inicial

| Superficie | Antes (IMPLEMENT-003) |
| --- | --- |
| Cabecera | «Miembros, invitaciones y acceso de este Espacio.» |
| Listado | Cards con badge Activo, último acceso, Historial, Acciones; filtros de status/rol |
| Invitar | Wizard 4 pasos + copy «Crear usuario» / CMS |
| Tabs | Equipo · Invitar · Actividad (auditoría) |
| Confirmación | Copy genérico de quitar acceso |
| Errores | Mensaje API crudo (p. ej. último admin) |

Base funcional cerrada: 6 operaciones Identity, `settings.team`, D1–D4.

---

## 2. Problemas visuales encontrados

1. Copy residual de Usuarios/CMS («Crear usuario», «CMS», «usuarios en este filtro»).
2. Wizard de invitación demasiado largo para Nombre / Correo / Rol.
3. Estado «Activo» y «Último acceso» añadían ruido sin valor.
4. Historial / enlace Asuntos Estudiantiles / tab Actividad competían con las 6 operaciones V1.
5. Invitaciones pendientes poco protagonistas en el listado.
6. Confirmación de quitar acceso poco personalizada.
7. Error de último administrador no humanizado en UI.
8. Breadcrumb shell mostraba segmento técnico `team`.

---

## 3. Cambios realizados

| Área | Cambio |
| --- | --- |
| Cabecera | Título **Equipo** · subtítulo *Las personas que trabajan contigo en este Espacio.* |
| Listado | Nombre → rol humano → correo → estado solo si aporta → Cambiar rol / Gestionar |
| Dueño | Sin acciones; nota *rol no modificable desde Equipo* |
| Invitaciones | Bloque separado (listado + pestaña Invitar); sin reenvío |
| Invitar | Formulario único: Nombre, Correo, Rol, **Enviar invitación** |
| Confirmaciones | *¿Quitar acceso a {nombre}?* + copy de Espacio; Cancelar / Quitar acceso |
| Errores | Humanización UI del último admin y permisos; Reintentar en carga |
| Tabs | Solo Equipo · Invitar (sin Actividad en esta superficie) |
| Breadcrumb | `team` → Equipo en `SEGMENT_LABELS` |
| Responsive | Columna única en móvil; grid 2 cols desde ~900px; sin tablas |

---

## 4. Listado

- Máximo: nombre, correo, rol humano, estado útil, acción.
- Roles visibles: Dueño del Espacio, Administrador, Soporte, Admisiones, Comunicaciones, Asuntos Estudiantiles, Revisor, Consulta.
- Sin códigos técnicos (`super_admin`, etc.).
- Sin Bloquear / Suspender / Permisos avanzados / Transferir Dueño.

---

## 5. Invitar e invitaciones

- CTA **Invitar persona** · formulario **Enviar invitación**.
- Pendientes: nombre/correo · rol · *Invitación pendiente* · **Cancelar invitación**.
- Vacío real: *No hay invitaciones pendientes.*

---

## 6. Estados

| Estado | Tratamiento |
| --- | --- |
| Con miembros | Grid/listado + contador |
| Sin colaboradores adicionales | Empty + CTA Invitar persona |
| Sin coincidencias de búsqueda | Empty + Limpiar búsqueda |
| Sin invitaciones | Empty calmado en bloque pendiente |
| Cargando | *Cargando Equipo…* |
| Error de carga | Banner + Reintentar |
| Acción no permitida / último admin | *No puedes quitar este acceso porque el Espacio debe tener al menos un administrador.* (solo UI; API intacta) |

---

## 7. Responsive

| Viewport | Comportamiento |
| --- | --- |
| Desktop | 2 columnas; invitaciones al lado del formulario |
| Mobile 390×844 | Cards a ancho completo: nombre → rol → correo → acciones |

Sin tablas horizontales. Shell intacto.

---

## 8. Archivos

### Creados

| Archivo | Rol |
| --- | --- |
| `scripts/capture-growth-ux-team-004.ts` | Capturas Playwright con datos reales |
| `tests/baseline/growth-ux-team-004.test.ts` | Regresión UX / copy / no-toques |
| `docs/AI/auditorias/OT-GROWTH-UX-TEAM-004-evidence/*` | Evidencia visual |
| `docs/AI/auditorias/OT-GROWTH-UX-TEAM-004.md` | Esta acta |

### Modificados

| Archivo | Cambio |
| --- | --- |
| `src/app/admin/settings/team/page.tsx` | Subtítulo humano |
| `src/components/admin/UsuariosCmsClient.tsx` | Jerarquía, estados, confirmaciones, humanización errores |
| `src/components/admin/UserCmsCard.tsx` | Card mínima Equipo V1 |
| `src/components/admin/InviteUserWizard.tsx` | Formulario de un paso |
| `src/styles/admin-users-cms.css` | Layout listado / controles |
| `src/lib/admin/breadcrumb-from-path.ts` | Label `team` → Equipo |

### No tocados

Identity · Keycloak · APIs · `last-admin` mensaje API · migración 023 · permisos · NON_ASSIGNABLE · Platform Admin · selector de Espacio · Personas / Campañas / Analítica / Actividad Growth · Shell nav.

---

## 9. Pruebas

| Suite | Resultado |
| --- | --- |
| `growth-ux-team-004.test.ts` | PASS |
| `growth-team-003.test.ts` (IMPLEMENT) | PASS |
| `growth-os-admin-shell-002.test.ts` | PASS |

---

## 10. Evidencia visual

Directorio: [`OT-GROWTH-UX-TEAM-004-evidence/`](./OT-GROWTH-UX-TEAM-004-evidence/)

Tenant de captura: **seminario-ipn** (7 miembros reales; 0 invitaciones pendientes — vacío real, sin inventar).

| # | Archivo | Qué valida |
| --- | --- | --- |
| 1 | `01-desktop-listado.png` | Listado desktop · roles humanos · CTA Invitar persona |
| 2 | `02-desktop-invitar.png` | Formulario Nombre/Correo/Rol · Enviar invitación |
| 3 | `03-desktop-invitaciones.png` | Bloque invitaciones (vacío real) |
| 4 | `04-desktop-cambiar-rol.png` | Panel Cambiar rol con labels humanos |
| 5 | `05-desktop-quitar-acceso.png` | Confirmación ¿Quitar acceso a …? |
| 6 | `06-estado-vacio.png` | Sin coincidencias de búsqueda (real) |
| 7 | `07-mobile-listado.png` | Mobile · jerarquía nombre/rol/correo/acciones |
| 8 | `08-mobile-invitar.png` | Mobile · invitar |

`RESULT.json`: `tenantId=seminario-ipn`, `memberCount=7`, `invitationCount=0`, `rolePanelOpened=true`, `removeOpened=true`, `emptyKind=busqueda`.

### Revisión visual

| Criterio | Resultado |
| --- | --- |
| Jerarquía listado | OK |
| Roles humanos / sin códigos | OK |
| Invitar simple | OK |
| Invitaciones separadas | OK (vacío real) |
| Confirmación quitar acceso | OK |
| Responsive mobile | OK |
| Shell intacto / sin Usuarios-CMS | OK |

---

## 11. Problemas funcionales detectados (solo documentados)

Ninguno bloqueante de producto en esta pasada.

| Ítem | Nota |
| --- | --- |
| Invitaciones pendientes con datos | Tenant de captura sin pendientes; empty state validado; no se inventaron invitaciones |
| Mensaje API `LAST_SPACE_ADMIN_ERROR` | Sigue siendo el string de Identity; UI lo traduce — no se cambió el core |
| Breadcrumb doble (chrome + frame) | Patrón Shell existente; solo se corrigió el label `team` |

---

## 12. Cambios deliberadamente NO realizados

- Identity / Keycloak / APIs / membership / permisos
- Migración 023 / last-admin core / NON_ASSIGNABLE
- Platform Admin / selector de Espacio / Personas Growth
- Rediseño Shell / otras pantallas Growth
- Reenvío de invitaciones / Transferir Dueño / Bloquear / Suspender
- Inventar miembros o invitaciones para evidencia

---

## 13. Pendientes reales

| Ítem | Nota |
| --- | --- |
| Evidencia con invitaciones pendientes reales | Revalidar visualmente cuando el Espacio tenga pendientes |
| Vacío absoluto (0 colaboradores) | No capturado (había 7); empty de búsqueda sí |
| Cierre de producto Equipo V1 | Fuera de esta OT — no se declara cerrado aquí |

---

## 14. Veredicto

**APTO VISUAL**

Cumple gate: evidencia desktop + mobile reales; listado/invitar/cambiar rol/quitar acceso claros; invitaciones separadas; lenguaje humano; errores sensibles humanizados en UI; sin datos ficticios; sin tocar Identity ni APIs; sin regresión IMPLEMENT-003.

Equipo V1 **no** se cierra automáticamente. **No** se abre otra OT.
