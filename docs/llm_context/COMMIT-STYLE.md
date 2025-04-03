# Commit Message Style Guide

## Format

We follow the Conventional Commits specification with scope information when
applicable:

```
<type>(<scope>): <description>
```

- `<type>`: Describes the kind of change (e.g., feat, fix, docs, chore,
  refactor, test, style)
- `<scope>`: Optional, indicates what area of the codebase is affected (e.g.,
  dx, auth, api)
- `<description>`: A concise description of the changes

## Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `chore`: Changes to the build process, tools, etc.
- `refactor`: Code changes that neither fix a bug nor add a feature
- `test`: Adding or updating tests
- `style`: Changes that don't affect the code's meaning (formatting, etc.)

## Scopes

Scopes should be used when changes affect a specific area of the codebase:

- `dx`: Developer experience improvements
- `api`: API-related changes
- `ui`: User interface changes
- `auth`: Authentication-related changes
- `db`: Database-related changes
- `tests`: Test-related changes

Omit the scope when a change affects the entire product or doesn't fit into a
specific area.

## Examples

```
feat(auth): add JWT authentication
fix(api): correct response format for error cases
docs(api): update endpoint documentation
chore: update dependencies
refactor: simplify error handling logic
test(auth): add tests for login flow
```

## Guidelines

- Keep the first line under 72 characters
- Use the imperative mood ("add" not "added")
- Do not end the description with a period
- Include "BREAKING CHANGE:" in the body for breaking changes
