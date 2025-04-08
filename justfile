# Available recipes for the mcp-linear project

# Default recipe - list all available recipes
default:
    @just --list

# Install dependencies
deps:
    npm ci

dev:
    NODE_ENV=development node --watch src/index.js

# Run with debug logging
debug:
    NODE_ENV=development LOG_LEVEL=DEBUG node --watch src/index.js

# Format code using Prettier
fmt *args='':
    npx prettier --check "**/*.{js,json}" {{args}}

# Lint code using ESLint
lint *args='':
    npx eslint {{args}}

# Type check JavaScript files (shows errors but doesn't fail)
typecheck:
    @echo "Running TypeScript type checking (errors in HTTP effects expected)..."
    npm run typecheck

check: fmt lint typecheck

test *args='':
    npm test {{args}}

ci: deps check test
