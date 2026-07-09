# Prompt: create-api

## Se activa cuando el usuario escribe algo como

- "Expon esto como API"
- "Crea el servicio backend para {{tema}}"
- "Necesito una API REST para {{tema}}"

## Que confirmar antes de generar (si no vino en el mensaje)

- Consumidores de la API: app web, movil, Electron, Power BI, u otro sistema (SAP, PI System).
- Si va a integrar con un sistema critico: confirmar que primero se apunta a un ambiente de desarrollo/homologacion (nunca directo a produccion).
- Requisitos de autenticacion (ver `create-auth.md` si aun no existe login).

## Proceso

1. Bootstrap de la aplicacion usando `swagger.bootstrap.template.ts`: ValidationPipe global, Swagger en `/docs`, shutdown hooks.
2. Cada recurso expuesto sigue `create-module.md` (entity, dto, repository, service, controller) o `create-report.md` si es de solo lectura/agregacion.
3. Aplicar `.claude/skills/security.md` a todo el API: guard de autenticacion, autorizacion por rol, rate limiting en endpoints publicos.
4. Aplicar `.claude/skills/logging.md`: logs estructurados con id de correlacion, endpoint `/health` y `/ready`.
5. Empaquetar con `Dockerfile.template` y aplicar `.claude/skills/docker.md` (multi-stage, usuario no root, HEALTHCHECK).
6. Aplicar `.claude/skills/deployment.md` para el pipeline: dev/homologacion antes que produccion, variables de entorno por ambiente, plan de rollback documentado.

## Checklist antes de entregar

- [ ] Swagger disponible y completo para cada endpoint nuevo.
- [ ] Autenticacion y autorizacion aplicadas a todos los endpoints (salvo los explicitamente publicos, justificados).
- [ ] Health/readiness checks implementados.
- [ ] Dockerfile multi-stage, sin secretos hardcodeados, corre como usuario no root.
- [ ] Pipeline definido con paso de dev/homologacion antes de produccion.
