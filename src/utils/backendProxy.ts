export async function fetchWithLoadBalancer(endpoint: string, options: RequestInit = {}) {
  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
  const isDev = isLocal || 
    process.env.NODE_ENV === "development" || 
    process.env.NEXT_PUBLIC_ENV === "development";

  const cleanUrl = (url: string) => (url || "").trim().replace(/^["']|["']$/g, "");
  const urls = (process.env.NEXT_PUBLIC_BACKEND_URLS || "").split(",").map(cleanUrl).filter(Boolean);

  const localBackend = urls.find(u => u.includes("localhost")) || "http://localhost:8000";
  const portalAuthHost = cleanUrl(process.env.NEXT_PUBLIC_PORTAL_AUTH_URL || "");

  const isPortalAuthEndpoint = endpoint === "/portal/captcha" || endpoint === "/portal/login";
  let targetUrl = isDev
    ? localBackend
    : (isPortalAuthEndpoint && portalAuthHost)
    ? portalAuthHost
    : urls[0] || localBackend;

  if (targetUrl.endsWith('/')) {
    targetUrl = targetUrl.slice(0, -1);
  }

  const fullUrl = `${targetUrl}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}
