/**
 * HTTP effect implementation using Deno's built-in fetch
 */
import { HTTPEffect, HttpRequestOptions, HttpResponse } from "./mod.ts";

/**
 * Perform an HTTP request using Deno's built-in fetch
 */
async function doFetch(
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
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers,
    json: async <T = unknown>() => await response.json() as T,
    text: async () => await response.text(),
  };
}

/**
 * Deno fetch implementation of the HTTP effect
 */
export const denoFetch: HTTPEffect = {
  fetch: doFetch,
};
