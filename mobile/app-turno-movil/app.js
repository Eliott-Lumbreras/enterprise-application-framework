/* Aura Minerals - App de Turno - cliente API + UI
   No contiene credenciales ni tokens hardcodeados.
   El token se guarda unicamente en sessionStorage (se borra al cerrar sesion / pestana). */

const DEFAULT_CONFIG = {
  // La API real (aura-aranzazu-dataapi.miningcontrol.cloud) no permite CORS desde
  // un navegador (fue disenada para Power Query, que llama del lado del servidor).
  // Por eso la app apunta por defecto al proxy incluido en /proxy-server, que si
  // agrega los headers CORS necesarios. Ver README.md.
  baseUrl: "http://localhost:4000",
  loginPath: "api/v1/login/access-token", // OAuth2 password flow (confirmado)
  fieldUser: "username",
  fieldPass: "password",
  tokenField: "access_token", // confirmado
  // Nombres de parametro de query para el rango de fechas. CONFIRMADO para
  // transport_report via el mensaje de error real de la API (2026-07-15):
  // {"detail":"dataIn e dataFi sao obrigatorios quando last_update_timestamp
  // nao for fornecido"} -> son "dataIn"/"dataFi" (portugues), no
  // "fecha_inicio"/"fecha_fin" como se habia supuesto. Puede variar por
  // endpoint: revisar cuando se confirme cada reporte pendiente.
  paramFechaInicio: "dataIn",
  paramFechaFin: "dataFi",
};

// Pedido del usuario (2026-07-21): ACARREO (transport_report) se actualiza
// solo cada 10 minutos, y esa actualizacion NO vuelve a pedir todos los
// datos: para el periodo "Mes" solo busca cambios de los ultimos 7 dias y
// los combina con el resto del mes que ya se tenia (ver monthRowsCache en
// loadDetail), para que la actualizacion no tarde.
const TRANSPORT_AUTO_REFRESH_MS = 10 * 60 * 1000;
const TRANSPORT_MAX_LOOKBACK_DAYS = 7;

/**
 * REPORT_DEFS: un registro por endpoint real de la API, con el mapeo de
 * columnas (nombre de campo devuelto por la API -> etiqueta en pantalla) y
 * los KPIs a calcular. Se va completando reporte por reporte segun las
 * indicaciones del usuario. NO INVENTAR nombres de columna: mientras un
 * reporte no tenga "columns" definido, la tabla se arma de forma generica
 * con las columnas que realmente devuelva la API.
 */
const REPORT_DEFS = {
  transport_report: {
    path: "api/v1/transport_report",
    columns: [
      { key: "production_date", label: "Fecha" },
      { key: "turn", label: "Turno" },
      { key: "operator_group", label: "Empresa" },
      { key: "equipment", label: "Camion" },
      { key: "load_equipment", label: "Scoop" },
      { key: "origin_subarea", label: "Lugar" },
      { key: "material", label: "Material" },
      { key: "calculated_mass", label: "Tonelaje" },
    ],
    kpis: [
      { type: "sum", key: "calculated_mass", label: "Tonelaje total" },
      { type: "avg", key: "calculated_mass", label: "Tonelaje prom/viaje" },
      { type: "count", label: "N. de viajes" },
    ],
    // "Lugar" = origin_subarea (confirmado por el usuario 2026-07-15).
    groupBy: { key: "origin_subarea", label: "Lugar", valueKey: "calculated_mass" },
    // Ligado a api/v1/goals (Plan) para comparar Real vs Plan por Lugar, segun
    // el reporte Power BI de referencia ("Reporte de Acarreo de Mineral").
    // NO es un boton/reporte propio: se trae de forma "best-effort" al cargar
    // ACARREO y si falla (ej. el HTTP 500 visto el 2026-07-16) simplemente no
    // se muestra la comparacion, sin romper el resto de la pantalla.
    // Pendiente de confirmar con datos reales: si "planning_type" === "plan"
    // ya corresponde a "plan mediano" o si falta otro campo para ese matiz
    // (ver .claude/knowledge-base/entities.md).
    planLink: {
      path: "api/v1/goals",
      filter: (row) => row.planning_type === "plan",
      lugarKey: "level1value",
      valueKey: "goal",
    },
  },
  // Endpoint api/v1/goals (Plan/metas). Se mantiene documentado aqui aunque
  // ya no cuelga de un boton propio (ver planLink arriba): sus columnas se
  // usan para armar la comparacion Real vs Plan dentro de ACARREO.
  goals_report: {
    path: "api/v1/goals",
    columns: [
      { key: "datetime_end", label: "Fecha" },
      {
        key: "level3id",
        label: "Turno",
        // Confirmado por el usuario 2026-07-16: en esta tabla 1=Noche, 2=Dia
        // (numeracion propia de goals, distinta del texto "Turno 1/Turno 2"
        // de transport_report).
        format: (v) => (String(v) === "1" ? "Noche" : String(v) === "2" ? "Dia" : v),
      },
      { key: "level1value", label: "Lugar" },
      { key: "level2value", label: "Material" },
      { key: "planning_type", label: "Tipo plan" },
      { key: "goal", label: "Meta" },
    ],
    kpis: [
      { type: "sum", key: "goal", label: "Meta total" },
    ],
  },
};

