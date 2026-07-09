# Enterprise Application Framework (EAF)

Framework interno reutilizable para generar aplicaciones empresariales (web, escritorio con Electron, móvil, APIs) con arquitectura, seguridad y calidad consistentes desde el primer commit.

## Estado actual: Fase 1 — Cimientos

- [x] Estructura de carpetas base
- [x] `.claude/CLAUDE.md` (director técnico: misión, estándares, seguridad, base de datos, calidad, testing, deployment)
- [x] Primer skill: `.claude/skills/architecture.md`
- [ ] Fase 2 — Skills fundamentales (backend, frontend, base de datos, seguridad, logging, testing, docker, electron, powerbi, sql, mining, deployment, installer, documentation)
- [ ] Fase 3 — Plantillas (Controller, Service, Repository, DTO, Entity, Migration, Swagger, Tests, Dockerfile, Electron, React Page)
- [ ] Fase 4 — Prompts inteligentes (create-module, create-report, create-dashboard, create-api, create-auth)
- [ ] Fase 5 — Workflows encadenados (proyecto → BD → backend → frontend → Electron → Docker → tests → instalador)
- [ ] Fase 6 — Checklists de calidad (seguridad, pruebas, swagger, logs, auditoría, rendimiento, errores, validaciones, roles, permisos)
- [ ] Fase 7 — Knowledge base específico de Fast2Mine (equipos, operadores, frentes, producción, KPIs, turnos, etc.)
- [ ] Fase 8 — Generadores de módulos
- [ ] Fase 9 — Code Reviewer automático
- [ ] Fase 10 — AI Architect (checklist de diseño antes de generar código)

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
│   └── checklists/
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
