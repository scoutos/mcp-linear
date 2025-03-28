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

### Linear API Authentication

Linear authentication uses API keys, which can be obtained from the Linear application settings. The API key is used to authenticate GraphQL API requests.

#### Linear API Key

To obtain a Linear API key:
1. Log in to Linear
2. Go to Settings > API > Personal API keys
3. Generate a new API key with appropriate permissions

This API key should be securely stored and provided to the MCP server via environment variables or secure configuration.

#### API Usage

Linear uses a GraphQL API, requiring:
- POST requests to `https://api.linear.app/graphql`
- Authentication via the `Authorization: Bearer YOUR_API_KEY` header
- GraphQL queries/mutations in the request body

### GraphQL Integration

Linear's GraphQL API requires proper query formatting:

```graphql
query SearchIssues($query: String!) {
  issues(filter: { search: $query }, first: 25) {
    nodes {
      id
      title
      description
      state {
        name
      }
      assignee {
        name
      }
      team {
        name
        key
      }
      updatedAt
    }
  }
}
```

Our implementation needs to:
1. Format proper GraphQL queries
2. Handle variables and pagination
3. Process responses into our domain types
4. Handle errors gracefully

### Configuration and Authentication

Linear authentication uses API keys, which will be handled using a typed configuration object passed directly to actions, following our pure-action pattern:

```typescript
// Define configuration type
type Config = {
  linearApiKey: string;
};

// Function to load config from environment
export function getConfig(): Config {
  const linearApiKey = Deno.env.get("LINEAR_API_KEY");
  if (!linearApiKey) {
    throw new Error("LINEAR_API_KEY environment variable is not set");
  }
  
  return {
    linearApiKey,
  };
}

// Usage in an action - configuration is passed explicitly
export const SearchIssuesAction = (effects: { http: HTTPEffect }) => ({
  async execute(query: string, config: Config): Promise<Issue[]> {
    // Use config.linearApiKey with HTTP effect to call Linear API
    const response = await effects.http.fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.linearApiKey}`,
        "Content-Type": "application/json"
      },
      // Query body here
    });
    
    // Process response
  }
});
```

This approach:
1. Keeps actions pure by explicitly passing all dependencies
2. Isolates environment access to the config utility
3. Makes testing easier by allowing mock configs to be passed
4. Improves type safety with typed configuration

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

## Implementation Checklist for Linear API Integration

### 1. Configuration for Linear API
- [ ] Create Config type definition
- [ ] Implement getConfig utility for environment-based config
- [ ] Add validation and error handling
- [ ] Write tests with mocked environment

### 2. GraphQL Utilities
- [ ] Create GraphQL query builder
- [ ] Implement response parsing utilities
- [ ] Add error handling for GraphQL errors

### 3. SearchIssuesAction
- [ ] Implement action using HTTP effect
- [ ] Format GraphQL query for issue search
- [ ] Parse and transform response to Issue[] type
- [ ] Handle pagination if needed

### 4. Integration with MCP Handlers
- [ ] Update handler dependencies to use real actions
- [ ] Pass token source to actions from handlers
- [ ] Update error handling for real API scenarios

### 5. Testing
- [ ] Unit tests for TokenSource
- [ ] Unit tests for SearchIssuesAction
- [ ] Integration tests for the full flow