/**
 * BUTTONS: define el dashboard principal (orden y texto de cada boton).
 * "reportKey" apunta a una entrada de REPORT_DEFS. Si es null, el boton
 * existe en pantalla pero todavia no tiene reporte configurado: al tocarlo
 * se muestra un aviso en vez de intentar traer datos con columnas inventadas.
 */
const BUTTONS = [
  { id: "acarreo", label: "ACARREO", reportKey: "transport_report" },
  { id: "trompos", label: "TROMPOS", reportKey: null },
  { id: "relleno", label: "RELLENO", reportKey: null },
  { id: "equipos", label: "EQUIPOS", reportKey: null },
  { id: "obras", label: "OBRAS", reportKey: null },
  // El Plan (api/v1/goals) ya no es un boton propio: se decidio (2026-07-17)
  // ligarlo dentro de ACARREO para comparar Real vs Plan (ver
  // REPORT_DEFS.transport_report.planLink).
  { id: "otro", label: "OTRO", reportKey: null },
];

const STORAGE_CFG = "aura_config_overrides";
const STORAGE_TOKEN = "aura_token";
const STORAGE_USER = "aura_user";

function getConfig() {
  try {
    const overrides = JSON.parse(localStorage.getItem(STORAGE_CFG) || "{}");
    return { ...DEFAULT_CONFIG, ...overrides };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(cfg) {
  localStorage.setItem(STORAGE_CFG, JSON.stringify(cfg));
}

function resolveField(obj, path) {
  return path.split(".").reduce((o, k) => (o || {})[k], obj);
}

/* ---------- API CLIENT ---------- */

async function apiLogin(username, password) {
  const cfg = getConfig();
  const body = new URLSearchParams();
  body.set("grant_type", "password");
  body.set(cfg.fieldUser, username);
  body.set(cfg.fieldPass, password);

  const res = await fetch(joinUrl(cfg.baseUrl, cfg.loginPath), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error("Login rechazado (HTTP " + res.status + "). Revisa usuario/contrasena o la configuracion de conexion.");
  }
  const data = await res.json();
  const token = resolveField(data, cfg.tokenField);
  if (!token) {
    throw new Error("No se encontro el token en la respuesta de login. Ajusta 'Campo respuesta con el token' en Configuracion.");
  }
  sessionStorage.setItem(STORAGE_TOKEN, token);
  sessionStorage.setItem(STORAGE_USER, username);
}

function getToken() {
  return sessionStorage.getItem(STORAGE_TOKEN);
}

function logout() {
  sessionStorage.removeItem(STORAGE_TOKEN);
  sessionStorage.removeItem(STORAGE_USER);
  showView("view-login");
}

function joinUrl(base, path) {
  return base.replace(/\/$/, "") + "/" + String(path).replace(/^\//, "");
}

async function apiFetchReport(path, params = {}) {
  const token = getToken();
  const cfg = getConfig();
  const url = new URL(joinUrl(cfg.baseUrl, path));
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), {
    headers: { Authorization: "Bearer " + token },
  });

  if (res.status === 401) {
    logout();
    throw new Error("Sesion expirada. Inicia sesion nuevamente.");
  }
  if (!res.ok) {
    const detail = await extractErrorDetail(res);
    throw new Error("Error HTTP " + res.status + " al consultar " + path + (detail ? ": " + detail : ""));
  }
  // Algunos endpoints de esta API devuelven el cuerpo vacio (no "[]") cuando
  // no hay datos para el filtro pedido, en vez de un array JSON vacio. Se
  // trata explicitamente como "sin datos" en vez de fallar con un error
  // criptico de parseo.
  const text = await res.text();
  if (!text.trim()) return [];
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("La respuesta de " + path + " no es JSON valido: " + text.slice(0, 200));
  }
  return normalizeRows(json);
}

/**
 * Extrae el mensaje de error real que devuelve la API (util para depurar
 * parametros/columnas no confirmados, ej. fecha_inicio/fecha_fin). Soporta
 * el formato tipico de FastAPI ({"detail": "..."} o {"detail": [{"msg": ...}]})
 * y cae a texto plano si no es JSON. Nunca lanza: si algo falla al leer el
 * body, devuelve cadena vacia en vez de tapar el error original con otro.
 */
