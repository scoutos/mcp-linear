# Linear MCP Server

A Deno 2.0 implementation of an MCP server for Linear integration.

## About

This MCP (Model Context Protocol) server provides a standardized interface for AI models to interact with Linear issue tracking functionality. It follows the Actions and Effects architecture pattern for clear separation of concerns and testability.

### Key Features

- MCP protocol endpoints for Linear functionality
- Support for searching issues, reading details, updating, and commenting
- Clean architecture following functional programming principles

## Development

This project uses [Deno 2.0](https://docs.deno.com) and [just](https://github.com/casey/just) for development workflow.

### Prerequisites

- [Deno 2.0](https://docs.deno.com)
- [just](https://github.com/casey/just)

### First-time Setup

After cloning the repository, run:

```bash
just post-clone
```

This will set up the required git hooks to ensure consistent code quality.

### Available Commands

```bash
# List all available commands
just

# Run the development server with file watching
just dev

# Start the server
deno task start

# Format code
just fmt

# Lint code
just lint

# Format and lint all files
just check

# Run tests
just test
# or
deno task test

# Check types
just check-types

# Set up git hooks (runs automatically from post-clone)
just setup-hooks
```

### Developer Experience

This project includes:

- Pre-commit hooks to automatically format and lint staged files
- Deno's built-in formatter and linter
- Type checking through Deno

## Project Structure

```
/
├── effects/             # Core effect definitions and implementations
│   ├── http/            # HTTP effects for API communication
│   ├── storage/         # Storage effects for data persistence
│   └── logging/         # Logging effects for observability
├── types/               # Type definitions
├── token-sources/       # Token source implementations
├── actions/             # Business logic actions
├── mcp/                 # MCP server implementation
│   ├── server.ts        # Core server implementation
│   └── server.test.ts   # Server tests
├── main.ts              # Application entry point
└── main.test.ts         # Main application tests
```

## API Endpoints

The MCP server exposes the following endpoints:

- `GET /mcp` - Server information
- `GET /mcp/tools` - List available tools
- `POST /mcp/tools/linear-search` - Search Linear issues
- `GET /mcp/tools/linear-issue/{id}` - Get issue details
- `PUT /mcp/tools/linear-issue/{id}` - Update an issue
- `POST /mcp/tools/linear-issue/{id}/comment` - Add a comment to an issue
