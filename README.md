# Linear MCP Server

A Deno 2.0 implementation of an MCP server for Linear integration.

## About

This MCP (Model Context Protocol) server provides a standardized interface for AI models to interact with Linear issue tracking functionality. It follows the Actions and Effects architecture pattern for clear separation of concerns and testability.

### Key Features

- Standard MCP protocol implementation for Linear 
- Support for searching issues, reading details, updating, and commenting
- Clean architecture following functional programming principles
- Runs standalone without requiring Deno installation

## Getting Started

### Quick Start (No Installation Required)

Use the server directly without installation:

```bash
npx @scoutos/mcp-linear
```

### Installation Options

#### Option 1: Using npm (Node.js)

```bash
# Install globally
npm install -g @scoutos/mcp-linear

# Run the server
mcp-linear
```

#### Option 2: Using Deno

If you have Deno installed:

```bash
# Run directly without installation
deno run --allow-env --allow-stdio https://deno.land/x/mcp_linear/main.ts

# Or install and run
deno install --allow-env --allow-stdio -n mcp-linear https://deno.land/x/mcp_linear/main.ts
mcp-linear
```

### Usage with Claude Desktop

Add the following to your Claude Desktop configuration file (typically at `~/.config/Claude Desktop/claude_desktop_config.json`):

```json
{
  "mcp": {
    "servers": [
      {
        "name": "Linear",
        "command": "npx @scoutos/mcp-linear",
        "env": {
          "LINEAR_API_KEY": "your_linear_api_key_here"
        }
      }
    ]
  }
}
```

Alternatively, you can use Docker:

```json
{
  "mcp": {
    "servers": [
      {
        "name": "Linear",
        "command": "docker run --rm -e LINEAR_API_KEY=your_linear_api_key_here scoutos/mcp-linear:latest"
      }
    ]
  }
}
```

### Usage with Cursor

For Cursor, add the following to your settings:

```json
{
  "ai.mcp.servers": [
    {
      "name": "Linear",
      "command": "npx @scoutos/mcp-linear",
      "env": {
        "LINEAR_API_KEY": "your_linear_api_key_here"
      }
    }
  ]
}
```

### Testing Your Integration

To verify your setup:

1. Configure the MCP server in your Claude Desktop or Cursor settings
2. Restart your application
3. Ask: "Search for Linear issues containing 'bug'"
4. The assistant should detect and use the Linear MCP server to retrieve results

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

### Building for Distribution

#### Building the npm Package

To build the package for npm distribution:

```bash
# Create a standalone executable
deno compile --allow-net --allow-env --output dist/mcp-linear main.ts

# Package for npm distribution
# This requires additional configuration in a package.json file
```

The binary will be available in the `dist` directory and can be published to npm.

#### Publishing to Deno Land

To make the package available via `deno.land/x`:

```bash
# Ensure all tests pass
just test

# Tag a new version
git tag v0.1.0
git push --tags
```

Then submit the module to `deno.land/x` following their contribution guidelines.

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