async function extractErrorDetail(res) {
  try {
    const text = await res.text();
    if (!text) return "";
    try {
      const data = JSON.parse(text);
      if (typeof data.detail === "string") return data.detail;
      if (Array.isArray(data.detail)) {
        return data.detail
          .map((d) => (d && d.loc ? d.loc.join(".") + ": " + d.msg : JSON.stringify(d)))
          .join(" | ");
      }
      return JSON.stringify(data).slice(0, 300);
    } catch {
      return text.slice(0, 300);
    }
  } catch {
    return "";
  }
}

function normalizeRows(json) {
  const r = json && typeof json === "object" && "Result" in json ? json.Result : json;
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object") return [r];
  return [];
}

/* ---------- PERIODO (Dia / Semana / Mes) ---------- */

let currentPeriod = "dia";

/**
 * Formatea una fecha como YYYY-MM-DD usando el CALENDARIO LOCAL del
 * dispositivo (no UTC). BUG CORREGIDO 2026-07-20: la version anterior usaba
 * d.toISOString(), que convierte a UTC. En una zona horaria como Mexico
 * (UTC-6), cualquier hora local entre aprox. 18:00 y 23:59 cae ya en el dia
 * siguiente en UTC -justo el arranque del Turno 2 (19:00)-, asi que
 * getCurrentTurnoContext() armaba la fecha/rango equivocados (un dia
 * adelantados) y el chip de "turno en curso" siempre daba 0.
 */
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function getPeriodRange(period) {
  const today = new Date();
  const end = new Date(today);
  let start = new Date(today);
  if (period === "semana") {
    start.setDate(start.getDate() - 6);
  } else if (period === "mes") {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
  }
  return { start: toISODate(start), end: toISODate(end) };
}

/**
 * Determina el turno en curso segun la hora actual, de acuerdo a los
 * horarios confirmados por el usuario (2026-07-16):
 * Turno 1 (dia): 07:00 a 18:59. Turno 2 (noche): 19:00 a 06:59 del dia
 * siguiente (cruza medianoche).
 *
 * ASUNCION pendiente de confirmar con datos reales: para el turno de noche
 * se asume que "production_date" queda registrado con la fecha en que
 * INICIA el turno (el dia en que son las 19:00), no la fecha en que termina.
 * Si al revisar datos reales resulta ser al reves, ajustar "date" abajo.
 */
function getCurrentTurnoContext(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 7 && hour < 19) {
    const date = toISODate(now);
    return { turnLabel: "Turno 1", turnShortLabel: "Dia", date, rangeStart: date, rangeEnd: date };
  }
  const shiftStart = new Date(now);
  if (hour < 7) shiftStart.setDate(shiftStart.getDate() - 1);
  const shiftEnd = new Date(shiftStart);
  shiftEnd.setDate(shiftEnd.getDate() + 1);
  return {
    turnLabel: "Turno 2",
    turnShortLabel: "Noche",
    date: toISODate(shiftStart),
    rangeStart: toISODate(shiftStart),
    rangeEnd: toISODate(shiftEnd),
  };
}

/**
 * Refresca el chip "en vivo" del boton ACARREO en el dashboard con el
 * tonelaje acumulado del turno en curso (segun getCurrentTurnoContext). Se
 * llama al mostrar el dashboard y cada vez que se vuelve a el. Nunca lanza:
 * si la API falla, el chip muestra un mensaje corto de error en vez de
 * romper el dashboard.
 */
async function refreshAcarreoLive() {
  const chipEl = document.getElementById("acarreo-live-chip");
  if (!chipEl) return;
  if (!getToken()) return;
  chipEl.textContent = "Actualizando turno actual...";
  try {
    const ctx = getCurrentTurnoContext();
    const cfg = getConfig();
    const params = {};
    params[cfg.paramFechaInicio] = ctx.rangeStart;
    params[cfg.paramFechaFin] = ctx.rangeEnd;
    let rows = await apiFetchReport(REPORT_DEFS.transport_report.path, params);

    // Rellena el hueco de hoy (ver fetchTodayGapRows): dataIn/dataFi nunca
    // trae el dia de hoy por el retraso de sincronizacion confirmado el
    // 2026-07-21. Solo aplica si el turno en curso es el de hoy (para el
    // Turno 2 que empezo ayer antes de las 7am, ctx.date ya es ayer y esa
    // fecha si viene completa por dataIn/dataFi).
    const todayStr = toISODate(new Date());
    if (ctx.date === todayStr && !rows.some((r) => r.production_date === todayStr)) {
      const gapRows = await fetchTodayGapRows();
      rows = rows.concat(gapRows);
    }

    const turnoRows = rows.filter((r) => r.turn === ctx.turnLabel && r.production_date === ctx.date);
    const total = turnoRows.reduce((sum, r) => sum + (parseFloat(r.calculated_mass) || 0), 0);
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    // "N/M" = viajes que calzan con el turno actual / total de viajes
    // traidos (incluyendo el relleno de hoy).
    chipEl.textContent =
      round2(total) + " t en " + turnoRows.length + "/" + rows.length + " viajes - act. " + hh + ":" + mm;
  } catch (err) {
    chipEl.textContent = "Turno actual: sin datos (" + err.message.slice(0, 60) + ")";
  }
}

