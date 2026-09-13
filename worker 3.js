const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: JSON_HEADERS
  });
}

async function healthCheck(env) {
  if (!env.DB) {
    return jsonResponse({
      ok: false,
      db: "missing-binding",
      message: "D1 binding DB ist nicht verfuegbar."
    }, 500);
  }

  const ping = await env.DB.prepare("SELECT 1 AS ok").first();
  const tables = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  ).all();

  return jsonResponse({
    ok: ping?.ok === 1,
    db: "connected",
    tables: (tables.results || []).map((row) => row.name),
    tableCount: (tables.results || []).length
  });
}

async function handleApi(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/api/health" && request.method === "GET") {
    try {
      return await healthCheck(env);
    } catch (error) {
      return jsonResponse({
        ok: false,
        db: "error",
        message: error?.message || "D1-Test fehlgeschlagen."
      }, 500);
    }
  }

  return jsonResponse({
    ok: false,
    message: "API-Endpunkt nicht gefunden."
  }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
