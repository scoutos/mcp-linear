/**
 * Tests for the UpdateIssue tool
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { updateIssue, UpdateIssue } from './update-issue.js';

describe('UpdateIssue tool', () => {
  describe('updateIssue function', async () => {
    it('should update an issue and return its details', async () => {
      // Mock data
      const mockIssueData = {
        id: 'issue-123',
        identifier: 'TEAM-123',
        url: 'https://linear.app/team/issue/TEAM-123/issue-title',
        title: 'Updated Issue Title',
        description: 'Updated description',
        priority: 2,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
        state: Promise.resolve({ name: 'Done' }),
        assignee: Promise.resolve({
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
        }),
        project: Promise.resolve({
          id: 'project-123',
          name: 'Test Project',
        }),
        update: async (data) => {
          return {
            id: 'issue-123',
            identifier: 'TEAM-123',
            url: 'https://linear.app/team/issue/TEAM-123/issue-title',
            title: data.title || mockIssueData.title,
            description: data.description || mockIssueData.description,
            priority: data.priority !== undefined ? data.priority : mockIssueData.priority,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-02T00:00:00.000Z',
            state: Promise.resolve({ name: 'Done' }),
            assignee: Promise.resolve({
              id: 'user-123',
              name: 'Test User',
              email: 'test@example.com',
            }),
            project: Promise.resolve({
              id: 'project-123',
              name: 'Test Project',
            }),
          };
        },
      };

      // Mock client
      const mockClient = {
        issue: async () => mockIssueData,
      };

      // Mock logger
      const mockLogger = {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      };

      // Call function
      const result = await updateIssue(
        mockClient,
        'issue-123',
        {
          title: 'Updated Issue Title',
          description: 'Updated description',
          stateId: 'state-123',
          priority: 2,
          assigneeId: 'user-123',
        },
        mockLogger
      );

      // Verify result structure
      assert.strictEqual(result.id, 'issue-123');
      assert.strictEqual(result.identifier, 'TEAM-123');
      assert.strictEqual(result.url, 'https://linear.app/team/issue/TEAM-123/issue-title');
      assert.strictEqual(result.title, 'Updated Issue Title');
      assert.strictEqual(result.description, 'Updated description');
      assert.strictEqual(result.priority, 2);
      assert.strictEqual(result.status, 'Done');
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

    it('should throw an error if issue is not found', async () => {
      // Mock client
      const mockClient = {
        issue: async () => null,
      };

      // Mock logger
      const mockLogger = {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      };

      // Expect function to throw
      try {
        await updateIssue(mockClient, 'non-existent-id', {}, mockLogger);
        assert.fail('Expected error was not thrown');
      } catch (error) {
        assert.strictEqual(
          error.message,
          'Issue with ID non-existent-id not found'
        );
      }
    });

    it('should handle errors during update', async () => {
      // Mock issue with failing update
      const mockIssueData = {
        id: 'issue-123',
        update: async () => {
          throw new Error('API Error');
        },
      };

      // Mock client
      const mockClient = {
        issue: async () => mockIssueData,
      };

      // Mock logger
      const mockLogger = {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      };

      // Expect function to throw
      try {
        await updateIssue(mockClient, 'issue-123', {}, mockLogger);
        assert.fail('Expected error was not thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'API Error');
      }
    });
  });

  describe('UpdateIssue export', () => {
    it('should be exported', () => {
      // Just check that the function is exported
      assert.ok(UpdateIssue);
    });
  });
});