/* ---------- KPIs ---------- */

function computeDefinedKpis(rows, kpiDefs) {
  return kpiDefs.map((def) => {
    if (def.type === "count") {
      return { label: def.label, value: rows.length, sub: "" };
    }
    const vals = rows.map((r) => parseFloat(r[def.key])).filter((v) => !isNaN(v));
    const sum = vals.reduce((a, b) => a + b, 0);
    if (def.type === "sum") {
      return { label: def.label, value: round2(sum), sub: "" };
    }
    if (def.type === "avg") {
      const avg = vals.length ? sum / vals.length : 0;
      return { label: def.label, value: round2(avg), sub: "" };
    }
    return { label: def.label, value: "-", sub: "" };
  });
}

function computeGenericKpis(rows) {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);
  const numericKeys = keys.filter((k) =>
    rows.every((r) => r[k] !== null && r[k] !== "" && !isNaN(parseFloat(r[k])))
  );
  return numericKeys.slice(0, 4).map((k) => {
    const vals = rows.map((r) => parseFloat(r[k]) || 0);
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = sum / vals.length;
    return { label: k, value: round2(sum), sub: "prom. " + round2(avg) };
  });
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/* ---------- RENDER ---------- */

function showView(id) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/**
 * Escapa texto antes de insertarlo en innerHTML. Cualquier valor que venga de
 * la API (nombres de contratista, material, etc.) o de datos de la app se
 * trata como no confiable: nunca se inserta crudo en el DOM (OWASP Top 10 —
 * XSS, ver security.checklist.md).
 */
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function renderDashboard() {
  const list = document.getElementById("report-list");
  list.innerHTML = "";
  BUTTONS.forEach((btn) => {
    const isAcarreo = btn.id === "acarreo";
    const el = document.createElement("button");
    el.type = "button";
    el.className = "report-btn" + (btn.reportKey ? "" : " pending");
    el.innerHTML =
      "<span class=\"report-btn-row\"><span>" + escapeHtml(btn.label) + "</span>" +
      (btn.reportKey ? "" : "<span class=\"chip\">pendiente</span>") + "</span>" +
      (isAcarreo ? "<span class=\"report-btn-sub\" id=\"acarreo-live-chip\">Cargando turno actual...</span>" : "");
    el.addEventListener("click", () => openDetail(btn));
    list.appendChild(el);
  });
  const user = sessionStorage.getItem(STORAGE_USER) || "";
  document.getElementById("header-subtitle").textContent = user ? "Sesion: " + user : "";
  refreshAcarreoLive();
}

let currentButton = null;

// Cache incremental del periodo "Mes" de ACARREO (ver loadDetail). Vive solo
// en memoria: se pierde si se recarga la pagina, y se invalida sola si
// cambia el mes (monthKey).
let monthRowsCache = null;

async function openDetail(btn) {
  currentButton = btn;
  document.getElementById("detail-title").textContent = btn.label;
  currentPeriod = "dia";
  document.querySelectorAll(".segmented-btn").forEach((b) => b.classList.toggle("active", b.dataset.period === "dia"));
  showView("view-detail");

  const pendingBox = document.getElementById("pending-config");
  const kpiRow = document.getElementById("kpi-row");
  const tableWrap = document.getElementById("detail-table-wrap");
  const status = document.getElementById("detail-status");

  // Boton exploratorio de last_update_timestamp (ver testLastUpdateTimestamp):
  // solo tiene sentido para ACARREO (transport_report), que es donde vimos
  // el retraso de sincronizacion el 2026-07-21.
  document.getElementById("btn-test-last-update").hidden = btn.reportKey !== "transport_report";

  if (!btn.reportKey) {
    pendingBox.hidden = false;
    kpiRow.innerHTML = "";
    tableWrap.innerHTML = "";
    document.getElementById("group-summary-wrap").innerHTML = "";
    status.hidden = true;
    return;
  }
  pendingBox.hidden = true;
  await loadDetail();
}

