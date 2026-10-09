const BA_TZ = "America/Argentina/Buenos_Aires";
const BUCKET_MS = 30000;
const RATE_MS = 20000;
const SELF_DAILY_CAP = 30;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PUT,OPTIONS",
      "access-control-allow-headers": "content-type,x-acceso"
    }
  });
}

function text(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "access-control-allow-origin": "*"
    }
  });
}

function err(code, status = 400) {
  return json({ ok: false, error: code }, status);
}

async function readBody(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function uid() {
  const b = new Uint8Array(12);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function code6() {
  const b = new Uint8Array(4);
  crypto.getRandomValues(b);
  const n =
    ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
  return String(100000 + (n % 900000));
}

async function sha256hex(s) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(s)
  );
  return [...new Uint8Array(buf)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

function bucketNow(offset = 0) {
  return Math.floor((Date.now() + offset) / BUCKET_MS);
}

function slugify(nombre) {
  const base = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return base || "comercio";
}

function hoyBA() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: BA_TZ });
}

async function verificarAcceso(env, comercio, acceso) {
  if (!acceso) return false;
  const h = await sha256hex(comercio.id + ":" + acceso);
  return h === comercio.acceso_hash;
}

async function payloadQR(env, comercioId, offset = 0) {
  const bucket = bucketNow(offset);
  const sig = await hmacHex(
    env.SELLO_SECRET,
    comercioId + "." + bucket
  );
  return `MS1|${comercioId}|${bucket}|${sig}`;
}

async function verificarPayload(env, comercioId, payload) {
  if (typeof payload !== "string") return false;
  const parts = payload.split("|");
  if (parts.length !== 4 || parts[0] !== "MS1" || parts[1] !== comercioId)
    return false;
  const bucket = Number(parts[2]);
  if (!Number.isInteger(bucket)) return false;
  const drift = bucket - bucketNow();
  if (drift < -1 || drift > 1) return false;
  const esperado = await hmacHex(env.SELLO_SECRET, comercioId + "." + bucket);
  if (esperado.length !== parts[3].length) return false;
  let diff = 0;
  for (let i = 0; i < esperado.length; i++)
    diff |= esperado.charCodeAt(i) ^ parts[3].charCodeAt(i);
  return diff === 0;
}

async function crearComercio(env, body) {
  const nombre = String(body.nombre || "").trim().slice(0, 60);
  if (!nombre) return err("falta_nombre");
  const premio = String(body.premio || "").trim().slice(0, 80) || null;
  const meta = Math.min(12, Math.max(2, Number(body.meta_sellos) || 8));
  const acceso = code6();
  const id = uid();
  const slug = slugify(nombre) + "-" + uid().slice(0, 4);
  const created_at = new Date().toISOString();
  const acceso_hash = await sha256hex(id + ":" + acceso);
  await env.DB.prepare(
    "INSERT INTO comercios (id, nombre, slug, acceso_hash, premio, meta_sellos, created_at, activo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)"
  )
    .bind(id, nombre, slug, acceso_hash, premio, meta, created_at)
    .run();
  return json({ ok: true, id, slug, acceso, nombre, premio, meta_sellos: meta });
}

async function validarPanel(env, req, comercioId) {
  const acceso = req.headers.get("x-acceso") || "";
  const r = await env.DB.prepare(
    "SELECT * FROM comercios WHERE id = ? AND activo = 1"
  )
    .bind(comercioId)
    .first();
  if (!r) return { error: "no_existe" };
  if (!(await verificarAcceso(env, r, acceso))) return { error: "acceso_rechazado" };
  return { comercio: r };
}

async function datosPanel(env, comercio) {
  const hoy = hoyBA();
  const tarjetas = await env.DB.prepare(
    "SELECT id, created_at, sello_count, canjeada_at FROM tarjetas WHERE comercio_id = ? ORDER BY created_at DESC LIMIT 50"
  )
    .bind(comercio.id)
    .all();
  const sellosHoy = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM sellos WHERE comercio_id = ? AND stamped_at LIKE ?"
  )
    .bind(comercio.id, hoy + "%")
    .first();
  const activas = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM tarjetas WHERE comercio_id = ? AND canjeada_at IS NULL"
  )
    .bind(comercio.id)
    .first();
  return json({
    ok: true,
    comercio: {
      id: comercio.id,
      nombre: comercio.nombre,
      slug: comercio.slug,
      premio: comercio.premio,
      meta_sellos: comercio.meta_sellos
    },
    sellos_hoy: sellosHoy ? sellosHoy.n : 0,
    tarjetas_activas: activas ? activas.n : 0,
    tarjetas: tarjetas.results || []
  });
}

