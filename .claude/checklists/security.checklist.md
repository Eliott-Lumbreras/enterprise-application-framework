# Checklist: Seguridad

- [ ] Ningun secreto, API key, connection string o token hardcodeado en el codigo.
- [ ] Contrasenas hasheadas con Argon2 (nunca MD5/SHA1/texto plano).
- [ ] JWT con access token + refresh token, con expiracion y revocacion soportadas.
- [ ] Autorizacion (roles/permisos) verificada en cada endpoint, no solo autenticacion.
- [ ] Todo input validado server-side, sin confiar en validacion del cliente.
- [ ] Sin concatenacion de SQL con input del usuario (queries parametrizadas).
- [ ] Rate limiting en endpoints de autenticacion y publicos.
- [ ] OWASP Top 10 revisado para el modulo (injection, broken auth, XSS, control de acceso, etc.).
- [ ] Dependencias sin vulnerabilidades conocidas criticas/altas sin mitigar.
