# Workflow: new-module

## Cuando se usa

El proyecto ya existe y se pide agregar una entidad/modulo nuevo (ej. "agrega Equipos al sistema").

## Pasos

1. Ejecutar `create-module.md` para generar entity, dto, repository, service, controller, migracion y tests.
2. Registrar el nuevo modulo en el bootstrap de la aplicacion (ver `create-api.md`, seccion de registro de modulos) si el proyecto usa un modulo raiz central.
3. Actualizar la documentacion: Swagger se genera solo por los decoradores del controller: verificar que aparezca en `/docs`; actualizar el README del proyecto (`.claude/skills/documentation.md`).
4. Si el modulo requiere visualizacion, encadenar con `new-reporting-feature.md` en vez de duplicar logica de reporte dentro del modulo CRUD.

## Salida esperada

Un modulo nuevo, aislado, sin tocar logica de otros modulos, con su propia migracion, tests en verde y visible en Swagger.

## Checklist de cierre

- [ ] Migracion nueva y reversible, no se edito una migracion existente.
- [ ] Tests unitarios e de integracion del modulo en verde.
- [ ] Modulo visible en Swagger con autenticacion/autorizacion aplicada.
- [ ] README actualizado mencionando el nuevo modulo.