async function crearTarjeta(env, req, comercioId) {
  const v = await validarPanel(env, req, comercioId);
  if (v.error) return err(v.error, v.error === "acceso_rechazado" ? 403 : 404);
  const id = uid();
  await env.DB.prepare(
    "INSERT INTO tarjetas (id, comercio_id, created_at, sello_count) VALUES (?, ?, ?, 0)"
  )
    .bind(id, comercioId, new Date().toISOString())
    .run();
  return json({ ok: true, id });
}

async function verTarjeta(env, req) {
  const url = new URL(req.url);
  const id = url.searchParams.get("t") || "";
  if (!id) return err("falta_t");
  const tarjeta = await env.DB.prepare(
    "SELECT t.*, c.nombre AS c_nombre, c.premio AS c_premio, c.meta_sellos AS c_meta, c.slug AS c_slug FROM tarjetas t JOIN comercios c ON c.id = t.comercio_id WHERE t.id = ?"
  )
    .bind(id)
    .first();
  if (!tarjeta) return err("no_existe", 404);
  return json({
    ok: true,
    id: tarjeta.id,
    sello_count: tarjeta.sello_count,
    canjeada: !!tarjeta.canjeada_at,
    comercio: {
      nombre: tarjeta.c_nombre,
      premio: tarjeta.c_premio,
      meta_sellos: tarjeta.c_meta,
      slug: tarjeta.c_slug
    },
    completa: tarjeta.sello_count >= tarjeta.c_meta
  });
}

async function sellar(env, req, body) {
  const tarjetaId = String(body.tarjeta_id || "");
  if (!tarjetaId) return err("falta_tarjeta");
  const tarjeta = await env.DB.prepare(
    "SELECT t.*, c.acceso_hash AS c_hash, c.meta_sellos AS c_meta, c.activo AS c_activo FROM tarjetas t JOIN comercios c ON c.id = t.comercio_id WHERE t.id = ?"
  )
    .bind(tarjetaId)
    .first();
  if (!tarjeta) return err("no_existe", 404);
  if (!tarjeta.c_activo) return err("comercio_inactivo", 403);
  if (tarjeta.canjeada_at) return err("ya_canjeada", 409);

  let mode = "cliente";
  if (body.payload) {
    if (!(await verificarPayload(env, tarjeta.comercio_id, body.payload)))
      return err("qr_invalido", 403);
  } else if (body.acceso) {
    mode = "self";
    const h = await sha256hex(tarjeta.comercio_id + ":" + body.acceso);
    if (h !== tarjeta.c_hash) return err("acceso_rechazado", 403);
    const hoy = hoyBA();
    const propio = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM sellos WHERE comercio_id = ? AND mode = 'self' AND stamped_at LIKE ?"
    )
      .bind(tarjeta.comercio_id, hoy + "%")
      .first();
    if (propio && propio.n >= SELF_DAILY_CAP) return err("tope_self_dia", 429);
  } else {
    return err("falta_payload");
  }

  const stampId =
    mode === "cliente"
      ? tarjetaId + "|" + String(body.payload).split("|")[2]
      : uid();
  const existente = await env.DB.prepare(
    "SELECT id FROM sellos WHERE tarjeta_id = ? AND id = ?"
  )
    .bind(tarjetaId, stampId)
    .first();
  if (existente)
    return json({
      ok: true,
      repetido: true,
      sello_count: tarjeta.sello_count,
      completa: tarjeta.sello_count >= tarjeta.c_meta
    });

  const ultimo = await env.DB.prepare(
    "SELECT stamped_at FROM sellos WHERE tarjeta_id = ? ORDER BY stamped_at DESC LIMIT 1"
  )
    .bind(tarjetaId)
    .first();
  if (ultimo) {
    const dt = Date.now() - Date.parse(ultimo.stamped_at);
    if (dt < RATE_MS) return err("muy_seguido", 429);
  }

  const stamped_at = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO sellos (id, tarjeta_id, comercio_id, mode, stamped_at) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(stampId, tarjetaId, tarjeta.comercio_id, mode, stamped_at)
    .run();
  const nuevo = await env.DB.prepare(
    "UPDATE tarjetas SET sello_count = sello_count + 1 WHERE id = ? RETURNING sello_count"
  )
    .bind(tarjetaId)
    .first();
  const count = nuevo ? nuevo.sello_count : tarjeta.sello_count + 1;
  return json({
    ok: true,
    sello_count: count,
    completa: count >= tarjeta.c_meta
  });
}

