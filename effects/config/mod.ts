/**
 * Configuration utilities
 */

/**
 * Application configuration
 */
export type Config = {
  linearApiKey: string;
};

/**
 * Get application configuration from environment variables
 *
 * @throws Error if required environment variables are not set
 * @returns Config object with all required configuration
 */
export function getConfig(): Config {
  const linearApiKey = Deno.env.get("LINEAR_API_KEY");
  if (!linearApiKey) {
    throw new Error("LINEAR_API_KEY environment variable is not set");
  }

  return {
    linearApiKey,
  };
}

/**
 * Create a test configuration with specified overrides
 *
 * @param overrides Partial config to override default test values
 * @returns Config object for testing
 */
export function createTestConfig(overrides: Partial<Config> = {}): Config {
  return {
    linearApiKey: "test-api-key",
    ...overrides,
  };
}
