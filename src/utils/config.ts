/**
 * Configuration utilities
 */
import { Config } from "../types/config";

/**
 * Get configuration from environment variables
 */
export function getConfig(): Config {
  const linearApiKey = process.env.LINEAR_API_KEY;

  if (!linearApiKey) {
    throw new Error("LINEAR_API_KEY environment variable must be set");
  }

  return {
    linearApiKey,
  };
}
