/**
 * Tests for add-comment tool
 */
// @ts-nocheck - Ignore all TypeScript errors in this file
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { addComment, AddComment } from './add-comment.js';

// Test implementation of the addComment function
describe('addComment', () => {
  it('should add a comment to a ticket', async () => {
    // Mock data
    const ticketId = 'MOCK-123';
    const commentText = 'This is a test comment';
    const mockCreatedAt = new Date().toISOString();
    const mockId = 'comment-id-123';

    // Mock viewer (current user)
    const mockViewer = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    };

    // Mock issue to verify it exists
    const mockIssue = {
      id: ticketId,
    };

    // Mock comment data
    const mockCommentData = {
      id: mockId,
      body: commentText,
      createdAt: new Date(mockCreatedAt),
      updatedAt: new Date(mockCreatedAt),
    };

    // Mock comment result (CommentPayload) with comment property as a promise
    const mockCommentResult = {
      comment: Promise.resolve(mockCommentData),
      success: true,
      lastSyncId: 123,
    };

    // Create mocks
    // @ts-ignore - We're creating a partial mock of the LinearClient
    const mockClient = {
      issue: mock.fn(async () => mockIssue),
      createComment: mock.fn(async () => mockCommentResult),
      viewer: Promise.resolve(mockViewer),
    };
    const mockLogger = {
      debug: mock.fn(),
      info: mock.fn(),
      error: mock.fn(),
    };

    // Call the function
    const result = await addComment(
      mockClient,
      ticketId,
      commentText,
      mockLogger
    );

    // Verify it was called with correct parameters
    assert.equal(mockClient.issue.mock.calls.length, 1);
    // @ts-ignore - Mock calls structure
    assert.equal(mockClient.issue.mock.calls[0].arguments[0], ticketId);

    assert.equal(mockClient.createComment.mock.calls.length, 1);
    // @ts-ignore - Mock calls structure
    assert.deepEqual(mockClient.createComment.mock.calls[0].arguments[0], {
      issueId: ticketId,
      body: commentText,
    });

    // Verify result
    assert.equal(result.id, mockId);
    assert.equal(result.body, commentText);
    assert.equal(result.user.id, mockViewer.id);
    assert.equal(result.user.name, mockViewer.name);
    assert.equal(result.user.email, mockViewer.email);
    assert.equal(result.createdAt, mockCreatedAt);
  });

  it('should throw an error when ticket is not found', async () => {
    // Mock data
    const ticketId = 'MOCK-NOT-FOUND';
    const commentText = 'This is a test comment';

    // Create mocks
    // @ts-ignore - We're creating a partial mock of the LinearClient
    const mockClient = {
      issue: mock.fn(async () => null),
      createComment: mock.fn(),
    };
    const mockLogger = {
      debug: mock.fn(),
      info: mock.fn(),
      error: mock.fn(),
    };

    // Call the function and verify it throws
    await assert.rejects(
      async () => {
        await addComment(mockClient, ticketId, commentText, mockLogger);
      },
      error => {
        assert.match(error.message, /not found/);
        return true;
      }
    );

    // Verify issue was checked but comment was not created
    assert.equal(mockClient.issue.mock.calls.length, 1);
    // @ts-ignore - Mock calls structure
    assert.equal(mockClient.createComment.mock.calls.length, 0);
  });

  it('should handle errors from the createComment API', async () => {
    // Mock data
    const ticketId = 'MOCK-123';
    const commentText = 'This is a test comment';

    // Mock issue to verify it exists
    const mockIssue = {
      id: ticketId,
    };

    // Create mocks
    // @ts-ignore - We're creating a partial mock of the LinearClient
    const mockClient = {
      issue: mock.fn(async () => mockIssue),
      createComment: mock.fn(async () => {
        throw new Error('API error');
      }),
      comment: mock.fn(),
    };
    const mockLogger = {
      debug: mock.fn(),
      info: mock.fn(),
      error: mock.fn(),
    };

    // Call the function and verify it throws
    await assert.rejects(
      async () => {
        await addComment(mockClient, ticketId, commentText, mockLogger);
      },
      error => {
        assert.equal(error.message, 'API error');
        return true;
      }
    );

    // Verify error was logged
    assert.equal(mockLogger.error.mock.calls.length, 1);
  });
});

// Test the tool class itself
describe('AddComment tool', () => {
  it('should be exported', () => {
    assert.equal(typeof AddComment, 'function');
  });
});
