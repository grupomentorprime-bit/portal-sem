# Task 3 — Report

## Status: DONE_WITH_CONCERNS

Commit: `21c8c21 feat: mostrar analítica de conversión en el Espacio`

## What was done

- `analitica-visual.tsx` (new): extracted `StorySection`, `HeroMetric`, `ProportionBars`, `PeriodSelector`, plus `formatCount`, `toDatetimeLocalValue`, `fromDatetimeLocalValue`, `PRESET_OPTIONS`. `AnaliticaClient.tsx` imports them; copy and `/api/growth/analytics` fetch untouched.
- `GET /api/growth/conversion-analytics` (`growth.sales.view`; 400 on period error, 500 on exception, no zeros in catch).
- `/admin/conversion/analitica` page (`growth.sales.view`, redirect to `/login?next=/admin/conversion/analitica`).
- `ConversionAnaliticaClient.tsx`: one column; sections captación, stock, movimiento, pérdidas, permanencia (+ ciclo), cohortes, responsables, calidad; denominators/notes from the contract constants; funnel selector picks a series ("Todos" lists each funnel separately, never merges stages); `EmptyState` "Sin datos en el período"; `AlertBanner` on read error.
- `nav-domains.ts`: item `nav-conversion-analitica` after `nav-conversion`; `excludePrefixes: ["/admin/conversion/analitica"]` on Panel comercial.
- `labels.ts`: new `GROWTH_CONVERSION_ANALITICA_*` exports.
- Test: 7 new source-guard tests appended to `tests/baseline/growth-conversion-analytics.test.ts`.

## RED (before implementation)

`npx tsx --test tests/baseline/growth-conversion-analytics.test.ts tests/baseline/growth-ux-analytics-004.test.ts`: exit 1. New guards failed:
- nav: `nav-conversion-analitica después de nav-conversion` (assertion)
- page / route / client / analitica-visual: `ENOENT` (files absent)
- growth-ux-analytics-004: all PASS.

## GREEN

`npx tsx --test` on growth-conversion-analytics, growth-ux-analytics-004, growth-analytics-003: tests 61, pass 61, fail 0.
(First GREEN run had 1 failure: my own header comment contained "ejemplo" and tripped the guard; reworded, re-ran.)
Also: `growth-os-admin-shell-002` + `admin-nav-conversion`: 8/8 pass (no edit to shell-002 needed, not in commit).
eslint on touched files: 0 errors, 2 warnings (`_ok` unused destructure, same pattern pre-existing in AnaliticaClient). `tsc --noEmit`: no errors in touched files.

## Commit contents (8 files)

analitica-visual.tsx, AnaliticaClient.tsx, ConversionAnaliticaClient.tsx, route.ts, page.tsx, nav-domains.ts, labels.ts, growth-conversion-analytics.test.ts.

- `nav-domains.ts`: committed whole working file per controller exception (includes the pre-existing nav restructure).
- `labels.ts`: committed blob = HEAD + conversion exports only (27 lines; no `opportunity_assigned`, persona status, band filters). Staged via `git hash-object` + `git update-index --cacheinfo`, so the working file was never rewritten from HEAD. Working file retains WIP + conversion exports; `git diff` on it shows only the previous WIP (verified).

## Concerns

- `nav-domains.ts` commit now contains the nav restructure (authorized), while the sidebar/layout consumers of it (`AdminSidebar.tsx`, `admin/layout.tsx`, `use-nav-group-expanded.ts`, `/admin/conversion/page.tsx`) remain uncommitted. HEAD is internally consistent for typing but nav links to `/admin/conversion`, `/admin/ventas/embudos`, `/admin/ventas/mi-trabajo` point at pages not in HEAD until those are committed.
- The nav guard ("Panel comercial" not importing `ConversionAnaliticaClient") reads the untracked `src/app/admin/conversion/page.tsx`; on a fresh checkout without it that test would fail with ENOENT.
- Not manually exercised in a browser; no migration 029 run; nothing pushed.
