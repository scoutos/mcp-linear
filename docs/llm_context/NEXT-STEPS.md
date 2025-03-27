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

We'll need these general effects:

- **HTTPEffect**: For making network requests to Linear's API
  ```typescript
  type HTTPEffect = {
    fetch: (url: string, options: RequestOptions) => Promise<Response>;
  };
  ```

- **AuthEffect**: For handling authentication with Linear
  ```typescript
  type AuthEffect = {
    getAccessToken: () => Promise<string>;
    refreshToken: () => Promise<string>;
  };
  ```

- **ConfigEffect**: For managing configuration values
  ```typescript
  type ConfigEffect = {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
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

### 2. Action Implementation

Create actions that use these effects to interact with Linear:

- **SearchIssuesAction**: Search for issues matching criteria
- **GetIssueAction**: Retrieve a specific issue and its details
- **UpdateIssueAction**: Modify an existing issue
- **AddCommentAction**: Add a comment to an issue

### 3. MCP Server Implementation

Build the MCP server that:
- Receives MCP protocol requests
- Routes them to appropriate actions
- Returns responses in MCP format

### 4. Effect Implementations

Create concrete implementations for each effect:

- **DenoFetch**: Implementation of HTTPEffect using Deno's native fetch
- **LinearAuthProvider**: Implementation of AuthEffect for Linear
- **FileSystemConfig**: Implementation of ConfigEffect using local files
- **ConsoleLogger**: Basic implementation of LoggingEffect

### 5. Testing Strategy

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
   - Create basic MCP server structure

2. **Linear Integration Phase**
   - Implement Linear API integration
   - Create actions for each required capability
   - Test each action independently

3. **MCP Protocol Phase**
   - Implement MCP request handlers
   - Create response formatters
   - Add error handling

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
  /auth/
    index.ts          # AuthEffect definition
    linear-auth.ts    # Linear implementation
    linear-auth.test.ts # Tests for Linear implementation
    in-memory.ts      # Test implementation
    in-memory.test.ts # Tests for in-memory implementation
  /config/
    index.ts          # ConfigEffect definition
    fs-config.ts      # File system implementation
    fs-config.test.ts # Tests for file system implementation 
    in-memory.ts      # Test implementation
    in-memory.test.ts # Tests for in-memory implementation
  /logging/
    index.ts          # LoggingEffect definition
    console-logger.ts # Console implementation
    console-logger.test.ts # Tests for console implementation
    in-memory.ts      # Test implementation
    in-memory.test.ts # Tests for in-memory implementation

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