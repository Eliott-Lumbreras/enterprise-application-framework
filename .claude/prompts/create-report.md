# Prompt: create-report

## Se activa cuando el usuario escribe algo como

- "Necesito un reporte de {{tema}} por turno"
- "Crea un endpoint de KPIs de {{tema}}"
- "Quiero ver {{tema}} filtrado por fecha/turno"

## Que confirmar antes de generar (si no vino en el mensaje)

- Fuente de datos: tabla(s) o entidad(es) ya existentes que alimentan el reporte.
- Filtros requeridos (rango de fechas, turno, equipo, frente, etc.) y sus nombres de parametro reales.
- KPIs/agregaciones esperadas (suma, promedio, conteo, plan vs real). Ver `.claude/skills/mining.md` para el catalogo de KPIs mineros estandar (t/dia, m/dia, m/t, Cumpl%, Disp%, Util%, Prod/guardia, Inv dias).
- Si el resultado alimenta un dashboard (ver `create-dashboard.md`) o se consume directo (Excel/Power BI).

## Proceso

1. Aplicar `.claude/skills/sql.md`: filtros tempranos, sin SELECT *, indices verificados para las columnas de filtro.
2. Definir un DTO de query (no de escritura) con los filtros validados: fecha_inicio, fecha_fin, turno, y los especificos del dominio.
3. Implementar el endpoint como GET, paginado, reutilizando `controller.template.ts` y `service.template.ts` como base, mas una capa de agregacion (no CRUD).
4. Si el volumen de datos lo justifica, aplicar `.claude/skills/powerbi.md` para modelar la fuente como tabla de hechos + dimensiones en vez de una consulta ad-hoc.
5. Marcar explicitamente en la respuesta/documentacion cuando el reporte incluya datos de produccion, CFEM, reservas o ESG: requieren validacion humana antes de uso externo (politica de compliance de Aura Minerals).

## Checklist antes de entregar

- [ ] Filtros de fecha/turno validados y documentados (parametros reales, no adivinados).
- [ ] Consulta paginada, sin SELECT * y con indices verificados.
- [ ] KPIs calculados coinciden con las formulas estandar del skill de mineria.
- [ ] Swagger documentado (parametros de query, forma de la respuesta).
- [ ] Aviso de validacion humana si el reporte toca datos regulatorios/CFEM/ESG.
