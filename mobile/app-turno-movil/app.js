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
  // Nombres de parametro de query para el rango de fechas. AJUSTAR cuando se
  // confirme el contrato real de cada endpoint (puede variar por endpoint).
  paramFechaInicio: "fecha_inicio",
  paramFechaFin: "fecha_fin",
};

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
      { key: "material", label: "Material" },
      { key: "calculated_mass", label: "Tonelaje" },
    ],
    kpis: [
      { type: "sum", key: "calculated_mass", label: "Tonelaje total" },
      { type: "avg", key: "calculated_mass", label: "Tonelaje prom/viaje" },
      { type: "count", label: "N. de viajes" },
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
    throw new Error("Error HTTP " + res.status + " al consultar " + path);
  }
  const json = await res.json();
  return normalizeRows(json);
}

function normalizeRows(json) {
  const r = json && typeof json === "object" && "Result" in json ? json.Result : json;
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object") return [r];
  return [];
}

/* ---------- PERIODO (Dia / Semana / Mes) ---------- */

let currentPeriod = "dia";

function toISODate(d) {
  return d.toISOString().slice(0, 10);
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
    const el = document.createElement("button");
    el.type = "button";
    el.className = "report-btn" + (btn.reportKey ? "" : " pending");
    el.innerHTML = "<span>" + escapeHtml(btn.label) + "</span>" + (btn.reportKey ? "" : "<span class=\"chip\">pendiente</span>");
    el.addEventListener("click", () => openDetail(btn));
    list.appendChild(el);
  });
  const user = sessionStorage.getItem(STORAGE_USER) || "";
  document.getElementById("header-subtitle").textContent = user ? "Sesion: " + user : "";
}

let currentButton = null;

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

  if (!btn.reportKey) {
    pendingBox.hidden = false;
    kpiRow.innerHTML = "";
    tableWrap.innerHTML = "";
    status.hidden = true;
    return;
  }
  pendingBox.hidden = true;
  await loadDetail();
}

async function loadDetail() {
  if (!currentButton || !currentButton.reportKey) return;
  const def = REPORT_DEFS[currentButton.reportKey];
  const status = document.getElementById("detail-status");
  const kpiRow = document.getElementById("kpi-row");
  const tableWrap = document.getElementById("detail-table-wrap");
  const rangeLabel = document.getElementById("period-range");

  const cfg = getConfig();
  const range = getPeriodRange(currentPeriod);
  rangeLabel.textContent = range.start === range.end ? range.start : range.start + " a " + range.end;

  status.hidden = false;
  status.textContent = "Cargando...";
  kpiRow.innerHTML = "";
  tableWrap.innerHTML = "";

  const params = {};
  params[cfg.paramFechaInicio] = range.start;
  params[cfg.paramFechaFin] = range.end;

  try {
    const rows = await apiFetchReport(def.path, params);
    status.hidden = true;
    renderKpis(rows, def);
    renderTable(rows, def);
  } catch (err) {
    status.hidden = false;
    status.textContent = err.message;
  }
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
    html += "<tr>" + cols.map((c) => "<td>" + escapeHtml(r[c.key] ?? "") + "</td>").join("") + "</tr>";
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
document.getElementById("btn-back").addEventListener("click", () => showView("view-dashboard"));
document.getElementById("btn-refresh").addEventListener("click", loadDetail);

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

/* ---------- INIT ---------- */

(function init() {
  if (getToken()) {
    showView("view-dashboard");
    renderDashboard();
  } else {
    showView("view-login");
  }
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
