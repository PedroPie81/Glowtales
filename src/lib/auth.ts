/**
 * GlowTales Client-Side Authentication Proxy utility to securely bridge 
 * Google AI Studio's dynamic iframe tokens into downstream API requests.
 */

export function searchAndStoreApiKey(): string | null {
  if (typeof window === "undefined") return null;

  try {
    // 1. Try to read from URL Search Parameters (e.g., ?apiKey=... or ?token=...)
    const searchParams = new URLSearchParams(window.location.search);
    const searchKey = searchParams.get("apiKey") || searchParams.get("apikey") || searchParams.get("token");
    if (searchKey) {
      sessionStorage.setItem("gemini_api_key", searchKey);
      return searchKey;
    }

    // 2. Try to read from Hash parameters
    const hash = window.location.hash;
    if (hash && hash.startsWith("#")) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const hashKey = hashParams.get("apiKey") || hashParams.get("apikey") || hashParams.get("token");
      if (hashKey) {
        sessionStorage.setItem("gemini_api_key", hashKey);
        return hashKey;
      }
    }
  } catch (err) {
    console.warn("[Auth Linker] Failed parsing window location parameters:", err);
  }

  // 3. Fallback to storage
  try {
    const stored = sessionStorage.getItem("gemini_api_key");
    if (stored) return stored;
  } catch (err) {
    // Ignore restricted storage issues in private sessions
  }

  return null;
}

export function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  const key = searchAndStoreApiKey();
  if (key) {
    // Dynamically inject the bearer token so our backend can hot-swap it securely
    headers["Authorization"] = `Bearer ${key}`;
  }

  return headers;
}
