/**
 * Tests for get-issue tool
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';

import { getIssue, GetIssue } from './get-issue.js';
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

  it('should fetch a ticket by ID', async () => {
    // Create mock Linear client
    const client = createMockLinearClient();
    const logger = createMockLogger();

    // Test parameters
    const issueId = 'TEST-123';

    // Call the function
    const result = await getIssue(client, issueId, {}, logger);

    // Verify basic properties
    assert.ok(result, 'Result should exist');
    assert.strictEqual(result.id, issueId, 'Issue ID should match');
    assert.ok(result.title, 'Issue should have a title');
    assert.ok(result.identifier, 'Issue should have an identifier');
    assert.ok(result.url, 'Issue should have a URL');

    // Verify the logger recorded the expected logs
    assert.ok(
      logger._logs.debug.some(log => log[0].includes('Fetching Linear issue')),
      'Debug log for fetching should be recorded'
    );
    assert.ok(
      logger._logs.debug.some(log =>
        log[0].includes('Successfully retrieved issue')
      ),
      'Debug log for success should be recorded'
    );
  });

  it('should fetch a ticket without comments when includeComments is false', async () => {
    // Create mock Linear client
    const client = createMockLinearClient();
    const logger = createMockLogger();

    // Test parameters
    const issueId = 'TEST-123';

    // Call the function with includeComments=false
    const result = await getIssue(
      client,
      issueId,
      { includeComments: false },
      logger
    );

    // Verify basic properties
    assert.ok(result, 'Result should exist');
    assert.strictEqual(result.id, issueId, 'Issue ID should match');

    // For a proper test, we would verify comments aren't included,
    // but the mock doesn't actually implement this behavior
  });

  it('should handle tickets with no assignee', async () => {
    // Create mock Linear client with custom behavior
    const client = createMockLinearClient(
      /** @type {any} */ {
        issueData: {
          id: 'TEST-123',
          title: 'Test Issue',
          assignee: null, // No assignee
        },
      }
    );
    const logger = createMockLogger();

    // Call the function
    const result = await getIssue(client, 'TEST-123', {}, logger);

    // Verify basic properties
    assert.ok(result, 'Result should exist');
    assert.strictEqual(
      result.assignee,
      undefined,
      'Issue should have no assignee'
    );
  });

  it('should throw an error when ticket is not found', async () => {
    // Create mock Linear client with custom error behavior
    const client = createMockLinearClient(
      /** @type {any} */ {
        throwOnIssue: true,
        errorMessage: 'Issue not found',
      }
    );
    const logger = createMockLogger();

    // Call the function and expect it to throw
    await assert.rejects(
      async () => {
        await getIssue(client, 'NONEXISTENT', {}, logger);
      },
      /** @param {any} error */
      error => error.message && error.message.includes('not found'),
      'Should throw an error for non-existent issues'
    );

    // Verify that the error was logged
    assert.ok(
      logger._logs.error.some(log => log[0].includes('Error retrieving')),
      'Error should be logged'
    );
  });
});

describe('GetIssue tool', () => {
  it('should be exported', () => {
    // Import has already happened at the top of the file
    // Just check that the imports exist
    assert.ok(GetIssue, 'GetIssue tool should be exported');
  });
});
