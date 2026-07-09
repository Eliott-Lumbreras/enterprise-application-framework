# Checklist: Manejo de errores

- [ ] Ninguna excepcion se atrapa y se descarta en silencio (todo catch hace algo: loguea, transforma, relanza).
- [ ] Mensajes de error significativos para quien los lee (usuario final vs logs internos, sin exponer detalles sensibles al usuario).
- [ ] Errores de negocio devuelven codigos HTTP correctos (400 validacion, 401 no autenticado, 403 no autorizado, 404 no encontrado, 409 conflicto).
- [ ] Transacciones multi-paso hacen rollback completo ante cualquier fallo intermedio.
- [ ] Fallas de dependencias externas (BD, API de terceros) no tumban toda la aplicacion, se manejan con timeout/reintento/circuit breaker segun el caso.
