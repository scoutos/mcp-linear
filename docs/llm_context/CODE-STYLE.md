# Code Style Guide

## Core Principles

- Prioritize readable code over clever/cute code
- Write type-safe code
- Write tests, then code
- Respect and maintain consistent styling conventions

## Naming Conventions

- Files: Use `kebab-case` for all file names
- Variables: Use `snake_case` for variable and function names in
  JavaScript/TypeScript
- Classes: Use `PascalCase` for class names
- Constants: Use `UPPER_SNAKE_CASE` for constants

## File Organization

- Co-locate tests with the code they test
  - Example: `user-service.ts` and `user-service.test.ts`
- Include cascading `README.md` files alongside code modules if these modules
  are complex or require additional context

## Architecture Patterns

- Business logic should be separate from side effects
- Use [[ACTIONS-AND-EFFECTS.md]] architecture to define clear boundaries:
  - Express every major side-effect via an effect
  - Implement effects with concrete implementations for specific technologies
  - Use pure functions for business logic in actions
  - Use in-memory implementations for testing purposes
- Leverage functional programming principles and dependency injection for
  testable components
- This architecture reduces vendor lock-in, increases maintainability, and
  simplifies code

## Testing

- Tests should be co-located with the code they test
- Test files should follow the naming pattern: `{filename}.test.{extension}`
- Each unit test should focus on a single responsibility
- Unit tests for **actions** should assert that **effects** are called with the
  correct arguments
- Unit tests for **effect implementations** should mock any clients and assert
  that the clients are called with the correct arguments
- Write acceptance tests for user-facing features, test these as a user when
  possible
