# Workflow: new-module

## Cuando se usa

El proyecto ya existe y se pide agregar una entidad/modulo nuevo (ej. "agrega Equipos al sistema").

## Pasos

0. **Gate de diseno (Fase 10 — AI Architect)**: completar `docs/design/{{kebab-case}}.design.md` a partir de `.claude/templates/design-doc.template.md`, aplicando `.claude/skills/ai-architect.md`. Correr `node scripts/check-design.js {{kebab-case}}`; si falla, no seguir al paso 1.
1. Ejecutar `create-module.md` para generar entity, dto, repository, service, controller, migracion y tests (o `node scripts/generate-module.js {{PascalCase}}`, Fase 8, con los campos confirmados en el design doc).
2. Registrar el nuevo modulo en el bootstrap de la aplicacion (ver `create-api.md`, seccion de registro de modulos) si el proyecto usa un modulo raiz central.
3. Correr `node scripts/review-module.js {{kebab-case}}` (Fase 9 — Code Reviewer automatico) y resolver todo hallazgo bloqueante.
4. Actualizar la documentacion: Swagger se genera solo por los decoradores del controller: verificar que aparezca en `/docs`; actualizar el README del proyecto (`.claude/skills/documentation.md`).
5. Si el modulo requiere visualizacion, encadenar con `new-reporting-feature.md` en vez de duplicar logica de reporte dentro del modulo CRUD.

## Salida esperada

Un modulo nuevo, aislado, sin tocar logica de otros modulos, con su propio design doc aprobado, su propia migracion, tests en verde, sin hallazgos bloqueantes del Code Reviewer, y visible en Swagger.

## Checklist de cierre

- [ ] `design.checklist.md` (Fase 10) paso antes de generar codigo.
- [ ] Migracion nueva y reversible, no se edito una migracion existente.
- [ ] Tests unitarios e de integracion del modulo en verde.
- [ ] `review-module.js` sin hallazgos bloqueantes (Fase 9).
- [ ] Modulo visible en Swagger con autenticacion/autorizacion aplicada.
- [ ] README actualizado mencionando el nuevo modulo.
- [ ] `module.checklist.md` (Fase 6) completo antes de entregar.
