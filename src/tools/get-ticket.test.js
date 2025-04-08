/**
 * Tests for get-ticket tool
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';

import { getIssue } from './get-ticket.js';
import { createMockLinearClient } from '../effects/linear/client.mock.js';

describe('getIssue', () => {
  /**
   * Creates a mock logger for testing
   * @returns {Object} Mock logger
   */
  function createMockLogger() {
    return {
      _logs: {
        debug: [],
        info: [],
        warn: [],
        error: [],
      },
      debug(...args) {
        this._logs.debug.push(args);
      },
      info(...args) {
        this._logs.info.push(args);
      },
      warn(...args) {
        this._logs.warn.push(args);
      },
      error(...args) {
        this._logs.error.push(args);
      },
    };
  }

  // Add issue method to mock client for testing
  function extendMockClientWithIssue(client) {
    // Add tracking for issue method calls
    client._calls.issue = [];

    // Mock the issue method
    client.issue = function (id) {
      // Record the call for test assertions
      this._calls.issue.push({ id });

      // Find the issue in our mock data
      const issue = this._mockIssues.nodes.find(node => node.id === id);

      if (!issue) {
        return Promise.resolve(null);
      }

      // Add comments method to the issue
      issue.comments = () =>
        Promise.resolve({
          nodes: [
            {
              id: `comment-1-${id}`,
              body: 'This is a test comment',
              createdAt: new Date('2023-01-05'),
              updatedAt: new Date('2023-01-05'),
              user: Promise.resolve({
                id: 'mock-user-1',
                name: 'Comment Author',
                email: 'author@example.com',
              }),
            },
            {
              id: `comment-2-${id}`,
              body: 'A follow up comment',
              createdAt: new Date('2023-01-06'),
              updatedAt: new Date('2023-01-07'), // Edited comment
              user: Promise.resolve({
                id: 'mock-user-2',
                name: 'Another User',
                email: 'another@example.com',
              }),
            },
          ],
        });

      return Promise.resolve(issue);
    };

    // Store mock issues for lookup
    client._mockIssues = {
      nodes: [
        {
          id: 'mock-issue-1',
          title: 'Mock Issue 1',
          description: 'This is a mock issue for testing',
          priority: 2,
          // State is a promise in the SDK
          state: Promise.resolve({ id: 'state-1', name: 'Backlog' }),
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
          // Assignee is also a promise in the SDK
          assignee: Promise.resolve({
            id: 'mock-user-1',
            name: 'Mock User',
            email: 'mock@example.com',
          }),
          // Project is also a promise in the SDK
          project: Promise.resolve({
            id: 'project-1',
            name: 'Main Project',
          }),
        },
        {
          id: 'mock-issue-2',
          title: 'Mock Issue 2',
          description: 'Another mock issue',
          priority: 1,
          // State is a promise in the SDK
          state: Promise.resolve({ id: 'state-2', name: 'In Progress' }),
          createdAt: new Date('2023-01-03'),
          updatedAt: new Date('2023-01-04'),
          // No assignee for this issue
          assignee: Promise.resolve(null),
          // Project is also a promise in the SDK
          project: Promise.resolve({
            id: 'project-2',
            name: 'Secondary Project',
          }),
        },
      ],
    };

    return client;
  }

  it('should fetch a ticket by ID', async () => {
    const mockClient = extendMockClientWithIssue(createMockLinearClient());
    const mockLogger = createMockLogger();

    const issue = await getIssue(
      mockClient,
      'mock-issue-1',
      { includeComments: true },
      mockLogger
    );

    // Check that the ID was passed to the client method
    assert.strictEqual(mockClient._calls.issue.length, 1);
    assert.strictEqual(mockClient._calls.issue[0].id, 'mock-issue-1');

    // Verify the issue details were correctly parsed
    assert.strictEqual(issue.id, 'mock-issue-1');
    assert.strictEqual(issue.title, 'Mock Issue 1');
    assert.strictEqual(issue.status, 'Backlog');
    assert.strictEqual(issue.priority, 2);

    // Verify project data was included
    assert.ok(issue.project);
    assert.strictEqual(issue.project.id, 'project-1');
    assert.strictEqual(issue.project.name, 'Main Project');

    // Verify assignee data was included
    assert.ok(issue.assignee);
    assert.strictEqual(issue.assignee.id, 'mock-user-1');
    assert.strictEqual(issue.assignee.name, 'Mock User');

    // Verify comments were fetched
    assert.ok(Array.isArray(issue.comments));
    assert.strictEqual(issue.comments.length, 2);
  });

  it('should fetch a ticket without comments when includeComments is false', async () => {
    const mockClient = extendMockClientWithIssue(createMockLinearClient());
    const mockLogger = createMockLogger();

    const issue = await getIssue(
      mockClient,
      'mock-issue-1',
      { includeComments: false },
      mockLogger
    );

    // Check that the ID was passed to the client method
    assert.strictEqual(mockClient._calls.issue.length, 1);
    assert.strictEqual(mockClient._calls.issue[0].id, 'mock-issue-1');

    // Verify the issue details were correctly parsed
    assert.strictEqual(issue.id, 'mock-issue-1');

    // Verify comments were not fetched (empty array)
    assert.ok(Array.isArray(issue.comments));
    assert.strictEqual(issue.comments.length, 0);
  });

  it('should handle tickets with no assignee', async () => {
    const mockClient = extendMockClientWithIssue(createMockLinearClient());
    const mockLogger = createMockLogger();

    const issue = await getIssue(
      mockClient,
      'mock-issue-2',
      { includeComments: true },
      mockLogger
    );

    // Verify the issue details were correctly parsed
    assert.strictEqual(issue.id, 'mock-issue-2');
    assert.strictEqual(issue.status, 'In Progress');

    // Verify assignee is undefined
    assert.strictEqual(issue.assignee, undefined);
  });

  it('should throw an error when ticket is not found', async () => {
    const mockClient = extendMockClientWithIssue(createMockLinearClient());
    const mockLogger = createMockLogger();

    await assert.rejects(
      async () => {
        await getIssue(
          mockClient,
          'non-existent-id',
          { includeComments: true },
          mockLogger
        );
      },
      error => {
        // Make sure error has the right message
        if (
          error instanceof Error &&
          error.message === 'Issue with ID non-existent-id not found'
        ) {
          return true;
        }
        return false;
      }
    );
  });
});

describe('GetTicket tool', () => {
  it('should be exported', async () => {
    // Import the tool dynamically to verify it's exported
    const { GetTicket } = await import('./get-ticket.js');
    assert.ok(GetTicket);
    assert.strictEqual(typeof GetTicket, 'function');
  });
});
