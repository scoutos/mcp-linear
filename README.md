# Linear MCP Server

A Node.js implementation of an MCP server for Linear integration.

## About

This MCP (Model Context Protocol) server provides a standardized interface for
AI models to interact with Linear issue tracking functionality. It follows the
Actions and Effects architecture pattern for clear separation of concerns and
testability.

### Key Features

- Standard MCP protocol implementation for Linear using the official MCP SDK
- Support for searching issues, reading details, updating, and commenting
- Clean architecture following functional programming principles
- Pure Node.js implementation for broad compatibility

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

This project uses Node.js and TypeScript for development.

### Prerequisites

- Node.js (v18+)
- npm

### First-time Setup

After cloning the repository, run:

```bash
npm install
```

### Available Commands

```bash
# Start the development server with file watching
npm run dev

# Start the server
npm start

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint
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
│   ├── http/            # HTTP effects for API communication
│   ├── storage/         # Storage effects for data persistence (future)
│   └── logging/         # Logging effects for observability (future)
├── types/               # Type definitions
├── src/                 # Source files
│   ├── actions/         # Business logic actions
│   ├── effects/         # Effect implementations for Node.js
│   ├── mcp/             # MCP server implementation
│   │   ├── handlers.ts  # Request handlers
│   │   └── server-stdio.ts # Server implementation using MCP SDK
│   ├── types/           # Type definitions
│   ├── utils/           # Utility functions
│   └── index.ts         # Main entry point
├── bin.ts               # CLI entry point
└── package.json         # Project metadata and dependencies
```

## API Endpoints

The MCP server exposes the following tools:

- `linear-search` - Search Linear issues with a query string
- `linear-issue` - Get, update, or add comments to Linear issues

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for
details.
