# Laboral RRHH editorial SDD

Started: 2026-10-02
Branch: feat/sitio-en-codigo
Plan: docs/superpowers/plans/2026-10-02-cumple-laboral-rrhh-editorial.md


Task 1: complete (uncommitted tests, review clean)

Task 2: complete (uncommitted materias.ts, review clean, visual OK)

Final review: Ready to merge this feature (Minor: more legal-guardrail asserts optional)
All tasks complete.

Finish choice: 3 keep branch as-is


# Conversion Engine fase 3 SDD

Started: 2026-10-19
Branch: feat/branding-admin-wip
Plan: docs/superpowers/plans/2026-10-19-conversion-engine-fase-3.md
Base: 9fd0967a3eb4d80ca4ea4de957d9b807ff0b9993

Task 1: complete (commits 9fd0967..37696a0, review clean)

Minors for final review:
- Extra incomplete-history causes beyond the spec list
- Quality buckets sinFechaApertura/sinFechaCierre/historialIncompleto are all-time, not period-scoped
- Cohort excludes result statuses without closedAt
- Funnel labels are the funnel key (input type has no name)
- Stage rows sorted by count/label, not funnel stage order
- ISO string compare can misorder mixed timestamp formats
- First membership row wins if duplicates; empty active label becomes no vigente
- Quality test asserts 3 of 6 buckets; no boundary tests
- Loss exit rows keyed funnelKey:fromState
Task 2: complete (commits 37696a0..ad31623, review clean)

Task 3: complete (commits ad31623..f3549ce, review clean after fixes)
Final review: Ready


# Operador Congreso acceso/clave SDD

Started: 2026-11-17
Branch: feat/congreso-varones-2026-ops
Plan: docs/superpowers/plans/2026-11-17-operador-congreso-acceso-clave.md
Base: c92afd4696fb0687400560b02343315c8dbf3187
Constraint: no git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>"/PR unless user asks

Task 1: complete (uncommitted, congress-access 2/2 pass, review pending self)
Task 2: complete (uncommitted, invitation-email-login pass)
Task 3: complete (uncommitted, request-access-link 2/2 pass)
Task 4: complete (uncommitted, API route smoke 200/429)
Task 5: complete (uncommitted, LoginForm recover UI)
Task 6: complete (5/5 related baseline tests pass; API 200/429 verified)
Final review (inline, subagents unavailable): Spec covered. Minor: operators already in Mongo need npm run sync:tenant-roles. Rate limit is in-memory (resets on process restart).

# Congreso Varones Nómina Precarga SDD

Started: 2026-11-17
Branch: feat/congreso-varones-2026-ops
Plan: docs/superpowers/plans/2026-11-17-congreso-varones-nomina-precarga.md
Base: 1a66dc8c93a969c3d48943e493d594407d4d442d
Constraint: sin git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>"/PR salvo pedido del usuario

Task 1: complete (uncommitted, congress-nomina-claim 2/2 pass, review inline — subagents unavailable)

Task 2: complete (uncommitted, congress-nomina-claim 4/4 pass, review inline)

Task 3: complete (uncommitted, import-commit-write + preview + critical 14/14, review inline)

Task 4: complete (uncommitted, commit route + Importación UI, review inline)

Task 5: complete (uncommitted, churches lib + admin/public APIs + registrations merge, review inline)

Task 6: complete (uncommitted, public roster search API, review inline)

Task 7: complete (uncommitted, claim submit + sync skip, review inline)

Task 8: complete (uncommitted, PortalCongressExperienceForm + page wire, review inline)
Task final: pending — subagents unavailable; domain tests 23/23 pass

Final review (inline, subagents unavailable): Spec covered for nomina precarga+claim. Minors: Mongo .env apunta a db vacia (smoke E2E manual pendiente); Select other-church UX; claim 409 tras save si race. Domain tests 23/23.


# Congreso Varones Caja/Pagos SDD

Started: 2026-11-17
Branch: feat/congreso-varones-2026-ops
Plan: docs/superpowers/plans/2026-11-17-congreso-varones-caja-pagos.md
Base: caec391c5dc29375fcd901c5606700ead2491d26
Constraint: sin git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>"/PR salvo pedido del usuario

Task 1: complete (uncommitted, cash-box+domain+critical 23/23)
Task 2: complete (uncommitted, payments route + repository method/paidOn)
Task 3: complete (uncommitted, ParticipantSheet Tipo+Fecha)
Task 4: complete (uncommitted, grupal + Caja filtros/totales)
Task 5: tests pass; browser smoke pendiente usuario

# Congreso Varones Control de caja SDD

