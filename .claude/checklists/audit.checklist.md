# Checklist: Auditoria

- [ ] Cada create/update/delete registra quien lo hizo (`created_by`/`updated_by`) y cuando (`created_at`/`updated_at`).
- [ ] Los deletes son soft-delete (`deleted_at`), nunca borrado fisico de datos operativos.
- [ ] Eventos de autenticacion (login, logout, fallos, cambio de permisos) quedan en un audit log separado del log de aplicacion.
- [ ] El audit log no se puede modificar desde la aplicacion (solo insercion).
- [ ] Si el modulo toca datos de produccion, CFEM, reservas o ESG, queda marcado que requiere validacion humana antes de uso externo/regulatorio.
