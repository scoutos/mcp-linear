/**
 * Tests for Linear create-issue tool
 */
import { test, mock } from 'node:test';
import assert from 'node:assert';
import { createIssue } from './create-issue.js';

test('createIssue with minimal parameters', async () => {
  // Setup mock data
  const mockIssueData = {
    id: 'mock-issue-id',
    title: 'Test Issue',
    description: null,
    priority: 0,
    state: Promise.resolve({ id: 'state-id', name: 'Backlog' }),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    assignee: Promise.resolve(null),
    project: Promise.resolve(null),
  };

  // Mock logger
  const mockLogger = {
    debug: mock.fn(),
    error: mock.fn(),
    info: mock.fn(),
    warn: mock.fn(),
  };

  // Mock client
  const mockClient = {
    issues: {
      create: mock.fn(async () => ({
        issue: Promise.resolve(mockIssueData),
      })),
    },
    _calls: {
      issueCreate: [],
    },
  };

  // Call the function
  const title = 'Test Issue';
  const teamId = 'team-123';

  const result = await createIssue(
    /** @type {any} */ (mockClient),
    title,
    teamId,
    {},
    /** @type {any} */ (mockLogger)
  );

  // Assert the mock was called with correct parameters
  assert.strictEqual(mockClient.issues.create.mock.calls.length, 1);
  const args = mockClient.issues.create.mock.calls[0]?.arguments || [{}];
  assert.deepStrictEqual(args[0], {
    title,
    teamId,
  });

  // Assert the result
  assert.strictEqual(result.id, 'mock-issue-id');
  assert.strictEqual(result.title, 'Test Issue');
  assert.strictEqual(result.status, 'Backlog');
});

test('createIssue with all parameters', async () => {
  // Setup mock data
  const mockAssigneeData = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockProjectData = {
    id: 'project-123',
    name: 'Test Project',
  };

  const mockStateData = {
    id: 'state-in-progress',
    name: 'In Progress',
  };

  const mockIssueData = {
    id: 'mock-issue-id',
    title: 'Test Issue',
    description: 'Test Description',
    priority: 2,
    state: Promise.resolve(mockStateData),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    assignee: Promise.resolve(mockAssigneeData),
    project: Promise.resolve(mockProjectData),
  };

  // Mock logger
  const mockLogger = {
    debug: mock.fn(),
    error: mock.fn(),
    info: mock.fn(),
    warn: mock.fn(),
  };

  // Mock client
  const mockClient = {
    issues: {
      create: mock.fn(async () => ({
        issue: Promise.resolve(mockIssueData),
      })),
    },
    _calls: {
      issueCreate: [],
    },
  };

  // Call the function with all parameters
  const title = 'Test Issue';
  const teamId = 'team-123';
  const options = {
    description: 'Test Description',
    priority: 2,
    assigneeId: 'user-123',
    stateId: 'state-in-progress',
    projectId: 'project-123',
  };

  const result = await createIssue(
    /** @type {any} */ (mockClient),
    title,
    teamId,
    options,
    /** @type {any} */ (mockLogger)
  );

  // Assert the mock was called with correct parameters
  assert.strictEqual(mockClient.issues.create.mock.calls.length, 1);
  const args = mockClient.issues.create.mock.calls[0]?.arguments || [{}];
  assert.deepStrictEqual(args[0], {
    title,
    teamId,
    description: 'Test Description',
    priority: 2,
    assigneeId: 'user-123',
    stateId: 'state-in-progress',
    projectId: 'project-123',
  });

  // Assert the result
  assert.strictEqual(result.id, 'mock-issue-id');
  assert.strictEqual(result.title, 'Test Issue');
  assert.strictEqual(result.description, 'Test Description');
  assert.strictEqual(result.status, 'In Progress');
  assert.strictEqual(result.priority, 2);
  assert.deepStrictEqual(result.assignee, {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  });
  assert.deepStrictEqual(result.project, {
    id: 'project-123',
    name: 'Test Project',
  });
});

test('createIssue handles errors', async () => {
  // Mock logger
  const mockLogger = {
    debug: mock.fn(),
    error: mock.fn(),
    info: mock.fn(),
    warn: mock.fn(),
  };

  // Mock client that throws an error
  const mockClient = {
    issues: {
      create: mock.fn(async () => {
        throw new Error('Mock API Error');
      }),
    },
  };

  // Call the function
  const title = 'Test Issue';
  const teamId = 'team-123';

  // Assert that the function throws
  await assert.rejects(async () => {
    await createIssue(
      /** @type {any} */ (mockClient),
      title,
      teamId,
      {},
      mockLogger
    );
  }, /Mock API Error/);

  // Assert that the logger was called
  assert.strictEqual(mockClient.issues.create.mock.calls.length, 1);
  assert.strictEqual(mockLogger.error.mock.calls.length, 1);
});
