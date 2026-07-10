# Design doc: AppTurnoMovil

Nota: este documento se llenó de forma retroactiva. La app ya existía
(construida antes de que el EAF tuviera su gate de diseño de Fase 10); se
documenta aquí para que quede bajo las mismas reglas que cualquier módulo
nuevo, e integrada con `.claude/knowledge-base/`.

## Entidad y campos

No es una entidad de base de datos propia (la app no tiene backend de datos
propio, solo un proxy CORS hacia una API externa). El "dato" central es un
reporte de turno minero por endpoint:

- **Acarreo (transport_report)** — confirmado: production_date, turn,
  operator_group, equipment, load_equipment, material, calculated_mass (ver
  `.claude/knowledge-base/entities.md`).
- Otros 6 endpoints (perforator_report, code_report, infrastructure_report,
  underground_operation_report, load_report, telemetry_report): la ruta está
  confirmada, las columnas de respuesta NO — pendientes de confirmar antes de
  mapear botones/KPIs.

## Reglas de negocio

- El filtro de período (Día/Semana/Mes) se calcula en el cliente y se manda
  como `fecha_inicio`/`fecha_fin` en la query string (nombres NO confirmados
  con la API real, ajustables en Configuración).
- Los botones sin endpoint mapeado se muestran atenuados ("pendiente") y no
  permiten ver datos inventados.
- KPIs de Acarreo: tonelaje total, tonelaje promedio por viaje, número de
  viajes — calculados sobre la respuesta de la API, no persistidos.

## Roles y permisos

No hay roles propios de la app: la autenticación/autorización vive
enteramente en la API real de MiningControl (login OAuth2 password flow). La
app solo pasa el token recibido; no decide permisos.

## Requisitos no funcionales

PWA instalable (manifest + service worker), mobile-first, debe servirse por
HTTPS en producción (los Service Workers no funcionan en HTTP salvo
localhost). El proxy CORS es un requisito no funcional obligatorio: sin él la
app no puede hablar con la API real desde el navegador (ver
`.claude/knowledge-base/data-sources.md`).

## Fuente de datos

Confirmado: contrato de login (`POST api/v1/login/access-token`,
`grant_type=password`, token en `access_token`) y las 7 rutas de reporte
válidas. Pendiente de confirmar: columnas de respuesta de 6 de los 7
reportes, y si `fecha_inicio`/`fecha_fin` son los nombres reales de
parámetro. Ver `.claude/knowledge-base/data-sources.md` para el detalle
completo y actualizarlo ahí, no solo aquí, cuando se confirme algo nuevo.

## Clasificación de datos y compliance

**Sí aplica.** La app muestra datos de producción minera real (toneladas por
turno, equipos, contratistas). Cualquier uso externo o regulatorio de estos
números requiere validación humana formal antes de publicarse, conforme a
las políticas de compliance de Aura Minerals (alineado con `CLAUDE.md` y las
instrucciones de la organización sobre datos de producción/CFEM/ESG). Uso
interno de seguimiento operativo: sin restricción adicional más allá de la ya
aplicada (autenticación contra la API real).

## Fuera de alcance

- Mapeo de columnas de TROMPOS, RELLENO, EQUIPOS, OBRAS (pendiente de que el
  usuario confirme el endpoint/columnas real de cada uno).
- Edición/escritura de datos: la app es de solo lectura.
- Notificaciones push, modo offline con sincronización de datos (el service
  worker solo cachea el shell estático, nunca respuestas de la API).
