# Checklists de calidad (Fase 6)

Gate de verificacion antes de dar por terminado cualquier modulo (ver `.claude/workflows/new-module.md` y `new-project.md`, paso final antes de entregar). Ningun modulo se marca como completo si falla alguno de estos 10 checklists.

| Checklist | Cubre |
|---|---|
| security.checklist.md | OWASP Top 10, secretos, Argon2, JWT, autorizacion |
| testing.checklist.md | Unit + integration, cobertura, casos borde |
| swagger.checklist.md | Documentacion OpenAPI de cada endpoint |
| logging.checklist.md | Logs estructurados, sin datos sensibles, health checks |
| audit.checklist.md | created_by/updated_by, soft delete, audit log de auth |
| performance.checklist.md | Paginacion, N+1, indices, cache |
| error-handling.checklist.md | Excepciones, codigos HTTP, rollback, resiliencia |
| validation.checklist.md | DTOs, whitelist, validacion de negocio |
| roles.checklist.md | Roles como datos, menor privilegio, auditoria de cambios |
| permissions.checklist.md | Permisos granulares, verificacion real en backend |

Ver `module.checklist.md` para el gate consolidado.