async function canjear(env, req, body) {
  const tarjetaId = String(body.tarjeta_id || "");
  if (!tarjetaId) return err("falta_tarjeta");
  const tarjeta = await env.DB.prepare(
    "SELECT t.*, c.acceso_hash AS c_hash, c.meta_sellos AS c_meta FROM tarjetas t JOIN comercios c ON c.id = t.comercio_id WHERE t.id = ?"
  )
    .bind(tarjetaId)
    .first();
  if (!tarjeta) return err("no_existe", 404);
  const acceso = req.headers.get("x-acceso") || "";
  const h = await sha256hex(tarjeta.comercio_id + ":" + acceso);
  if (h !== tarjeta.c_hash) return err("acceso_rechazado", 403);
  if (tarjeta.canjeada_at) return err("ya_canjeada", 409);
  if (tarjeta.sello_count < tarjeta.c_meta) return err("incompleta", 409);
  const ahora = new Date().toISOString();
  await env.DB.prepare(
    "UPDATE tarjetas SET canjeada_at = ? WHERE id = ?"
  )
    .bind(ahora, tarjetaId)
    .run();
  return json({ ok: true, canjeada_at: ahora });
}

const api = {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const method = req.method;

    if (method === "OPTIONS") return text(null, 204);

    try {
      if (method === "GET" && (path === "/" || path === "/api"))
        return json({
          ok: true,
          svc: "mis-sellos-api",
          rutas: [
            "GET /api/ping",
            "POST /api/comercios",
            "POST /api/comercios/acceso",
            "GET /api/comercios/:id",
            "GET /api/comercios/:id/token",
            "POST /api/comercios/:id/tarjetas",
            "GET /api/tarjeta?t=...",
            "POST /api/sello",
            "POST /api/canje"
          ]
        });

      if (method === "GET" && path === "/api/ping")
        return json({ ok: true, svc: "mis-sellos" });

      if (method === "POST" && path === "/api/comercios")
        return await crearComercio(env, await readBody(req));

      if (method === "POST" && path === "/api/comercios/acceso") {
        const body = await readBody(req);
        const ref = String(body.id || body.slug || "");
        if (!ref) return err("falta_id");
        const r = await env.DB.prepare(
          "SELECT * FROM comercios WHERE (id = ? OR slug = ?) AND activo = 1"
        )
          .bind(ref, ref)
          .first();
        if (!r) return err("no_existe", 404);
        if (!(await verificarAcceso(env, r, String(body.acceso || ""))))
          return err("acceso_rechazado", 403);
        return json({
          ok: true,
          comercio: {
            id: r.id,
            nombre: r.nombre,
            slug: r.slug,
            premio: r.premio,
            meta_sellos: r.meta_sellos
          }
        });
      }

      const mPanel = path.match(/^\/api\/comercios\/([a-f0-9]+)$/);
      if (method === "GET" && mPanel) {
        const v = await validarPanel(env, req, mPanel[1]);
        if (v.error)
          return err(v.error, v.error === "acceso_rechazado" ? 403 : 404);
        return await datosPanel(env, v.comercio);
      }

      const mToken = path.match(/^\/api\/comercios\/([a-f0-9]+)\/token$/);
      if (method === "GET" && mToken) {
        const v = await validarPanel(env, req, mToken[1]);
        if (v.error)
          return err(v.error, v.error === "acceso_rechazado" ? 403 : 404);
        const payload = await payloadQR(env, v.comercio.id);
        return json({
          ok: true,
          payload,
          bucket: bucketNow(),
          expira_en: BUCKET_MS - (Date.now() % BUCKET_MS)
        });
      }

      const mTarjetas = path.match(/^\/api\/comercios\/([a-f0-9]+)\/tarjetas$/);
      if (method === "POST" && mTarjetas)
        return await crearTarjeta(env, req, mTarjetas[1]);

      if (method === "GET" && path === "/api/tarjeta")
        return await verTarjeta(env, req);

      if (method === "POST" && path === "/api/sello")
        return await sellar(env, req, await readBody(req));

      if (method === "POST" && path === "/api/canje")
        return await canjear(env, req, await readBody(req));

      return json({ ok: false, error: "no_encontrado", method, path }, 404);
    } catch (e) {
      return json(
        { ok: false, error: "error_interno", detail: String((e && e.message) || e) },
        500
      );
    }
  }
};

export default api;
