import { assertEquals } from "jsr:@std/assert";
import { main } from "./main.ts";

Deno.test("Smoke test - main function exists", () => {
  // This is just a simple smoke test to verify the test suite is running
  // and that the main function exists and can be imported
  assertEquals(typeof main, "function");
});