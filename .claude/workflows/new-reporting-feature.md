# Workflow: new-reporting-feature

## Cuando se usa

Se pide un reporte o indicador nuevo con su visualizacion (ej. "quiero ver el cumplimiento de acarreo por turno").

## Pasos

1. Ejecutar `create-report.md`: define filtros, fuente de datos y KPIs (validar formulas contra `.claude/skills/mining.md` si es un KPI minero estandar).
2. Ejecutar `create-dashboard.md` usando el endpoint del paso 1 como fuente. Maximo 5 visualizaciones.
3. Si el reporte toca datos de produccion, CFEM, reservas o ESG, marcar explicitamente que requiere validacion humana antes de uso externo o regulatorio (politica de compliance de Aura Minerals, ver `.claude/skills/mining.md`).
4. Si el volumen o la complejidad del reporte lo amerita (muchas dimensiones, uso repetido desde Power BI), evaluar migrar el modelo a `.claude/skills/powerbi.md` (modelo estrella) en vez de mantenerlo solo como endpoint REST.

## Salida esperada

Un endpoint de reporte documentado en Swagger, mas una pantalla/dashboard que lo consume, con los KPIs correctamente etiquetados y el aviso de compliance cuando aplique.

## Checklist de cierre

- [ ] Endpoint de reporte paginado, con filtros validados y documentados.
- [ ] Dashboard con maximo 5 visualizaciones, todas justificadas.
- [ ] KPIs con formula verificada contra el catalogo estandar de mineria (si aplica).
- [ ] Aviso de validacion humana agregado si el dato es de produccion/CFEM/ESG.
