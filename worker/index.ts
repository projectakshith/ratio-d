async function hmacSign(secret: string, timestamp: number, body: string, method: string, path: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const data = `${method}:${path}:${timestamp}:${body}`;
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

addEventListener("fetch", (event: any) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request): Promise<Response> {
  const env = (globalThis as any);
  const cors = {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Ratio-Sig, X-Ratio-TS",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/pyq-proxy") {
    const targetPath = url.searchParams.get("path");
    if (!targetPath) return new Response("Missing path", { status: 400, headers: cors });
    
    const srmUrl = new URL(`https://srm-pyq-api.onrender.com/${targetPath}`);
    url.searchParams.forEach((v, k) => {
      if (k !== "path") srmUrl.searchParams.set(k, v);
    });

    const res = await fetch(srmUrl.toString());
    const newRes = new Response(res.body, res);
    Object.entries(cors).forEach(([k, v]) => newRes.headers.set(k, v));
    return newRes;
  }

  const allowed = ["/login", "/refresh", "/version"];
  if (!allowed.includes(path)) {
    return new Response(JSON.stringify({ 
      error: "nice try hackerman", 
      message: "better luck next time ;)" 
    }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const backends = (env.BACKEND_URLS || "").split(",").map((u: string) => u.trim()).filter(Boolean);
  const timestamp = Date.now();
  let bodyText = "";
  if (request.method === "POST") {
    bodyText = await request.text();
  }

  const signature = await hmacSign(env.HMAC_SECRET || "", timestamp, bodyText, request.method, path);

  for (const base of backends) {
    try {
      const targetUrl = new URL(base);
      targetUrl.pathname = path;
      targetUrl.search = url.search;

      const res = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: {
          "Content-Type": "application/json",
          "X-Ratio-Sig": signature,
          "X-Ratio-TS": timestamp.toString(),
        },
        body: request.method === "POST" ? bodyText : null,
      });

      if (res.ok || res.status < 500) {
        const newRes = new Response(res.body, res);
        Object.entries(cors).forEach(([k, v]) => newRes.headers.set(k, v));
        return newRes;
      }
    } catch (e) {
      continue;
    }
  }

  return new Response(JSON.stringify({ error: "all backends unavailable" }), {
    status: 503,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
