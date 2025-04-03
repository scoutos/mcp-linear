# Available recipes for the mcp-linear project

# Default recipe - list all available recipes
default:
    @just --list

# Run the development server with file watching
dev:
    deno task dev

# Format code using Deno's formatter (fixes issues)
fmt *args='':
    deno fmt {{args}}

# Check formatting without modifying files (for CI)
fmt-check:
    deno fmt --check

# Lint code using Deno's linter (doesn't fix issues)
lint *args='':
    deno lint {{args}}

# Run all local checks with auto-fixing where possible
check: fmt lint check-types test

# Run all CI checks (no auto-fixing)
ci-check: fmt-check lint check-types test

# CI checks (use ci-check)
ci: ci-check

# Only format and lint staged files (pre-commit) with auto-fixing
pre-commit:
    #!/usr/bin/env bash
    echo "Running pre-commit hooks..."
    
    # Get list of staged files
    STAGED_FILES=$(git diff --staged --name-only --diff-filter=ACMR | grep -E '\.(ts|js|json)$')
    
    if [ -n "$STAGED_FILES" ]; then
        echo "Formatting staged files..."
        echo "$STAGED_FILES" | xargs deno fmt
        
        echo "Linting staged files..."
        echo "$STAGED_FILES" | grep -E '\.(ts|js)$' | xargs deno lint
        
        # Add back formatted files
        echo "$STAGED_FILES" | xargs git add
    else
        echo "No relevant staged files found"
    fi

# Pre-push hook to ensure CI checks will pass
pre-push:
    #!/usr/bin/env bash
    echo "Running CI checks before push..."
    just ci-check

# Run tests with coverage
test *args='':
    deno test {{args}}

# Check types
check-types *args='':
    deno check main.ts {{args}}

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
    chmod +x .git/hooks/pre-commit

    # Create pre-push hook that calls our just pre-push recipe
    echo '#!/bin/sh
    # Run the pre-push recipe from justfile
    just pre-push
    ' > .git/hooks/pre-push
    chmod +x .git/hooks/pre-push

    echo "Git hooks have been set up successfully"

# Script that should be run after cloning the repository
post-clone: setup-hooks
    echo "Repository has been set up successfully"