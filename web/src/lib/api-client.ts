/**
 * API client with retry logic, caching, and error handling.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTTL?: number;
  timeout?: number;
}

interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate cache key from URL and options
 */
function getCacheKey(url: string, options?: RequestConfig): string {
  return `${options?.method || "GET"}:${url}`;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cacheEntry: { timestamp: number }, ttl: number): boolean {
  return Date.now() - cacheEntry.timestamp < ttl;
}

/**
 * Create an AbortController with timeout
 */
function createTimeoutController(timeout: number): {
  controller: AbortController;
  timeoutId: NodeJS.Timeout;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return { controller, timeoutId };
}

/**
 * Main API fetch function with retries and caching
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestConfig = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    retries = 3,
    retryDelay = 1000,
    cache: useCache = method === "GET",
    cacheTTL = CACHE_TTL,
    timeout = 30000,
  } = options;

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
  const cacheKey = getCacheKey(url, options);

  // Check cache for GET requests
  if (useCache && method === "GET") {
    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached, cacheTTL)) {
      return cached.data as T;
    }
  }

  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { controller, timeoutId } = createTimeoutController(timeout);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error: ApiError = new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
        error.status = response.status;
        try {
          error.data = await response.json();
        } catch {
          // Response not JSON
        }

        // Don't retry 4xx errors (except 429)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw error;
        }

        throw error;
      }

      const data = await response.json();

      // Cache successful GET requests
      if (useCache && method === "GET") {
        cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data as T;
    } catch (error) {
      lastError = error as ApiError;

      // Don't retry if aborted or client error
      if (
        (error as Error).name === "AbortError" ||
        (lastError.status && lastError.status >= 400 && lastError.status < 500 && lastError.status !== 429)
      ) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        console.warn(`API request failed, retrying in ${delay}ms...`, error);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error("API request failed");
}

/**
 * Clear cache for a specific endpoint or all cache
 */
export function clearCache(endpoint?: string): void {
  if (endpoint) {
    const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
    cache.delete(`GET:${url}`);
  } else {
    cache.clear();
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  get: <T = unknown>(endpoint: string, config?: Omit<RequestConfig, "method" | "body">) =>
    apiFetch<T>(endpoint, { ...config, method: "GET" }),

  post: <T = unknown>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, "method">) =>
    apiFetch<T>(endpoint, { ...config, method: "POST", body, cache: false }),

  put: <T = unknown>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, "method">) =>
    apiFetch<T>(endpoint, { ...config, method: "PUT", body, cache: false }),

  patch: <T = unknown>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, "method">) =>
    apiFetch<T>(endpoint, { ...config, method: "PATCH", body, cache: false }),

  delete: <T = unknown>(endpoint: string, config?: Omit<RequestConfig, "method" | "body">) =>
    apiFetch<T>(endpoint, { ...config, method: "DELETE", cache: false }),
};

/**
 * React hook for API calls with loading and error states
 */
export function useApi<T>(
  endpoint: string | null,
  config?: RequestConfig
): {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: () => Promise<void>;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(!!endpoint);

  const fetchData = React.useCallback(async () => {
    if (!endpoint) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiFetch<T>(endpoint, config);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [endpoint, config]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}

// Import React for the hook
import React from "react";

export default api;
