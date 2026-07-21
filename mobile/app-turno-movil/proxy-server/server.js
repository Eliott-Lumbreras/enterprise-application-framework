/**
 * Proxy CORS para la app "Aura Turno" — sin dependencias externas (solo Node 18+).
 *
 * Motivo: aura-aranzazu-dataapi.miningcontrol.cloud fue disenada para ser
 * consumida desde Power Query (Web.Contents), que hace la llamada del lado
 * del servidor de Power BI y por lo tanto nunca aplica CORS. Un navegador si
 * aplica CORS, asi que una PWA no puede llamar a esa API directamente salvo
 * que el proveedor whiteliste el origen exacto de la app (pregunta pendiente
 * para el equipo de TI / MiningControl).
 *
 * Mientras se resuelve eso (o como solucion permanente, ya que ademas evita
 * exponer el flujo OAuth completo directo al navegador), este proxy:
 *  - Reenvia cualquier request bajo /api/v1/* tal cual a la API real.
 *  - Agrega los headers CORS que el navegador necesita para aceptar la respuesta.
 *  - NO guarda ni registra usuario/contrasena/token en ningun lado (sin logs
 *    de body, sin base de datos, sin archivos). Solo hace de "puente".
 *
 * IMPORTANTE (seguridad):
 *  - Configurar ALLOWED_ORIGIN al dominio real de la app antes de produccion.
 *    Dejarlo en "*" solo sirve para pruebas locales.
 *  - Desplegar primero en un ambiente de desarrollo/homologacion, nunca
 *    apuntar a produccion de la API sin validarlo antes (politica interna).
 *  - No se loguea el body de las requests (podria contener la contrasena
 *    del usuario en el login).
 *
 * Uso: node server.js   (variables de entorno opcionales, ver .env.example)
 */

import http from "node:http";

const PORT = Number(process.env.PORT || 4000);
const API_BASE = (process.env.MININGCONTROL_API_BASE || "https://aura-aranzazu-dataapi.miningcontrol.cloud").replace(/\/$/, "");
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

function setCors(res, origin) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN === "*" ? "*" : (origin || ALLOWED_ORIGIN));
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");
}

const server = http.createServer(async (req, res) => {
  setCors(res, req.headers.origin);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, target: API_BASE }));
    return;
  }

  if (!req.url.startsWith("/api/v1/")) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;

  const forwardHeaders = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (["host", "origin", "referer", "content-length", "connection"].includes(k.toLowerCase())) continue;
    forwardHeaders[k] = v;
  }

  const targetUrl = API_BASE + req.url;

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : body,
    });
    const buf = Buffer.from(await upstream.arrayBuffer());
    if (!upstream.ok) {
      // Solo para depuracion local: se imprime el CUERPO DE LA RESPUESTA del
      // upstream (nunca el body de la request, que podria traer la password
      // del login). Util mientras se confirman parametros/columnas pendientes
      // (ver .claude/knowledge-base/data-sources.md). Quitar antes de produccion.
      console.error(
        "[proxy] upstream respondio " + upstream.status + " para " + req.method + " " + req.url +
        "\n  body: " + buf.toString("utf8").slice(0, 500),
      );
    } else if (req.url.includes("/api/v1/transport_report")) {
      // DIAGNOSTICO TEMPORAL (2026-07-21): transport_report esta devolviendo
      // 200 OK pero con 0 filas para fechas donde el usuario confirma que ya
      // hay viajes reales cargados. Como esto no es un error HTTP, el log de
      // arriba no se activa. Este log si se activa siempre para
      // transport_report (exito o no) para ver la URL exacta que se mando y
      // el tamano real de la respuesta. Quitar una vez resuelto.
      console.log(
        "[proxy][transport_report] " + req.method + " " + req.url +
        " -> HTTP " + upstream.status + ", body " + buf.length + " bytes" +
        "\n  preview: " + buf.toString("utf8").slice(0, 300),
      );
    }
    res.writeHead(upstream.status, {
      "Content-Type": upstream.headers.get("content-type") || "application/json",
    });
    res.end(buf);
  } catch (err) {
    console.error("[proxy] error contactando " + targetUrl + ":", err.message);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "No se pudo contactar la API de MiningControl", detail: err.message }));
  }
});

server.listen(PORT, () => {
  console.log("Proxy escuchando en http://localhost:" + PORT);
  console.log("Reenviando a: " + API_BASE);
  console.log("Origen permitido (CORS): " + ALLOWED_ORIGIN);
});
