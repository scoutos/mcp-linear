# Reference Documentation

This document contains references to documentation for specific technologies.

## Deno

It is **very important to remember that we are working on Deno 2.0**. You may
know about lots of information specific to Deno 1.0, but it is important to
check and see if we are doing things correctly for **Deno 2.0**.

You can find **up-to-date** documentation here:
[Deno Docs](https://docs.deno.com)

## MCP (Model Context Protocol)

- [MCP Documentation](https://modelcontextprotocol.io/introduction) - Official
  documentation for the Model Context Protocol

MCP Key Concepts:

- MCP is a standardized protocol for AI models to access external data and
  capabilities
- MCP servers expose specific capabilities through the standardized protocol
- Servers can connect to local data sources or remote services via web APIs
- The protocol provides a consistent interface for AI models to access different
  tools and data

## Linear

- [Linear API Documentation](https://developers.linear.app/docs) - Official
  Linear API documentation for integrating with Linear
- [Linear SDK Documentation](https://developers.linear.app/docs/sdk/fetching-and-modifying-data) - 
  Documentation for using the Linear JavaScript/TypeScript SDK
- [Linear GraphQL API Explorer](https://developers.linear.app/docs/graphql/working-with-the-graphql-api) -
  Tool for exploring and testing Linear's GraphQL API

Linear API Key Concepts:

- Linear provides a GraphQL API for programmatic access to issues, comments, and
  other data
- Authentication is done via API keys, which can be obtained from the Linear
  application settings
- To access the API, include a bearer token in the Authorization header:
  ```
  Authorization: Bearer YOUR_API_KEY
  ```
- GraphQL queries must be sent to `https://api.linear.app/graphql` as POST
  requests
- API keys should be stored securely as environment variables, not hardcoded in
  source code

### Linear SDK Key Concepts

- The Linear SDK is a TypeScript/JavaScript wrapper around the GraphQL API
- SDK functions return promises that resolve to the requested data
- Many fields in the response are also promises (like user, assignee, team)
- To access these fields, you need to await them separately:
  ```javascript
  const issue = await client.issue('ISSUE_ID');
  const assignee = await issue.assignee; // Assignee is a promise that needs to be awaited
  ```
- SDK methods often return collections with a `nodes` array containing the results
- The SDK uses a builder pattern for constructing GraphQL queries

### Example Linear GraphQL Queries

#### Searching Issues

```graphql
query SearchIssues($query: String!, $first: Int!) {
  issues(filter: { search: $query }, first: $first) {
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

## Our Implementation Patterns

- Configuration is handled via typed objects and utility functions, not directly
  in business logic
- GraphQL interactions are encapsulated in utility functions for easier testing
  and reuse
- Actions are kept pure by passing configuration explicitly, not accessing
  environment directly
- Tests for environment-dependent code need the `--allow-env` flag

## Example Repositories

These repositories may be used for reference, though they might not be actively
maintained:

- [jerhadf/linear-mcp-server](https://github.com/jerhadf/linear-mcp-server) -
  Example Linear MCP server implementation
- [ibraheem4/linear-mcp](https://github.com/ibraheem4/linear-mcp) - Another
  example Linear MCP implementation
