export async function fetchWithLoadBalancer(endpoint: string, options: RequestInit = {}) {
  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;

  if (!workerUrl) {
    throw new Error("NEXT_PUBLIC_WORKER_URL not set");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(`${workerUrl}${endpoint}`, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}
