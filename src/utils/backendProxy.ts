export async function fetchWithLoadBalancer(endpoint: string, options: RequestInit = {}) {
  const urlsString = process.env.BACKEND_URLS || process.env.API_URL || "";
  const urls = urlsString
    .split(",")
    .map(url => url.trim())
    .filter(Boolean);

  if (urls.length === 0) {
    throw new Error("No backend URLs configured.");
  }

  const shuffledUrls = [...urls].sort(() => Math.random() - 0.5);

  let lastError: any = null;

  for (const baseUrl of shuffledUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); 

      const res = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          "X-App-Secret": process.env.INTERNAL_SECRET || "",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return res;
      }
      
      lastError = new Error(`Server ${baseUrl} responded with status ${res.status}`);
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError;
}
