import { assertEquals } from "jsr:@std/assert";
import { denoFetch } from "./deno-fetch.ts";

Deno.test("denoFetch - should implement HTTPEffect interface", () => {
  assertEquals(typeof denoFetch.fetch, "function");
});

// Note: We're not testing actual network calls here as that would be integration testing
// In a real project, we might use a local test server or mock the global fetch