# Generadores, revisión y gate de diseño (Fases 8-10)

## check-design.js (Fase 10) — AI Architect / gate de diseño

Se corre ANTES que todo lo demás en esta carpeta: valida que el design doc
de un módulo (`.claude/templates/design-doc.template.md` llenado, normalmente
en `docs/design/<kebab>.design.md`) tenga sus 7 secciones obligatorias
respondidas de verdad, no dejadas igual que la plantilla.

### Uso

```bash
node scripts/check-design.js <NombreModuloKebabCase> [--root=<ruta>]
node scripts/check-design.js --file=<ruta-al-design-doc> [--template=<ruta>]
```

Ejemplos:

```bash
node scripts/check-design.js equipment
node scripts/check-design.js --file=docs/design/equipment.design.md
```

Código de salida: `1` si alguna sección obligatoria falta o quedó idéntica a
la plantilla; `0` si las 7 fueron modificadas.

### Cómo detecta "no llenado"

Compara, sección por sección, el cuerpo del documento del usuario contra el
cuerpo de la misma sección en la plantilla canónica
(`.claude/templates/design-doc.template.md`), ignorando espacios. Si son
iguales, la sección no se tocó. Se eligió esta comparación en vez de una
heurística de longitud de texto porque el placeholder de la plantilla va
acompañado de texto instructivo largo — una regla de "muy corto = vacío"
daba falsos negativos.

### Las 7 secciones obligatorias

Entidad y campos, Reglas de negocio, Roles y permisos, Requisitos no
funcionales, Fuente de datos, Clasificación de datos y compliance, Fuera de
alcance. Ver `.claude/checklists/design.checklist.md` para el detalle de qué
debe contener cada una y `.claude/skills/ai-architect.md` para el rol que
las completa.

### Qué NO verifica

Que las respuestas sean correctas — solo que existen y son propias del
usuario. La correctitud sigue siendo criterio del AI Architect / de quien
revisa. Tampoco reemplaza `review-module.js` (Fase 9, revisa código ya
generado) ni `module.checklist.md` (Fase 6, gate de salida).

### Verificado con casos de prueba

Se probó con un design doc recién copiado de la plantilla sin llenar (falla
las 7 secciones), uno completamente llenado con respuestas reales incluyendo
un "Pendiente de confirmar" explícito en Fuente de datos (pasa limpio), y uno
con 6 secciones llenas y 1 revertida a placeholder (falla solo esa,
identificándola por nombre).

## generate-module.js (Fase 8)

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

### Antes y después de generar

0. Antes: pasar `check-design.js` (Fase 10) para el mismo módulo.
1. Ajustar los campos de dominio: la Entity/DTO/Migration generados traen solo `name` y `status` como campos de ejemplo — reemplazar por los campos reales confirmados en el design doc.
2. Registrar el modulo (imports/providers en el modulo de Nest, ruta en el router del frontend).
3. Correr `review-module.js` (ver abajo).
4. Pasar `module.checklist.md` (Fase 6) antes de marcar el modulo como terminado.

## review-module.js (Fase 9) — Code Reviewer automatico

Revisa codigo (tipicamente el que acaba de salir de `generate-module.js`, o
cualquier `.ts`/`.tsx` del proyecto) contra reglas deterministas derivadas de
`.claude/CLAUDE.md` y los 10 checklists de `.claude/checklists/`.

**Importante — que es y que no es**: automatiza solo la parte de cada
checklist que se puede verificar por texto (regex/estructura). No reemplaza
`module.checklist.md`: criterios como "rate limiting configurado", "revision
OWASP completa" o "N+1 reales bajo carga" requieren criterio humano y el
script no finge verificarlos.

### Uso

```bash
# Revisar un modulo generado por generate-module.js (busca en backend/, tests/,
# database/migrations/ y frontend/ usando el nombre en kebab-case)
node scripts/review-module.js <nombre-modulo-kebab> [--root=<ruta>]

# Revisar un archivo o carpeta arbitraria (sin las reglas de "modulo completo"
# como existencia de tests/migracion)
node scripts/review-module.js --path=<archivo-o-carpeta> [--root=<ruta>]
```

Ejemplos:

