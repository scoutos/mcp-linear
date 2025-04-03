/**
 * In-memory implementation of the HTTP effect for testing
 */
import { HTTPEffect, HttpRequestOptions, HttpResponse } from "./mod.ts";

/**
 * HTTP handler function type
 */
export type HttpHandler = (
  url: string,
  options?: HttpRequestOptions,
) => Promise<Response>;

/**
 * Options for creating an in-memory HTTP effect
 */
export type InMemoryHttpOptions = {
  responses?: Map<string, HttpHandler>;
  responseDelay?: number;
};

/**
 * Create an in-memory HTTP effect for testing
 *
 * @param options Options for configuring the in-memory HTTP effect
 * @returns An HTTP effect that returns pre-configured responses
 */
export function createInMemoryHTTP(
  options: InMemoryHttpOptions = {},
): HTTPEffect {
  const responses = options.responses || new Map<string, HttpHandler>();
  const responseDelay = options.responseDelay || 0;

  return {
    async fetch(
      url: string,
      requestOptions?: HttpRequestOptions,
    ): Promise<HttpResponse> {
      // Find a matching response handler
      let handler: HttpHandler | undefined;

      // Try exact URL match first
      if (responses.has(url)) {
        handler = responses.get(url);
      } else {
        // Otherwise, try domain match as a fallback
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        if (responses.has(domain)) {
          handler = responses.get(domain);
        }
      }

      // If no handler found, return a 404
      if (!handler) {
        return createHttpResponse(
          new Response(
            JSON.stringify({ error: "Not Found" }),
            {
              status: 404,
              statusText: "Not Found",
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }

      // Simulate network delay if configured
      if (responseDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, responseDelay));
      }

      // Get the response from the handler
      const response = await handler(url, requestOptions);

      return createHttpResponse(response);
    },
  };
}

/**
 * Convert a standard Response to our HttpResponse type
 */
function createHttpResponse(response: Response): HttpResponse {
  // Convert headers to a plain object
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Clone the response for each potential consumption
  const responseClone1 = response.clone();
  const responseClone2 = response.clone();

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers,
    json: async <T = unknown>() => await responseClone1.json() as T,
    text: async () => await responseClone2.text(),
  };
}
