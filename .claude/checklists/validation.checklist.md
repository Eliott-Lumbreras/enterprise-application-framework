# Checklist: Validaciones

- [ ] Cada campo de entrada tiene una regla de validacion explicita (tipo, longitud, formato, requerido/opcional).
- [ ] Los DTOs rechazan campos no esperados (`whitelist`/`forbidNonWhitelisted`), no los ignoran silenciosamente.
- [ ] Validaciones de negocio (no solo de forma) se verifican en el Service, no solo en el DTO.
- [ ] Los mensajes de validacion son claros y en el idioma del usuario final.
- [ ] Los filtros de reportes (fecha, turno, etc.) se validan antes de construir la consulta.
