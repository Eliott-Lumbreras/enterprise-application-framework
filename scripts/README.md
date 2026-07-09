# Generadores (Fase 8)

## generate-module.js

Genera un modulo backend/frontend completo a partir de una sola entidad,
reutilizando las plantillas de `.claude/templates/` (Fase 3) y su convencion
de placeholders documentada en `.claude/templates/README.md`.

### Uso

```bash
node scripts/generate-module.js <NombreEntidad> [opciones]
```

Ejemplos:

```bash
node scripts/generate-module.js Equipment
node scripts/generate-module.js work-order
node scripts/generate-module.js Inventory --plural=inventories
node scripts/generate-module.js AuditLog --skip=frontend,integration-test
```

El nombre de entidad acepta PascalCase, camelCase, kebab-case o snake_case de
entrada; el script deriva las 4 variantes y el plural para todos los archivos.

### Opciones

| Opcion | Uso |
|---|---|
| `--plural=<kebab-case>` | Plural irregular (ej. `inventories`, `companies`). Sin esta opcion se usa una regla simple (+s / +es), que no cubre plurales irregulares — para esos, siempre pasar `--plural` explicito en vez de confiar en la regla automatica. |
| `--root=<ruta>` | Raiz del proyecto donde escribir (por defecto, la raiz de este repo). Util para generar dentro de un proyecto concreto que use este framework como dependencia/plantilla. |
| `--skip=parte1,parte2` | Omite partes puntuales. Valores validos: `entity, dto, repository, service, controller, migration, unit-test, integration-test, frontend`. |

### Que genera

| Parte | Origen (plantilla) | Destino |
|---|---|---|
| Entity | entity.template.ts | `backend/src/modules/<kebab>/<kebab>.entity.ts` |
| DTO | dto.template.ts | `backend/src/modules/<kebab>/<kebab>.dto.ts` |
| Repository | repository.template.ts | `backend/src/modules/<kebab>/<kebab>.repository.ts` |
| Service | service.template.ts | `backend/src/modules/<kebab>/<kebab>.service.ts` |
| Controller | controller.template.ts | `backend/src/modules/<kebab>/<kebab>.controller.ts` |
| Migration | migration.template.ts | `database/migrations/<timestamp>-create-<kebab>-table.ts` (timestamp real generado en el momento, reemplazando el placeholder fijo de la plantilla) |
| Unit test | unit-test.template.spec.ts | `tests/<kebab>/<kebab>.service.spec.ts` |
| Integration test | integration-test.template.spec.ts | `tests/<kebab>/<kebab>.e2e-spec.ts` |
| Frontend page | react-page.template.tsx | `frontend/src/pages/<kebab>/<kebab>-page.tsx` |

### Que NO genera (alcance explicito, no fabricado)

- **Swagger**: es una configuracion global de la app (`swagger.bootstrap.template.ts`), no algo por modulo. El controller generado ya trae los decoradores `@Api*` necesarios.
- **Electron**: `electron.main.template.ts` / `electron.preload.template.ts` son globales de la capa desktop, no por modulo.
- **Auditoria centralizada**: created_by/updated_by/deleted_at ya vienen en la Entity y la Migration. Un log de auditoria como tabla de eventos separada no tiene plantilla propia todavia en este framework — no se inventa aqui.
- **Permisos granulares**: el Controller ya exige autenticacion (`AuthGuard`). La verificacion de permisos por rol se cubre con `roles.checklist.md` / `permissions.checklist.md` (Fase 6), no con un guard autogenerado.

### Verificaciones internas del script

- Falla (exit 1) si falta alguna plantilla requerida, en vez de generar un archivo a medias.
- Despues de escribir cada archivo, lo vuelve a leer del disco y compara contra el contenido esperado (detecta truncamientos de escritura).
- Falla si queda algun `{{placeholder}}` sin resolver en el archivo final.

### Despues de generar

1. Ajustar los campos de dominio: la Entity/DTO/Migration generados traen solo `name` y `status` como campos de ejemplo — reemplazar por los campos reales del modulo.
2. Registrar el modulo (imports/providers en el modulo de Nest, ruta en el router del frontend).
3. Pasar `module.checklist.md` (Fase 6) antes de marcar el modulo como terminado.
