# Plantillas (Fase 3)

Convención de stack: Node.js + TypeScript Strict + NestJS-style (decoradores, Dependency Injection nativa, Swagger integrado), Clean Architecture y Repository Pattern, sobre PostgreSQL. Se eligió este estilo porque cubre de forma nativa varios requisitos de `CLAUDE.md` (DI, validación por decoradores, Swagger). Si un proyecto concreto usa otro framework, adaptar manteniendo las mismas capas y responsabilidades.

## Convención de placeholders

| Placeholder | Ejemplo | Uso |
|---|---|---|
| `{{PascalCase}}` | `Equipment` | Nombre de clase/entidad |
| `{{camelCase}}` | `equipment` | Nombre de variable/propiedad |
| `{{kebab-case}}` | `equipment` | Rutas, nombres de archivo |
| `{{snake_case}}` | `equipment` | Nombre de tabla/columna en PostgreSQL |
| `{{PLURAL_kebab-case}}` | `equipments` | Rutas de colección |

## Archivos

- `entity.template.ts` — entidad de dominio con columnas de auditoría obligatorias.
- `dto.template.ts` — Create/Update DTO con validación (class-validator).
- `repository.template.ts` — Repository Pattern sobre el entity.
- `service.template.ts` — lógica de negocio, transacciones, logging, errores explícitos.
- `controller.template.ts` — endpoints REST + Swagger + validación de entrada.
- `migration.template.ts` — migración reversible (up/down) con índices/constraints.
- `swagger.bootstrap.template.ts` — configuración de Swagger/OpenAPI en el arranque de la app.
- `unit-test.template.spec.ts` — test unitario del Service con dependencias mockeadas.
- `integration-test.template.spec.ts` — test de integración del Controller contra base de datos de prueba.
- `Dockerfile.template` — build multi-stage, usuario no root, HEALTHCHECK.
- `electron.main.template.ts` / `electron.preload.template.ts` — proceso principal y preload con contextIsolation.
- `react-page.template.tsx` — página React con loading/empty/error states y Dark Mode.
- `design-doc.template.md` — design doc de pre-generación (Fase 10): entidad y campos, reglas de negocio, roles/permisos, requisitos no funcionales, fuente de datos, clasificación de compliance, fuera de alcance. Se llena ANTES de generar código, no después.

Cada plantilla es un punto de partida completo (sin TODOs), no un esqueleto vacío. Se adapta reemplazando los placeholders, nunca copiando código incompleto.
