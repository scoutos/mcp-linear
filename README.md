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
- Node.js implementation with the official MCP SDK

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- Linear API key

### Installation

1. Clone the repository
2. Install dependencies
```bash
npm install
```
3. Create a `.env` file in the root directory with your Linear API key
```
LINEAR_API_KEY=your_linear_api_key_here
```

### Running the Server

Start the server:

```bash
npm start
```

For development with file watching:

```bash
just dev
```

For development with debug logging:

```bash
just debug
```

Or set environment variables manually:

```bash
LOG_LEVEL=DEBUG NODE_ENV=development node src/index.js
```

Logs will be written to the `logs/mcp-linear.log` file to avoid interfering with the STDIO transport.

### Using with MCP Inspector

The server runs in stdio mode, which means you can connect to it with the MCP Inspector.

1. Start the server in one terminal:
```bash
npm start
```

2. Visit the web-based inspector at: https://inspector.modelcontextprotocol.ai

3. Select "stdio" as the transport type

4. Enter the following command:
```
node /path/to/mcp-linear/src/index.js
```

5. Click "Connect" to connect to your running server

### Usage with Claude Desktop

Add the following to your Claude Desktop configuration file (typically at
`~/.config/Claude Desktop/claude_desktop_config.json`):

```json
{
  "mcp": {
    "servers": [
      {
        "name": "Linear",
        "command": "node /path/to/mcp-linear/src/index.js",
        "env": {
          "LINEAR_API_KEY": "your_linear_api_key_here",
          "LOG_LEVEL": "DEBUG", 
          "NODE_ENV": "development"
        }
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
      "command": "node /path/to/mcp-linear/src/index.js",
      "env": {
        "LINEAR_API_KEY": "your_linear_api_key_here",
        "LOG_LEVEL": "DEBUG", 
        "NODE_ENV": "development"
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

## Project Structure

```
/
├── src/                     # Source code
│   ├── effects/             # Effects implementation
│   │   ├── http/            # HTTP effects for API communication
│   │   └── logging/         # Logging effects for safe logging with STDIO
│   ├── tools/               # MCP tools implementation
│   │   ├── types/           # Tool type definitions
│   │   └── utils/           # Tool utility functions
│   ├── utils/               # Utility modules
│   │   ├── config/          # Configuration utilities
│   │   └── linear/          # Linear API integration
│   └── index.js             # Main entry point
├── logs/                    # Log files (created at runtime)
├── scripts/                 # Development scripts
└── package.json             # Project configuration
```

## Available Tools

The MCP server exposes the following tools:

- `list_tickets` - List Linear tickets with various filtering options (assignee, status, etc.)

## Troubleshooting

If you're having issues with the Linear MCP server:

1. **Check your Linear API key**: Make sure you've set a valid Linear API key in your .env file or environment variables. Linear API keys should start with "lin_api_".

2. **Enable debug logging**:
   
   a. When starting the MCP server:
   ```bash
   just debug
   # or
   LOG_LEVEL=DEBUG NODE_ENV=development node src/index.js
   ```
   
   b. In your client configuration (Claude Desktop, Cursor, etc.):
   ```json
   "env": {
     "LINEAR_API_KEY": "your_linear_api_key_here",
     "LOG_LEVEL": "DEBUG"
   }
   ```
   
   c. When calling tools directly, add the debug parameter:
   ```json
   {
     "debug": true
   }
   ```

3. **Check log files**: Examine logs in the `logs/mcp-linear.log` file for detailed error information.

4. **Verify Linear API access**: Make sure your Linear API key has appropriate permissions and that you can access the Linear API directly.

## Architecture

The application follows an effects-based architecture:

- **Effects**: Side-effecting operations are isolated in the `effects` directory:
  - `http`: For network requests to the Linear API
  - `logging`: Safe logging that doesn't interfere with STDIO transport

- **Tools**: MCP tool implementations that use effects for side-effects

- **Utils**: Utility modules for configuration, Linear API, etc.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for
details.