# Checklist: Permisos

- [ ] Los permisos son granulares por accion (crear, leer, actualizar, eliminar) y por recurso, no un unico permiso "todo o nada".
- [ ] El guard de autorizacion verifica permiso real en cada request, no solo la presencia de un token valido.
- [ ] Los permisos por defecto de un usuario nuevo son los minimos necesarios (principio de menor privilegio).
- [ ] Cambios de permisos requieren un rol con privilegio suficiente y quedan auditados.
- [ ] Los permisos se revisan tambien en el frontend para ocultar acciones no autorizadas (sin depender solo de eso: la verificacion real es del backend).
