# Checklists de calidad (Fase 6 + Fase 10)

Dos gates distintos, no uno solo:

- **Entrada (Fase 10, antes de generar codigo)**: `design.checklist.md`. Se revisa antes de correr `generate-module.js`.
- **Salida (Fase 6, antes de entregar)**: los 10 checklists de abajo, consolidados en `module.checklist.md`. Ningun modulo se marca como completo si falla alguno.

| Checklist | Cubre |
|---|---|
| design.checklist.md | Diseno confirmado antes de generar codigo (Fase 10, gate de entrada) |
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

Ver `module.checklist.md` para el gate consolidado de salida.
