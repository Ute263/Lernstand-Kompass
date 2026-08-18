/**
 * Lernstand-Kompass Klassen-Sync – Cloudflare Worker + D1
 *
 * D1 binding: DB
 * Daten werden clientseitig AES-GCM-verschlüsselt. Der Worker erhält nur
 * einen SHA-256-basierten Bucket-Token und verschlüsselte Nutzdaten.
 */

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "lernstand-kompass-sync", time: new Date().toISOString() }, 200, cors);
    }

    if (url.pathname === "/v1/sessions") {
      const bucket = bearerToken(request);
      if (!validBucket(bucket)) return json({ error: "unauthorized" }, 401, cors);

      if (request.method === "POST") {
        const body = await request.json().catch(() => null);
        if (!body?.id || !body?.payload?.iv || !body?.payload?.data || body?.payload?.v !== 1) {
          return json({ error: "invalid_payload" }, 400, cors);
        }
        const id = String(body.id).slice(0, 160);
        const createdAt = typeof body.createdAt === "string" ? body.createdAt.slice(0, 64) : new Date().toISOString();
        const payload = JSON.stringify(body.payload);
        await env.DB.prepare(`
          INSERT INTO learning_sessions (bucket, id, created_at, payload)
          VALUES (?1, ?2, ?3, ?4)
          ON CONFLICT(bucket, id) DO UPDATE SET
            created_at = excluded.created_at,
            payload = excluded.payload
        `).bind(bucket, id, createdAt, payload).run();
        return json({ ok: true, id }, 200, cors);
      }

      if (request.method === "GET") {
        const result = await env.DB.prepare(`
          SELECT id, created_at, payload
          FROM learning_sessions
          WHERE bucket = ?1
          ORDER BY created_at ASC
          LIMIT 1000
        `).bind(bucket).all();
        return json({
          ok: true,
          items: (result.results || []).map((row) => ({
            id: row.id,
            createdAt: row.created_at,
            payload: safeJson(row.payload)
          }))
        }, 200, cors);
      }
    }

    return json({ error: "not_found" }, 404, cors);
  }
};

function bearerToken(request) {
  const header = request.headers.get("Authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function validBucket(value) {
  return /^[A-Za-z0-9_-]{40,64}$/.test(value || "");
}

function safeJson(value) {
  try { return JSON.parse(value); } catch { return null; }
}

function json(value, status, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders }
  });
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
