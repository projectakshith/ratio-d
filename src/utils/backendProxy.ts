export async function fetchWithLoadBalancer(endpoint: string, options: RequestInit = {}) {
  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
  const isDev = isLocal || 
    process.env.NODE_ENV === "development" || 
    process.env.NEXT_PUBLIC_ENV === "development";

  const urls = (process.env.NEXT_PUBLIC_BACKEND_URLS || "").split(",").filter(Boolean);
  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
  
  const localBackend = urls.find(u => u.includes("localhost")) || "http://localhost:8000";
  let targetUrl = isDev ? localBackend : (workerUrl || urls[0] || localBackend);

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
