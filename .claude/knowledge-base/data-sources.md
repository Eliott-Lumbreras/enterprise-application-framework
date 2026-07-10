# Fuentes de datos confirmadas

## API principal

- Dominio: `aura-aranzazu-dataapi.miningcontrol.cloud`.
- Diseñada originalmente para Power Query (`Web.Contents`), por eso no aplica CORS para llamadas desde navegador (ver proxy en `mobile/app-turno-movil/proxy-server/`, dentro de este mismo repo).

## Login (confirmado)

- `POST api/v1/login/access-token`
- `Content-Type: application/x-www-form-urlencoded`
- Body: `grant_type=password&username=...&password=...`
- Respuesta: token en el campo `access_token` (flujo OAuth2 password, tipico de FastAPI).

## Endpoints de reporte (confirmados como ruta)

`api/v1/transport_report`, `api/v1/perforator_report`, `api/v1/code_report`, `api/v1/infrastructure_report`, `api/v1/underground_operation_report`, `api/v1/load_report`, `api/v1/telemetry_report`.

Autenticacion: header `Authorization: Bearer <token>`.

## Parametros de filtro (NO confirmados, son un supuesto razonable)

`fecha_inicio` / `fecha_fin` como nombres de parametro de query. Si al probar contra la API real no filtran correctamente, ajustar en la app (pantalla Configuracion) y actualizar este documento.

## Columnas de respuesta

Solo confirmadas para `transport_report` (ver `entities.md`). Para el resto de endpoints, no asumir nombres de columna: pedir al usuario la respuesta real antes de mapear KPIs o tablas.
