/**
 * Linear API client interface
 *
 * This module provides access to the Linear API using the official Linear SDK.
 */
import { LinearClient } from '@linear/sdk';

/**
 * Creates a Linear client using the official Linear SDK
 * @param {string} apiKey - Linear API key
 * @returns {import('@linear/sdk').LinearClient} A Linear client instance
 * @throws {Error} If API key is missing or appears invalid
 */
export function createLinearClient(apiKey) {
  if (!apiKey) {
    throw new Error('Linear API key is required');
  }

  // Basic validation that the API key looks like a token
  // Linear API keys start with "lin_api_" and are followed by a string of characters
  if (!apiKey.startsWith('lin_api_') || apiKey.length < 20) {
    throw new Error(
      'Linear API key appears to be invalid. It should start with "lin_api_"'
    );
  }

  return new LinearClient({ apiKey });
}
