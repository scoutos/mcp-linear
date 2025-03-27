/**
 * MCP request handlers
 */
import { MCPRequest, MCPResponsePromise } from "../types/mcp.ts";
import { Issue } from "../types/linear.ts";

/**
 * Handler dependencies
 */
export type HandlerDependencies = Record<string, never>;

/**
 * Handler for the search issues endpoint
 */
export function createSearchIssuesHandler(_deps: HandlerDependencies) {
  return (request: MCPRequest): MCPResponsePromise => {
    // Parameter is unused since this is a mock implementation
    const _params = request.params;

    // Mock implementation for now
    const results: Issue[] = [
      {
        id: "TEST-123",
        title: "Test Issue",
        description: "This is a test issue",
        status: "In Progress",
      },
    ];

    return {
      id: request.id,
      data: { results },
    };
  };
}

/**
 * Handler for the get issue endpoint
 */
export function createGetIssueHandler(_deps: HandlerDependencies) {
  return (request: MCPRequest): MCPResponsePromise => {
    const { id } = request.params as { id: string };

    // Mock implementation for now
    const issue: Issue = {
      id,
      title: "Test Issue",
      description: "This is a test issue",
      status: "In Progress",
      comments: [
        {
          id: "comment-1",
          body: "This is a test comment",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    return {
      id: request.id,
      data: { issue },
    };
  };
}

/**
 * Handler for the update issue endpoint
 */
export function createUpdateIssueHandler(_deps: HandlerDependencies) {
  return (request: MCPRequest): MCPResponsePromise => {
    const { id } = request.params as { id: string };
    const updateData = { ...request.params };
    delete updateData.id;

    // Mock implementation for now
    const issue: Issue = {
      id,
      ...(updateData as Partial<Issue>),
    };

    return {
      id: request.id,
      data: {
        success: true,
        issue,
      },
    };
  };
}

/**
 * Handler for the add comment endpoint
 */
export function createAddCommentHandler(_deps: HandlerDependencies) {
  return (request: MCPRequest): MCPResponsePromise => {
    const { id: _id } = request.params as { id: string };
    const { body } = request.params as { body: string };

    // Mock implementation for now
    const comment = {
      id: `comment-${Date.now()}`,
      body,
      createdAt: new Date().toISOString(),
    };

    return {
      id: request.id,
      data: {
        success: true,
        comment,
      },
    };
  };
}

/**
 * Create all MCP handlers
 */
export function createMCPHandlers(deps: HandlerDependencies) {
  return {
    searchIssues: createSearchIssuesHandler(deps),
    getIssue: createGetIssueHandler(deps),
    updateIssue: createUpdateIssueHandler(deps),
    addComment: createAddCommentHandler(deps),
  };
}