/**
 * Prueba EXPLORATORIA (2026-07-21): la API menciono un parametro alterno
 * "last_update_timestamp" como alternativa a dataIn/dataFi (visto en el
 * mensaje de error real: "dataIn e dataFi sao obrigatorios quando
 * last_update_timestamp nao for fornecido"). La idea es ver si consultando
 * por ESTE parametro (en vez de por fecha de produccion) aparecen los viajes
 * de hoy que la API todavia no refleja via dataIn/dataFi (ver el retraso de
 * sincronizacion confirmado el 2026-07-21).
 *
 * No se conoce el formato exacto que espera este parametro: se prueba
 * primero con una fecha simple (mismo formato que dataIn/dataFi). Si la API
 * responde con un error, ese error deberia decir el formato correcto (igual
 * que paso con dataIn/dataFi originalmente) — sin inventar el formato.
 *
 * Este boton NO reemplaza a Dia/Turno/Semana/Mes: es solo para explorar, y
 * su resultado se muestra con columnas genericas (sin forzar el mapeo de
 * columnas de transport_report), para no ocultar ningun campo nuevo que la
 * API devuelva en este modo.
 */
async function testLastUpdateTimestamp() {
  if (!currentButton || currentButton.reportKey !== "transport_report") return;
  const status = document.getElementById("detail-status");
  const kpiRow = document.getElementById("kpi-row");
  const rangeLabel = document.getElementById("period-range");
  document.getElementById("group-summary-wrap").innerHTML = "";
  kpiRow.innerHTML = "";
  status.hidden = false;
  status.textContent = "Probando last_update_timestamp (exploratorio)...";

  const testValue = toISODate(new Date());
  rangeLabel.textContent = "PRUEBA last_update_timestamp=" + testValue + " (no reemplaza Dia/Turno/Semana/Mes)";

  try {
    const rows = await apiFetchReport(REPORT_DEFS.transport_report.path, { last_update_timestamp: testValue });
    status.hidden = true;
    kpiRow.innerHTML =
      "<div class=\"hint-text\">" + rows.length + " fila(s) devueltas con last_update_timestamp=" +
      escapeHtml(testValue) + "</div>";

    // Diagnostico completo (no la tabla generica de 8 columnas): se muestran
    // TODOS los nombres de columna reales y el contenido completo de la
    // primera fila, para comparar contra el esquema conocido de
    // transport_report (calculated_mass, turn, production_date,
    // origin_subarea) sin depender de scroll horizontal.
    const tableWrap = document.getElementById("detail-table-wrap");
    if (rows.length) {
      const keys = Object.keys(rows[0]);
      tableWrap.innerHTML =
        "<p class=\"hint-text\">Columnas reales (" + keys.length + "): " + escapeHtml(keys.join(", ")) + "</p>" +
        "<pre style=\"white-space:pre-wrap;font-size:11px;background:var(--card);border:1px solid #253253;border-radius:10px;padding:10px;\">" +
        escapeHtml(JSON.stringify(rows[0], null, 2)) + "</pre>";
    } else {
      tableWrap.innerHTML = "<p class=\"hint-text\">0 filas.</p>";
    }
  } catch (err) {
    status.hidden = false;
    status.textContent = "last_update_timestamp (exploratorio) fallo: " + err.message;
  }
}

/**
 * Complemento para el retraso de sincronizacion confirmado el 2026-07-21:
 * cuando el rango de fecha de una consulta a transport_report llega hasta
 * HOY, "dataIn"/"dataFi" no trae los viajes de hoy (la API responde 204
 * vacio para ese dia en concreto, aunque ya haya viajes reales cargados en
 * el sistema de origen). Se confirmo con datos reales que consultando por
 * el parametro alterno "last_update_timestamp=<hoy>" SI aparecen esos
 * viajes (169 filas reales el 2026-07-21, con el mismo esquema conocido:
 * calculated_mass, turn, production_date, origin_subarea, etc.).
 *
 * Se filtra el resultado por production_date === hoy antes de usarlo, ya
 * que last_update_timestamp probablemente trae CUALQUIER fila actualizada
 * hoy (por ejemplo, una correccion a un viaje de una fecha anterior),  no
 * solo los viajes cuya fecha de produccion sea hoy.
 *
 * "Best-effort": si esto falla, simplemente no se rellena el hueco de hoy
 * (el resto del reporte sigue funcionando con lo que si trajo dataIn/dataFi).
 */
async function fetchTodayGapRows() {
  const todayStr = toISODate(new Date());
  try {
    const rows = await apiFetchReport(REPORT_DEFS.transport_report.path, { last_update_timestamp: todayStr });
    return rows.filter((r) => r.production_date === todayStr);
  } catch (err) {
    console.warn("No se pudo rellenar el hueco de hoy via last_update_timestamp: " + err.message);
    return [];
  }
}

