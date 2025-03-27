# Linear MCP Server

A Deno 2.0 implementation of an MCP server for Linear integration.

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

# Format and lint all files
just check

# Run tests
just test

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

_More details coming soon_
