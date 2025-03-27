# Available recipes for the mcp-linear project

# Default recipe - list all available recipes
default:
    @just --list

# Run the development server with file watching
dev:
    deno run --watch main.ts

# Format code using Deno's formatter
fmt *args='':
    deno fmt {{args}}

# Lint code using Deno's linter
lint *args='':
    deno lint {{args}}

# Format and lint all files
check: fmt lint

# CI checks for all files (for GitHub Actions)
ci: fmt lint check-types test

# Only format and lint staged files (pre-commit)
pre-commit:
    #!/usr/bin/env bash
    STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.([jt]sx?|json)$')
    TS_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.([t]sx?)$')
    if [ -n "$STAGED_FILES" ]; then
        echo "Formatting staged files..."
        echo "$STAGED_FILES" | xargs deno fmt
        echo "Linting staged files..."
        echo "$STAGED_FILES" | xargs deno lint
        # Re-add files that may have been modified by formatting
        echo "$STAGED_FILES" | xargs git add
    fi
    if [ -n "$TS_FILES" ]; then
        echo "Type-checking staged TypeScript files..."
        # Run type check on the whole project as Deno doesn't support type checking individual files
        deno check **/*.ts
    fi
    # Run tests
    echo "Running tests..."
    deno test

# Run tests with coverage
test *args='--coverage':
    deno test {{args}}

# Check types
check-types *args='':
    deno check **/*.ts {{args}}

# Setup git hooks
setup-hooks:
    #!/usr/bin/env bash
    echo "Setting up git hooks..."
    # Create hooks directory if it doesn't exist
    mkdir -p .git/hooks
    # Create pre-commit hook that calls our just pre-commit recipe
    echo '#!/bin/sh
    # Run the pre-commit recipe from justfile
    just pre-commit
    ' > .git/hooks/pre-commit
    # Make the hook executable
    chmod +x .git/hooks/pre-commit
    echo "Git hooks have been set up successfully"

# Script that should be run after cloning the repository
post-clone: setup-hooks
    echo "Repository has been set up successfully"