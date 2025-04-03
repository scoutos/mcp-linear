# Linear MCP Server

A Deno 2.0 implementation of an MCP server for Linear integration.

## About

This MCP (Model Context Protocol) server provides a standardized interface for
AI models to interact with Linear issue tracking functionality. It follows the
Actions and Effects architecture pattern for clear separation of concerns and
testability.

### Key Features

- Standard MCP protocol implementation for Linear using the official MCP SDK
- Support for searching issues, reading details, updating, and commenting
- Clean architecture following functional programming principles
- Pure Deno 2.0 implementation for speed, security and simplicity

## Getting Started

### Quick Start (No Installation Required)

Use the server directly without installation:

```bash
npx @scoutos/mcp-linear
```

### Installation Options

#### Option 1: Using Deno

```bash
# Run directly without installation 
deno run --allow-env --allow-net main.ts

# Or install globally
deno install --allow-env --allow-net -n mcp-linear main.ts

# Run the server
mcp-linear
```

### Usage with Claude Desktop

Add the following to your Claude Desktop configuration file (typically at
`~/.config/Claude Desktop/claude_desktop_config.json`):

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

# Format code
just fmt

# Lint code
just lint

# Run all local checks with auto-fixing where possible
just check

# Run tests
just test

# Check types
just check-types

# Set up git hooks (runs automatically from post-clone)
just setup-hooks
```

### Integrations and Dependencies

- Uses
  [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk)
  for MCP implementation
- Linear API integration via GraphQL

## Project Structure

```
/
├── effects/             # Core effect definitions and implementations
│   ├── actions/         # Business logic actions
│   ├── config/          # Configuration utilities
│   ├── http/            # HTTP effects for API communication
│   ├── linear/          # Linear API integration
│   └── tools/           # MCP tools implementation
│       ├── types/       # Tool type definitions
│       └── utils/       # Tool utility functions
├── main.ts              # Main entry point
├── deno.json            # Deno configuration
└── justfile             # Development workflow commands
```

## API Endpoints

The MCP server exposes the following tools:

- `hello_world` - Simple test tool to verify the MCP server is working
- `search_tickets` - Search Linear tickets with filtering and sorting options

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for
details.
