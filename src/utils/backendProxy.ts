export async function fetchWithLoadBalancer(endpoint: string, options: RequestInit = {}) {
  const isDev = process.env.NEXT_PUBLIC_ENV === "development";
  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
  const directBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URLS?.split(",")[0] || "http://localhost:8000";

  const targetUrl = isDev ? directBackendUrl : workerUrl;

  if (!targetUrl) {
    throw new Error("Target URL (Worker or Backend) not set");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(`${targetUrl}${endpoint}`, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}
