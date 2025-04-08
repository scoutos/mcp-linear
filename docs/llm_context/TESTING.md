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

## Best Practices

1. **Isolate tests**: Each test should be independent and not rely on state from other tests
2. **Mock external dependencies**: Use test adapters to avoid real network calls or side effects
3. **Test edge cases**: Include tests for error conditions and unexpected inputs
4. **Keep assertions focused**: Test one aspect of behavior per test case
5. **Use descriptive test names**: Make it clear what functionality is being tested

## Sample Test File

See `src/tools/search-tickets.test.js` for a comprehensive example of testing a component with external dependencies.