# Estructura de turno y periodos

## Turno (columna `turn`, confirmado en transport_report)

Valor de turno por registro: dia/noche (valores exactos posibles, ej. "dia"/"noche" o "D"/"N", pendientes de confirmar con datos reales — no se ha visto el valor exacto que devuelve la API todavia).

## Filtro de periodo (implementado en app-turno-movil)

La app no filtra por turno dia/noche en la UI actualmente; filtra por rango de fecha calculado a partir de tres botones:

- **Dia**: fecha de hoy (inicio = fin = hoy).
- **Semana**: ultimos 7 dias (inicio = hoy - 6, fin = hoy).
- **Mes**: del dia 1 del mes actual a hoy.

Estos rangos se envian como `fecha_inicio`/`fecha_fin` (nombres de parametro asumidos, configurables en la pantalla de Configuracion de la app sin tocar codigo). Ver `data-sources.md` para el estado de confirmacion de estos nombres de parametro.

## Pendiente

- Confirmar si la API espera un filtro adicional de turno (dia/noche) por separado del rango de fechas.
- Confirmar si "dia habil" excluye domingos/feriados para KPIs tipo t/dia o Cumpl%.
