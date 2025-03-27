# Actions and Effects Architecture

## Philosophy

Our architecture follows a functional approach to the hexagonal architecture pattern, focusing on simplicity and clarity while maintaining strong separation of concerns. This approach moves away from traditional object-oriented concepts like interfaces and abstract classes in favor of simpler TypeScript types and pure functions.

We still heavily rely on dependency injection, but implement it through function parameters rather than class constructors. This maintains the benefits of dependency injection (testability, interoperability between providers, clear dependency relationships) while simplifying the implementation.

## Key Concepts

### Effects

Effects represent all side-effects and external interactions in our application:

- Defined as TypeScript types (not interfaces/abstract classes)
- Represent fundamental capabilities for interacting with the outside world
- Named with the suffix "Effect" (e.g., `StorageEffect`)
- Organized in an `/effects` directory, categorized by capability

**IMPORTANT: Effects as General Capabilities**

Effects should represent general-purpose capabilities (ports), NOT specific services or domains:

❌ **INCORRECT**: Creating effects tied to specific services
```typescript
// This is incorrect - effects should not be tied to specific services
type LinearEffect = {
  searchIssues: (query: string) => Promise<Issue[]>;
  getIssue: (id: string) => Promise<Issue>;
};
```

✅ **CORRECT**: Creating general-purpose effects
```typescript
// This is correct - effects represent general capabilities
type HTTPEffect = {
  fetch: (url: string, options: RequestOptions) => Promise<Response>;
};

type StorageEffect = {
  read: (key: string) => Promise<string | null>;
  write: (key: string, value: string) => Promise<void>;
};
```

Service-specific functionality should be built on top of these general effects, implemented in **actions** rather than in effect definitions.

**Fundamental Effect Types**

These are examples of truly fundamental effects:

- **HTTPEffect**: Network communication
- **StorageEffect**: Persistent data storage (could be filesystem, database, etc.)
- **LoggingEffect**: Logging and observability
- **TimerEffect**: Time-related operations (delays, scheduling)
- **RandomEffect**: Randomness/entropy source

**Note on Auth and Config**

Authentication and configuration are typically better represented as:

1. Actions that use more fundamental effects (like HTTP or storage)
2. OR as higher-level compositions of more fundamental effects
3. OR as business entities that are passed to actions

For example, instead of an `AuthEffect`, consider:
- `GetAccessTokenAction` that uses `StorageEffect` and/or `HTTPEffect`
- `RefreshTokenAction` that uses `HTTPEffect`

Similarly, instead of a `ConfigEffect`, consider:
- `ReadConfigAction` and `UpdateConfigAction` that use `StorageEffect`

These domain concepts can be implemented as actions that leverage more fundamental effects.

### Effect Implementations

Each effect can have multiple implementations:

- Concrete implementations are exported as objects/functions
- Named descriptively without "Adapter" or "Implementation" suffixes
- Focus on a specific technology or environment
- Located alongside their effect definitions or in subdirectories

Example:

```typescript
// effects/storage/file-system.ts
export const fileSystemStorage: StorageEffect = {
  async read(key) {
    // File system implementation
    try {
      return await Deno.readTextFile(key);
    } catch {
      return null;
    }
  },
  async write(key, value) {
    // File system implementation
    await Deno.writeTextFile(key, value);
  }
};
```

For HTTP, you might have:

```typescript
// effects/http/deno-fetch.ts
export const denoFetch: HTTPEffect = {
  async fetch(url, options) {
    // Deno-specific implementation using built-in fetch
    return await fetch(url, options);
  }
};
```

### Actions

Actions contain the core business logic of the application:

- Pure functional logic that uses effects for side effects
- Structured as factory functions that accept required effects
- Return an object with an `execute` method (or other domain-specific methods)
- Focus on domain language, not technical implementation
- Specify their effect dependencies explicitly

Example:

```typescript
// actions/get-chat-history.ts
import { StorageEffect } from "../effects/storage";

type GetChatHistoryEffects = {
  storage: StorageEffect;
};

export const GetChatHistoryAction = (effects: GetChatHistoryEffects) => ({
  async execute(chatId: string): Promise<string[]> {
    const storageKey = `chat-history-${chatId}`;
    const data = await effects.storage.read(storageKey);

    if (!data) {
      return []; // Return empty history if no data is found
    }

    return JSON.parse(data) as string[];
  },
});
```

A service-specific action using generic effects:

```typescript
// actions/search-linear-issues.ts
import { HTTPEffect } from "../effects/http";
import { TokenSource } from "../types"; // Not an effect, but a business entity

type SearchIssuesEffects = {
  http: HTTPEffect;
};

export const SearchIssuesAction = (effects: SearchIssuesEffects) => ({
  async execute(query: string, tokenSource: TokenSource): Promise<Issue[]> {
    const token = await tokenSource.getToken();
    
    // Use generic HTTP effect to make Linear-specific API call
    const response = await effects.http.fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `{ issues(filter: { search: "${query}" }) { nodes { id title } } }`
      })
    });
    
    const data = await response.json();
    return data.issues.nodes;
  },
});
```

## Dependency Injection

Our architecture emphasizes dependency injection through function parameters:

```typescript
// Explicitly declare all dependencies as a parameter object
export const GetChatHistoryAction = (effects: GetChatHistoryEffects) => {
  // Return actions that use the injected effects
  return {
    async execute(chatId: string): Promise<string[]> {
      // Implementation uses injected effects
    },
  };
};
```

Key benefits:

- **Explicit dependencies**: All required effects are clearly defined in the parameter type
- **Testability**: Easy to substitute real implementations with mocks during testing
- **Flexibility**: Switch between different providers (e.g., cloud vs. local storage)
- **Configuration**: Centralize effect implementation selection at the composition root

## Usage Pattern

1. Define effects that represent fundamental external capabilities
2. Create implementations for those effects for specific technologies
3. Write actions that depend on effects and contain business logic
4. Compose actions with specific effect implementations at the application boundary

Example composition:

```typescript
// app.ts (composition root)
import { fileSystemStorage } from "./effects/storage/file-system";
import { GetChatHistoryAction } from "./actions/get-chat-history";

// Compose action with specific effect implementation (dependency injection)
const getChatHistory = GetChatHistoryAction({
  storage: fileSystemStorage,
});

// Use the action
const history = await getChatHistory.execute("chat-123");
```

## Testing

This approach simplifies testing by making it easy to provide test implementations:

```typescript
// effects/storage/in-memory.ts
import { StorageEffect } from "../effects/storage";

export function createInMemoryStorage(): StorageEffect {
  const store = new Map<string, string>();

  return {
    async read(key) {
      return store.get(key) || null;
    },
    async write(key, value) {
      store.set(key, value);
    }
  };
}

// in tests:
const testStorage = createInMemoryStorage();
const getChatHistory = GetChatHistoryAction({ storage: testStorage });
// Test getChatHistory.execute()...
```

## Benefits Over Traditional Ports and Adapters

- **Less boilerplate**: No interfaces, abstract classes, or inheritance
- **Simpler mental model**: Just functions and data
- **Better TypeScript experience**: Types instead of interfaces
- **More testable**: Pure functions with explicit dependencies
- **More flexible**: Easier to compose and reuse
- **Clearer boundaries**: Effects explicitly separate core logic from external concerns
- **Maintained dependency injection**: Preserves the benefits of DI but with simpler function parameters
- **Centralized composition**: Clear composition root for wiring up dependencies
- **Improved provider interoperability**: Easily switch between different cloud/service providers
