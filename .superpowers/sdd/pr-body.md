## Summary
- Sitio Cumple con rutas reales de materias y apoyo (método, FAQ, evaluar, nosotros, contacto), shell compartido y SEO por pathname.
- Menú Información y fichas institucionales con patrón editorial completo en las seis materias (wordmark, batón, panel, conceptos, checklist, implica, pasos), anclado a fuentes BCN/`norma.ts`.
- Specs y planes en `docs/superpowers` para Karin, SST, laboral, datos, inclusión y contratistas; marca de producto Mentor Cumple.

## Test plan
- [ ] `npx tsx --test tests/baseline/cumple-pages.test.ts` (25/25)
- [ ] Revisar menú Información y las 6 fichas en `cumple.localhost:3000/materias/*`
- [ ] Verificar CTAs a `/evaluar` y bloques Fuentes oficiales
- [ ] Confirmar que no hay WIP de branding/admin en este push (queda local)
