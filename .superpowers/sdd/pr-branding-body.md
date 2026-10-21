## Summary
- Admin shell Growth OS: sidebar tinta, chrome de producto e identidad visual desacoplada por Espacio
- Branding SaaS: sin fallbacks SEM en runtime, favicon de plataforma, strip de assets ajenos y preview de origen por host
- Baseline shell-002 alineado con CMS legacy retirado (pages/menus/content/academic) para desbloquear CI

## Test plan
- [ ] `npm run check:branding`
- [ ] `npx tsx --test tests/baseline/growth-os-admin-shell-002.test.ts tests/baseline/coded-site-admin-retired.test.ts tests/baseline/saas-branding.test.ts tests/baseline/ux-shell-identity.test.ts`
- [ ] Revisar shell admin (sidebar/topbar) y panel Identidad visual en un Espacio
- [ ] Confirmar que un Espacio sin logo no hereda SEM en favicon/preview
