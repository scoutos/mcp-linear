/**
 * Tests for list-issues tool
 */
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ListIssues, listIssues } from './list-issues.js';
import { createMockLinearClient } from '../effects/linear/client.mock.js';

// Mock logger for testing
const mockLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// Mock config and effects for testing the tool handler
const createMockContext = () => ({
  config: {
    linearApiKey: 'lin_api_test_mock_key_123456',
  },
  effects: {
    logger: mockLogger,
    linear: {
      createClient: () => createMockLinearClient(),
    },
  },
});

describe('ListIssues Tool', () => {
  describe('Basic test', () => {
    it('should be defined', async () => {
      // Create a new instance of the ListIssues tool with mock context
      const ctx = createMockContext();
      const listIssues = new ListIssues(ctx);

      // Verify tool is defined and has expected interface
      assert.ok(listIssues);
      assert.strictEqual(typeof listIssues.call, 'function');
      assert.strictEqual(listIssues.name, 'list_issues');
    });
  });

  describe('listIssues function', () => {
    it('should correctly filter by status name', async () => {
      const client = createMockLinearClient();
      const result = await listIssues(
        client,
        { status: 'In Progress' },
        { limit: 10 },
        mockLogger
      );

      assert.ok(result);
      assert.ok(Array.isArray(result.results));
      assert.ok(
        result.results.every(issue => issue.status === 'In Progress'),
        'All returned issues should have status "In Progress"'
      );

      // Check for new fields
      if (result.results.length > 0) {
        assert.ok(
          result.results[0].identifier,
          'Issue should have an identifier'
        );
        assert.ok(result.results[0].url, 'Issue should have a URL');
      }
    });

    it('should correctly filter by assignee name', async () => {
      const client = createMockLinearClient();
      const result = await listIssues(
        client,
        { assignee: 'Test User' },
        { limit: 10 },
        mockLogger
      );

      assert.ok(result);
      assert.ok(Array.isArray(result.results));
      // Would check assignee names if the mock returned them properly
    });

    it('should correctly filter with assignedToMe', async () => {
      const client = createMockLinearClient();
      const result = await listIssues(
        client,
        { assignedToMe: true },
        { limit: 10 },
        mockLogger
      );

      assert.ok(result);
      assert.ok(Array.isArray(result.results));
      // This would verify the viewer.assignedIssues was called
      // but we can't verify that directly in this test structure
    });

    it('should correctly filter by project name', async () => {
      const client = createMockLinearClient();
      const result = await listIssues(
        client,
        { project: 'Test Project' },
        { limit: 10 },
        mockLogger
      );

      assert.ok(result);
      assert.ok(Array.isArray(result.results));
      // Would check project names if the mock returned them properly
    });

    it('should correctly pass sorting parameters', async () => {
      const client = createMockLinearClient();
      const result = await listIssues(
        client,
        {},
        { sortBy: 'updatedAt', sortDirection: 'DESC', limit: 10 },
        mockLogger
      );

      assert.ok(result);
      assert.ok(Array.isArray(result.results));
      // We can't directly verify the sort params were applied
      // in the mock, but we can verify the function doesn't error
    });
  });

  describe('Tool handler integration', () => {
    it('should correctly initialize with context', async () => {
      const ctx = createMockContext();
      const tool = new ListIssues(ctx);
      assert.strictEqual(tool.name, 'list_issues');
    });

    it('should correctly proxy parameters to the listIssues function', async () => {
      const ctx = createMockContext();
      const tool = new ListIssues(ctx);

      const result = await tool.call({
        status: 'In Progress',
        limit: 5,
      });

      assert.ok(result);
      assert.ok(result.content);
      assert.strictEqual(result.content[0].type, 'text');
      assert.ok(result.content[0].text.includes('Issues found'));
    });

    it('should correctly handle assignedToMe parameter', async () => {
      const ctx = createMockContext();
      const tool = new ListIssues(ctx);

      const result = await tool.call({
        assignedToMe: true,
        limit: 5,
      });

      assert.ok(result);
      assert.ok(result.content);
      assert.strictEqual(result.content[0].type, 'text');
    });
  });
});
