# Enterprise Application Framework (EAF)

Framework interno reutilizable para generar aplicaciones empresariales (web, escritorio con Electron, móvil, APIs) con arquitectura, seguridad y calidad consistentes desde el primer commit.

## Estado actual: Fase 8 — Generadores de módulos

- [x] Estructura de carpetas base
- [x] `.claude/CLAUDE.md` (director técnico: misión, estándares, seguridad, base de datos, calidad, testing, deployment)
- [x] Fase 2 — 15 skills en `.claude/skills/`: architecture, backend, frontend, database, security, logging, testing, docker, electron, powerbi, sql, mining, deployment, installer, documentation
- [x] Fase 3 — 12 plantillas en `.claude/templates/`: entity, dto, repository, service, controller, migration, swagger bootstrap, unit test, integration test, Dockerfile, Electron (main+preload), React page
- [x] Fase 4 — 5 prompts en `.claude/prompts/`: create-module, create-report, create-dashboard, create-api, create-auth
- [x] Fase 5 — 4 workflows en `.claude/workflows/`: new-project, new-module, new-reporting-feature, release
- [x] Fase 6 — 10 checklists + gate maestro en `.claude/checklists/`: seguridad, pruebas, swagger, logs, auditoría, rendimiento, errores, validaciones, roles, permisos
- [x] Fase 7 — Knowledge base en `.claude/knowledge-base/`: glosario, entidades confirmadas/pendientes, KPIs, turnos, fuentes de datos
- [x] Fase 8 — Generadores de módulos: `scripts/generate-module.js` (Entity, DTO, Repository, Service, Controller, Migration, Unit test, Integration test, página Frontend a partir de un solo nombre de entidad)
- [ ] Fase 9 — Code Reviewer automático
- [ ] Fase 10 — AI Architect (checklist de diseño antes de generar código)

## Skills (Fase 2)

| Skill | Rol |
|---|---|
| architecture.md | Senior Software Architect (Clean Architecture, SOLID, DDD) |
| backend.md | Senior Backend Engineer (Clean Architecture, Repository Pattern, DI) |
| frontend.md | Senior Frontend Engineer (responsive, dark mode, accesibilidad) |
| database.md | Senior Database Engineer (PostgreSQL, migraciones, índices) |
| security.md | Application Security Engineer (OWASP Top 10, Argon2, JWT) |
| logging.md | Observability Engineer (logs estructurados, auditoría) |
| testing.md | QA Engineer (unit + integration, cobertura >90%) |
| docker.md | DevOps Engineer (Dockerfile multi-stage, compose) |
| electron.md | Desktop Engineer (Electron, IPC seguro, auto-update) |
| powerbi.md | Power BI / Analytics Engineer (modelo estrella, DAX, M) |
| sql.md | SQL Engineer (consultas eficientes, índices, paginación) |
| mining.md | Mining Operations Domain Expert (KPIs, turnos, compliance) |
| deployment.md | Release Engineer (CI/CD, rollback, ambientes) |
| installer.md | Packaging Engineer (instaladores por SO) |
| documentation.md | Technical Writer (README, Swagger, ADRs) |

## Generadores (Fase 8)

`scripts/generate-module.js` toma un nombre de entidad y genera el módulo completo reutilizando las plantillas de la Fase 3 (sin duplicar sus reglas):

```bash
node scripts/generate-module.js Equipment
node scripts/generate-module.js work-order --plural=work-orders
```

| Genera | No genera (alcance explícito) |
|---|---|
| Entity, DTO, Repository, Service, Controller | Swagger bootstrap (es global, no por módulo) |
| Migration (con timestamp real, no placeholder) | Electron main/preload (globales de la app desktop) |
| Unit test + Integration test | Log de auditoría centralizado (no hay plantilla validada aún) |
| Página Frontend básica | Guard de permisos granulares por rol (ver checklists de Fase 6) |

Cada archivo generado se vuelve a leer del disco para confirmar que no quedó truncado ni con placeholders sin resolver; si falta una plantilla o algo no cuadra, el script falla en vez de generar algo a medias. Detalle completo en `scripts/README.md`.

## Knowledge base Fast2Mine (Fase 7)

