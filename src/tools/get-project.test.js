/**
 * Tests for get-project tool
 */
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';

import { getProject, GetProject } from './get-project.js';
import { createMockLinearClient } from '../effects/linear/client.mock.js';

describe('getProject', () => {
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

  it('should fetch a project by ID', async () => {
    // Mock data for testing
    const mockProject = {
      id: 'project-123',
      name: 'Test Project',
      description: 'A test project',
      state: 'Active',
      progress: 0.5,
      completed: false,
      canceled: false,
      archived: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
      team: Promise.resolve({
        id: 'team-123',
        name: 'Engineering',
        key: 'ENG',
      }),
      lead: Promise.resolve({
        id: 'user-123',
        name: 'Test Lead',
      }),
      issueCount: 10,
      completedIssueCount: 5,
      url: 'https://linear.app/project/123',
      issues: () =>
        Promise.resolve({
          nodes: [
            {
              id: 'issue-1',
              title: 'Test Issue 1',
              description: 'Description for issue 1',
              priority: 2,
              state: Promise.resolve({ name: 'In Progress' }),
              assignee: Promise.resolve({ name: 'Test Assignee' }),
              createdAt: new Date('2023-01-03'),
              updatedAt: new Date('2023-01-04'),
              comments: () => Promise.resolve({ nodes: [] }),
            },
          ],
        }),
      members: () =>
        Promise.resolve({
          nodes: [
            {
              id: 'member-1',
              name: 'Test Member',
              email: 'test@example.com',
              role: 'Member',
            },
          ],
        }),
    };

    // Create mock Linear client
    const mockClient = {
      project: mock.fn(async () => mockProject),
      issues: mock.fn(async () => ({
        nodes: [
          {
            id: 'issue-1',
            title: 'Test Issue 1',
            description: 'Description for issue 1',
            priority: 2,
            state: Promise.resolve({ name: 'In Progress' }),
            assignee: Promise.resolve({ name: 'Test Assignee' }),
            createdAt: new Date('2023-01-03'),
            updatedAt: new Date('2023-01-04'),
            comments: () => Promise.resolve({ nodes: [] }),
          },
        ],
      })),
    };

    const logger = createMockLogger();

    // Call the function with all details
    const result = await getProject(
      /** @type {any} */ (mockClient),
      'project-123',
      {
        includeIssues: true,
        includeMembers: true,
        includeComments: true,
        limit: 10,
      },
      /** @type {any} */ (logger)
    );

    // Verify function was called correctly
    assert.strictEqual(mockClient.project.mock.calls.length, 1);
    assert.strictEqual(
      mockClient.project.mock.calls[0]?.arguments[0],
      'project-123'
    );

    // Verify the result
    assert.ok(result, 'Result should exist');
    assert.strictEqual(result.id, 'project-123', 'Project ID should match');
    assert.strictEqual(
      result.name,
      'Test Project',
      'Project name should match'
    );
    assert.strictEqual(
      result.teamName,
      'Engineering',
      'Team name should be resolved'
    );
    assert.strictEqual(
      result.leadName,
      'Test Lead',
      'Lead name should be resolved'
    );
    assert.strictEqual(result.progress, 0.5, 'Progress should match');

    // Check for members and issues
    assert.ok(result.members, 'Should include members');
    if (result.members) {
      assert.strictEqual(result.members.length, 1, 'Should have one member');
      assert.strictEqual(
        result.members[0].name,
        'Test Member',
        'Member name should match'
      );
    }

    assert.ok(result.issues, 'Should include issues');
    if (result.issues) {
      assert.strictEqual(result.issues.length, 1, 'Should have one issue');
      assert.strictEqual(
        result.issues[0].title,
        'Test Issue 1',
        'Issue title should match'
      );
      assert.strictEqual(
        result.issues[0].state,
        'In Progress',
        'Issue state should be resolved'
      );
      assert.strictEqual(
        result.issues[0].assigneeName,
        'Test Assignee',
        'Assignee name should be resolved'
      );
    }
  });

  it('should handle projects with no team or lead', async () => {
    // Mock data without team or lead
    const mockProject = {
      id: 'project-123',
      name: 'Test Project',
      description: 'A test project',
      state: null,
      progress: 0,
      completed: false,
      canceled: false,
      archived: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
      team: null,
      lead: null,
      issueCount: 0,
      completedIssueCount: 0,
      url: 'https://linear.app/project/123',
      issues: () => Promise.resolve({ nodes: [] }),
      members: () => Promise.resolve({ nodes: [] }),
    };

    // Create mock Linear client
    const mockClient = {
      project: mock.fn(async () => mockProject),
      issues: mock.fn(async () => ({
        nodes: [],
      })),
    };

    const logger = createMockLogger();

    // Call the function with minimal details
    const result = await getProject(
      /** @type {any} */ (mockClient),
      'project-123',
      { includeIssues: false, includeMembers: false },
      /** @type {any} */ (logger)
    );

    // Verify the result
    assert.ok(result, 'Result should exist');
    assert.strictEqual(result.id, 'project-123', 'Project ID should match');
    assert.strictEqual(
      result.name,
      'Test Project',
      'Project name should match'
    );
    assert.strictEqual(
      result.teamName,
      undefined,
      'Team name should be undefined'
    );
    assert.strictEqual(
      result.leadName,
      undefined,
      'Lead name should be undefined'
    );
    assert.strictEqual(result.progress, 0, 'Progress should be zero');
    assert.strictEqual(
      result.members,
      undefined,
      'Members should not be included'
    );
    assert.strictEqual(
      result.issues,
      undefined,
      'Issues should not be included'
    );
  });

  it('should throw an error when project is not found', async () => {
    // Create mock Linear client that returns null for project
    const mockClient = {
      project: mock.fn(async () => null),
    };

    const logger = createMockLogger();

    // Call the function and expect it to throw
    await assert.rejects(
      async () => {
        await getProject(
          /** @type {any} */ (mockClient),
          'nonexistent-id',
          {},
          /** @type {any} */ (logger)
        );
      },
      /** @param {any} error */
      error => error.message.includes('not found'),
      'Should throw an error for non-existent project'
    );

    // Verify that the logger recorded the error
    assert.ok(
      logger._logs.error.some(log => log[0].includes('Error retrieving')),
      'Error should be logged'
    );
  });
});

describe('GetProject tool', () => {
  it('should be exported', () => {
    assert.ok(GetProject, 'GetProject tool should be exported');
  });
});
