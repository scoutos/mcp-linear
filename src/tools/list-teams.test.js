/**
 * Tests for list-teams tool
 */
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';

import { listTeams, ListTeams } from './list-teams.js';

describe('listTeams', () => {
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

  // Example mock team data
  const mockTeams = [
    {
      id: 'team-1',
      name: 'Engineering',
      key: 'ENG',
      description: 'Engineering team',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
      color: '#FF0000',
      private: false,
      cycleEnable: true,
      timezone: 'UTC',
      markedAsDuplicate: false,
      issuesPerCycle: 10,
      url: 'https://linear.app/team/eng',
    },
    {
      id: 'team-2',
      name: 'Product',
      key: 'PROD',
      description: 'Product team',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
      color: '#00FF00',
      private: false,
      cycleEnable: true,
      timezone: 'UTC',
      markedAsDuplicate: false,
      issuesPerCycle: 10,
      url: 'https://linear.app/team/prod',
    },
  ];

  it('should retrieve all teams when no filters are provided', async () => {
    const mockMembers = {
      nodes: [
        {
          id: 'user-1',
          name: 'User One',
          displayName: 'User One Display',
          active: true,
        },
        {
          id: 'user-2',
          name: 'User Two',
          displayName: 'User Two Display',
          active: true,
        },
      ],
    };

    const mockProjects = {
      nodes: [
        {
          id: 'project-1',
          name: 'Project One',
          state: Promise.resolve({ name: 'Active' }),
          completed: false,
        },
        {
          id: 'project-2',
          name: 'Project Two',
          state: Promise.resolve({ name: 'Completed' }),
          completed: true,
        },
      ],
    };

    const mockIssues = {
      nodes: [
        { id: 'issue-1', completedAt: null },
        { id: 'issue-2', completedAt: null },
        { id: 'issue-3', completedAt: new Date() },
      ],
    };

    // Create mock client
    const mockClient = {
      teams: mock.fn(async () => ({
        nodes: mockTeams.map(team => ({
          ...team,
          members: mock.fn(async () => mockMembers),
          projects: mock.fn(async () => mockProjects),
          issues: mock.fn(async () => mockIssues),
        })),
      })),
    };

    const logger = createMockLogger();

    // Call the function with default parameters
    const results = await listTeams(
      /** @type {any} */ (mockClient),
      {},
      { includeMembers: true, includeProjects: true, limit: 25 },
      /** @type {any} */ (logger)
    );

    // Verify function was called correctly
    assert.strictEqual(mockClient.teams.mock.calls.length, 1);

    // Verify the results
    assert.ok(results, 'Results should exist');
    assert.ok(Array.isArray(results.results), 'Results should be an array');
    assert.strictEqual(results.results.length, 2, 'Should return both teams');

    // Check first team structure
    const team = results.results[0];
    assert.strictEqual(team.id, 'team-1', 'Team ID should match');
    assert.strictEqual(team.name, 'Engineering', 'Team name should match');
    assert.strictEqual(team.key, 'ENG', 'Team key should match');

    // Should include members
    assert.ok(team.members, 'Should include members array');
    if (team.members) {
      assert.strictEqual(team.members.length, 2, 'Should have two members');
    }

    // Should include projects
    assert.ok(team.projects, 'Should include projects array');
    if (team.projects) {
      assert.strictEqual(team.projects.length, 2, 'Should have two projects');
    }

    // Should include issue counts
    assert.strictEqual(team.issueCount, 3, 'Should have correct issue count');
    assert.strictEqual(
      team.activeIssueCount,
      2,
      'Should have correct active issue count'
    );
    assert.strictEqual(
      team.completedIssueCount,
      1,
      'Should have correct completed issue count'
    );
  });

  it('should filter teams by name (partial match)', async () => {
    // Create mock client
    const mockClient = {
      teams: mock.fn(async () => ({
        nodes: mockTeams.map(team => ({
          ...team,
          members: mock.fn(async () => ({ nodes: [] })),
          projects: mock.fn(async () => ({ nodes: [] })),
          issues: mock.fn(async () => ({ nodes: [] })),
        })),
      })),
    };

    const logger = createMockLogger();

    // Call function with name filter
    const results = await listTeams(
      /** @type {any} */ (mockClient),
      { nameFilter: 'eng' },
      { includeMembers: false, includeProjects: false },
      /** @type {any} */ (logger)
    );

    // Verify results are filtered
    assert.strictEqual(
      results.results.length,
      1,
      'Should return only one team'
    );
    assert.strictEqual(
      results.results[0].id,
      'team-1',
      'Should return Engineering team'
    );
  });

  it('should handle errors gracefully', async () => {
    // Create mock client that throws
    const mockClient = {
      teams: mock.fn(async () => {
        throw new Error('Mock API Error');
      }),
    };

    const logger = createMockLogger();

    // Call the function and expect it to throw
    await assert.rejects(
      async () => {
        await listTeams(
          /** @type {any} */ (mockClient),
          {},
          {},
          /** @type {any} */ (logger)
        );
      },
      /** @param {any} error */
      error => error.message.includes('Mock API Error'),
      'Should throw an error when the API fails'
    );

    // Verify that the logger recorded the error
    assert.ok(
      logger._logs.error.some(log => log[0].includes('Error listing')),
      'Error should be logged'
    );
  });
});

describe('ListTeams tool', () => {
  it('should be exported', () => {
    assert.ok(ListTeams, 'ListTeams tool should be exported');
  });
});
