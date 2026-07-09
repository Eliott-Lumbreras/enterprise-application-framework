# Checklist: Logs

- [ ] Logging estructurado (JSON) con id de correlacion/request propagado.
- [ ] Nivel de log correcto: error solo para fallos reales, no para validaciones de negocio esperadas.
- [ ] Ningun log contiene secretos, contrasenas, tokens completos o PII sin enmascarar.
- [ ] Cada fallo logueado incluye contexto suficiente para reproducirlo (operacion, id de entidad, usuario, timestamp).
- [ ] Endpoints `/health` y `/ready` responden con el estado real de las dependencias (BD, cache, APIs externas).
