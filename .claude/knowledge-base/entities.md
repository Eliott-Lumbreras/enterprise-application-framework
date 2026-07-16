# Entidades / reportes de datos

Fuente real: app "Aura Turno" (`mobile/app-turno-movil/`, dentro de este mismo repo), API `aura-aranzazu-dataapi.miningcontrol.cloud`. Design doc: `docs/design/app-turno-movil.design.md`.

## Confirmado: Acarreo (transport_report)

Boton del dashboard: ACARREO. Endpoint: `api/v1/transport_report`.

| Campo API | Significado | Columna en pantalla |
|---|---|---|
| production_date | Fecha de produccion (solo fecha, sin hora) | Fecha |
| turn | Turno. Valor real confirmado en datos: "Turno 2" (texto completo, no "T1"/"T2" como abrevia el reporte Power BI existente) | Turno |
| operator_group | Empresa/contratista operador | Empresa |
| equipment | Camion de acarreo | Camion |
| load_equipment | Scoop/cargador | Scoop |
| origin_subarea | Lugar/subarea de origen del material (confirmado 2026-07-15) | Lugar |
| material | Tipo de material | Material |
| calculated_mass | Tonelaje calculado | Tonelaje |

KPIs ya implementados: Tonelaje total, Tonelaje promedio por viaje, N. de viajes (ver `mobile/app-turno-movil/app.js`, `REPORT_DEFS.transport_report`).

## Pendientes de confirmar

Estos endpoints ya se confirmaron como rutas validas de la API, pero sus columnas reales (nombres de campo) todavia no se han verificado con datos de respuesta reales. No usar nombres de columna inventados para ellos:

- `api/v1/perforator_report` (candidato para el boton "TROMPOS" o para un futuro reporte de Perforacion — no asumir)
- `api/v1/code_report` (probablemente codigos de demora/parada, ver mining.md skill)
- `api/v1/infrastructure_report` (candidato para el boton "OBRAS")
- `api/v1/underground_operation_report` (candidato para el boton "EQUIPOS")
- `api/v1/load_report` (Carguio; candidato para un boton futuro, quiza relacionado con "RELLENO" si el relleno se registra como parte del ciclo de carguio)
- `api/v1/telemetry_report` (telemetria de equipos: velocidad, combustible, alarmas — estructura no confirmada)

## Pendiente: API de plan/metas

El usuario va a integrar una API separada de "plan" (metas de tonelaje por
turno/hora) para poder calcular cumplimiento — no confirmado todavia, no
inventar valores de meta mientras tanto. Existe un reporte Power BI de
referencia ("Reporte de Acarreo de Mineral - Mina Aranzazu") que muestra el
tipo de metricas esperadas (Plan Turno, Plan a la hora, % Cumpl, Proyeccion
Turno) una vez que esa API este disponible.

## Como pasar un endpoint de "pendiente" a "confirmado"

1. El usuario prueba el endpoint real (con el token) y comparte la respuesta o los nombres de columna.
2. Se actualiza este archivo moviendo el endpoint a la seccion "Confirmado" con su tabla de columnas.
3. Se actualiza `REPORT_DEFS` en `mobile/app-turno-movil/app.js` (dentro de este repo) con el mapeo real, siguiendo el mismo patron que Acarreo.
4. Se actualizan los KPIs del boton correspondiente contra el catalogo de `.claude/knowledge-base/kpis.md`.