async function loadDetail() {
  if (!currentButton || !currentButton.reportKey) return;
  const def = REPORT_DEFS[currentButton.reportKey];
  const status = document.getElementById("detail-status");
  const kpiRow = document.getElementById("kpi-row");
  const tableWrap = document.getElementById("detail-table-wrap");
  const rangeLabel = document.getElementById("period-range");

  const cfg = getConfig();
  // "Turno" es un periodo especial: en vez de un rango de dias fijo (Dia /
  // Semana / Mes), usa getCurrentTurnoContext() para saber que turno esta
  // corriendo ahora mismo (puede abarcar 2 fechas de calendario si es el
  // Turno 2 de noche).
  const isTurno = currentPeriod === "turno";
  const turnoCtx = isTurno ? getCurrentTurnoContext() : null;
  const range = isTurno ? { start: turnoCtx.rangeStart, end: turnoCtx.rangeEnd } : getPeriodRange(currentPeriod);

  rangeLabel.textContent = isTurno
    ? turnoCtx.turnLabel + " (" + turnoCtx.turnShortLabel + ") - " + turnoCtx.date
    : (range.start === range.end ? range.start : range.start + " a " + range.end);

  status.hidden = false;
  status.textContent = "Cargando...";
  kpiRow.innerHTML = "";
  tableWrap.innerHTML = "";
  document.getElementById("group-summary-wrap").innerHTML = "";

  const isTransport = currentButton.reportKey === "transport_report";

  // Cache incremental para "Mes" de ACARREO (pedido del usuario 2026-07-21):
  // la primera vez que se abre "Mes" se trae el mes completo (dia 1 a hoy).
  // Las actualizaciones siguientes (automatica cada 10 min, o el boton
  // Actualizar) YA NO vuelven a pedir todo el mes: solo piden los ultimos 7
  // dias (posibles cambios/nuevos viajes) y los combinan con lo que ya se
  // tenia guardado del resto del mes, en vez de descartarlo.
  const useMonthCache = isTransport && !isTurno && currentPeriod === "mes";
  let monthKey = null;
  let recentStartStr = null;
  if (useMonthCache) {
    const today = new Date();
    monthKey = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0");
    const recentStart = new Date();
    recentStart.setDate(recentStart.getDate() - (TRANSPORT_MAX_LOOKBACK_DAYS - 1));
    recentStartStr = toISODate(recentStart);
  }
  const haveValidMonthCache = useMonthCache && monthRowsCache && monthRowsCache.monthKey === monthKey;

  const params = {};
  if (haveValidMonthCache) {
    params[cfg.paramFechaInicio] = recentStartStr;
    params[cfg.paramFechaFin] = range.end;
  } else {
    params[cfg.paramFechaInicio] = range.start;
    params[cfg.paramFechaFin] = range.end;
  }

  try {
    let rows = await apiFetchReport(def.path, params);
    status.hidden = true;

    if (useMonthCache) {
      if (haveValidMonthCache) {
        // Conserva del cache todo lo anterior a los ultimos 7 dias (no se
        // volvio a pedir), y reemplaza esos ultimos 7 dias con lo recien
        // traido.
        const kept = monthRowsCache.rows.filter((r) => (r.production_date ?? "") < recentStartStr);
        rows = kept.concat(rows);
      }
      monthRowsCache = { monthKey, rows };
    }

    // Rellena el hueco de hoy (ver fetchTodayGapRows) si el rango pedido
    // llega hasta la fecha de hoy: dataIn/dataFi nunca trae el dia de hoy
    // por el retraso de sincronizacion confirmado el 2026-07-21.
    const todayStr = toISODate(new Date());
    const targetDateForGap = isTurno ? turnoCtx.date : range.end;
    if (isTransport && targetDateForGap === todayStr) {
      const alreadyHasToday = rows.some((r) => r.production_date === todayStr);
      if (!alreadyHasToday) {
        const gapRows = await fetchTodayGapRows();
        rows = rows.concat(gapRows);
      }
    }

    // Acota al turno exacto (no solo al rango de fecha): necesario sobre
    // todo para el Turno 2, cuyo rango incluye 2 fechas de calendario.
    if (isTurno && isTransport) {
      rows = rows.filter((r) => r.turn === turnoCtx.turnLabel && r.production_date === turnoCtx.date);
    }

    // Plan (api/v1/goals) ligado a ACARREO: se trae "best-effort" para no
    // romper el reporte principal si el endpoint de Plan falla (ej. el
    // HTTP 500 visto el 2026-07-16). Si falla, planRows queda en null y la
    // comparacion Real vs Plan simplemente no se muestra.
    let planRows = null;
    if (def.planLink) {
      try {
        planRows = await apiFetchReport(def.planLink.path, params);
      } catch (planErr) {
        planRows = null;
        console.warn("Plan (api/v1/goals) no disponible: " + planErr.message);
      }
    }

    renderKpis(rows, def);
    renderGroupSummary(rows, def, planRows);
    renderTable(rows, def);
  } catch (err) {
    status.hidden = false;
    status.textContent = err.message;
  }
}

