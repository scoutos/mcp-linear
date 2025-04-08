/**
 * Tests for the list-members tool
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { listMembers } from './list-members.js';
import { createMockLinearClient } from '../effects/linear/client.mock.js';

// Create a mock client specifically for testing the list-members functionality
function createMembersTestClient() {
  const base = createMockLinearClient();

  // Mock users with a more extensive structure
  base.users = async () => {
    return {
      nodes: [
        {
          id: 'user-1',
          name: 'jsmith',
          displayName: 'John Smith',
          email: 'john.smith@example.com',
          active: true,
        },
        {
          id: 'user-2',
          name: 'jdoe',
          displayName: 'Jane Doe',
          email: 'jane.doe@example.com',
          active: true,
        },
        {
          id: 'user-3',
          name: 'bobr',
          displayName: 'Bob Robertson',
          email: 'bob.robertson@example.com',
          active: false,
        },
      ],
    };
  };

  return base;
}

// Create a simple mock logger
const mockLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

describe('listMembers', () => {
  it('should retrieve all members when no filters are provided', async () => {
    const mockClient = createMembersTestClient();
    const result = await listMembers(mockClient, {}, { limit: 25 }, mockLogger);

    assert.equal(result.results.length, 3, 'Should return all 3 members');
    assert.deepStrictEqual(
      result.results[0],
      {
        id: 'user-1',
        name: 'jsmith',
        displayName: 'John Smith',
        email: 'john.smith@example.com',
        active: true,
      },
      'First member should have correct structure'
    );
  });

  it('should filter members by name (partial match)', async () => {
    const mockClient = createMembersTestClient();
    const result = await listMembers(
      mockClient,
      { nameFilter: 'john' },
      { limit: 25 },
      mockLogger
    );

    assert.equal(result.results.length, 1, 'Should only return 1 member');
    assert.equal(
      result.results[0].name,
      'jsmith',
      'Should find user by display name'
    );

    // Test matching by username
    const result2 = await listMembers(
      mockClient,
      { nameFilter: 'jdoe' },
      { limit: 25 },
      mockLogger
    );

    assert.equal(result2.results.length, 1, 'Should only return 1 member');
    assert.equal(
      result2.results[0].name,
      'jdoe',
      'Should find user by username'
    );
  });

  it('should respect the limit parameter', async () => {
    const mockClient = createMembersTestClient();
    const result = await listMembers(mockClient, {}, { limit: 2 }, mockLogger);

    assert.equal(result.results.length, 2, 'Should return only 2 members');
  });

  it('should include active status in the results', async () => {
    const mockClient = createMembersTestClient();
    const result = await listMembers(mockClient, {}, { limit: 25 }, mockLogger);

    assert.equal(result.results[0].active, true, 'First user should be active');
    assert.equal(
      result.results[2].active,
      false,
      'Third user should be inactive'
    );
  });

  it('should handle errors gracefully', async () => {
    /** @type {import('@linear/sdk').LinearClient} */
    const mockClient = /** @type {any} */ ({
      users: () => {
        throw new Error('Network error or API failure');
      },
    });

    await assert.rejects(
      async () => {
        await listMembers(mockClient, {}, { limit: 25 }, mockLogger);
      },
      error => {
        if (
          error instanceof Error &&
          error.message === 'Network error or API failure'
        ) {
          return true;
        }
        return false;
      },
      'Should throw with proper error message'
    );
  });
});
