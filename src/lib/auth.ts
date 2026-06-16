/**
 * GlowTales Client-Side Authentication Proxy utility to securely bridge 
 * Google AI Studio's dynamic iframe tokens into downstream API requests.
 */

export function searchAndStoreApiKey(): string | null {
  if (typeof window === "undefined") return null;

  const potentialKeys = [
    "apiKey", "apikey", "key", "api-key", "api_key",
    "token", "accessToken", "access_token",
    "geminiApiKey", "gemini_api_key", "gemini-api-key"
  ];

  try {
    // 1. Try to read from URL Search Parameters (e.g., ?apiKey=... or ?token=...)
    const searchParams = new URLSearchParams(window.location.search);
    for (const keyName of potentialKeys) {
      const searchKey = searchParams.get(keyName);
      if (searchKey && searchKey.trim()) {
        const trimmed = searchKey.trim();
        sessionStorage.setItem("gemini_api_key", trimmed);
        console.log(`[GlowTales Auth Proxy] Recovered dynamic credential key from URL parameter [${keyName}]`);
        return trimmed;
      }
    }

    // 2. Try to read from Hash parameters
    const hash = window.location.hash;
    if (hash && hash.startsWith("#")) {
      const hashParams = new URLSearchParams(hash.substring(1));
      for (const keyName of potentialKeys) {
        const hashKey = hashParams.get(keyName);
        if (hashKey && hashKey.trim()) {
          const trimmed = hashKey.trim();
          sessionStorage.setItem("gemini_api_key", trimmed);
          console.log(`[GlowTales Auth Proxy] Recovered dynamic credential key from Anchor hash [${keyName}]`);
          return trimmed;
        }
      }
    }
  } catch (err) {
    console.warn("[GlowTales Auth] Failed parsing window location parameters:", err);
  }

  // 3. Fallback to storage
  try {
    const stored = sessionStorage.getItem("gemini_api_key");
    if (stored && stored.trim()) {
      return stored.trim();
    }
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