/**
 * Resumen agrupado (ej. tonelaje total por Scoop/"lugar"). Se calcula sobre
 * las filas ya cargadas para el periodo actual, sin pedir nada nuevo a la
 * API. Si el reporte no define "groupBy", no se muestra nada (no se inventa
 * un agrupamiento generico).
 *
 * Si el reporte define "planLink" y se pudo traer "planRows" (ver
 * loadDetail), se agregan columnas "Meta" y "% Cumpl." comparando el total
 * real de cada grupo (Lugar) contra la meta de Plan para ese mismo Lugar. Si
 * planRows no esta disponible (endpoint de Plan caido, sin datos, etc.), la
 * tabla se ve exactamente igual que antes: sin inventar columnas de plan.
 */
function renderGroupSummary(rows, def, planRows) {
  const wrap = document.getElementById("group-summary-wrap");
  if (!def.groupBy) {
    wrap.innerHTML = "";
    return;
  }
  if (!rows.length) {
    wrap.innerHTML = "";
    return;
  }
  const { key, label, valueKey } = def.groupBy;
  const groups = new Map();
  for (const r of rows) {
    const groupValue = r[key] ?? "(sin valor)";
    const amount = parseFloat(r[valueKey]);
    const entry = groups.get(groupValue) || { total: 0, trips: 0 };
    if (!isNaN(amount)) entry.total += amount;
    entry.trips += 1;
    groups.set(groupValue, entry);
  }
  const sorted = [...groups.entries()].sort((a, b) => b[1].total - a[1].total);

  // Mapa Lugar -> meta total de Plan, si hay planLink y datos disponibles.
  const planLink = def.planLink;
  const planMap = new Map();
  if (planLink && Array.isArray(planRows) && planRows.length) {
    const planned = planLink.filter ? planRows.filter(planLink.filter) : planRows;
    for (const p of planned) {
      const lugar = p[planLink.lugarKey] ?? "(sin valor)";
      const goal = parseFloat(p[planLink.valueKey]);
      if (isNaN(goal)) continue;
      planMap.set(lugar, (planMap.get(lugar) || 0) + goal);
    }
  }
  const hasPlan = planMap.size > 0;

  let html = "<h3 class=\"group-summary-title\">Resumen por " + escapeHtml(label) + "</h3>";
  html += "<div class=\"table-wrap\"><table><thead><tr>";
  html += "<th>" + escapeHtml(label) + "</th><th>Total</th><th>N. viajes</th><th>Promedio</th>";
  if (hasPlan) html += "<th>Meta</th><th>% Cumpl.</th>";
  html += "</tr></thead><tbody>";
  for (const [groupValue, entry] of sorted) {
    const avg = entry.trips ? entry.total / entry.trips : 0;
    html += "<tr><td>" + escapeHtml(groupValue) + "</td><td>" + escapeHtml(round2(entry.total)) +
      "</td><td>" + escapeHtml(entry.trips) + "</td><td>" + escapeHtml(round2(avg)) + "</td>";
    if (hasPlan) {
      const goal = planMap.get(groupValue);
      if (goal !== undefined && goal > 0) {
        const pct = (entry.total / goal) * 100;
        html += "<td>" + escapeHtml(round2(goal)) + "</td><td>" + escapeHtml(round2(pct)) + "%</td>";
      } else {
        html += "<td>-</td><td>-</td>";
      }
    }
    html += "</tr>";
  }
  html += "</tbody></table></div>";
  wrap.innerHTML = html;
}

function renderKpis(rows, def) {
  const kpiRow = document.getElementById("kpi-row");
  const kpis = def.kpis ? computeDefinedKpis(rows, def.kpis) : computeGenericKpis(rows);
  if (!kpis.length) {
    kpiRow.innerHTML = "<div class=\"hint-text\">" + rows.length + " registro(s). Sin columnas numericas detectadas para KPI.</div>";
    return;
  }
  kpiRow.innerHTML = kpis
    .map(
      (k) => "<div class=\"kpi-card\"><div class=\"kpi-label\">" + escapeHtml(k.label) + "</div><div class=\"kpi-value\">" + escapeHtml(k.value) + "</div><div class=\"kpi-sub\">" + escapeHtml(k.sub || "") + "</div></div>"
    )
    .join("");
}

