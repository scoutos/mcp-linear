/**
 * HTTP effects types and exports
 */

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
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  json: <T = unknown>() => Promise<T>;
  text: () => Promise<string>;
};

/**
 * HTTP effect interface
 */
export interface HTTPEffect {
  fetch: (url: string, options?: HttpRequestOptions) => Promise<HttpResponse>;
}

export * from "./deno-fetch.ts";
export * from "./in-memory.ts";
