# Next Steps for Linear MCP Implementation

This document outlines the plan for implementing the MCP server that integrates with Linear.

## Current Status

We've made progress on the MCP server implementation:
- Basic server structure is in place
- HTTP effect and in-memory test implementation exist
- Response formatters for the MCP protocol are implemented
- Type definitions for Linear, MCP protocol, and TokenSource are defined
- Mock handlers for search, get, update, and comment are functioning

## Immediate Focus: Additional Linear API Operations

With Linear authentication and issue searching now implemented, our next priority should be to implement the remaining operations:

1. Getting issue details
2. Updating issues
3. Adding comments to issues

These would follow the same patterns we've established with the search functionality:

## Implementation Plan for Remaining Operations

### 1. Get Issue Details

- **GraphQL Utilities**:
  - Define GraphQL query for fetching a single issue with details
  - Create response transformation to our domain types
  - Add error handling for not found cases

- **GetIssueAction Implementation**:
  - Create action using HTTP effect
  - Pass configuration explicitly through parameters
  - Transform GraphQL responses to domain types

- **MCP Handler Connection**:
  - Connect handler to the real action
  - Ensure proper error handling

### 2. Update Issue

- **GraphQL Utilities**:
  - Define GraphQL mutation for updating issues
  - Create input/output transformations
  - Add validation for required fields

- **UpdateIssueAction Implementation**:
  - Create action using HTTP effect
  - Pass configuration explicitly
  - Validate and transform input parameters

- **MCP Handler Connection**:
  - Connect handler to the real action
  - Add proper input validation

### 3. Add Comment

- **GraphQL Utilities**:
  - Define GraphQL mutation for adding comments
  - Create response transformations

- **AddCommentAction Implementation**:
  - Create action using HTTP effect
  - Pass configuration explicitly
  - Transform responses

- **MCP Handler Connection**:
  - Connect handler to the real action
  - Validate input parameters

### 4. Testing Strategy

- **Unit Tests**:
  - Test each action with mock HTTP effects
  - Test handlers with mock actions
  - Verify error handling paths

- **Integration Tests**:
  - Create end-to-end tests for full flow
  - Test handling of API errors

## Development Approach

Follow the same pattern used for the search functionality:

1. **GraphQL Utilities First**
   - Define queries/mutations for each operation
   - Create transformation functions
   - Test with mock responses

2. **Actions Implementation**
   - Create pure functions that use the GraphQL utilities
   - Keep actions independent of environment
   - Pass config explicitly

3. **Handler Integration**
   - Connect handlers to real actions
   - Add proper error handling
   - Ensure validation of inputs

## Key Files to Implement

```
/utils/
  linear-graphql.ts      # Add new queries/mutations

/actions/
  get-issue.ts           # GetIssueAction implementation 
  get-issue.test.ts      # Tests for GetIssueAction
  update-issue.ts        # UpdateIssueAction implementation
  update-issue.test.ts   # Tests for UpdateIssueAction
  add-comment.ts         # AddCommentAction implementation
  add-comment.test.ts    # Tests for AddCommentAction
```

After completing these operations, we'll have a fully functional Linear MCP server with real API integration.