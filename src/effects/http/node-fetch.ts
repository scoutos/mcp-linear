/**
 * HTTP effect implementation using cross-fetch
 */
import fetch from "cross-fetch";

/**
 * HTTP request options
 */
export type HttpRequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

/**
 * HTTP response
 */
export type HttpResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  json: <T = any>() => Promise<T>;
  text: () => Promise<string>;
};

/**
 * HTTP effect interface
 */
export interface HttpEffect {
  fetch: (url: string, options?: HttpRequestOptions) => Promise<HttpResponse>;
}

/**
 * Perform an HTTP request using cross-fetch
 */
async function fetchWithCrossFetch(
  url: string,
  options: HttpRequestOptions = {},
): Promise<HttpResponse> {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: options.headers || {},
    body: options.body,
  });

  // Convert headers to a plain object
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    status: response.status,
    statusText: response.statusText,
    headers,
    json: async <T = any>() => await response.json() as T,
    text: async () => await response.text(),
  };
}

/**
 * Node fetch implementation of the HTTP effect
 */
export const nodeFetch: HttpEffect = {
  fetch: fetchWithCrossFetch,
};