function renderTable(rows, def) {
  const wrap = document.getElementById("detail-table-wrap");
  if (!rows.length) {
    wrap.innerHTML = "<p class=\"hint-text\">Sin datos para el periodo seleccionado.</p>";
    return;
  }
  const cols = def.columns ? def.columns : Object.keys(rows[0]).slice(0, 8).map((k) => ({ key: k, label: k }));
  let html = "<table><thead><tr>" + cols.map((c) => "<th>" + escapeHtml(c.label) + "</th>").join("") + "</tr></thead><tbody>";
  rows.forEach((r) => {
    html += "<tr>" + cols.map((c) => {
      const raw = r[c.key] ?? "";
      const display = c.format ? c.format(raw, r) : raw;
      return "<td>" + escapeHtml(display) + "</td>";
    }).join("") + "</tr>";
  });
  html += "</tbody></table>";
  wrap.innerHTML = html;
}

/* ---------- SETTINGS ---------- */

function fillSettingsForm() {
  const cfg = getConfig();
  document.getElementById("cfg-base-url").value = cfg.baseUrl;
  document.getElementById("cfg-login-path").value = cfg.loginPath;
  document.getElementById("cfg-field-user").value = cfg.fieldUser;
  document.getElementById("cfg-field-pass").value = cfg.fieldPass;
  document.getElementById("cfg-token-field").value = cfg.tokenField;
  document.getElementById("cfg-param-fecha-inicio").value = cfg.paramFechaInicio;
  document.getElementById("cfg-param-fecha-fin").value = cfg.paramFechaFin;
}

/* ---------- EVENTS ---------- */

document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("login-error");
  const loadingEl = document.getElementById("login-loading");
  errorEl.hidden = true;
  loadingEl.hidden = false;
  try {
    await apiLogin(document.getElementById("input-user").value, document.getElementById("input-pass").value);
    loadingEl.hidden = true;
    showView("view-dashboard");
    renderDashboard();
  } catch (err) {
    loadingEl.hidden = true;
    errorEl.textContent = err.message;
    errorEl.hidden = false;
  }
});

document.getElementById("btn-logout").addEventListener("click", logout);
document.getElementById("btn-back").addEventListener("click", () => {
  showView("view-dashboard");
  refreshAcarreoLive();
});
document.getElementById("btn-refresh").addEventListener("click", loadDetail);
document.getElementById("btn-test-last-update").addEventListener("click", testLastUpdateTimestamp);

// Mantiene actualizado el chip de "turno en curso" del boton ACARREO
// mientras el usuario esta en el dashboard (sin recargar la pagina).
setInterval(() => {
  const dashboard = document.getElementById("view-dashboard");
  if (dashboard && dashboard.classList.contains("active")) refreshAcarreoLive();
}, 5 * 60 * 1000);

// Auto-actualiza la vista de detalle de ACARREO (transport_report) cada 10
// minutos mientras esta abierta, sin que el usuario tenga que tocar
// "Actualizar" (pedido del usuario 2026-07-21). El tope de 7 dias en
// loadDetail() (TRANSPORT_MAX_LOOKBACK_DAYS) es lo que evita que esta
// actualizacion automatica tarde.
setInterval(() => {
  const detailView = document.getElementById("view-detail");
  const isAcarreoOpen =
    detailView && detailView.classList.contains("active") &&
    currentButton && currentButton.reportKey === "transport_report";
  if (isAcarreoOpen) loadDetail();
}, TRANSPORT_AUTO_REFRESH_MS);

document.querySelectorAll(".segmented-btn").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".segmented-btn").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    currentPeriod = b.dataset.period;
    if (currentButton && currentButton.reportKey) loadDetail();
  });
});

document.getElementById("btn-open-settings").addEventListener("click", () => {
  fillSettingsForm();
  showView("view-settings");
});
document.getElementById("btn-open-settings-login").addEventListener("click", () => {
  fillSettingsForm();
  showView("view-settings");
});
document.getElementById("btn-close-settings").addEventListener("click", () => {
  showView(getToken() ? "view-dashboard" : "view-login");
});
document.getElementById("form-settings").addEventListener("submit", (e) => {
  e.preventDefault();
  saveConfig({
    baseUrl: document.getElementById("cfg-base-url").value.trim(),
    loginPath: document.getElementById("cfg-login-path").value.trim(),
    fieldUser: document.getElementById("cfg-field-user").value.trim(),
    fieldPass: document.getElementById("cfg-field-pass").value.trim(),
    tokenField: document.getElementById("cfg-token-field").value.trim(),
    paramFechaInicio: document.getElementById("cfg-param-fecha-inicio").value.trim(),
    paramFechaFin: document.getElementById("cfg-param-fecha-fin").value.trim(),
  });
  showView(getToken() ? "view-dashboard" : "view-login");
});
document.getElementById("btn-reset-settings").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_CFG);
  fillSettingsForm();
});
