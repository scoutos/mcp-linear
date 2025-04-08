/**
 * Linear API effect module
 *
 * This module provides direct and mocked access to the Linear SDK client.
 */

// Export the actual client implementation
export * from './client.js';

// Export the mock implementation for testing
export * from './client.mock.js';

// Export types
export * from './types/types.js';

/**
 * Linear API effect interface
 * @typedef {Object} LinearEffect
 * @property {(apiKey: string) => import('@linear/sdk').LinearClient} createClient - Creates a Linear client
 */
