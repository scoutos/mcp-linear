# Common Tasks

This document outlines standard instructions for common tasks. When the user requests these with shorthand commands, follow these detailed procedures.

## Git Operations

### When user says "let's commit" or "commit changes":

1. Run `git status` to check modified files
2. Run `git diff` to review changes
3. Create a descriptive commit message following conventional commits
4. Commit changes without "created by Claude" messaging

### When user says "push changes" or "push this up":

1. Check branch status with `git status`
2. Push to remote using `git push`
3. Confirm successful push

## Feature Development

### When user says "start a feature" or "get started on [feature]":

1. Create a feature branch from main (`git checkout -b feature/[name]`)
2. Break down the feature into implementable components
3. Suggest a development plan with clear milestones
4. Start with test implementation following code style guidelines

## Session Reflection

### When user says "reflect on this session" or "update context":

1. Review work completed during the session
2. Identify documentation that should be updated
3. Suggest improvements to workflow or code organization
4. Update appropriate files in the `docs/llm_context` directory

## Testing and Validation

### When user says "test this" or "validate changes":

1. Run appropriate test commands for modified components
2. Verify type checking passes
3. Run linting if available
4. Report results and any necessary fixes

