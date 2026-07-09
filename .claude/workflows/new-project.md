# Workflow: new-project

## Cuando se usa

El usuario pide arrancar una aplicacion nueva desde cero (ej. "crea un sistema de control de produccion minera"). Cadena completa, en orden, sin saltarse pasos:

Crear proyecto -> Crear base de datos -> Crear Backend -> Crear Frontend -> Crear Electron (si aplica) -> Crear Docker -> Crear Tests -> Crear Instalador (si aplica)

## Pasos

1. **Crear proyecto**: replicar la estructura de `Enterprise-App-Framework` (backend/frontend/desktop/mobile/database/docs/infrastructure/scripts/tests) y copiar `CLAUDE.md` como base. Confirmar con el usuario: nombre del proyecto, que capas aplican (web only, web+desktop, web+movil).
2. **Crear base de datos**: aplicar `.claude/skills/database.md`. Definir las entidades principales del dominio y generar sus migraciones con `migration.template.ts`.
3. **Crear Backend**: por cada entidad, ejecutar `create-module.md`. Si el proyecto expone las entidades como API publica, ejecutar tambien `create-api.md` (bootstrap, Swagger, guards).
4. **Crear Frontend**: ejecutar `create-dashboard.md` para las pantallas principales, aplicando `.claude/skills/frontend.md`.
5. **Crear Electron** (solo si el proyecto requiere app de escritorio): usar `electron.main.template.ts` / `electron.preload.template.ts` y `.claude/skills/electron.md`.
6. **Crear Docker**: usar `Dockerfile.template` y `.claude/skills/docker.md` para backend (y frontend si se sirve como contenedor separado).
7. **Crear Tests**: unit + integration por cada modulo (ya generados en el paso 3 via `create-module.md`); verificar cobertura >90% en logica de negocio segun `.claude/skills/testing.md`.
8. **Crear Instalador** (solo si hay Electron): aplicar `.claude/skills/installer.md`.

## Salida esperada

Un proyecto nuevo, corriendo localmente (`docker-compose up`), con al menos un modulo de dominio completo (entity a controller, con tests), documentado en su propio README, listo para pasar al workflow `release.md` cuando este listo para desplegarse.

## Checklist de cierre

- [ ] Ningun paso de la cadena se salto sin justificacion explicita (ej. "sin Electron porque es 100% web").
- [ ] Base de datos con migraciones versionadas, no cambios manuales al esquema.
- [ ] Al menos un modulo de dominio con CRUD completo y tests en verde.
- [ ] `docker-compose up` levanta el proyecto sin pasos manuales adicionales.
- [ ] README del proyecto nuevo generado/actualizado (`.claude/skills/documentation.md`).
