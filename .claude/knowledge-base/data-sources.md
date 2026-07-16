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

## Parametros de filtro (confirmado para transport_report)

`dataIn` / `dataFi` (portugues: "data Inicial"/"data Final"), NO `fecha_inicio`/`fecha_fin` como se habia supuesto originalmente. Confirmado el 2026-07-15 leyendo el mensaje de error real de la API contra una prueba en dispositivo:

```
HTTP 400: {"detail":"dataIn e dataFi sao obrigatorios quando last_update_timestamp nao for fornecido"}
```

La API tambien acepta un modo alternativo via `last_update_timestamp` (no explorado todavia). Pendiente confirmar si `dataIn`/`dataFi` aplican igual a los otros 6 endpoints o si varian por reporte.

## Columnas de respuesta

Solo confirmadas para `transport_report` (ver `entities.md`). Para el resto de endpoints, no asumir nombres de columna: pedir al usuario la respuesta real antes de mapear KPIs o tablas.
