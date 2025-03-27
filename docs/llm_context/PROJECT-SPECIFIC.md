# Project-Specific Guidelines

## MCP-Linear Project

This project implements an MCP (Model Context Protocol) server that provides access to Linear issue tracking functionality. The server acts as a bridge that allows AI models to interact with Linear through a standardized protocol.

## Key Architecture Points

### Effects as General Ports

It's critical to remember that effects should represent general capabilities (ports), NOT specific services:

❌ INCORRECT: Creating effects tied to specific services
```typescript
// This is incorrect - effects should not be tied to specific services
type LinearEffect = {
  searchIssues: (query: string) => Promise<Issue[]>;
  getIssue: (id: string) => Promise<Issue>;
};
```

✅ CORRECT: Creating general-purpose effects
```typescript
// This is correct - effects represent general capabilities
type HTTPEffect = {
  fetch: (url: string, options: RequestOptions) => Promise<Response>;
};

type AuthEffect = {
  getAccessToken: () => Promise<string>;
};
```

The specific service implementations (like Linear API clients) should be built on top of these general effects, not baked into the effect definitions themselves.

### Project Structure

Our implementation follows this high-level structure:

1. Core effects providing general capabilities (HTTP, Auth, Config, Logging)
2. Actions representing business logic that use these effects
3. MCP server handlers that translate MCP protocol requests to our actions
4. Effect implementations that connect to specific services (e.g., Linear API)

### Linear Integration

Our integration with Linear focuses on these core capabilities:
- Searching issues
- Reading issues and comments
- Editing issues (body, tags, etc.)
- Adding comments

These capabilities are implemented using our Actions and Effects architecture, where actions contain the business logic and effects provide the necessary external capabilities.

### MCP Protocol

The MCP protocol standardizes how AI models can access external data and capabilities. Our server implements this protocol to provide Linear functionality to AI models in a standardized way.