Started: 2026-11-17
Branch: feat/congreso-varones-2026-ops
Plan: docs/superpowers/plans/2026-11-17-congreso-varones-control-caja.md
Base HEAD: caec391c5dc29375fcd901c5606700ead2491d26
Constraint: sin git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>"/PR salvo pedido del usuario; reviews via uncommitted diffs

Task 1: complete (uncommitted, summarizeContributionClose + tests)
Task 2: complete (uncommitted, breakdowns day/zone/church + tests)
Task 3: complete (uncommitted, Tabs value controlled)
Task 4: complete (uncommitted, CashBoxView)
Task 5: complete (uncommitted, panel tab + Summary teaser)
Task 6: browser blocked on login — needs user smoke
Domain tests: congress-cash-box 8/8 pass

# Congreso Varones Control de caja UX SDD

Started: 2026-11-18
Branch: feat/congreso-varones-2026-ops
Plan: docs/superpowers/plans/2026-11-18-congreso-varones-control-caja-ux.md
Constraint: sin git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>"/PR salvo pedido del usuario; reviews via uncommitted diffs


Task 1: complete (uncommitted, helpers + cierre hero; inline � subagents unavailable)
Task 2: complete (uncommitted, recaudado alineado)
Task 3: complete (uncommitted, d�a condicional + zona|iglesia 2 cols)
Task 4: complete (uncommitted, movimientos columnas; domain tests 8/8; browser blocked on login)
Final review (inline): Spec UX covered in CashBoxView.tsx. Tokens warning/success/primary (no hardcoded amber/violet) to match kit. Minors: browser smoke pendiente usuario.

# Pago grupal seleccion pagados SDD

Started: 2026-11-18
Branch: feat/congreso-varones-2026-ops
Plan: docs/superpowers/plans/2026-11-18-pago-grupal-seleccion-pagados.md
Base: 97cb343462ef5965fd6f971a8e1c471be91c5764
Constraint: sin Co-authored-by trailer; sin PR salvo pedido del usuario

Task 1: complete (commits 97cb343..58ef68d, review inline — subagents unavailable)
Task 2: complete (commits 58ef68d..167dee9, review inline — subagents unavailable)

# Invitación Varones asunto bienvenida SDD

Started: 2026-11-18
Branch: feat/congreso-varones-2026-ops
Plan: docs/superpowers/plans/2026-11-18-invitacion-varones-asunto-bienvenida.md
Base: 167dee954f91aca0a99af3cb9b44b1fc4b6c6c36
Constraint: sin git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>"/PR salvo pedido del usuario; reviews via uncommitted diffs

Task 3: complete (unit tests 5/5; browser smoke pendiente usuario)
Final review (inline, subagents unavailable): Spec covered for group selection. Minors: browser smoke pendiente.

# Invitación Varones asunto bienvenida SDD

Started: 2026-11-18
Branch: feat/congreso-varones-2026-ops
Plan: docs/superpowers/plans/2026-11-18-invitacion-varones-asunto-bienvenida.md
Base: 167dee954f91aca0a99af3cb9b44b1fc4b6c6c36
Constraint: sin git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>"/PR salvo pedido del usuario; reviews via uncommitted diffs

Task 1: complete (uncommitted, unit-email-brand 8/8 pass, review inline — subagents unavailable)
Final review (inline): Spec covered. Subject only; recovery/space invitacion intactos. Ready.
Finish choice: 3 keep branch as-is

# Congreso Varones Exento + Drilldown SDD

Started: 2026-11-18
Branch: feat/congreso-varones-2026-ops
Plan: docs/superpowers/plans/2026-11-18-congreso-varones-exento-drilldown.md
Base HEAD: 167dee954f91aca0a99af3cb9b44b1fc4b6c6c36
Constraint: sin git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>"/PR salvo pedido del usuario; reviews via uncommitted diffs
Task 1: complete (uncommitted, congress-charge 4/4, review inline — subagents usage-limited)
Task 2: complete (uncommitted, selectable saldo>0 + Exento label)
Task 3: complete (uncommitted, PATCH .../charge)
Task 4: complete (uncommitted, ParticipantSheet + panel patchCharge)
Task 5: complete (uncommitted, CashBox drill-down + group amount by remaining)
Domain tests: charge+labels+cash-box 17/17 pass

# Pago grupal recaudacion partida SDD

Started: 2026-11-18
Branch: feat/congreso-varones-2026-ops
Plan: docs/superpowers/plans/2026-11-18-pago-grupal-recaudacion-partida.md
Base: f9861f112afea07cf069c748a8bacec5b45bcfd8
Constraint: sin Co-authored-by; sin PR salvo pedido

Task 1: complete (commits f9861f1..3db7b11, inline)
Task 2+3: complete (UI+dual POST, inline — subagents unavailable)
Task 4: unit tests pass; browser smoke pendiente usuario
