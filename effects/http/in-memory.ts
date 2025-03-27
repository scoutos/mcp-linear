import { HTTPEffect } from "./index.ts";

/**
 * Options for creating an in-memory HTTP effect
 */
export type InMemoryHTTPOptions = {
  /**
   * Mock responses by URL pattern
   */
  responses?: Map<string, (url: string, options?: RequestInit) => Promise<Response>>;
  
  /**
   * Default response handler for URLs not in the responses map
   */
  defaultHandler?: (url: string, options?: RequestInit) => Promise<Response>;
};

/**
 * Create an in-memory HTTP effect for testing
 */
export function createInMemoryHTTP(options: InMemoryHTTPOptions = {}): HTTPEffect {
  const { 
    responses = new Map(), 
    defaultHandler = () => Promise.resolve(new Response(JSON.stringify({ error: "Not implemented" }), { 
      status: 501,
      headers: { "Content-Type": "application/json" },
    })),
  } = options;
  
  return {
    async fetch(url, options) {
      // Find a matching handler
      for (const [pattern, handler] of responses.entries()) {
        if (url.includes(pattern)) {
          return await handler(url, options);
        }
      }
      
      // Use default handler if no match
      return await defaultHandler(url, options);
    },
  };
}