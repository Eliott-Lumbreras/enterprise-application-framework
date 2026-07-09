# Prompts inteligentes (Fase 4)

Cada archivo describe cuándo activarse, qué información confirmar antes de generar código, qué archivos produce (usando los templates de `.claude/templates/` y las reglas de los skills en `.claude/skills/`), y un checklist de salida basado en `CLAUDE.md`.

Estos prompts no reemplazan a los skills: los skills definen *cómo* debe ser el código (estándares), los prompts definen *qué secuencia de archivos* generar para una solicitud típica del usuario.

| Prompt | Se activa con frases como |
|---|---|
| create-module.md | "Genera un módulo de Equipos", "Crea el CRUD de Operadores" |
| create-report.md | "Necesito un reporte de acarreo por turno", "Crea un endpoint de KPIs de producción" |
| create-dashboard.md | "Arma un dashboard de disponibilidad de equipos", "Crea la pantalla de resumen de turno" |
| create-api.md | "Expón esto como API", "Crea el servicio backend para X" |
| create-auth.md | "Agrega login", "Necesito autenticación con roles" |