```bash
node scripts/review-module.js equipment
node scripts/review-module.js --path=backend/src/modules/equipment/equipment.service.ts
```

Codigo de salida: `1` si hay al menos un hallazgo BLOQUEANTE (util para engancharlo
a CI); `0` si solo hay advertencias/informativos o todo paso.

### Reglas a nivel de archivo (aplican segun el tipo de archivo)

| Regla | Checklist | Severidad |
|---|---|---|
| `core.no-todo` | CLAUDE.md — nunca dejar TODOs | Bloqueante |
| `security.no-hardcoded-secrets` (no aplica a `*.spec.ts`/`*.e2e-spec.ts`) | security.checklist.md | Bloqueante |
| `security.no-sql-concat` | security.checklist.md | Bloqueante |
| `error-handling.no-empty-catch` | error-handling.checklist.md | Bloqueante |
| `validation.dto-has-decorators` (solo `*.dto.ts`) | validation.checklist.md | Bloqueante |
| `roles.controller-has-guard` (solo `*.controller.ts`) | roles.checklist.md / permissions.checklist.md | Bloqueante |
| `swagger.operation-balance` (solo `*.controller.ts`) | swagger.checklist.md | Bloqueante |
| `audit.entity-columns` (solo `*.entity.ts`) | audit.checklist.md | Bloqueante |
| `audit.migration-columns` (solo migraciones) | audit.checklist.md | Bloqueante |
| `logging.no-console` (solo `backend/src` y `frontend/src`) | logging.checklist.md | Advertencia |
| `performance.list-pagination` (solo `*.repository.ts`) | performance.checklist.md | Advertencia |

### Reglas a nivel de modulo (solo en modo `<nombre-modulo>`, no en `--path`)

| Regla | Checklist | Severidad |
|---|---|---|
| `testing.unit-test-exists` | testing.checklist.md | Bloqueante |
| `testing.integration-test-exists` | testing.checklist.md | Bloqueante |
| `database.migration-exists` | CLAUDE.md (Database: migraciones siempre) | Bloqueante |
| `frontend.page-exists` | informativo — no todo modulo necesita UI | Informativo |

### Que NO cubre (para no fabricar falsa confianza)

- No detecta N+1 reales (requiere observar consultas en ejecucion, no texto estatico).
- No verifica rate limiting, revision OWASP completa, ni vulnerabilidades de dependencias.
- No mide cobertura de tests real (`>90%"` de `testing.checklist.md`) — solo confirma que los archivos de test existen.
- No verifica que Swagger (`/docs`) realmente levante sin errores en runtime.
- `security.no-hardcoded-secrets` no revisa archivos `*.spec.ts`/`*.e2e-spec.ts`: montar un token/credencial FALSA para un doble de prueba es practica estandar (el propio `integration-test.template.spec.ts` usa `authToken = 'test-jwt-token'`). Un secreto real jamas deberia estar en un test contra un sistema real, pero eso queda en manos del criterio humano de `security.checklist.md`.

### Verificado con casos de prueba

Se probo generando un modulo limpio (`generate-module.js Equipment`) — el reviewer
no reporta hallazgos — y luego inyectando a proposito un TODO, un secreto
hardcodeado, un `console.error`, un catch vacio, concatenacion SQL insegura, un
DTO sin decoradores, un controller sin `@UseGuards`, una columna de auditoria
faltante y un test eliminado: el reviewer detecto los 9 casos correctamente y
devolvio exit code 1.

Auditoria de punta a punta (Fase 10 -> 8 -> 9 encadenadas sobre un modulo
`WorkOrder` generado de cero): encontro un falso positivo real — el propio
`integration-test.template.spec.ts` del framework (`authToken =
'test-jwt-token'`) disparaba `security.no-hardcoded-secrets`, lo que habria
bloqueado a TODO modulo generado por su propio test de integracion. Corregido
excluyendo `*.spec.ts`/`*.e2e-spec.ts` de esa regla especifica (ver tabla de
arriba). Re-verificado que un secreto real fuera de un archivo de test se
sigue detectando igual.

## Orden completo, de punta a punta

```
check-design.js  ->  generate-module.js  ->  review-module.js  ->  module.checklist.md
  (Fase 10)            (Fase 8)              (Fase 9)              (Fase 6, humano)
```
