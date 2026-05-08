async function sha256hex(data) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSign(secret, timestamp, body) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bodyHash = await sha256hex(body);
  const message = `${timestamp}.${bodyHash}`;
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const hex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${hex}`;
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const env = globalThis;
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

  if (path === "/" || path === "") {
    return new Response(
      JSON.stringify({
        status: "online",
        message: "ratio'd proxy is active",
      }),
      {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      },
    );
  }

  if (path === "/pyq-proxy") {
    const targetPath = url.searchParams.get("path");
    if (!targetPath)
      return new Response("Missing path", { status: 400, headers: cors });

    const srmUrl = new URL(`https://srm-pyq-api.onrender.com${targetPath}`);
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
    return new Response(
      JSON.stringify({
        error: "nice try hackerman",
        message: "better luck next time ;)",
      }),
      {
        status: 403,
        headers: { ...cors, "Content-Type": "application/json" },
      },
    );
  }

  const backends = (env.BACKEND_URLS || "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  const timestamp = Math.floor(Date.now() / 1000);
  let bodyText = "";
  if (request.method === "POST") {
    bodyText = await request.text();
  }

  const signature = await hmacSign(env.HMAC_SECRET || "", timestamp, bodyText);

  for (const base of backends) {
    try {
      const targetUrl = new URL(base);
      targetUrl.pathname = path;
      targetUrl.search = url.search;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(targetUrl.toString(), {
        method: request.method,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-Ratio-Sig": signature,
        },
        body: request.method === "POST" ? bodyText : null,
      });

      clearTimeout(timeout);

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
