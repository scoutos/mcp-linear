# Next Steps for Linear MCP Implementation

This document outlines the plan for implementing the MCP server that integrates with Linear.

## Understanding the Components

### What is an MCP Server?
An MCP (Model Context Protocol) server acts as a bridge between AI models and external data sources/services. Our goal is to build an MCP server that provides AI models standardized access to Linear's issue tracking functionality.

### Linear Functionality
We need to expose these core Linear capabilities through our MCP server:
- Search issues
- Read issues and comments
- Edit issues (body, tags, etc.)
- Add comments

## Implementation Plan

### 1. Core Effects Definition

We'll need these fundamental effects:

- **HTTPEffect**: For making network requests to Linear's API
  ```typescript
  type HTTPEffect = {
    fetch: (url: string, options: RequestOptions) => Promise<Response>;
  };
  ```

- **StorageEffect**: For persisting data like tokens or cached responses
  ```typescript
  type StorageEffect = {
    read: (key: string) => Promise<string | null>;
    write: (key: string, value: string) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
  ```

- **LoggingEffect**: For consistent logging
  ```typescript
  type LoggingEffect = {
    info: (message: string, data?: unknown) => void;
    error: (message: string, error?: unknown) => void;
    debug: (message: string, data?: unknown) => void;
  };
  ```

### 2. Business Domain Types

Define core business entities that represent our domain:

- **TokenSource**: For handling Linear authentication
  ```typescript
  type TokenSource = {
    getToken: () => Promise<string>;
    refreshToken: () => Promise<string>;
  };
  ```

- **LinearClient**: A higher-level abstraction for Linear operations
  ```typescript
  type LinearClient = {
    searchIssues: (query: string) => Promise<Issue[]>;
    getIssue: (id: string) => Promise<Issue>;
    // other methods
  };
  ```

- **MCPTypes**: Types representing the MCP protocol
  ```typescript
  type MCPRequest = {
    // MCP request structure
  };
  
  type MCPResponse = {
    // MCP response structure
  };
  ```

### 3. Action Implementation

Create actions that use effects to implement business logic:

- **SearchIssuesAction**: Search for issues matching criteria
- **GetIssueAction**: Retrieve a specific issue and its details
- **UpdateIssueAction**: Modify an existing issue
- **AddCommentAction**: Add a comment to an issue

### 4. MCP Server Implementation

Build the MCP server that:
- Receives MCP protocol requests
- Routes them to appropriate actions
- Returns responses in MCP format

### 5. Effect Implementations

Create concrete implementations for each effect:

- **DenoFetch**: Implementation of HTTPEffect using Deno's native fetch
- **FileSystemStorage**: Implementation of StorageEffect using Deno's file system APIs
- **ConsoleLogger**: Basic implementation of LoggingEffect

### 6. Testing Strategy

- Create in-memory implementations of each effect for testing
- Test actions in isolation with mock effects
- Test the MCP server interface with mock actions
- Create integration tests that test the full flow
- Co-locate tests with implementation files following our code style guide

## Development Approach

We'll implement features incrementally:

1. **Setup Phase**
   - Define core effects and their test implementations
   - Set up project structure following Actions and Effects pattern
   - Create basic domain types (TokenSource, LinearClient)

2. **Linear Integration Phase**
   - Implement actions for Linear operations
   - Create TokenSource implementation for Linear
   - Test each action independently

3. **MCP Protocol Phase**
   - Define MCP request/response types
   - Implement MCP request handlers
   - Create MCP server with routing

4. **Polish Phase**
   - Improve error handling and logging
   - Add comprehensive testing
   - Document usage and integration

## Key Files and Structure

```
/effects/
  /http/
    index.ts          # HTTPEffect definition
    deno-fetch.ts     # Deno implementation
    deno-fetch.test.ts # Tests for Deno implementation
    in-memory.ts      # Test implementation
    in-memory.test.ts # Tests for in-memory implementation
  /storage/
    index.ts          # StorageEffect definition
    file-system.ts    # File system implementation
    file-system.test.ts # Tests for implementation
    in-memory.ts      # Test implementation
    in-memory.test.ts # Tests for in-memory implementation
  /logging/
    index.ts          # LoggingEffect definition
    console-logger.ts # Console implementation
    console-logger.test.ts # Tests for console implementation
    in-memory.ts      # Test implementation
    in-memory.test.ts # Tests for in-memory implementation

/types/
  linear.ts           # Types for Linear entities (Issue, Comment, etc.)
  token-source.ts     # TokenSource interface
  mcp.ts              # MCP protocol types

/token-sources/
  linear-token.ts     # Linear token implementation
  linear-token.test.ts # Tests for Linear token source

/actions/
  search-issues.ts    # SearchIssuesAction
  search-issues.test.ts # Tests for SearchIssuesAction
  get-issue.ts        # GetIssueAction
  get-issue.test.ts   # Tests for GetIssueAction
  update-issue.ts     # UpdateIssueAction
  update-issue.test.ts # Tests for UpdateIssueAction
  add-comment.ts      # AddCommentAction
  add-comment.test.ts # Tests for AddCommentAction
  
/mcp/
  server.ts           # MCP server implementation
  server.test.ts      # Tests for server implementation
  handlers.ts         # Request handlers
  handlers.test.ts    # Tests for request handlers
  formatter.ts        # Response formatters
  formatter.test.ts   # Tests for response formatters
```

This structure follows our Actions and Effects architecture while focusing on the specific needs of an MCP server for Linear integration. Tests are co-located with the implementation files they're testing, as per our code style guide.