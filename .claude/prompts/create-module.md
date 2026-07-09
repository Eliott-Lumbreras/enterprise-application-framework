# Prompt: create-module

## Se activa cuando el usuario escribe algo como

- "Genera un modulo de {{Entidad}}"
- "Crea el CRUD de {{Entidad}}"
- "Necesito gestionar {{Entidad}} en el sistema"

## Que confirmar antes de generar (si no vino en el mensaje)

- Nombre de la entidad y sus campos de negocio (ademas de las columnas de auditoria obligatorias).
- Si requiere reglas de negocio especiales ademas de CRUD (ej. estados con transicion controlada).
- Quien puede crear/editar/eliminar (roles, para el guard de autorizacion).

## Proceso

1. Aplicar `.claude/skills/architecture.md` y `.claude/skills/backend.md` para la capa de dominio.
2. Generar, a partir de las plantillas en `.claude/templates/`, reemplazando `{{PascalCase}}`, `{{camelCase}}`, `{{kebab-case}}`, `{{snake_case}}`:
   - `entity.template.ts` -> `{{kebab-case}}.entity.ts`
   - `dto.template.ts` -> `{{kebab-case}}.dto.ts` (agregar los campos de negocio confirmados)
   - `repository.template.ts` -> `{{kebab-case}}.repository.ts`
   - `service.template.ts` -> `{{kebab-case}}.service.ts`
   - `controller.template.ts` -> `{{kebab-case}}.controller.ts`
   - `migration.template.ts` -> migracion con timestamp real, columnas de negocio incluidas
   - `unit-test.template.spec.ts` -> `{{kebab-case}}.service.spec.ts`
   - `integration-test.template.spec.ts` -> `{{kebab-case}}.e2e-spec.ts`
3. Aplicar `.claude/skills/security.md` al guard/roles del controller segun lo confirmado.
4. Aplicar `.claude/skills/database.md` a la migracion (indices sobre columnas de filtro frecuente).
5. Registrar el modulo en el bootstrap de la app (ver `create-api.md` si el modulo aun no esta expuesto).

## Checklist antes de entregar

- [ ] Todas las columnas de auditoria presentes (id, created_at, updated_at, created_by, updated_by, deleted_at).
- [ ] DTOs validan cada campo de entrada (class-validator), sin campos sin validar.
- [ ] Controller documentado con decoradores Swagger (@ApiOperation, @ApiResponse).
- [ ] Guard de autenticacion/autorizacion aplicado.
- [ ] Tests unitarios e de integracion generados y en verde.
- [ ] Sin TODOs ni codigo de ejemplo/prototipo.
