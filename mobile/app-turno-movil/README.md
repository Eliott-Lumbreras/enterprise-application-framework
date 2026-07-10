# Aura Turno — App móvil de operación minera

> Esta app ahora vive dentro del Enterprise Application Framework (EAF), en
> `mobile/app-turno-movil/`. Su design doc (Fase 10) está en
> `docs/design/app-turno-movil.design.md`, y los datos confirmados/pendientes
> de la API están documentados en `.claude/knowledge-base/` (`entities.md`,
> `data-sources.md`) — actualiza esos archivos, no solo este README, cuando
> se confirme un endpoint nuevo.

PWA (Progressive Web App) independiente para visualizar en el celular los datos de turno de la API `aura-aranzazu-dataapi.miningcontrol.cloud`. Instalable desde el navegador ("Agregar a pantalla de inicio"), sin necesidad de tienda de apps.

## Archivos

- `index.html` — pantallas: login, dashboard, detalle de reporte, configuración.
- `app.js` — cliente API (login OAuth2 password flow + fetch autenticado) y lógica de UI.
- `styles.css` — estilos mobile-first.
- `manifest.json` / `sw.js` — hacen la app instalable (PWA).
- `icon-192.png` / `icon-512.png` — íconos de marcador de posición (reemplazar por el logo oficial de Aura Minerals; solicitar a Comunicación Corporativa los assets de marca aprobados).
- `proxy-server/` — proxy CORS necesario para que la app pueda hablar con la API real (ver siguiente sección). Sin dependencias externas, solo Node 18+.

## Por qué existe `proxy-server/` (CORS)

Se probó el login directo desde el navegador contra `aura-aranzazu-dataapi.miningcontrol.cloud` y falló con `Failed to fetch`. Causa: esa API está pensada para Power Query (`Web.Contents`), que hace la llamada del lado del servidor de Power BI — ahí no aplica CORS. Un navegador sí aplica CORS, y como el backend no whitelistea el origen de la PWA, la petición se aborta.

Esto **no se puede arreglar solo con código del frontend**: CORS lo controla el servidor de la API. Hay dos caminos, no excluyentes:

1. Pedir al equipo de TI / MiningControl que agregue el dominio donde publiques la app a su lista blanca de CORS (solución ideal a mediano plazo).
2. Mientras tanto (o como solución permanente, porque además evita exponer el flujo OAuth completo al navegador), usar el proxy incluido: la PWA llama al proxy (mismo origen o uno controlado por ti), y el proxy —que corre en un servidor, no en el navegador— reenvía la petición a la API real sin restricción de CORS, agregando los headers que el navegador sí necesita.

### Levantar el proxy

```bash
cd proxy-server
node server.js
# Proxy escuchando en http://localhost:4000
```

No requiere `npm install` (cero dependencias externas, solo usa `http` y `fetch` nativos de Node 18+). Variables de entorno opcionales en `.env.example`: `PORT`, `MININGCONTROL_API_BASE`, `ALLOWED_ORIGIN`.

El proxy no fue probado end-to-end contra la API real porque el entorno donde generé este código tiene su propio filtro de salida a internet y no permite ese dominio; sí se verificó que levanta, responde `/health`, hace preflight CORS correctamente y da 404 fuera de `/api/v1/*`. Pruébalo tú contra la API real en tu red y avísame si el forward falla, para ajustarlo.

## Cómo probarla localmente

```bash
# Terminal 1: proxy
cd proxy-server
node server.js

# Terminal 2: la app
cd ..
python3 -m http.server 8080
```

Abrir `http://localhost:8080` en el navegador del celular (misma red) o en Chrome desktop con las DevTools en modo responsivo. La app ya apunta por defecto a `http://localhost:4000` (el proxy); si cambias el puerto o despliegas el proxy en otro lado, ajústalo en Configuración (ícono ⚙) dentro de la app.

## Contrato de API ya confirmado

- Login: `POST api/v1/login/access-token`, `Content-Type: application/x-www-form-urlencoded`, body `grant_type=password&username=...&password=...`.
- Token de respuesta: campo `access_token`.
- Reportes (GET, con header `Authorization: Bearer <token>`):
  `api/v1/transport_report`, `api/v1/perforator_report`, `api/v1/code_report`, `api/v1/infrastructure_report`, `api/v1/underground_operation_report`, `api/v1/load_report`, `api/v1/telemetry_report`.

## Dashboard y reportes (botones)

El dashboard principal es una lista de botones (`BUTTONS` en `app.js`), cada uno asociado a un reporte (`REPORT_DEFS`). Estado actual:

| Botón | Endpoint | Estado |
|---|---|---|
| ACARREO | `api/v1/transport_report` | Configurado (columnas + KPIs reales) |
| TROMPOS | — | Pendiente de mapeo |
| RELLENO | — | Pendiente de mapeo |
| EQUIPOS | — | Pendiente de mapeo |
| OBRAS | — | Pendiente de mapeo |
| OTRO | — | Placeholder |

