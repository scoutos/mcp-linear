# Project-Specific Guidelines

## MCP-Linear Project

This project implements an MCP (Model Context Protocol) server that provides access to Linear issue tracking functionality. The server acts as a bridge that allows AI models to interact with Linear through a standardized protocol.

## Linear MCP Server Architecture

### Core Concepts

This project follows our Actions and Effects architecture to implement a Model Context Protocol (MCP) server for Linear integration.

- **MCP Server**: Implements the standardized MCP protocol to expose Linear functionality to AI models
- **Linear API**: Accessed through GraphQL to perform operations on issues, comments, etc.
- **Actions**: Encapsulate business logic for searching, reading, editing issues and adding comments
- **Effects**: Provide fundamental capabilities (HTTP, storage, logging) for the actions to use

### Project Structure

Our implementation follows this high-level structure:

1. Core effects providing general capabilities (HTTP, Storage, Logging)
2. Actions representing business logic for Linear operations
3. MCP server handlers that translate MCP protocol requests to our actions
4. Types and interfaces representing the business domain

### Linear Integration Features

Our integration with Linear focuses on these core capabilities:
- Searching issues
- Reading issues and comments
- Editing issues (body, tags, etc.)
- Adding comments

These capabilities are implemented as actions that use fundamental effects like HTTP for communicating with Linear's GraphQL API.

### Tokens and Authentication

Linear authentication will be handled as business entities passed to actions rather than as specific effects:

```typescript
// Example of a token source as a business entity rather than an effect
type TokenSource = {
  getToken: () => Promise<string>;
};

// Usage in an action
export const SearchIssuesAction = (effects: { http: HTTPEffect }) => ({
  async execute(query: string, tokenSource: TokenSource): Promise<Issue[]> {
    const token = await tokenSource.getToken();
    // Use token with HTTP effect to call Linear API
  }
});
```

This approach keeps our effects general-purpose while still supporting the specific authentication needs of Linear.

### MCP Protocol Handlers

The MCP protocol handlers will translate between MCP requests/responses and our internal actions:

```typescript
// Example MCP handler structure
export const createMCPHandlers = (actions: {
  searchIssues: ReturnType<typeof SearchIssuesAction>;
  getIssue: ReturnType<typeof GetIssueAction>;
  // other actions
}) => {
  return {
    handleSearchRequest: async (request: MCPRequest): Promise<MCPResponse> => {
      // Extract parameters from MCP request
      const { query } = request.params;
      const tokenSource = getTokenSourceFromRequest(request);
      
      // Call the appropriate action
      const issues = await actions.searchIssues.execute(query, tokenSource);
      
      // Format as MCP response
      return formatMCPResponse(issues);
    },
    // Other handlers
  };
};
```

This layered approach keeps the MCP protocol concerns separate from the core business logic in our actions.