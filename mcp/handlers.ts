/**
 * MCP request handlers
 */
import { MCPRequest, MCPResponsePromise } from "../types/mcp.ts";
import { Issue } from "../types/linear.ts";
import { SearchIssuesAction } from "../actions/search-issues.ts";
import { Config } from "../types/config.ts";
import { getConfig } from "../utils/config.ts";

/**
 * Handler dependencies
 */
export type HandlerDependencies = {
  actions?: {
    searchIssues?: ReturnType<typeof SearchIssuesAction>;
  };
  config?: Config;
};

/**
 * Handler for the search issues endpoint
 */
export function createSearchIssuesHandler(deps: HandlerDependencies) {
  return async (request: MCPRequest): Promise<MCPResponsePromise> => {
    try {
      // Extract the query parameter
      const query = request.params.query as string;

      // Use real action if provided, otherwise fallback to mock
      if (deps.actions?.searchIssues) {
        // Get configuration
        const config = deps.config || getConfig();

        // Use the real search action
        const searchResults = await deps.actions.searchIssues.execute(
          { query },
          config,
        );

        return {
          id: request.id,
          data: searchResults,
        };
      } else {
        // Mock implementation as fallback
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
      }
    } catch (error) {
      // Handle errors
      return {
        id: request.id,
        data: { results: [] },
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: "SEARCH_ERROR",
        },
      };
    }
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
export function createMCPHandlers(deps: HandlerDependencies = {}) {
  return {
    searchIssues: createSearchIssuesHandler(deps),
    getIssue: createGetIssueHandler(deps),
    updateIssue: createUpdateIssueHandler(deps),
    addComment: createAddCommentHandler(deps),
  };
}