Los botones "pendiente" se muestran atenuados; al tocarlos, la app avisa que falta configurar el reporte en vez de mostrar columnas inventadas. Para completar cada uno, indícame: el endpoint real (de los 7 ya confirmados arriba) y el mapeo columna-de-la-API → etiqueta en pantalla (igual que se hizo con Acarreo). Actualiza también `.claude/knowledge-base/entities.md` con el mismo dato.

**Acarreo (transport_report)** — mapeo ya aplicado:

| Campo API | Columna en pantalla |
|---|---|
| production_date | Fecha |
| turn | Turno |
| operator_group | Empresa |
| equipment | Camión |
| load_equipment | Scoop |
| material | Material |
| calculated_mass | Tonelaje |

KPIs calculados: Tonelaje total, Tonelaje promedio por viaje, N° de viajes.

## Filtro de período (Día / Semana / Mes)

En la vista de detalle, los botones superiores calculan un rango de fechas (Día = hoy, Semana = últimos 7 días, Mes = del día 1 del mes a hoy) y lo mandan como `fecha_inicio`/`fecha_fin` en la query string. **Estos nombres de parámetro son un supuesto razonable, no confirmado** — si al probar contra la API real el filtro no funciona, ajusta "Parámetro fecha inicio/fin" en Configuración (ícono ⚙) o actualiza `.claude/knowledge-base/data-sources.md`.

## Qué falta ajustar cuando tengas acceso real

1. Confirmar que `fecha_inicio`/`fecha_fin` son los parámetros correctos para `transport_report` (ajustable en Configuración sin tocar código).
2. Completar el mapeo de columnas de TROMPOS, RELLENO, EQUIPOS, OBRAS y OTRO.
3. **CORS**: ya resuelto con `proxy-server/` (ver sección dedicada más arriba). Antes de publicar en producción, define `ALLOWED_ORIGIN` en el proxy con la URL exacta de la app en vez de `*`.

## Seguridad (alineado a `.claude/checklists/security.checklist.md`)

- **Sin credenciales ni tokens hardcodeados** en el código: el usuario ingresa usuario/contraseña en el login; el token se guarda solo en `sessionStorage` (memoria del navegador, se borra al cerrar sesión o la pestaña). `localStorage` sí se usa, pero únicamente para la Configuración (URL del proxy, nombres de campo/parámetro) — nunca para el token ni la contraseña.
- **Proxy en producción**: el login pasa por `proxy-server/` antes de llegar a la API real (necesario por CORS, ver sección dedicada). El proxy no guarda ni loguea usuario/contraseña/token — solo reenvía; su único `console.log` es al arrancar (puerto, destino, origen CORS permitido) y su único `console.error` registra `err.message`, nunca el body de la petición.
- **XSS (OWASP Top 10)**: `renderTable`/`renderKpis`/`renderDashboard` en `app.js` insertan valores de la API en `innerHTML`. Se agregó un helper `escapeHtml()` (con prueba manual contra un payload `<img onerror=...>`) para que ningún campo devuelto por la API pueda ejecutarse como HTML/JS en el navegador.
- **Proxy en producción**: antes de publicar, fijar `ALLOWED_ORIGIN` al dominio real de la app (nunca `*`), desplegarlo en HTTPS, y si en el futuro el proxy necesita algún secreto propio (ej. una API key adicional), guardarlo en **Azure Key Vault** o variables de entorno — nunca en el código.
- **Ambientes**: probar primero en un ambiente de desarrollo/homologación de la API antes de apuntar la app a producción.
- **Datos sensibles**: si algún endpoint expone datos de colaboradores (nombres, RUT/cédula, etc.), estos deben minimizarse/enmascarse en pantalla salvo que el usuario que consulta tenga una finalidad legítima.
- **Datos de producción/CFEM/reservas**: los números que se muestren aquí son para seguimiento operativo interno. Cualquier uso externo o regulatorio de estos datos requiere validación humana formal antes de publicarse, conforme a las políticas de compliance de Aura Minerals.

## Estado de revisión automatizada

`scripts/review-module.js` (Fase 9) solo escanea `.ts`/`.tsx`: esta app es
JavaScript/HTML plano, así que la herramienta no la cubre todavía. La
revisión de seguridad/logging de arriba se hizo a mano, con los mismos
criterios (grep dirigido de secretos, TODOs, catch vacíos, console.*, más una
revisión de XSS que la herramienta tampoco cubre). No se debe asumir que
"pasó" `review-module.js` porque nunca corrió sobre estos archivos.

## Publicación

Cualquier hosting de archivos estáticos con HTTPS sirve (Azure Static Web Apps, IIS interno, etc.). Requisito único: HTTPS, ya que los Service Workers (necesarios para instalar la PWA) no funcionan en HTTP salvo `localhost`.
