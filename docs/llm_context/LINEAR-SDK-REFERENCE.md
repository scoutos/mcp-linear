# Linear SDK Reference Guide

This document provides a reference for using the Linear SDK (@linear/sdk) correctly in our codebase.

## Overview

We use the official Linear SDK to interact with Linear's API. The current version we're using is:

```
@linear/sdk@38.0.0
```

This document outlines the proper method calls for common operations we perform with the Linear API.

## Issues

### Creating Issues

To create a new issue in Linear:

```javascript
// ✅ CORRECT
const issueResult = await client.issueCreate({
  title: "Issue title",
  teamId: "TEAM_ID", 
  description: "Description text",
  priority: 2, // 0-4
  assigneeId: "USER_ID", // optional
  stateId: "STATE_ID", // optional
  projectId: "PROJECT_ID" // optional
});

// Get the created issue data
const issueData = await issueResult.issue;

// ❌ INCORRECT - This method does not exist
// const issueResult = await client.issues.create({...});
```

### Getting Issues

To get a specific issue by ID:

```javascript
// Fetch by ID
const issue = await client.issue("ISSUE_ID");
```

### Listing Issues

To list issues with various filters:

```javascript
// Basic listing with filters
const issues = await client.issues({
  filter: {
    team: { name: { eq: "Engineering" } },
    state: { name: { eq: "In Progress" } }
  }
});

// Access the results
const issueNodes = issues.nodes;
```

## Projects

### Getting Projects

To get a specific project by ID:

```javascript
const project = await client.project("PROJECT_ID");
```

### Listing Projects

```javascript
const projects = await client.projects();
const projectNodes = projects.nodes;
```

## Teams

### Listing Teams

```javascript
const teams = await client.teams();
const teamNodes = teams.nodes;
```

## Members

### Listing Members

```javascript
const members = await client.users();
const memberNodes = members.nodes;
```

### Current User

```javascript
const currentUser = await client.viewer;
```

## Comments

### Adding Comments

```javascript
const commentResult = await client.commentCreate({
  issueId: "ISSUE_ID",
  body: "Comment text"
});

const commentData = await commentResult.comment;
```

## Response Structure

Linear API responses often contain nested promises that need to be awaited:

```javascript
// Example of handling a response with nested promises
const issue = await client.issue("ISSUE_ID");

// Nested properties are promises
const assignee = await issue.assignee;
const state = await issue.state;
const project = await issue.project;

// Comments and attachments are functions that return promises
const comments = await issue.comments();
const commentNodes = comments.nodes;
```

## Common Errors

1. **Method Not Found**: Ensure you're using the correct method names and structure
   - Example: Use `client.issueCreate()` not `client.issues.create()`

2. **Missing Required Fields**: Check required fields for each operation
   - For issue creation: `title` and `teamId` are required

3. **Promise Handling**: Remember that many properties are promises that need to be awaited
   - Example: `const issueData = await issueResult.issue;`

## Testing with the SDK

For integration testing, use a dedicated Linear workspace with a test API key.

```javascript
// Integration test example
import { LinearClient } from '@linear/sdk';

describe('Linear SDK Integration', () => {
  let client;
  
  beforeAll(() => {
    client = new LinearClient({ apiKey: process.env.LINEAR_TEST_API_KEY });
  });
  
  test('creating an issue works', async () => {
    const result = await client.issueCreate({
      title: 'Test Issue',
      teamId: 'TEAM_ID',
      description: 'Test description'
    });
    
    const issue = await result.issue;
    expect(issue.title).toBe('Test Issue');
  });
});
```

## References

- [Linear SDK Documentation](https://developers.linear.app/docs/sdk/getting-started)
- [Linear API Reference](https://developers.linear.app/docs/graphql/working-with-the-graphql-api)