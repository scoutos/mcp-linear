# Testing Guide

This document outlines the testing approach for the mcp-linear project, including best practices and examples.

## Test Adapters

We provide test adapters for effects that make testing components much easier. These adapters allow you to:

1. Verify that effects are used correctly
2. Capture information for assertions
3. Provide controlled mock responses

### HTTP Test Adapter

The HTTP test adapter is located at `src/effects/http/test-adapter.js` and provides a consistent way to mock HTTP requests and responses:

```javascript
import { createTestHttp } from '../effects/http/test-adapter.js';

// Basic usage with default empty responses
const mockHttp = createTestHttp();

// Configure with specific mock responses
const mockHttp = createTestHttp({
  responses: [
    {
      ok: true,
      status: 200,
      data: { /* mock response data */ }
    }
  ]
});

// Use a custom request handler
const mockHttp = createTestHttp({
  requestHandler: async (url, options) => {
    if (url.includes('/specific/endpoint')) {
      return {
        ok: true,
        status: 200,
        data: { /* specific response */ }
      };
    }
    return null; // Let the adapter use default responses
  }
});

// Add simulated network latency
const mockHttp = createTestHttp({
  responseDelay: 100 // 100ms delay
});

// Access recorded requests for assertions
assert.strictEqual(mockHttp.requests.length, 1);
assert.strictEqual(mockHttp.requests[0].url, 'https://api.example.com');
assert.deepStrictEqual(mockHttp.requests[0].body, { expected: 'data' });
```

### Logging Test Adapter

The logging test adapter is located at `src/effects/logging/test-adapter.js` and provides a way to capture and assert on log messages:

```javascript
import { createTestLogger } from '../effects/logging/test-adapter.js';

// Basic usage
const mockLogger = createTestLogger();

// Configure options
const mockLogger = createTestLogger({
  captureStackTraces: true, // Capture stack traces for error logs
  silent: false // Output logs to console during tests
});

// Make assertions on captured logs
mockLogger.info('Test message');
assert.strictEqual(mockLogger.logs.info.length, 1);
assert.strictEqual(mockLogger.logs.info[0].message, 'Test message');

// Check for specific log content
assert.ok(mockLogger.logs.error.some(entry => 
  entry.message.includes('Error string')));

// Clear logs between test cases
mockLogger.clear();
```

## Testing Components

When testing components that use effects, you can use these test adapters to provide controlled behavior:

```javascript
import { SearchTickets } from './search-tickets.js';
import { createTestHttp } from '../effects/http/test-adapter.js';
import { createTestLogger } from '../effects/logging/test-adapter.js';
import { createTestConfig } from '../utils/config/mod.js';

describe('Component Tests', () => {
  let config;
  let mockLogger;
  let mockHttp;
  let component;
  
  beforeEach(() => {
    // Setup test dependencies
    config = createTestConfig();
    mockLogger = createTestLogger();
    mockHttp = createTestHttp();
    
    // Initialize the component with test dependencies
    component = new SomeComponent({
      config,
      effects: {
        http: mockHttp,
        logger: mockLogger
      }
    });
  });
  
  it('should make the expected HTTP request', async () => {
    await component.doSomething();
    
    // Assert on HTTP requests
    assert.strictEqual(mockHttp.requests.length, 1);
    assert.strictEqual(mockHttp.requests[0].url, 'expected-url');
    
    // Assert on logging behavior
    assert.ok(mockLogger.logs.info.some(entry => 
      entry.message.includes('Expected log message')));
  });
});
```

## Running Tests

To run the tests, use:

```bash
npm test
```

This will execute all test files in the project using Node.js's built-in test runner.

For a specific test file:

```bash
npm test -- src/path/to/test.js
```

## Integration Tests for External SDK Usage

### Problem Statement

We recently experienced an issue where our code attempted to use `client.issueCreate()` when the Linear SDK actually requires `client.issues.create()`. This type of error is not caught by simple unit tests because our mock implementations don't enforce the same interface as the real SDK.

This issue could have been avoided with either:
1. Full TypeScript implementation (would catch at compile time)
2. Integration tests that exercise the actual SDK methods

Since we want to avoid adding a build step that TypeScript would require, we need to implement proper integration tests.

### Integration Test Plan

1. **Create a dedicated integration test directory**:
   ```
   /tests/integration/linear-sdk/
   ```

2. **Set up testing with a Linear sandbox account**:
   - Create a dedicated Linear workspace for testing
   - Generate a test API key with limited permissions
   - Store the API key in environment variables for CI

3. **Implement SDK method contract tests**:
   - Create a test for each method we use from the Linear SDK
   - Verify the method exists and has the expected signature
   - Perform minimal API calls that validate our understanding

4. **Structure tests by functionality**:
   ```javascript
   // tests/integration/linear-sdk/issues.test.js
   describe('Linear SDK Issues', () => {
     it('should list issues with client.issues.list()', async () => {
       // Test list() method exists and works
     });
     
     it('should create issues with client.issues.create()', async () => {
       // Test create() method exists and works
     });
   });
   ```

5. **Implement CI skip for most runs**:
   - Run integration tests manually during development
   - Run automatically on PRs that modify SDK interaction code
   - Skip for routine PRs that don't modify SDK-related files

6. **Create a reference guide**:
   - Document correct SDK method calls
   - Include real examples from our integration tests
   - Maintain in `docs/llm_context/LINEAR-SDK-REFERENCE.md`

### Implementation Timeline

1. Set up Linear sandbox account and test API key (1 day)
2. Create basic integration test framework (1 day)
3. Implement tests for current SDK usage (2 days)
4. Update CI configuration for integration tests (1 day)
5. Create reference documentation (1 day)

## Best Practices

1. **Isolate tests**: Each test should be independent and not rely on state from other tests
2. **Mock external dependencies**: Use test adapters to avoid real network calls or side effects
3. **Test edge cases**: Include tests for error conditions and unexpected inputs
4. **Keep assertions focused**: Test one aspect of behavior per test case
5. **Use descriptive test names**: Make it clear what functionality is being tested
6. **Verify SDK contracts**: Ensure mock implementations match actual SDK interfaces
7. **Run integration tests during development**: Verify SDK understanding with real calls

## Sample Test File

See `src/tools/search-tickets.test.js` for a comprehensive example of testing a component with external dependencies.