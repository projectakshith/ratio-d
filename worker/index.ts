export interface Env {
  BACKEND_URLS: string;
  HMAC_SECRET: string;
  ALLOWED_ORIGIN: string;
}

const CACHE_TTL = 10 * 60;

async function hmacSign(secret: string, timestamp: number, bodyHash: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const message = `${timestamp}.${bodyHash}`;
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getBackends(env: Env): string[] {
  return env.BACKEND_URLS.split(",").map((u) => u.trim()).filter(Boolean);
}

async function forwardToBackend(
  backends: string[],
  path: string,
  body: string,
  env: Env
): Promise<Response> {
  const timestamp = Math.floor(Date.now() / 1000);
  const bodyHash = await sha256Hex(body);
  const sig = await hmacSign(env.HMAC_SECRET, timestamp, bodyHash);

  const shuffled = [...backends].sort(() => Math.random() - 0.5);
  let lastErr: unknown;

  for (const base of shuffled) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Ratio-Sig": `t=${timestamp},v1=${sig}`,
        },
        body,
        signal: AbortSignal.timeout(20000),
      });

      if (res.ok || (res.status >= 400 && res.status < 500)) return res;

      lastErr = new Error(`${base} returned ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr;
}

function corsHeaders(origin: string, allowed: string): HeadersInit {
  const isAllowed =
    origin === allowed ||
    origin === `www.${allowed.replace("https://", "")}` ||
    origin === "http://localhost:3000";

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";
    const cors = corsHeaders(origin, env.ALLOWED_ORIGIN);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (!["/login", "/refresh", "/version"].includes(path)) {
      return new Response("not found", { status: 404, headers: cors });
    }

    if (request.method !== "POST" && path !== "/version") {
      return new Response("method not allowed", { status: 405, headers: cors });
    }

    if (path === "/version") {
      const backends = getBackends(env);
      try {
        const res = await forwardToBackend(backends, "/version", "", env);
        const data = await res.text();
        return new Response(data, {
          status: res.status,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ error: "backend unavailable" }), {
          status: 503,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    const body = await request.text();

    if (path === "/refresh") {
      const cacheKey = new Request(`https://ratio-cache${path}/${await sha256Hex(body)}`);
      const cached = await caches.default.match(cacheKey);
      if (cached) {
        return new Response(cached.body, {
          status: 200,
          headers: { ...cors, "Content-Type": "application/json", "X-Cache": "HIT" },
        });
      }

      const backends = getBackends(env);
      let backendRes: Response;
      try {
        backendRes = await forwardToBackend(backends, path, body, env);
      } catch {
        return new Response(JSON.stringify({ error: "all backends unavailable" }), {
          status: 503,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const responseBody = await backendRes.text();
      const response = new Response(responseBody, {
        status: backendRes.status,
        headers: { ...cors, "Content-Type": "application/json", "X-Cache": "MISS" },
      });

      if (backendRes.ok) {
        const toCache = new Response(responseBody, {
          headers: { "Cache-Control": `max-age=${CACHE_TTL}` },
        });
        ctx.waitUntil(caches.default.put(cacheKey, toCache));
      }

      return response;
    }

    const backends = getBackends(env);
    try {
      const backendRes = await forwardToBackend(backends, path, body, env);
      const responseBody = await backendRes.text();
      return new Response(responseBody, {
        status: backendRes.status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "all backends unavailable" }), {
        status: 503,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  },
};
