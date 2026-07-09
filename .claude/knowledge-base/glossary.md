# Glosario minero (Fast2Mine / Aura Turno)

## Terminos confirmados (usados como botones/reportes reales en la app Aura Turno)

- **Acarreo**: transporte de mineral/esteril desde el frente hasta su destino (planta, botadero, relleno). Confirmado como `api/v1/transport_report`.
- **Turno**: periodo de trabajo (dia/noche). Columna confirmada `turn` en transport_report.
- **Scoop**: equipo de carguio subterraneo (cargador LHD). Confirmado como columna `load_equipment`.
- **Camion**: equipo de acarreo. Confirmado como columna `equipment`.
- **Material**: tipo de material transportado (ej. mineral, esteril). Confirmado como columna `material`.
- **Tonelaje**: masa transportada, calculada. Confirmado como columna `calculated_mass`.
- **Empresa/Operator group**: contratista u operador responsable del equipo/turno. Confirmado como columna `operator_group`.

## Terminos pendientes de confirmar (hipotesis por terminologia estandar, NO verificados)

- **Trompos**: termino usado como boton en el dashboard; en algunas operaciones se refiere a un tipo de equipo o maniobra de carguio/giro. Pendiente confirmar a que endpoint/reporte corresponde.
- **Relleno**: relleno de labores explotadas (relleno hidraulico, en pasta o detritico). Pendiente confirmar endpoint y columnas.
- **Obras**: normalmente se refiere a infraestructura/obras civiles de la mina (ventilacion, drenaje, sostenimiento). Posible candidato: `api/v1/infrastructure_report` (no confirmado).
- **Equipos**: vista general de equipos moviles (disponibilidad/utilizacion). Posible candidato: `api/v1/underground_operation_report` o `api/v1/telemetry_report` (no confirmado).
- **COM**: en la industria suele referirse a "Centro de Operaciones Mineras" (sala de monitoreo en tiempo real). No confirmado si aplica a este proyecto o es otro concepto.
- **Frente / labor**: punto de trabajo activo dentro de la mina (tajeo, desarrollo, preparacion).
- **Tajeo**: labor de explotacion donde se extrae el mineral.
- **Subnivel / crucero / galeria / rampa**: tipos de labores de desarrollo/acceso subterraneo.
- **Perforacion y voladura**: ciclo de minado para fragmentar roca antes del carguio. Candidato: `api/v1/perforator_report` (confirmado como endpoint, columnas pendientes).
- **Sostenimiento**: refuerzo estructural de una labor (pernos, malla, shotcrete).
- **Ventilacion / drenaje**: sistemas de infraestructura de mina subterranea.

## Endpoints de la API confirmados (ver `data-sources.md` para el detalle completo)

`api/v1/transport_report` (Acarreo, mapeado), `api/v1/perforator_report`, `api/v1/code_report`, `api/v1/infrastructure_report`, `api/v1/underground_operation_report`, `api/v1/load_report`, `api/v1/telemetry_report` (estos 6 ultimos confirmados solo como ruta, columnas pendientes).