| Archivo | Contenido |
|---|---|
| glossary.md | Terminología minera, distinguiendo confirmado vs pendiente |
| entities.md | Reportes/entidades: Acarreo confirmado, 6 endpoints pendientes de mapeo |
| kpis.md | Catálogo de KPIs mineros estándar y sus fórmulas |
| shift-structure.md | Estructura de turno y lógica de períodos (Día/Semana/Mes) |
| data-sources.md | Contrato confirmado de la API de MiningControl |

Regla estricta de esta carpeta: nada marcado "pendiente" se trata como dato real hasta confirmarlo. Ver `.claude/knowledge-base/README.md`.

## Checklists de calidad (Fase 6)

| Checklist | Cubre |
|---|---|
| security.checklist.md | OWASP Top 10, secretos, Argon2, JWT, autorización |
| testing.checklist.md | Unit + integration, cobertura, casos borde |
| swagger.checklist.md | Documentación OpenAPI de cada endpoint |
| logging.checklist.md | Logs estructurados, sin datos sensibles, health checks |
| audit.checklist.md | created_by/updated_by, soft delete, audit log de auth |
| performance.checklist.md | Paginación, N+1, índices, cache |
| error-handling.checklist.md | Excepciones, códigos HTTP, rollback, resiliencia |
| validation.checklist.md | DTOs, whitelist, validación de negocio |
| roles.checklist.md | Roles como datos, menor privilegio, auditoría de cambios |
| permissions.checklist.md | Permisos granulares, verificación real en backend |

`module.checklist.md` es el gate consolidado: ningún módulo se marca terminado si falla alguno de los 10.

## Workflows (Fase 5)

| Workflow | Cuando se usa |
|---|---|
| new-project.md | Proyecto -> BD -> Backend -> Frontend -> Electron -> Docker -> Tests -> Instalador |
| new-module.md | Agregar un modulo CRUD a un proyecto existente |
| new-reporting-feature.md | Reporte + dashboard de punta a punta |
| release.md | Pasar de homologacion a produccion con rollback documentado |

Cada workflow encadena los prompts (Fase 4) y skills (Fase 2) correspondientes, en el orden en que deben ejecutarse.

## Prompts (Fase 4)

| Prompt | Se activa con |
|---|---|
| create-module.md | "Genera un modulo de X", "Crea el CRUD de X" |
| create-report.md | "Necesito un reporte de X por turno", "Crea un endpoint de KPIs" |
| create-dashboard.md | "Arma un dashboard de X", "Crea la pantalla de resumen" |
| create-api.md | "Expon esto como API", "Crea el servicio backend para X" |
| create-auth.md | "Agrega login", "Necesito autenticacion con roles" |

Cada prompt referencia los skills (Fase 2) y plantillas (Fase 3) correspondientes; no duplica sus reglas.

## Plantillas (Fase 3)

| Plantilla | Contenido |
|---|---|
| entity.template.ts | Entidad con columnas de auditoría obligatorias |
| dto.template.ts | Create/Update DTO con class-validator |
| repository.template.ts | Repository Pattern (único punto de acceso a datos) |
| service.template.ts | Lógica de negocio, transacciones, logging, errores |
| controller.template.ts | Endpoints REST + Swagger + guard de autenticación |
| migration.template.ts | Migración reversible con índices/constraints |
| swagger.bootstrap.template.ts | Configuración global de validación + Swagger |
| unit-test.template.spec.ts | Test unitario del Service con mocks |
| integration-test.template.spec.ts | Test e2e del Controller contra BD de prueba |
| Dockerfile.template | Build multi-stage, usuario no root, HEALTHCHECK |
| electron.main.template.ts / electron.preload.template.ts | Proceso principal + preload con contextIsolation |
| react-page.template.tsx | Página con loading/empty/error states y confirmación de borrado |

Convención de stack y placeholders documentada en `.claude/templates/README.md`.

## Estructura

```
Enterprise-App-Framework/
├── .claude/
│   ├── CLAUDE.md
│   ├── settings.json
│   ├── skills/
│   ├── templates/
│   ├── prompts/
│   ├── workflows/
│   ├── checklists/
│   └── knowledge-base/
├── backend/
├── frontend/
├── desktop/
├── mobile/
├── database/
├── docs/
├── infrastructure/
├── scripts/
├── tests/
├── package.json
├── README.md
└── .gitignore
```

## Nota

Este repositorio es independiente del proyecto "Conexiones Api" (app de turno de Aura Minerals). Es una herramienta/estándar de desarrollo de uso general, no específica de una sola aplicación.
