# Workflow

- Any time you are working on a task, you should remember what is described in `TASKS.md` because there may be specific instructions or context that you need to remember
- When writing code, you should follow the guidelines in `CODE-STYLE.md`
- Chunk work into small, manageable pieces, committing frequently
- If you are struggling with a task, it is preferable to ask for help
- If you are running an expensive or complex operation, it is preferable to prompt the user to run the command themselves, and report back the result or output
- When presented with complex tasks, **think carefully** about how you can break the task down into smaller, more manageable pieces, outline a plan, and request feedback on the plan before proceeding

## Running Commands

- Prefer to run operations like tests, and checks via the `just` runner rather than using commands like `npx`, `npm`, or `deno` directly
- If you run into commands that are not exposed via the `justfile` and they are pertaining to the project, consider adding them to the `justfile`

## Git Operations

- When starting work on something new, fetch main, and create a new feature branch from main
- It is OK to create and maintain multiple local working branches off of our feature branch
- Do not push these working branches to the remote, only the main feature branch
- Use conventional commits with appropriate scopes (see `COMMIT-STYLE.md`)
- Use the `gh` CLI for interacting with Github and doing things like interacting with pull-requests or checks
- When creating commits or pull-requests, refrain from using any _created by Claude Code_ type of messaging

## Project-specific Notes

- Remember that the project uses Deno 2.0, not Deno 1.0
- Configuration is handled through environment variables, which must be accessed via utility functions rather than directly in business logic
- Linear integration requires an API key set via the LINEAR_API_KEY environment variable
- Test commands need the --allow-env flag to access environment variables
- When running the server with real Linear integration, use:
  ```bash
  LINEAR_API_KEY=your_linear_api_key just dev
  ```
- GraphQL interactions are handled through dedicated utilities in the utils directory