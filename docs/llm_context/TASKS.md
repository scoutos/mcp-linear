# Common Tasks

This document outlines standard instructions for common tasks. When the user requests these with shorthand commands, follow these detailed procedures.

## Git Operations

### When user says "let's commit" or "commit changes":

1. Run `git status` to check modified files
2. Run `git diff` to review changes
3. Create a descriptive commit message following conventional commits
   - Follow the format: `<type>(<scope>): <description>`
   - Use scope when changes affect a specific area (e.g., `feat(dx)`, `docs(llm)`)
   - Omit scope when changes affect the entire product
   - See `COMMIT-STYLE.md` for detailed guidelines
4. Commit changes without "created by Claude" messaging

### When user says "push changes" or "push this up":

1. Check branch status with `git status`
2. Push to remote using `git push`
3. Confirm successful push

## Feature Development

### When user says "start a feature" or "get started on [feature]":

1. Create a feature branch from main (`git checkout -b feature/[name]`)
2. Break down the feature into implementable components
3. Suggest a development plan with clear milestones
4. Start with test implementation following code style guidelines

## Session Reflection

### When user says "reflect on this session" or "update context":

1. Review work completed during the session
2. Identify documentation that should be updated
3. Suggest improvements to workflow or code organization
4. Update appropriate files in the `docs/llm_context` directory

## Testing and Validation

### When user says "test this" or "validate changes":

1. Run appropriate test commands for modified components
2. Verify type checking passes
3. Run linting if available
4. Report results and any necessary fixes

## Linear API Integration Tasks

### Linear API Key Token Source Implementation

1. Create the token source directory structure if needed
2. Implement environment-based API key TokenSource
3. Add validation and error handling
4. Write tests with mocked environment

### GraphQL Utilities for Linear API

1. Create a utilities directory and files
2. Implement query building functions
3. Create response parsing utilities
4. Add error handling for GraphQL errors
5. Write tests for GraphQL utilities

### SearchIssuesAction Implementation

1. Create the action file and test file
2. Implement the action factory function
3. Build the GraphQL query for search
4. Process and transform the response
5. Implement error handling
6. Write tests with mocked HTTP effect

### MCP Handler Integration

1. Update handler dependencies to accept actions
2. Modify the search handler to use real SearchIssuesAction
3. Implement token source creation from requests
4. Update error handling for real API scenarios
5. Write tests for the updated handlers

### End-to-End Testing

1. Create an integration test for the search flow
2. Test with mock HTTP responses
3. Verify the entire flow works as expected
4. Create a development harness for manual testing