# Checklist: Swagger / OpenAPI

- [ ] Cada endpoint nuevo tiene `@ApiOperation` con un resumen claro.
- [ ] Cada respuesta relevante (200, 201, 400, 401, 404, etc.) documentada con `@ApiResponse`.
- [ ] DTOs de entrada y salida visibles en el schema (sin campos ocultos que el cliente necesite).
- [ ] Requisito de autenticacion marcado (`@ApiBearerAuth`) cuando aplique.
- [ ] `/docs` se genera sin errores y refleja el estado real de la API (no rutas fantasma ni desactualizadas).
