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

