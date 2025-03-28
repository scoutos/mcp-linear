# Next Steps for Linear MCP Implementation

This document outlines the plan for implementing the MCP server that integrates with Linear.

## Current Status

We've made progress on the MCP server implementation:
- Basic server structure is in place
- HTTP effect and in-memory test implementation exist
- Response formatters for the MCP protocol are implemented
- Type definitions for Linear, MCP protocol, and TokenSource are defined
- Mock handlers for search, get, update, and comment are functioning

## Immediate Focus: Linear Authentication and Search

Our immediate priority is to implement authentication with Linear and enable real issue searching. This means:

1. Implementing a TokenSource for Linear API keys
2. Creating the SearchIssuesAction with real Linear API integration
3. Updating the MCP handlers to use the real actions instead of mock data

## Implementation Plan

### 1. Configuration for Linear API Authentication

- **Configuration Implementation**:
  - Create a typed configuration interface for Linear API
  - Implement a config utility for loading from environment variables
  - Include validation and error handling
  - Make configuration easily mockable for testing

### 2. Linear GraphQL API Integration

- **Linear GraphQL Client**:
  - Define GraphQL queries for issue search
  - Create helper functions to execute GraphQL operations
  - Handle pagination for search results
  - Implement error handling and response parsing

### 3. SearchIssuesAction Implementation

- **Create Real Implementation**:
  - Implement action using HTTP effect and TokenSource
  - Transform Linear GraphQL responses to our domain types
  - Add filtering and sorting capabilities
  - Handle errors gracefully

### 4. Connect MCP Handlers to Real Actions

- **Update Handlers**:
  - Refactor handler dependencies to accept actions
  - Connect search handler to real SearchIssuesAction
  - Ensure proper parameter passing and error handling

### 5. Testing Strategy

- **Unit Tests**:
  - Test TokenSource implementation
  - Test SearchIssuesAction with mock HTTP effect
  - Test updated handlers with mock actions

- **Integration Tests**:
  - Test end-to-end flow with mock HTTP responses
  - Create a test harness for manual verification

## Development Approach

We'll implement features incrementally:

1. **Authentication Phase**
   - Implement TokenSource for Linear API keys
   - Add configuration options
   - Write comprehensive tests

2. **API Integration Phase**
   - Create GraphQL query utilities for Linear
   - Implement SearchIssuesAction
   - Test with mock HTTP responses

3. **MCP Integration Phase**
   - Connect real actions to MCP handlers
   - Update server to use real handlers
   - Test end-to-end flow

4. **Polish Phase**
   - Improve error handling
   - Add robust logging
   - Document usage and requirements

## Key Files to Implement

```
/token-sources/
  linear-api-key.ts      # API key implementation
  linear-api-key.test.ts # Tests for API key implementation

/actions/
  search-issues.ts       # Real SearchIssuesAction implementation 
  search-issues.test.ts  # Tests for SearchIssuesAction

/utils/
  linear-graphql.ts      # GraphQL utilities for Linear API
  linear-graphql.test.ts # Tests for GraphQL utilities
```

After completing this phase, we'll be able to authenticate with Linear and perform real issue searches through the MCP protocol.