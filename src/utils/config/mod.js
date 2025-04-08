/**
 * Configuration utilities
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs/promises';
import { noopLogger } from '../../effects/logging/mod.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '../../..');

/**
 * @typedef {Object} Config
 * @property {string} linearApiKey - Linear API key
 */

/**
 * Get application configuration from environment variables or .env file
 *
 * @param {import('../../effects/logging/mod.js').LoggingEffect} [logger=noopLogger] - Logger to use
 * @throws Error if required environment variables are not set
 * @returns {Promise<Config>} Config object with all required configuration
 */
export async function getConfig(logger = noopLogger) {
  // Try to load configuration from .env file
  try {
    // Look for .env file in project root
    const envPath = resolve(rootDir, '.env');

    // Check if .env file exists
    await fs.access(envPath).catch(() => {
      logger.warn('No .env file found, using environment variables only');
    });

    // Load .env file (will silently continue if file doesn't exist)
    dotenv.config({ path: envPath });

    // Also try .env.local if it exists (for local overrides)
    const localEnvPath = resolve(rootDir, '.env.local');
    await fs
      .access(localEnvPath)
      .then(() => {
        dotenv.config({ path: localEnvPath });
      })
      .catch(() => {
        // No local env file, that's fine
      });
  } catch (error) {
    logger.warn(`Could not load .env file: ${error.message}`);
  }

  // Get config from environment variables
  const linearApiKey = process.env.LINEAR_API_KEY;
  if (!linearApiKey) {
    throw new Error('LINEAR_API_KEY environment variable is not set');
  }

  return {
    linearApiKey,
  };
}

/**
 * Create a test configuration with specified overrides
 *
 * @param {Partial<Config>} overrides - Partial config to override default test values
 * @returns {Config} Config object for testing
 */
export function createTestConfig(overrides = {}) {
  return {
    linearApiKey: 'test-api-key',
    ...overrides,
  };
}
