# Project-Specific Guidelines

## MCP-Linear Project

This project implements an MCP (Model Context Protocol) server that provides
access to Linear issue tracking functionality. The server acts as a bridge that
allows AI models to interact with Linear through a standardized protocol.

## Linear MCP Server Architecture

### Core Concepts

This project follows our Actions and Effects architecture to implement a Model
Context Protocol (MCP) server for Linear integration.

- **MCP Server**: Implements the standardized MCP protocol using the official
  `@modelcontextprotocol/sdk` to expose Linear functionality to AI models
- **Linear API**: Accessed through GraphQL to perform operations on issues,
  comments, etc.
- **Actions**: Encapsulate business logic for searching, reading, editing issues
  and adding comments
- **Effects**: Provide fundamental capabilities (HTTP, storage, logging) for the
  actions to use

### Project Structure

Our implementation follows this high-level structure:

1. Core effects providing general capabilities (HTTP, Storage, Logging)
2. Actions representing business logic for Linear operations
3. MCP server handlers that translate MCP protocol requests to our actions
4. Types and interfaces representing the business domain

### MCP SDK Integration

Our project now uses the official `@modelcontextprotocol/sdk` package to
implement the MCP server. This provides several advantages:

- Standard compliance with the latest MCP protocol version
- Built-in validation using Zod
- Proper type safety and better developer experience
- Easier maintenance as the protocol evolves

The integration follows this pattern:

```typescript
// Import the SDK
const { McpServer, StdioServerTransport } = require(
  "@modelcontextprotocol/sdk/dist/cjs/server/mcp.js",
);
const { z } = require("zod");

// Create server with name and version
const server = new McpServer({
  name: "Linear MCP Server",
  version: "0.1.0",
  description: "MCP server for Linear issue tracking",
});

// Define tools with Zod schemas
server.tool(
  "linear-search",
  {
    query: z.string().describe("Search query for Linear issues"),
  },
  async ({ query }) => {
    // Implementation that calls our actions
    const request = { id: "1", params: { query } };
    const response = await handlers.searchIssues(request);

    return {
      content: [
        { type: "text", text: JSON.stringify(response.result) },
      ],
    };
  },
  { description: "Search Linear issues" },
);

// Connect to stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

This approach leverages the SDK's capabilities while still using our Actions and
Effects architecture for the core business logic.

### Linear Integration Features

Our integration with Linear focuses on these core capabilities:

- Searching issues
- Reading issues and comments
- Editing issues (body, tags, etc.)
- Adding comments

These capabilities are implemented as actions that use fundamental effects like
HTTP for communicating with Linear's GraphQL API.

### Linear API Authentication

Linear authentication uses API keys, which can be obtained from the Linear
application settings. The API key is used to authenticate GraphQL API requests.

#### Linear API Key

To obtain a Linear API key:

1. Log in to Linear
2. Go to Settings > API > Personal API keys
3. Generate a new API key with appropriate permissions

This API key should be securely stored and provided to the MCP server via
environment variables or secure configuration.

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

Linear authentication uses API keys, which are handled using a typed
configuration object passed directly to actions, following our pure-action
pattern:

```typescript
// Define configuration type
type Config = {
  linearApiKey: string;
};

// Function to load config from environment
export function getConfig(): Config {
  const linearApiKey = process.env.LINEAR_API_KEY;
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
    const response = await effects.http.fetch(
      "https://api.linear.app/graphql",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.linearApiKey}`,
          "Content-Type": "application/json",
        },
        // Query body here
      },
    );

    // Process response
  },
});
```

This approach:

1. Keeps actions pure by explicitly passing all dependencies
2. Isolates environment access to the config utility
3. Makes testing easier by allowing mock configs to be passed
4. Improves type safety with typed configuration

## Implementation Checklist for Linear API Integration

### 1. Configuration for Linear API ✅

- [x] Create Config type definition
- [x] Implement getConfig utility for environment-based config
- [x] Add validation and error handling
- [x] Write tests with mocked environment

### 2. GraphQL Utilities ✅

- [x] Create GraphQL query builder
- [x] Implement response parsing utilities
- [x] Add error handling for GraphQL errors

### 3. SearchIssuesAction ✅

- [x] Implement action using HTTP effect
- [x] Format GraphQL query for issue search
- [x] Parse and transform response to Issue[] type
- [x] Handle pagination if needed

### 4. Integration with MCP SDK ✅

- [x] Update server implementation to use the `@modelcontextprotocol/sdk`
- [x] Create tools using Zod schemas
- [x] Connect to StdioServerTransport
- [x] Update error handling for SDK integration

### 5. Testing

- [x] Unit tests for TokenSource
- [x] Unit tests for SearchIssuesAction
- [ ] Integration tests for the MCP SDK integration
- [ ] End-to-end testing with Claude Desktop
