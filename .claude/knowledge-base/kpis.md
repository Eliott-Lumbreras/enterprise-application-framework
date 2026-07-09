# Catalogo de KPIs mineros

Mismo catalogo que `.claude/skills/mining.md`, presentado aqui como referencia de negocio (formulas), sin valores de benchmark inventados — los rangos "buenos/malos" dependen de cada operacion y no se asumen sin datos reales.

| KPI | Formula | Notas |
|---|---|---|
| t/dia | Toneladas producidas / dia calendario u operativo | Definir si se usa dia calendario o dia habil |
| m/dia | Metros de avance / dia | Aplica a desarrollo (rampa, galeria, subnivel, crucero) |
| m/t | Metros avanzados / toneladas producidas | Ratio de eficiencia desarrollo vs produccion |
| Cumpl % | Real / Plan x 100 | Requiere que exista un plan cargado para el mismo periodo |
| Disp % | Horas disponibles / horas calendario x 100 | Disponibilidad mecanica de equipos |
| Util % | Horas efectivas / horas disponibles x 100 | Utilizacion real del equipo disponible |
| Prod (t/guardia) | Toneladas / numero de guardias trabajadas | Productividad por turno/guardia |
| Inv (dias) | Inventario disponible / consumo diario promedio | Dias de inventario de un insumo/repuesto |

## Aplicado a Acarreo (confirmado)

- Tonelaje total = SUM(calculated_mass)
- Tonelaje promedio/viaje = AVG(calculated_mass)
- N. de viajes = COUNT(*)

Estos tres ya estan implementados en `app-turno-movil`. El resto de KPIs de esta tabla aplican a los reportes aun pendientes de mapear (ver `entities.md`).
