# Available recipes for the mcp-linear project

# Default recipe - list all available recipes
default:
    @just --list

# Run the development server with file watching
dev:
    deno run --watch main.ts

# Format code using Deno's formatter
fmt:
    deno fmt

# Lint code using Deno's linter
lint:
    deno lint

# Format and lint all files
check: fmt lint

# Only format and lint staged files (pre-commit)
pre-commit:
    #!/usr/bin/env bash
    STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.([jt]sx?|json)$')
    if [ -n "$STAGED_FILES" ]; then
        echo "Formatting staged files..."
        echo "$STAGED_FILES" | xargs deno fmt
        echo "Linting staged files..."
        echo "$STAGED_FILES" | xargs deno lint
        # Re-add files that may have been modified by formatting
        echo "$STAGED_FILES" | xargs git add
    fi

# Run tests with coverage
test:
    deno test --coverage

# Check types
check-types:
    deno check **/*.ts