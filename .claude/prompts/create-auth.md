# Prompt: create-auth

## Se activa cuando el usuario escribe algo como

- "Agrega login"
- "Necesito autenticacion con roles"
- "Protege esta API con usuarios y permisos"

## Que confirmar antes de generar (si no vino en el mensaje)

- Roles/permisos requeridos (ej. admin, supervisor, operador) y que puede hacer cada uno.
- Si ya existe un proveedor de identidad (SSO/Azure AD) o si el login es propio contra la base de datos.
- Politica de expiracion de sesion (duracion de access token y de refresh token).

## Proceso

1. Aplicar `.claude/skills/security.md` como base obligatoria: Argon2 para contrasenas, JWT con access + refresh token y rotacion/revocacion, rate limiting en `/login`.
2. Nunca implementar SSO/autenticacion corporativa sin escalar a Seguridad de la Informacion primero (fuera del alcance de este prompt: requiere aprobacion humana, ver limites de la organizacion).
3. Modelar roles/permisos como tablas propias (no hardcodear roles en el codigo) siguiendo `.claude/skills/database.md`.
4. Emitir audit log en cada login, logout, cambio de permisos y intento fallido (`.claude/skills/logging.md`).
5. El guard de autorizacion generado aqui es el que usan `create-module.md` y `create-api.md` en sus controllers.

## Checklist antes de entregar

- [ ] Contrasenas hasheadas con Argon2, nunca en texto plano ni logueadas.
- [ ] Access token + refresh token con expiracion y revocacion implementados.
- [ ] Roles/permisos en base de datos, no hardcodeados.
- [ ] Rate limiting en endpoints de autenticacion.
- [ ] Audit log de eventos de autenticacion, sin datos sensibles en texto plano.
- [ ] Ninguna integracion SSO/IdP corporativo sin aprobacion explicita de Seguridad.
