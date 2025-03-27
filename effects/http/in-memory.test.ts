import { assertEquals } from "jsr:@std/assert";
import { createInMemoryHTTP } from "./in-memory.ts";

Deno.test("createInMemoryHTTP - should implement HTTPEffect interface", () => {
  const http = createInMemoryHTTP();
  assertEquals(typeof http.fetch, "function");
});

Deno.test("createInMemoryHTTP - should return default response when no handler matches", async () => {
  const http = createInMemoryHTTP();
  const response = await http.fetch("https://example.com");
  
  assertEquals(response.status, 501);
  const body = await response.json();
  assertEquals(body.error, "Not implemented");
});

Deno.test("createInMemoryHTTP - should return response from matching handler", async () => {
  const responses = new Map<string, (url: string, options?: RequestInit) => Promise<Response>>();
  responses.set("example.com", () => Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 })));
  
  const http = createInMemoryHTTP({ responses });
  const response = await http.fetch("https://example.com/api");
  
  assertEquals(response.status, 200);
  const body = await response.json();
  assertEquals(body.success, true);
});

Deno.test("createInMemoryHTTP - should pass url and options to handler", async () => {
  let capturedUrl: string | undefined;
  let capturedOptions: RequestInit | undefined;
  
  const responses = new Map<string, (url: string, options?: RequestInit) => Promise<Response>>();
  responses.set("example.com", (url: string, options?: RequestInit) => {
    capturedUrl = url;
    capturedOptions = options;
    return Promise.resolve(new Response("{}", { status: 200 }));
  });
  
  const http = createInMemoryHTTP({ responses });
  await http.fetch("https://example.com/api", { method: "POST" });
  
  assertEquals(capturedUrl, "https://example.com/api");
  assertEquals(capturedOptions?.method, "POST");
});