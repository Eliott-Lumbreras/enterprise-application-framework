# Checklist: Roles

- [ ] Los roles existen como datos (tabla), no hardcodeados en el codigo como strings sueltos repetidos.
- [ ] Cada endpoint declara explicitamente que rol(es) puede acceder.
- [ ] Existe un rol por defecto de menor privilegio; nada queda accesible "por accidente" a todos los roles.
- [ ] Cambios de rol de un usuario quedan registrados en el audit log.
- [ ] La asignacion de roles no puede hacerla el propio usuario sobre si mismo sin autorizacion de un rol superior.
