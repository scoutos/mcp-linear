/**
 * Tests for the ListWorkflowStates tool
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { listWorkflowStates, ListWorkflowStates } from './list-workflow-states.js';

describe('ListWorkflowStates tool', () => {
  describe('listWorkflowStates function', async () => {
    it('should list workflow states for a team', async () => {
      // Mock data
      const mockStates = {
        nodes: [
          {
            id: 'state-1',
            name: 'Backlog',
            color: '#000000',
            description: 'Backlog items',
            type: 'backlog',
            position: 0,
          },
          {
            id: 'state-2',
            name: 'In Progress',
            color: '#0000FF',
            description: 'In progress items',
            type: 'started',
            position: 1,
          },
          {
            id: 'state-3',
            name: 'Done',
            color: '#00FF00',
            description: 'Completed items',
            type: 'completed',
            position: 2,
          },
        ],
      };

      // Mock team
      const mockTeam = {
        name: 'Test Team',
        states: async () => mockStates,
      };

      // Mock client
      const mockClient = {
        team: async () => mockTeam,
      };

      // Mock logger
      const mockLogger = {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      };

      // Call function
      const result = await listWorkflowStates(
        mockClient,
        'team-123',
        mockLogger
      );

      // Verify result structure
      assert.strictEqual(result.length, 3);
      assert.deepStrictEqual(result[0], {
        id: 'state-1',
        name: 'Backlog',
        color: '#000000',
        description: 'Backlog items',
        type: 'backlog',
        position: 0,
      });
      assert.deepStrictEqual(result[1], {
        id: 'state-2',
        name: 'In Progress',
        color: '#0000FF',
        description: 'In progress items',
        type: 'started',
        position: 1,
      });
      assert.deepStrictEqual(result[2], {
        id: 'state-3',
        name: 'Done',
        color: '#00FF00',
        description: 'Completed items',
        type: 'completed',
        position: 2,
      });
    });

    it('should handle empty states response', async () => {
      // Mock team with empty states
      const mockTeam = {
        name: 'Test Team',
        states: async () => ({ nodes: [] }),
      };

      // Mock client
      const mockClient = {
        team: async () => mockTeam,
      };

      // Mock logger
      const mockLogger = {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      };

      // Call function
      const result = await listWorkflowStates(
        mockClient,
        'team-123',
        mockLogger
      );

      // Verify result is empty array
      assert.deepStrictEqual(result, []);
    });

    it('should throw an error if team is not found', async () => {
      // Mock client
      const mockClient = {
        team: async () => null,
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
        await listWorkflowStates(mockClient, 'non-existent-id', mockLogger);
        assert.fail('Expected error was not thrown');
      } catch (error) {
        assert.strictEqual(
          error.message,
          'Team with ID non-existent-id not found'
        );
      }
    });

    it('should handle errors during states fetching', async () => {
      // Mock team with failing states method
      const mockTeam = {
        name: 'Test Team',
        states: async () => {
          throw new Error('API Error');
        },
      };

      // Mock client
      const mockClient = {
        team: async () => mockTeam,
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
        await listWorkflowStates(mockClient, 'team-123', mockLogger);
        assert.fail('Expected error was not thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'API Error');
      }
    });
  });

  describe('ListWorkflowStates export', () => {
    it('should be exported', () => {
      // Just check that the function is exported
      assert.ok(ListWorkflowStates);
    });
  });
});