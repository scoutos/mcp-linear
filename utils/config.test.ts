/**
 * Tests for configuration utilities
 */
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std/assert/mod.ts";
import { createTestConfig, getConfig } from "./config.ts";

Deno.test("createTestConfig - returns default test configuration", () => {
  const config = createTestConfig();
  assertEquals(config.linearApiKey, "test-api-key");
});

Deno.test("createTestConfig - overrides default values", () => {
  const config = createTestConfig({ linearApiKey: "custom-api-key" });
  assertEquals(config.linearApiKey, "custom-api-key");
});

Deno.test("getConfig - throws error when LINEAR_API_KEY is not set", () => {
  // Save original environment
  const originalEnv = Deno.env.get("LINEAR_API_KEY");

  try {
    // Unset the environment variable
    Deno.env.delete("LINEAR_API_KEY");

    // Should throw error
    assertThrows(
      () => getConfig(),
      Error,
      "LINEAR_API_KEY environment variable is not set",
    );
  } finally {
    // Restore original environment if it was set
    if (originalEnv) {
      Deno.env.set("LINEAR_API_KEY", originalEnv);
    }
  }
});

Deno.test("getConfig - returns configuration from environment", () => {
  // Save original environment
  const originalEnv = Deno.env.get("LINEAR_API_KEY");

  try {
    // Set test environment variables
    Deno.env.set("LINEAR_API_KEY", "env-api-key");

    // Get config
    const config = getConfig();

    // Verify values from environment
    assertEquals(config.linearApiKey, "env-api-key");
  } finally {
    // Restore original environment if it was set
    if (originalEnv) {
      Deno.env.set("LINEAR_API_KEY", originalEnv);
    } else {
      Deno.env.delete("LINEAR_API_KEY");
    }
  }
});
